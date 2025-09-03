import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import jwt, { SignOptions } from 'jsonwebtoken'
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

// Server-only auth service (uses bcrypt)
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

// Password validation (server-side)
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