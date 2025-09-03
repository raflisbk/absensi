import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, faceRecognitionRateLimit } from '@/lib/rate-limit'
import { faceRecognitionSchema } from '@/lib/validation'

// Face similarity threshold
const FACE_SIMILARITY_THRESHOLD = 0.6

// Calculate Euclidean distance between two face descriptors
function calculateDistance(descriptors1: number[], descriptors2: number[]): number {
  if (descriptors1.length !== descriptors2.length) {
    throw new Error('Face descriptor lengths do not match')
  }

  let sum = 0
  for (let i = 0; i < descriptors1.length; i++) {
    const diff = descriptors1[i] - descriptors2[i]
    sum += diff * diff
  }

  return Math.sqrt(sum)
}

// Verify location based on WiFi and GPS
async function verifyLocation(
  classId: string,
  wifiSsid?: string,
  gpsLat?: number,
  gpsLng?: number
): Promise<{ valid: boolean; reason?: string }> {
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      room: true
    }
  })

  if (!classInfo || !classInfo.room) {
    return { valid: false, reason: 'Class or room information not found' }
  }

  // Check WiFi SSID if provided
  if (wifiSsid && classInfo.room.allowedWifiSSIDs) {
    const allowedSSIDs = classInfo.room.allowedWifiSSIDs as string[]
    if (!allowedSSIDs.includes(wifiSsid)) {
      return { valid: false, reason: 'WiFi network not allowed for this location' }
    }
  }

  // Check GPS coordinates if provided
  if (gpsLat && gpsLng && classInfo.room.latitude && classInfo.room.longitude) {
    const distance = calculateGPSDistance(
      gpsLat,
      gpsLng,
      classInfo.room.latitude,
      classInfo.room.longitude
    )
    
    const maxDistance = classInfo.room.radius || 50 // Default 50 meters
    if (distance > maxDistance) {
      return { valid: false, reason: 'Location too far from classroom' }
    }
  }

  return { valid: true }
}

// Calculate GPS distance in meters
function calculateGPSDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, faceRecognitionRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request, ['STUDENT'])
    const body = await request.json()

    const validation = faceRecognitionSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { faceDescriptors, classId, wifiSsid, gpsLat, gpsLng, deviceInfo } = validation.data

    // Get user's enrolled face profile
    const faceProfile = await prisma.faceProfile.findUnique({
      where: { userId: currentUser.id }
    })

    if (!faceProfile || faceProfile.enrollmentStatus !== 'COMPLETED') {
      return ApiResponseHelper.error(
        'Face enrollment not completed. Please complete face enrollment first.',
        400
      )
    }

    // Parse stored face descriptors
    let storedDescriptors: number[]
    try {
      storedDescriptors = JSON.parse(faceProfile.faceDescriptors)
    } catch (error) {
      return ApiResponseHelper.error('Invalid stored face data', 500)
    }

    // Calculate face similarity
    const distance = calculateDistance(faceDescriptors, storedDescriptors)
    const similarity = 1 - distance // Convert distance to similarity score
    
    if (similarity < FACE_SIMILARITY_THRESHOLD) {
      return ApiResponseHelper.error(
        'Face verification failed. Please try again or update your face profile.',
        401
      )
    }

    // Verify class exists and user is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: currentUser.id,
        classId: classId,
        status: 'ACTIVE'
      },
      include: {
        class: {
          include: {
            room: true
          }
        }
      }
    })

    if (!enrollment) {
      return ApiResponseHelper.error('You are not enrolled in this class', 403)
    }

    // Check if class is currently active
    const now = new Date()
    const classStart = new Date(enrollment.class.startTime)
    const classEnd = new Date(enrollment.class.endTime)
    
    if (now < classStart || now > classEnd) {
      return ApiResponseHelper.error('Class is not currently active', 400)
    }

    // Verify location
    const locationVerification = await verifyLocation(classId, wifiSsid, gpsLat, gpsLng)
    if (!locationVerification.valid) {
      return ApiResponseHelper.error(locationVerification.reason!, 400)
    }

    // Check if attendance already exists for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: currentUser.id,
        classId: classId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingAttendance) {
      return ApiResponseHelper.error('Attendance already recorded for today', 409)
    }

    // Determine attendance status based on time
    const lateThreshold = new Date(classStart)
    lateThreshold.setMinutes(lateThreshold.getMinutes() + 15) // 15 minutes late threshold

    let status: 'PRESENT' | 'LATE' = 'PRESENT'
    if (now > lateThreshold) {
      status = 'LATE'
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: currentUser.id,
        classId: classId,
        status: status,
        checkInTime: now,
        faceMatchScore: similarity,
        wifiSsid: wifiSsid || null,
        gpsCoordinates: gpsLat && gpsLng ? JSON.stringify({ lat: gpsLat, lng: gpsLng }) : null,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        createdAt: now,
        updatedAt: now
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            room: {
              select: {
                name: true,
                building: true
              }
            }
          }
        }
      }
    })

    return ApiResponseHelper.created(
      {
        id: attendance.id,
        status: attendance.status,
        checkInTime: attendance.checkInTime,
        faceMatchScore: attendance.faceMatchScore,
        class: attendance.class
      },
      `Attendance recorded successfully as ${status}`
    )

  } catch (error) {
    return handleApiError(error)
  }
}