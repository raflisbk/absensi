import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const createAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  wifiSSID: z.string().optional(),
  faceData: z.string().optional()
})

const getAttendanceSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  classId: z.string().optional(),
  userId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'checkInTime']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

interface AttendanceFilters {
  classId?: string
  userId?: string
  date?: string
  status?: 'PRESENT' | 'LATE' | 'ABSENT'
}

async function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): Promise<number> {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance in kilometers
  return distance * 1000 // Convert to meters
}

async function validateLocation(
  classId: string,
  coordinates?: { latitude: number; longitude: number },
  wifiSSID?: string
): Promise<{ valid: boolean; reason?: string }> {
  const classRoom = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      room: true
    }
  })

  if (!classRoom || !classRoom.room) {
    return { valid: false, reason: 'Class or room not found' }
  }

  // Check WiFi SSID if provided
  if (wifiSSID && classRoom.room.allowedWifiSSIDs) {
    const allowedSSIDs = classRoom.room.allowedWifiSSIDs as string[]
    if (!allowedSSIDs.includes(wifiSSID)) {
      return { valid: false, reason: 'WiFi network not allowed for this location' }
    }
  }

  // Check GPS coordinates if provided
  if (coordinates && classRoom.room.latitude && classRoom.room.longitude) {
    const distance = await calculateDistance(
      coordinates.latitude,
      coordinates.longitude,
      classRoom.room.latitude,
      classRoom.room.longitude
    )
    
    const maxDistance = classRoom.room.radius || 50 // Default 50 meters
    if (distance > maxDistance) {
      return { valid: false, reason: 'Location too far from class room' }
    }
  }

  return { valid: true }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      classId: searchParams.get('classId') || undefined,
      userId: searchParams.get('userId') || undefined,
      date: searchParams.get('date') || undefined,
      status: searchParams.get('status') as 'PRESENT' | 'LATE' | 'ABSENT' | undefined,
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'checkInTime',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    }

    const validation = getAttendanceSchema.safeParse(queryParams)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { page, limit, classId, userId, date, status, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}

    // Role-based filtering
    if (currentUser.role === 'STUDENT') {
      whereClause.userId = currentUser.id
    } else if (currentUser.role === 'LECTURER') {
      // Lecturers can only see attendance for their classes
      whereClause.class = {
        lecturerId: currentUser.id
      }
    }

    // Apply additional filters
    if (classId) {
      whereClause.classId = classId
    }

    if (userId && currentUser.role === 'ADMIN') {
      whereClause.userId = userId
    }

    if (status) {
      whereClause.status = status
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate
      }
    }

    // Get total count
    const total = await prisma.attendance.count({
      where: whereClause
    })

    // Get paginated results
    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            avatar: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            room: {
              select: {
                id: true,
                name: true,
                building: true
              }
            }
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit
    })

    return ApiResponseHelper.paginated(attendances, page, limit, total)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request, ['STUDENT'])
    const body = await request.json()
    
    const validation = createAttendanceSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { classId, coordinates, wifiSSID, faceData } = validation.data

    // Check if class exists and is active
    const classSession = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        room: true,
        enrollments: {
          where: { userId: currentUser.id }
        }
      }
    })

    if (!classSession) {
      return ApiResponseHelper.notFound('Class not found')
    }

    if (classSession.enrollments.length === 0) {
      return ApiResponseHelper.forbidden('You are not enrolled in this class')
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

    // Validate location
    const locationValidation = await validateLocation(classId, coordinates, wifiSSID)
    if (!locationValidation.valid) {
      return ApiResponseHelper.error(locationValidation.reason!, 400)
    }

    // Determine attendance status based on time
    const now = new Date()
    const classStartTime = new Date(classSession.startTime)
    const lateThreshold = new Date(classStartTime)
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
        coordinates: coordinates ? JSON.stringify(coordinates) : null,
        wifiSSID: wifiSSID || null,
        faceData: faceData || null,
        createdAt: now,
        updatedAt: now
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            avatar: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            room: {
              select: {
                id: true,
                name: true,
                building: true
              }
            }
          }
        }
      }
    })

    return ApiResponseHelper.created(attendance, 'Attendance recorded successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request, ['ADMIN', 'LECTURER'])
    const body = await request.json()
    const { attendanceId, status, notes } = body

    if (!attendanceId || !status) {
      return ApiResponseHelper.error('Attendance ID and status are required', 400)
    }

    // Check if attendance exists
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        class: true
      }
    })

    if (!attendance) {
      return ApiResponseHelper.notFound('Attendance record not found')
    }

    // Check permissions
    if (currentUser.role === 'LECTURER' && attendance.class.lecturerId !== currentUser.id) {
      return ApiResponseHelper.forbidden('You can only modify attendance for your own classes')
    }

    // Update attendance
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: status,
        notes: notes || null,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            avatar: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            room: {
              select: {
                id: true,
                name: true,
                building: true
              }
            }
          }
        }
      }
    })

    return ApiResponseHelper.success(updatedAttendance, 'Attendance updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}