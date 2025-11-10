import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, message?: string, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: statusCode }
  )
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status: statusCode }
  )
}

export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
) {
  return NextResponse.json({
    success: true,
    data,
    pagination,
  })
}
