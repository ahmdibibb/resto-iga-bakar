import { NextResponse } from 'next/server'

/**
 * Custom error classes for different error scenarios
 */

export class QRCodeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QRCodeValidationError'
  }
}

export class OrderValidationError extends Error {
  public field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'OrderValidationError'
    this.field = field
  }
}

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class InternalServerError extends Error {
  constructor(message: string = 'Internal server error') {
    super(message)
    this.name = 'InternalServerError'
  }
}

/**
 * Central error handler for API routes
 * Returns appropriate HTTP status codes and error messages
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for debugging
  console.error('API Error:', error)

  // QR Code validation errors (400)
  if (error instanceof QRCodeValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Order validation errors (400)
  if (error instanceof OrderValidationError) {
    return NextResponse.json(
      { error: error.message, field: error.field },
      { status: 400 }
    )
  }

  // Payment validation errors (400)
  if (error instanceof PaymentValidationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Authentication errors (401)
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  // Authorization errors (403)
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  // Not found errors (404)
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }

  // Conflict errors (409)
  if (error instanceof ConflictError) {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    )
  }

  // Internal server errors (500)
  if (error instanceof InternalServerError) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Default to 500 for unknown errors
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
