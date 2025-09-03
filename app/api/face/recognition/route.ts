import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getClientIP } from '@/lib/auth'
import { faceRecognitionSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, faceRecognitionRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, faceRecognitionRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const user = await requireAuth(request)
    const body = await request.json()
    const validation = faceRecognitionSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { faceDescriptors, classId, wifiSsid, gpsLat, gpsLng, deviceInfo } = validation.data

    // Get user's face profile
    const faceProfile = await prisma.faceProfile.findFirst({
      where: { userId: user.id }
    })

    if (!faceProfile) {
      return ApiResponseHelper.error('Face profile not found. Please complete face enrollment first.', 400)
    }

    // Get class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        location: true,
        enrollments: {
          where: { userId: user.id, status: 'ACTIVE' }
        }
      }
    })

    if (!classInfo) {
      return ApiResponseHelper.notFound('Class not found')
    }

    if (classInfo.enrollments.length === 0) {
      return ApiResponseHelper.error('You are not enrolled in this class', 403)
    }

    // Validate WiFi network if provided
    if (wifiSsid && classInfo.location.wifiSsid !== wifiSsid) {
      return ApiResponseHelper.error('Invalid location. Please connect to the correct WiFi network.', 403)
    }

    // Validate class schedule
    const now = new Date()
    const schedule = classInfo.schedule as any
    const currentDay = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    // Convert schedule time to minutes
    const [startHour, startMin] = schedule.startTime.split(':').map(Number)
    const [endHour, endMin] = schedule.endTime.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (schedule.dayOfWeek !== currentDay) {
      return ApiResponseHelper.error('This class is not scheduled for today', 400)
    }

    // Allow check-in 15 minutes before class starts and during class
    const checkInWindow = 15 // minutes
    if (currentTime < (startTime - checkInWindow) || currentTime > endTime) {
      return ApiResponseHelper.error('Check-in is not available at this time', 400)
    }

    // Compare face descriptors
    const storedDescriptors = faceProfile.faceDescriptors as number[]
    const confidence = calculateFaceConfidence(storedDescriptors, faceDescriptors)

    if (confidence < faceProfile.confidenceThreshold) {
      // Log failed attempt
      await prisma.faceQualityLog.create({
        data: {
          userId: user.id,
          qualityScores: { confidence },
          validationResults: { success: false, reason: 'Low confidence score' }
        }
      })

      return ApiResponseHelper.error('Face recognition failed. Please try again.', 400)
    }

    // Check if user already checked in for this class today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        classId: classId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingAttendance) {
      return ApiResponseHelper.error('You have already checked in for this class today', 400)
    }

    // Determine attendance status based on time
    let status = 'PRESENT'
    const lateThreshold = 10 // minutes after start time
    if (currentTime > (startTime + lateThreshold)) {
      status = 'LATE'
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        classId: classId,
        method: 'FACE_RECOGNITION',
        ipAddress: getClientIP(request),
        wifiSsid: wifiSsid,
        confidenceScore: confidence,
        deviceInfo: deviceInfo,
        gpsLat: gpsLat,
        gpsLng: gpsLng,
        status: status as any
      }
    })

    // Log successful attempt
    await prisma.faceQualityLog.create({
      data: {
        userId: user.id,
        qualityScores: { confidence },
        validationResults: { success: true, attendanceId: attendance.id }
      }
    })

    return ApiResponseHelper.created({
      attendanceId: attendance.id,
      status: status,
      confidence: confidence,
      timestamp: attendance.timestamp
    }, `Attendance recorded successfully (${status})`)

  } catch (error) {
    return handleApiError(error)
  }
}

function calculateFaceConfidence(stored: number[], current: number[]): number {
  if (stored.length !== current.length || stored.length === 0) {
    return 0
  }

  // Calculate Euclidean distance
  let sumSquares = 0
  for (let i = 0; i < stored.length; i++) {
    const diff = stored[i] - current[i]
    sumSquares += diff * diff
  }
  
  const distance = Math.sqrt(sumSquares)
  
  // Convert distance to confidence score (0-1)
  // Lower distance = higher confidence
  const maxDistance = 1.0 // Threshold for maximum distance
  const confidence = Math.max(0, 1 - (distance / maxDistance))
  
  return Math.round(confidence * 1000) / 1000 // Round to 3 decimal places
}