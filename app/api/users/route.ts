import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const getUsersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

const updateUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
  studentId: z.string().optional(),
  phone: z.string().optional(),
  documentVerified: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional()
})

const deleteUsersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required')
})

interface UserFilters {
  search?: string
  role?: 'ADMIN' | 'LECTURER' | 'STUDENT'
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
}

async function buildUserWhereClause(filters: UserFilters): Promise<any> {
  const whereClause: any = {}

  if (filters.search) {
    whereClause.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { studentId: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  if (filters.role) {
    whereClause.role = filters.role
  }

  if (filters.status) {
    whereClause.status = filters.status
  }

  return whereClause
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request, ['ADMIN', 'LECTURER'])
    const { searchParams } = new URL(request.url)
    
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') as 'ADMIN' | 'LECTURER' | 'STUDENT' | undefined,
      status: searchParams.get('status') as 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | undefined,
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'updatedAt' | 'name' | 'email',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    }

    const validation = getUsersSchema.safeParse(queryParams)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { page, limit, search, role, status, sortBy, sortOrder } = validation.data

    // Build filters
    const filters: UserFilters = { search, role, status }
    const whereClause = await buildUserWhereClause(filters)

    // For lecturers, only show students in their classes
    if (currentUser.role === 'LECTURER') {
      whereClause.role = 'STUDENT'
      whereClause.enrollments = {
        some: {
          class: {
            lecturerId: currentUser.id
          }
        }
      }
    }

    // Get total count
    const total = await prisma.user.count({
      where: whereClause
    })

    // Build order by
    const orderBy: any = { [sortBy]: sortOrder }

    // Get paginated results
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        studentId: true,
        phone: true,
        status: true,
        faceEnrollmentStatus: true,
        documentVerified: true,
        emailVerified: true,
        phoneVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
        _count: {
          select: {
            attendances: true,
            enrollments: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    return ApiResponseHelper.paginated(users, page, limit, total)

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

    const currentUser = await requireAuth(request, ['ADMIN'])
    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return ApiResponseHelper.error('User ID is required', 400)
    }

    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const updateData = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return ApiResponseHelper.notFound('User not found')
    }

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email }
      })

      if (emailExists) {
        return ApiResponseHelper.error('Email already in use', 409)
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        studentId: true,
        phone: true,
        status: true,
        faceEnrollmentStatus: true,
        documentVerified: true,
        emailVerified: true,
        phoneVerified: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return ApiResponseHelper.success(updatedUser, 'User updated successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request, ['ADMIN'])
    const { searchParams } = new URL(request.url)
    const body = await request.json()

    // Handle single user deletion via query param
    const userIdParam = searchParams.get('userId')
    if (userIdParam) {
      const userExists = await prisma.user.findUnique({
        where: { id: userIdParam }
      })

      if (!userExists) {
        return ApiResponseHelper.notFound('User not found')
      }

      // Prevent self-deletion
      if (userIdParam === currentUser.id) {
        return ApiResponseHelper.error('You cannot delete your own account', 400)
      }

      await prisma.user.delete({
        where: { id: userIdParam }
      })

      return ApiResponseHelper.success(null, 'User deleted successfully')
    }

    // Handle bulk deletion via request body
    const validation = deleteUsersSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { userIds } = validation.data

    // Prevent self-deletion in bulk
    if (userIds.includes(currentUser.id)) {
      return ApiResponseHelper.error('You cannot delete your own account', 400)
    }

    // Delete users in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const deletedUsers = await tx.user.deleteMany({
        where: {
          id: {
            in: userIds
          }
        }
      })

      return deletedUsers
    })

    return ApiResponseHelper.success(
      { deletedCount: result.count },
      `${result.count} users deleted successfully`
    )

  } catch (error) {
    return handleApiError(error)
  }
}