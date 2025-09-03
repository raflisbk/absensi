import { NextRequest } from 'next/server'
import { AuthService, requireAuth } from '@/lib/auth'
import { ApiResponseHelper, handleApiError } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Get session ID from token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponseHelper.unauthorized()
    }

    const token = authHeader.substring(7)
    const payload = AuthService.verifyToken(token)

    if (!payload) {
      return ApiResponseHelper.unauthorized()
    }

    // Revoke session
    await AuthService.revokeSession(payload.sessionId)

    return ApiResponseHelper.success(null, 'Logout successful')

  } catch (error) {
    return handleApiError(error)
  }
}