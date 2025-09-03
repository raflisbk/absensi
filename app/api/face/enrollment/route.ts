import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { faceEnrollmentSchema } from '@/lib/validation'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, faceRecognitionRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, faceRecognitionRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    const user = await requireAuth(request)
    const body = await request.json()
    const validation = faceEnrollmentSchema.safeParse(body)

    if (!validation.success) {
      return ApiResponseHelper.validationError(validation.error.flatten().fieldErrors)
    }

    const { faceDescriptors, qualityScore, confidenceThreshold } = validation.data

    // Check if user already has face profile
    const existingProfile = await prisma.faceProfile.findFirst({
      where: { userId: user.id }
    })

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await prisma.faceProfile.update({
        where: { id: existingProfile.id },
        data: {
          faceDescriptors,
          qualityScore,
          confidenceThreshold,
          updatedAt: new Date()
        }
      })

      // Update user face enrollment status
      await prisma.user.update({
        where: { id: user.id },
        data: { faceEnrollmentStatus: 'ENROLLED' }
      })

      // Update registration step
      await prisma.registrationStep.updateMany({
        where: {
          userId: user.id,
          stepName: 'FACE_ENROLLMENT'
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          data: { qualityScore }
        }
      })

      return ApiResponseHelper.success(
        { faceProfileId: updatedProfile.id },
        'Face profile updated successfully'
      )
    } else {
      // Create new face profile
      const faceProfile = await prisma.faceProfile.create({
        data: {
          userId: user.id,
          faceDescriptors,
          qualityScore,
          confidenceThreshold
        }
      })

      // Update user face enrollment status
      await prisma.user.update({
        where: { id: user.id },
        data: { faceEnrollmentStatus: 'ENROLLED' }
      })

      // Update registration step
      await prisma.registrationStep.updateMany({
        where: {
          userId: user.id,
          stepName: 'FACE_ENROLLMENT'
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          data: { qualityScore }
        }
      })

      return ApiResponseHelper.created(
        { faceProfileId: faceProfile.id },
        'Face enrollment completed successfully'
      )
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const faceProfile = await prisma.faceProfile.findFirst({
      where: { userId: user.id }
    })

    if (!faceProfile) {
      return ApiResponseHelper.notFound('Face profile not found')
    }

    return ApiResponseHelper.success({
      id: faceProfile.id,
      qualityScore: faceProfile.qualityScore,
      confidenceThreshold: faceProfile.confidenceThreshold,
      createdAt: faceProfile.createdAt,
      updatedAt: faceProfile.updatedAt
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const faceProfile = await prisma.faceProfile.findFirst({
      where: { userId: user.id }
    })

    if (!faceProfile) {
      return ApiResponseHelper.notFound('Face profile not found')
    }

    await prisma.faceProfile.delete({
      where: { id: faceProfile.id }
    })

    // Update user face enrollment status
    await prisma.user.update({
      where: { id: user.id },
      data: { faceEnrollmentStatus: 'NOT_ENROLLED' }
    })

    // Update registration step
    await prisma.registrationStep.updateMany({
      where: {
        userId: user.id,
        stepName: 'FACE_ENROLLMENT'
      },
      data: {
        status: 'PENDING',
        completedAt: null
      }
    })

    return ApiResponseHelper.success(null, 'Face profile deleted successfully')

  } catch (error) {
    return handleApiError(error)
  }
}