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

    // Find reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token }
    })

    if (!resetRecord) {
      return ApiResponseHelper.error('Invalid reset token', 400)
    }

    if (resetRecord.used) {
      return ApiResponseHelper.error('Reset token has already been used', 400)
    }

    if (resetRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id }
      })
      return ApiResponseHelper.error('Reset token has expired', 400)
    }

    // Hash new password
    const hashedPassword = await AuthService.hashPassword(password)

    // Update user password
    const user = await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword }
    })

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    })

    // Revoke all existing sessions for security
    await AuthService.revokeAllUserSessions(user.id)

    return ApiResponseHelper.success(
      null,
      'Password reset successful. Please log in with your new password.'
    )

  } catch (error) {
    return handleApiError(error)
  }
}