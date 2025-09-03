import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const approveUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional()
})

const bulkApproveSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional()
})

interface ApprovalStep {
  userId: string
  status: 'success' | 'error'
  message: string
}

async function processApprovalStep(
  step: ApprovalStep, 
  action: 'APPROVE' | 'REJECT', 
  reason?: string
): Promise<ApprovalStep> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: step.userId }
    })

    if (!user) {
      return {
        ...step,
        status: 'error',
        message: 'User not found'
      }
    }

    if (user.status !== 'PENDING') {
      return {
        ...step,
        status: 'error',
        message: `User status is already ${user.status}`
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: step.userId },
      data: {
        status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
        approvedAt: action === 'APPROVE' ? new Date() : null,
        rejectionReason: action === 'REJECT' ? reason : null,
        updatedAt: new Date()
      }
    })

    return {
      ...step,
      status: 'success',
      message: `User ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`
    }
  } catch (error: any) {
    return {
      ...step,
      status: 'error',
      message: error.message || 'Unknown error occurred'
    }
  }
}

async function processBulkApproval(
  userIds: string[], 
  action: 'APPROVE' | 'REJECT', 
  reason?: string,
  tx?: any
): Promise<ApprovalStep[]> {
  const results: ApprovalStep[] = []
  
  for (const userId of userIds) {
    const step: ApprovalStep = {
      userId,
      status: 'success',
      message: ''
    }
    
    try {
      const user = await (tx || prisma).user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        results.push({
          ...step,
          status: 'error',
          message: 'User not found'
        })
        continue
      }

      if (user.status !== 'PENDING') {
        results.push({
          ...step,
          status: 'error',
          message: `User status is already ${user.status}`
        })
        continue
      }

      await (tx || prisma).user.update({
        where: { id: userId },
        data: {
          status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
          approvedAt: action === 'APPROVE' ? new Date() : null,
          rejectionReason: action === 'REJECT' ? reason : null,
          updatedAt: new Date()
        }
      })

      results.push({
        ...step,
        status: 'success',
        message: `User ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`
      })
    } catch (error: any) {
      results.push({
        ...step,
        status: 'error',
        message: error.message || 'Unknown error occurred'
      })
    }
  }
  
  return results
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    // Require admin authentication
    const currentUser = await requireAuth(request, ['ADMIN'])

    const body = await request.json()
    const validation = approveUserSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { userId, action, reason } = validation.data

    // Check if user exists and is pending
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return ApiResponseHelper.notFound('User not found')
    }

    if (user.status !== 'PENDING') {
      return ApiResponseHelper.error(`User status is already ${user.status}`, 400)
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: action === 'APPROVE' ? 'ACTIVE' : 'REJECTED',
        approvedAt: action === 'APPROVE' ? new Date() : null,
        rejectionReason: action === 'REJECT' ? reason : null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        approvedAt: true,
        rejectionReason: true,
        updatedAt: true
      }
    })

    // TODO: Send notification email to user
    // await sendApprovalNotification(updatedUser, action)

    return ApiResponseHelper.success(
      updatedUser, 
      `User ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`
    )

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

    // Require admin authentication
    const currentUser = await requireAuth(request, ['ADMIN'])

    const body = await request.json()
    const validation = bulkApproveSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { userIds, action, reason } = validation.data

    // Process bulk approval in transaction
    const results = await prisma.$transaction(async (tx) => {
      return await processBulkApproval(userIds, action, reason, tx)
    })

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return ApiResponseHelper.success({
      results,
      summary: {
        total: userIds.length,
        success: successCount,
        errors: errorCount
      }
    }, `Bulk ${action.toLowerCase()} completed: ${successCount} successful, ${errorCount} failed`)

  } catch (error) {
    return handleApiError(error)
  }
}