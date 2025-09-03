import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import jwt, { SignOptions } from 'jsonwebtoken'
import { z } from 'zod'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const SALT_ROUNDS = 12

// JWT Payload interface
interface JWTPayload {
  userId: string
  email: string
  role: string
  sessionId: string
  iat?: number
  exp?: number
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
  }

  static async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = { expiresIn: '7d' }
    return jwt.sign(payload, JWT_SECRET, options)
  }

  static generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static async createSession(
    userId: string, 
    deviceInfo: any, 
    ipAddress: string
  ): Promise<any> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    const session = await prisma.session.create({
      data: {
        userId,
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress,
        expiresAt,
        lastActivity: new Date()
      }
    })

    return session
  }

  static async validateSession(sessionId: string): Promise<any | null> {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Update last activity
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() }
    })

    return session
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId }
    })
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await this.deleteSession(sessionId)
  }

  static async deleteUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId }
    })
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    await this.deleteUserSessions(userId)
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

// Auth validation schemas
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'])
})

export type AuthUser = z.infer<typeof authUserSchema>

// Extract user from token
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = AuthService.verifyToken(token)
    if (!payload || !payload.sessionId) {
      return null
    }

    const session = await AuthService.validateSession(payload.sessionId)
    if (!session || !session.user) {
      return null
    }

    // Validate user status
    if (session.user.status !== 'ACTIVE') {
      return null
    }

    return authUserSchema.parse(session.user)
  } catch (error) {
    return null
  }
}

// Require authentication middleware
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

// Password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}