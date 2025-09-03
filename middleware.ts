import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes and API routes that don't need auth
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/verify-email',
  ]

  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ]

  // Skip middleware for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.includes(pathname) || publicApiRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token
  try {
    const payload = AuthService.verifyToken(token)
    
    if (!payload) {
      throw new Error('Invalid token')
    }

    // Validate session if it's an API route
    if (pathname.startsWith('/api/')) {
      const session = await AuthService.validateSession(payload.sessionId)
      
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session expired' },
          { status: 401 }
        )
      }

      // Check role-based access
      if (pathname.startsWith('/api/admin/') && payload.role !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // For pages, check role-based access
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.userId)
      requestHeaders.set('x-user-role', payload.role)
      requestHeaders.set('x-session-id', payload.sessionId)

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })
    }

    return NextResponse.next()

  } catch (error) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}