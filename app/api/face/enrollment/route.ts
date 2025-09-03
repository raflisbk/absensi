import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, faceRecognitionRateLimit } from '@/lib/rate-limit'
import { faceEnrollmentSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, faceRecognitionRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request)

    // Get user's face enrollment data
    const faceProfile = await prisma.faceProfile.findUnique({
      where: { userId: currentUser.id },
      select: {
        id: true,
        enrollmentStatus: true,
        qualityScore: true,
        enrolledAt: true,
        lastUpdated: true,
        version: true
      }
    })

    if (!faceProfile) {
      return ApiResponseHelper.notFound('Face profile not found')
    }

    return ApiResponseHelper.success(faceProfile, 'Face profile retrieved successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, faceRecognitionRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request, ['STUDENT', 'LECTURER'])
    const body = await request.json()

    const validation = faceEnrollmentSchema.safeParse(body)
    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { faceDescriptors, qualityScore, confidenceThreshold } = validation.data

    // Check minimum quality score
    if (qualityScore < 0.7) {
      return ApiResponseHelper.error(
        'Face image quality is too low. Please try again with better lighting and clearer image.',
        400
      )
    }

    // Check if user already has face profile
    const existingProfile = await prisma.faceProfile.findUnique({
      where: { userId: currentUser.id }
    })

    let faceProfile
    if (existingProfile) {
      // Update existing profile
      faceProfile = await prisma.faceProfile.update({
        where: { userId: currentUser.id },
        data: {
          faceDescriptors: JSON.stringify(faceDescriptors),
          qualityScore,
          confidenceThreshold,
          enrollmentStatus: 'COMPLETED',
          lastUpdated: new Date(),
          version: existingProfile.version + 1
        }
      })

      // Update user's face enrollment status
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { faceEnrollmentStatus: 'COMPLETED' }
      })
    } else {
      // Create new profile
      faceProfile = await prisma.faceProfile.create({
        data: {
          userId: currentUser.id,
          faceDescriptors: JSON.stringify(faceDescriptors),
          qualityScore,
          confidenceThreshold,
          enrollmentStatus: 'COMPLETED',
          enrolledAt: new Date(),
          lastUpdated: new Date(),
          version: 1
        }
      })

      // Update user's face enrollment status
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { faceEnrollmentStatus: 'COMPLETED' }
      })
    }

    return ApiResponseHelper.success(
      {
        id: faceProfile.id,
        enrollmentStatus: faceProfile.enrollmentStatus,
        qualityScore: faceProfile.qualityScore,
        version: faceProfile.version,
        enrolledAt: faceProfile.enrolledAt,
        lastUpdated: faceProfile.lastUpdated
      },
      existingProfile ? 'Face profile updated successfully' : 'Face enrollment completed successfully'
    )

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, faceRecognitionRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const currentUser = await requireAuth(request)

    // Check if face profile exists
    const faceProfile = await prisma.faceProfile.findUnique({
      where: { userId: currentUser.id }
    })

    if (!faceProfile) {
      return ApiResponseHelper.notFound('Face profile not found')
    }

    // Delete face profile
    await prisma.faceProfile.delete({
      where: { userId: currentUser.id }
    })

    // Update user's face enrollment status
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { faceEnrollmentStatus: 'PENDING' }
    })

    return ApiResponseHelper.success(null, 'Face profile deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}