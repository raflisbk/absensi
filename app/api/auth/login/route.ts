import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService, getClientIP } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
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
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return ApiResponseHelper.error('Invalid email or password', 401)
    }

    // Verify password
    const isPasswordValid = await AuthService.comparePasswords(password, user.password)
    if (!isPasswordValid) {
      return ApiResponseHelper.error('Invalid email or password', 401)
    }

    // Check user status
    if (user.status === 'SUSPENDED') {
      return ApiResponseHelper.error('Your account has been suspended', 403)
    }

    if (user.status === 'REJECTED') {
      return ApiResponseHelper.error('Your account registration was rejected', 403)
    }

    if (user.status === 'PENDING') {
      return ApiResponseHelper.error('Your account is pending approval', 403)
    }

    // Create session
    const deviceInfo = {
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: getClientIP(request)
    }

    const session = await AuthService.createSession(
      user.id,
      deviceInfo,
      getClientIP(request)
    )

    // Generate JWT
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return ApiResponseHelper.success({
      user: userWithoutPassword,
      token,
      expiresAt: session.expiresAt
    }, 'Login successful')

  } catch (error) {
    return handleApiError(error)
  }
}