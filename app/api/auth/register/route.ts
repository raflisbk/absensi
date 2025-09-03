import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth-service'
import { EmailService } from '@/lib/email'
import { registerSchema } from '@/lib/validation'
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
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { email, name, studentId, phone, role, password } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { studentId }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return ApiResponseHelper.error('Email already registered', 409)
      }
      if (existingUser.studentId === studentId) {
        return ApiResponseHelper.error('Student/Staff ID already registered', 409)
      }
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        studentId,
        phone,
        role,
        password: hashedPassword,
        status: 'PENDING',
        faceEnrollmentStatus: 'NOT_ENROLLED'
      }
    })

    // Create initial registration steps
    const registrationSteps = [
      'BASIC_INFO',
      'DOCUMENT_VERIFICATION', 
      'FACE_ENROLLMENT',
      'EMAIL_VERIFICATION',
      'PHONE_VERIFICATION'
    ]

    await prisma.registrationStep.createMany({
      data: registrationSteps.map(stepName => ({
        userId: user.id,
        stepName: stepName as any,
        status: stepName === 'BASIC_INFO' ? 'COMPLETED' : 'PENDING'
      }))
    })

    // Create email verification token using the correct method name
    const verificationToken = AuthService.generateRandomToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    await prisma.emailVerification.create({
      data: {
        email,
        token: verificationToken,
        expiresAt
      }
    })

    // Send verification email
    await EmailService.sendEmailVerification(email, verificationToken, name)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return ApiResponseHelper.created({
      user: userWithoutPassword,
      registrationSteps: registrationSteps.map(step => ({
        stepName: step,
        status: step === 'BASIC_INFO' ? 'COMPLETED' : 'PENDING'
      })),
      nextStep: 'EMAIL_VERIFICATION',
      message: 'Registration successful! Please check your email for verification.'
    }, 'User registered successfully')

  } catch (error) {
    return handleApiError(error)
  }
}