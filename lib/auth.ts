import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  sessionId: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }

  static async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static async createSession(userId: string, deviceInfo: any, ipAddress: string) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const session = await prisma.session.create({
      data: {
        userId,
        token: this.generateRandomToken(),
        deviceInfo,
        ipAddress,
        expiresAt,
      }
    })

    return session
  }

  static async validateSession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
      }
      return null
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    })

    return session
  }

  static async revokeSession(token: string) {
    await prisma.session.deleteMany({
      where: { token }
    })
  }

  static async revokeAllUserSessions(userId: string) {
    await prisma.session.deleteMany({
      where: { userId }
    })
  }

  static generateRandomToken(): string {
    return require('crypto').randomBytes(32).toString('hex')
  }

  static async getUserFromRequest(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = this.verifyToken(token)

    if (!payload) {
      return null
    }

    const session = await this.validateSession(payload.sessionId)
    
    if (!session) {
      return null
    }

    return session.user
  }
}

export async function requireAuth(request: NextRequest, allowedRoles?: string[]) {
  const user = await AuthService.getUserFromRequest(request)

  if (!user) {
    throw new Error('Authentication required')
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Account not active')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  if (xRealIp) {
    return xRealIp.trim()
  }
  
  return request.ip || 'unknown'
}