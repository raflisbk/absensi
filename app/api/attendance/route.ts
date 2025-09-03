import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { attendanceQuerySchema, createAttendanceSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const queryParams = {
      userId: searchParams.get('userId'),
      classId: searchParams.get('classId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      status: searchParams.get('status'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10'
    }

    const validation = attendanceQuerySchema.safeParse(queryParams)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { userId, classId, startDate, endDate, status, page, limit } = validation.data

    // Build where clause
    let whereClause: any = {}

    // For non-admin users, only show their own attendance
    if (user.role === 'STUDENT') {
      whereClause.userId = user.id
    } else if (user.role === 'LECTURER') {
      // Lecturers can see attendance for their classes
      const lecturerClasses = await prisma.class.findMany({
        where: { lecturerId: user.id },
        select: { id: true }
      })
      whereClause.classId = {
        in: lecturerClasses.map(c => c.id)
      }
    }

    // Apply filters
    if (userId && user.role === 'ADMIN') {
      whereClause.userId = userId
    }
    
    if (classId) {
      whereClause.classId = classId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (startDate || endDate) {
      whereClause.timestamp = {}
      if (startDate) whereClause.timestamp.gte = new Date(startDate)
      if (endDate) whereClause.timestamp.lte = new Date(endDate)
    }

    // Get total count
    const total = await prisma.attendance.count({
      where: whereClause
    })

    // Get paginated results
    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            lecturer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return ApiResponseHelper.paginated(attendance, page, limit, total)

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

    const user = await requireAuth(request, ['ADMIN', 'LECTURER'])
    const body = await request.json()
    const validation = createAttendanceSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { userId, classId, method, confidenceScore, wifiSsid, gpsLat, gpsLng } = validation.data

    // Verify class access for lecturers
    if (user.role === 'LECTURER') {
      const classInfo = await prisma.class.findFirst({
        where: {
          id: classId,
          lecturerId: user.id
        }
      })

      if (!classInfo) {
        return ApiResponseHelper.forbidden('You can only create attendance for your own classes')
      }
    }

    // Check if student is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        classId: classId,
        status: 'ACTIVE'
      }
    })

    if (!enrollment) {
      return ApiResponseHelper.error('Student is not enrolled in this class', 400)
    }

    // Check if attendance already exists for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        classId: classId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (existingAttendance) {
      return ApiResponseHelper.error('Attendance already recorded for today', 400)
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        classId,
        method,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        confidenceScore,
        wifiSsid,
        gpsLat,
        gpsLng
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return ApiResponseHelper.created(attendance, 'Attendance recorded successfully')

  } catch (error) {
    return handleApiError(error)
  }
}