import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class InMemoryRateLimit {
  private store: RateLimitStore = {}

  async limit(identifier: string, maxRequests: number, windowMs: number): Promise<{
    success: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up expired entries
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key]
      }
    })

    if (!this.store[identifier]) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + windowMs
      }
      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      }
    }

    const entry = this.store[identifier]

    if (entry.resetTime < now) {
      entry.count = 1
      entry.resetTime = now + windowMs
      return {
        success: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs
      }
    }

    if (entry.count >= maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    entry.count++
    return {
      success: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }
}

const rateLimiter = new InMemoryRateLimit()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
  keyGenerator?: (request: NextRequest) => string
}

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  success: boolean
  headers: Record<string, string>
  error?: string
}> {
  const {
    maxRequests,
    windowMs,
    message = 'Too many requests, please try again later',
    keyGenerator = defaultKeyGenerator
  } = config

  const identifier = keyGenerator(request)
  const result = await rateLimiter.limit(identifier, maxRequests, windowMs)

  const headers = {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString()
  }

  if (!result.success) {
    return {
      success: false,
      headers,
      error: message
    }
  }

  return {
    success: true,
    headers
  }
}

function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `rate_limit:${ip}`
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const result = await rateLimit(request, config)
    return result
  }
}

// Predefined rate limit configurations
export const authRateLimit: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts, please try again later'
}

export const apiRateLimit: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many API requests, please try again later'
}

export const faceRecognitionRateLimit: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many face recognition attempts, please try again later'
}

export const emailRateLimit: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many email requests, please try again later',
  keyGenerator: (request) => {
    const body = request.body as any
    const email = body?.email || 'unknown'
    return `email_rate_limit:${email}`
  }
}