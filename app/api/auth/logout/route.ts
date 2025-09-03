import { NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { ApiResponseHelper, handleApiError } from '@/lib/response'
import { rateLimit, authRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, authRateLimit)
    if (!rateLimitResult.success) {
      return ApiResponseHelper.error(rateLimitResult.error!, 429)
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return ApiResponseHelper.error('No authentication token provided', 401)
    }

    // Verify token and get session ID
    const payload = AuthService.verifyToken(token)
    if (!payload || !payload.sessionId) {
      return ApiResponseHelper.error('Invalid token', 401)
    }

    // Revoke the session
    try {
      await AuthService.revokeSession(payload.sessionId)
    } catch (error) {
      // Session might already be deleted, but that's okay
      console.log('Session already deleted or not found:', payload.sessionId)
    }

    return ApiResponseHelper.success(null, 'Logged out successfully')

  } catch (error) {
    return handleApiError(error)
  }
}

// Also support GET method for logout links
export async function GET(request: NextRequest) {
  return POST(request)
}