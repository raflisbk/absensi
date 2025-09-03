import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// JWT Payload interface
interface JWTPayload {
  userId: string
  email: string
  role: string
  sessionId: string
  iat?: number
  exp?: number
}

// Auth validation schemas
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'])
})

export type AuthUser = z.infer<typeof authUserSchema>

// Edge-compatible JWT utilities (no bcrypt)
export class EdgeAuthUtils {
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
  }
}

// Helper function to get client IP from various headers
export function getClientIP(request: NextRequest): string {
  // Try different headers to get the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }
  
  // Fallback to a default value
  return '127.0.0.1'
}

// Extract user from token (for API routes only - uses Prisma)
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    // Only import prisma when needed (API routes only)
    const { prisma } = await import('@/lib/prisma')
    
    const payload = EdgeAuthUtils.verifyToken(token)
    if (!payload || !payload.sessionId) {
      return null
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true
          }
        }
      }
    })

    if (!session || !session.user || session.expiresAt < new Date()) {
      return null
    }

    // Validate user status
    if (session.user.status !== 'ACTIVE') {
      return null
    }

    // Update last activity
    await prisma.session.update({
      where: { id: payload.sessionId },
      data: { lastActivity: new Date() }
    })

    return authUserSchema.parse(session.user)
  } catch (error) {
    return null
  }
}

// Require authentication middleware (for API routes)
export async function requireAuth(
  request: NextRequest, 
  allowedRoles?: string[]
): Promise<AuthUser> {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    throw new Error('No authentication token provided')
  }

  const user = await getUserFromToken(token)
  if (!user) {
    throw new Error('Invalid or expired token')
  }

  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
  }

  return user
}

// Optional auth - doesn't throw if no token
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    return await requireAuth(request)
  } catch (error) {
    return null
  }
}

// Edge-compatible token validation (no database access)
export function validateTokenOnly(token: string): JWTPayload | null {
  return EdgeAuthUtils.verifyToken(token)
}

// Role checking helpers
export const isAdmin = (user: AuthUser | null): boolean => user?.role === 'ADMIN'
export const isLecturer = (user: AuthUser | null): boolean => user?.role === 'LECTURER'  
export const isStudent = (user: AuthUser | null): boolean => user?.role === 'STUDENT'

// Permission checking
export const canAccessAdminPanel = (user: AuthUser | null): boolean => isAdmin(user)
export const canManageUsers = (user: AuthUser | null): boolean => isAdmin(user)
export const canManageClasses = (user: AuthUser | null): boolean => 
  isAdmin(user) || isLecturer(user)
export const canViewAllAttendance = (user: AuthUser | null): boolean => 
  isAdmin(user) || isLecturer(user)