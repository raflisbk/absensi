import { NextResponse } from 'next/server'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export class ApiResponseHelper {
  static success<T>(data?: T, message?: string, meta?: any): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      message,
      data,
      meta
    })
  }

  static error(
    message: string, 
    statusCode: number = 400, 
    errors?: Record<string, string[]>
  ): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message,
      errors
    }, { status: statusCode })
  }

  static validationError(errors: Record<string, string[]>): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      errors
    }, { status: 422 })
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 401 })
  }

  static forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 403 })
  }

  static notFound(message: string = 'Not found'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 404 })
  }

  static serverError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 })
  }

  static created<T>(data?: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      message,
      data
    }, { status: 201 })
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }

  static paginated<T>(
    data: T[], 
    page: number, 
    limit: number, 
    total: number,
    message?: string
  ): NextResponse<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    })
  }
}

export function handleApiError(error: any): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error.code === 'P2002') {
    return ApiResponseHelper.error('Duplicate entry found', 409)
  }

  if (error.code === 'P2025') {
    return ApiResponseHelper.notFound('Record not found')
  }

  if (error.name === 'ValidationError') {
    return ApiResponseHelper.validationError(error.errors)
  }

  if (error.message === 'Authentication required') {
    return ApiResponseHelper.unauthorized()
  }

  if (error.message === 'Insufficient permissions') {
    return ApiResponseHelper.forbidden()
  }

  return ApiResponseHelper.serverError(
    process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  )
}