import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { createClassSchema, paginationSchema } from '@/lib/validation'
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
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder') || 'desc'
    }

    const validation = paginationSchema.safeParse(queryParams)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { page, limit, search, sortBy, sortOrder } = validation.data

    // Build where clause based on user role
    let whereClause: any = {}

    if (user.role === 'STUDENT') {
      // Students can only see classes they're enrolled in
      whereClause = {
        enrollments: {
          some: {
            userId: user.id,
            status: 'ACTIVE'
          }
        }
      }
    } else if (user.role === 'LECTURER') {
      // Lecturers can see their own classes
      whereClause.lecturerId = user.id
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.class.count({
      where: whereClause
    })

    // Build order by
    let orderBy: any = { createdAt: sortOrder }
    if (sortBy) {
      orderBy = { [sortBy]: sortOrder }
    }

    // Get paginated results
    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true
          }
        },
        enrollments: {
          where: user.role === 'STUDENT' ? { userId: user.id } : undefined,
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            user: user.role !== 'STUDENT' ? {
              select: {
                id: true,
                name: true,
                studentId: true
              }
            } : undefined
          }
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    return ApiResponseHelper.paginated(classes, page, limit, total)

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

    const user = await requireAuth(request, ['ADMIN'])
    const body = await request.json()
    const validation = createClassSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { name, code, lecturerId, locationId, schedule, duration, capacity } = validation.data

    // Check if class code already exists
    const existingClass = await prisma.class.findUnique({
      where: { code }
    })

    if (existingClass) {
      return ApiResponseHelper.error('Class code already exists', 409)
    }

    // Verify lecturer exists and has correct role
    const lecturer = await prisma.user.findUnique({
      where: { id: lecturerId }
    })

    if (!lecturer || lecturer.role !== 'LECTURER') {
      return ApiResponseHelper.error('Invalid lecturer ID', 400)
    }

    // Verify location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    })

    if (!location) {
      return ApiResponseHelper.error('Invalid location ID', 400)
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        lecturerId,
        locationId,
        schedule,
        duration,
        capacity
      },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true
          }
        }
      }
    })

    return ApiResponseHelper.created(newClass, 'Class created successfully')

  } catch (error) {
    return handleApiError(error)
  }
}