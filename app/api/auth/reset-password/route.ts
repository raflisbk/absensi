import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { resetPasswordSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, authRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, authRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { token, password } = validation.data

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true
      }
    })

    if (!resetToken) {
      return ApiResponseHelper.error('Invalid or expired reset token', 400)
    }

    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({
        where: { token }
      })
      return ApiResponseHelper.error('Reset token has expired', 400)
    }

    if (resetToken.used) {
      return ApiResponseHelper.error('Reset token has already been used', 400)
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(password)

    // Start transaction to update password and revoke sessions
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { token },
        data: {
          used: true,
          usedAt: new Date()
        }
      })
    })

    // Revoke all user sessions for security using the correct method name
    try {
      await AuthService.revokeAllUserSessions(resetToken.userId)
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to revoke user sessions:', error)
    }

    return ApiResponseHelper.success(
      null,
      'Password reset successfully. Please login with your new password.'
    )

  } catch (error) {
    return handleApiError(error)
  }
}