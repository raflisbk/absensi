import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth-service' // Use the server-only auth service
import { getClientIP } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, authRateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, authRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const body = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { email, password, rememberMe } = validation.data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true,
        emailVerified: true,
        faceEnrollmentStatus: true,
        studentId: true,
        avatar: true
      }
    })

    if (!user) {
      return ApiResponseHelper.error('Invalid email or password', 401)
    }

    // Check password
    const isPasswordValid = await AuthService.comparePasswords(password, user.password)
    if (!isPasswordValid) {
      return ApiResponseHelper.error('Invalid email or password', 401)
    }

    // Check user status
    if (user.status !== 'ACTIVE') {
      let message = 'Account not active'
      switch (user.status) {
        case 'PENDING':
          message = 'Account pending approval. Please wait for admin approval.'
          break
        case 'SUSPENDED':
          message = 'Account suspended. Please contact administrator.'
          break
        case 'REJECTED':
          message = 'Account rejected. Please contact administrator.'
          break
      }
      return ApiResponseHelper.error(message, 403)
    }

    // Check email verification
    if (!user.emailVerified) {
      return ApiResponseHelper.error(
        'Please verify your email address before logging in. Check your inbox for verification link.',
        403
      )
    }

    // Create session
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    const deviceInfo = {
      userAgent,
      ip: ipAddress,
      loginTime: new Date(),
      rememberMe: rememberMe || false
    }

    const session = await AuthService.createSession(user.id, deviceInfo, ipAddress)

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    }

    const token = AuthService.generateToken(tokenPayload)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress
      }
    })

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      studentId: user.studentId,
      faceEnrollmentStatus: user.faceEnrollmentStatus,
      emailVerified: user.emailVerified,
      avatar: user.avatar
    }

    return ApiResponseHelper.success(
      {
        user: userData,
        token,
        sessionId: session.id
      },
      'Login successful'
    )

  } catch (error) {
    return handleApiError(error)
  }
}