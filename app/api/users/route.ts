import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { updateUserSchema, paginationSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const user = await requireAuth(request, ['ADMIN'])
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
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    // Build where clause
    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      whereClause.role = role
    }

    if (status) {
      whereClause.status = status
    }

    // Get total count
    const total = await prisma.user.count({
      where: whereClause
    })

    // Build order by
    let orderBy: any = { createdAt: sortOrder }
    if (sortBy) {
      orderBy = { [sortBy]: sortOrder }
    }

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
    const userId = searchParams.get('userId')

    if (!userId) {
      return ApiResponseHelper.error('User ID is required', 400)
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return ApiResponseHelper.error('Cannot delete your own account', 400)
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return ApiResponseHelper.notFound('User not found')
    }

    // Delete related records first
    await prisma.$transaction(async (tx) => {
      // Delete face profiles
      await tx.faceProfile.deleteMany({
        where: { userId }
      })

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId }
      })

      // Delete registration steps
      await tx.registrationStep.deleteMany({
        where: { userId }
      })

      // Delete document verifications
      await tx.documentVerification.deleteMany({
        where: { userId }
      })

      // Delete user approvals
      await tx.userApproval.deleteMany({
        where: { userId }
      })

      // Delete face quality logs
      await tx.faceQualityLog.deleteMany({
        where: { userId }
      })

      // Delete enrollments
      await tx.enrollment.deleteMany({
        where: { userId }
      })

      // Delete attendances
      await tx.attendance.deleteMany({
        where: { userId }
      })

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    return ApiResponseHelper.success(null, 'User deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}