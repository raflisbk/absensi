import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, apiRateLimit } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/validation'
import { EmailService } from '@/lib/email'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for password reset requests
    const rateLimitResult = await rateLimit(request, apiRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(
        'Too many password reset requests. Please try again later.',
        429
      )
    }

    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { email } = validation.data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user && user.status === 'ACTIVE') {
      // Generate reset token
      const resetToken = AuthService.generateRandomToken()
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Save reset token to database
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: resetTokenExpiry
        }
      })

      // Send reset email using the correct method name
      const emailSent = await EmailService.sendPasswordReset(
        user.email,
        resetToken,
        user.name
      )

      if (!emailSent) {
        // Log the error but don't reveal it to the user
        console.error('Failed to send password reset email to:', email)
      }
    }

    return ApiResponseHelper.success(
      null,
      'If an account with that email exists, we\'ve sent a password reset link.'
    )

  } catch (error) {
    return handleApiError(error)
  }
}