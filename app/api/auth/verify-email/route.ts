import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponseHelper, handleApiError } from '@/lib/response'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = verifyEmailSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { token } = validation.data

    // Find verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token }
    })

    if (!verification) {
      return ApiResponseHelper.error('Invalid verification token', 400)
    }

    if (verification.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerification.delete({
        where: { id: verification.id }
      })
      return ApiResponseHelper.error('Verification token has expired', 400)
    }

    // Update user email verification status
    const user = await prisma.user.update({
      where: { email: verification.email },
      data: { emailVerified: true }
    })

    // Update registration step
    await prisma.registrationStep.updateMany({
      where: {
        userId: user.id,
        stepName: 'EMAIL_VERIFICATION'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    // Delete verification token
    await prisma.emailVerification.delete({
      where: { id: verification.id }
    })

    return ApiResponseHelper.success(
      { emailVerified: true },
      'Email verified successfully'
    )

  } catch (error) {
    return handleApiError(error)
  }
}