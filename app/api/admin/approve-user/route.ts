import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { EmailService } from '@/lib/email'
import { approveUserSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const admin = await requireAuth(request, ['ADMIN'])
    const body = await request.json()
    const { userId, ...approvalData } = body

    if (!userId) {
      return ApiResponseHelper.error('User ID is required', 400)
    }

    const validation = approveUserSchema.safeParse(approvalData)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { status, reason, notes } = validation.data

    // Check if user exists and is pending approval
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return ApiResponseHelper.notFound('User not found')
    }

    if (user.status !== 'PENDING') {
      return ApiResponseHelper.error('User is not pending approval', 400)
    }

    // Check if user has completed all required registration steps
    const registrationSteps = await prisma.registrationStep.findMany({
      where: { userId }
    })

    const requiredSteps = ['BASIC_INFO', 'EMAIL_VERIFICATION', 'FACE_ENROLLMENT']
    const completedSteps = registrationSteps
      .filter(step => step.status === 'COMPLETED')
      .map(step => step.stepName)

    const hasAllRequiredSteps = requiredSteps.every(step => 
      completedSteps.includes(step as any)
    )

    if (status === 'APPROVED' && !hasAllRequiredSteps) {
      return ApiResponseHelper.error(
        'User has not completed all required registration steps', 
        400
      )
    }

    // Start transaction for approval process
    const result = await prisma.$transaction(async (tx) => {
      // Create approval record
      const approval = await tx.userApproval.create({
        data: {
          userId,
          adminId: admin.id,
          status,
          reason,
          notes,
          reviewedAt: new Date()
        }
      })

      // Update user status
      const newUserStatus = status === 'APPROVED' ? 'ACTIVE' : 'REJECTED'
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          status: newUserStatus,
          approvedAt: status === 'APPROVED' ? new Date() : null,
          approvedBy: status === 'APPROVED' ? admin.id : null
        }
      })

      return { approval, user: updatedUser }
    })

    // Send email notification
    const emailSent = await EmailService.sendRegistrationApproval(
      result.user.email,
      result.user.name,
      status === 'APPROVED',
      reason
    )

    if (!emailSent) {
      console.error('Failed to send approval email to user:', result.user.email)
    }

    // Send welcome email if approved
    if (status === 'APPROVED') {
      await EmailService.sendWelcomeEmail(result.user.email, result.user.name)
    }

    return ApiResponseHelper.success({
      approval: result.approval,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        status: result.user.status,
        approvedAt: result.user.approvedAt
      }
    }, `User ${status.toLowerCase()} successfully`)

  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const admin = await requireAuth(request, ['ADMIN'])
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'PENDING'

    // Get pending approvals count
    const pendingCount = await prisma.user.count({
      where: { status: 'PENDING' }
    })

    // Get users based on approval status
    let whereClause: any = {}
    
    if (status === 'PENDING') {
      whereClause.status = 'PENDING'
    } else if (status === 'APPROVED') {
      whereClause.status = 'ACTIVE'
    } else if (status === 'REJECTED') {
      whereClause.status = 'REJECTED'
    }

    const total = await prisma.user.count({
      where: whereClause
    })

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        registrationSteps: {
          select: {
            stepName: true,
            status: true,
            completedAt: true
          }
        },
        documentVerifications: {
          select: {
            documentType: true,
            status: true,
            verifiedAt: true
          }
        },
        faceProfiles: {
          select: {
            qualityScore: true,
            createdAt: true
          }
        },
        userApprovals: {
          where: {
            status: { in: ['APPROVED', 'REJECTED'] }
          },
          include: {
            admin: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            reviewedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return ApiResponseHelper.paginated(
      {
        users,
        pendingCount
      },
      page,
      limit,
      total
    )

  } catch (error) {
    return handleApiError(error)
  }
}