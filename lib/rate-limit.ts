import { NextRequest } from 'next/server'

// Rate limit configuration
export interface RateLimitConfig {
  window: number // Time window in seconds
  limit: number // Max requests per window
}

// Default rate limits
export const apiRateLimit: RateLimitConfig = {
  window: 60, // 1 minute
  limit: 100 // 100 requests per minute
}

export const authRateLimit: RateLimitConfig = {
  window: 60, // 1 minute  
  limit: 10 // 10 requests per minute
}

export const uploadRateLimit: RateLimitConfig = {
  window: 300, // 5 minutes
  limit: 20 // 20 uploads per 5 minutes
}

// In-memory store for rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

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

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  error?: string
}

export async function rateLimit(
  request: NextRequest, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIP(request)
  const key = `rateLimit:${ip}`
  const now = Date.now()
  const windowMs = config.window * 1000
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // First request in window or window expired
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime
    }
  }
  
  if (current.count >= config.limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: current.resetTime,
      error: 'Rate limit exceeded'
    }
  }
  
  // Increment counter
  current.count += 1
  rateLimitStore.set(key, current)
  
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - current.count,
    resetTime: current.resetTime
  }
}