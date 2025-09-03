import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { EmailService } from '@/lib/email'
import { forgotPasswordSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, emailRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, emailRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { email } = validation.data

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      return ApiResponseHelper.success(
        null,
        'If the email exists in our system, a password reset link will be sent.'
      )
    }

    // Delete existing reset tokens for this email
    await prisma.passwordReset.deleteMany({
      where: { email }
    })

    // Create new reset token
    const resetToken = AuthService.generateRandomToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

    await prisma.passwordReset.create({
      data: {
        email,
        token: resetToken,
        expiresAt
      }
    })

    // Send password reset email
    await EmailService.sendPasswordReset(email, resetToken, user.name)

    return ApiResponseHelper.success(
      null,
      'If the email exists in our system, a password reset link will be sent.'
    )

  } catch (error) {
    return handleApiError(error)
  }
}