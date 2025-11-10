/**
 * X API v2 Client
 * Handles authentication, requests, and error handling for X API v2
 */

import { AppError, ErrorCodes } from '../utils/errors'
import {
  XApiConfig,
  XApiCredentials,
  RateLimitInfo,
  XApiResponse,
  ApiError,
} from './types'
import {
  RateLimiterManager,
  RetryHandler,
  parseRateLimitHeaders,
  createRateLimitError,
} from './rate-limiter'

// ============================================================================
// X API Client
// ============================================================================

export class XApiClient {
  private baseUrl: string
  private credentials: XApiCredentials | null = null
  private bearerToken: string | null = null
  private rateLimiter: RateLimiterManager
  private retryHandler: RetryHandler

  constructor(config: XApiConfig) {
    this.baseUrl = config.baseUrl || 'https://api.x.com/2'
    this.rateLimiter = new RateLimiterManager()
    this.retryHandler = new RetryHandler()

    // Set authentication
    if (config.bearerToken) {
      this.bearerToken = config.bearerToken
    }

    if (config.accessToken) {
      this.credentials = {
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
        expiresAt: config.refreshToken ? Date.now() + 7200 * 1000 : undefined, // 2 hours default
      }
    }
  }

  // ==========================================================================
  // Authentication Methods
  // ==========================================================================

  /**
   * Set Bearer Token for app-only authentication
   */
  setBearerToken(token: string): void {
    this.bearerToken = token
  }

  /**
   * Set OAuth 2.0 user credentials
   */
  setCredentials(credentials: XApiCredentials): void {
    this.credentials = credentials
  }

  /**
   * Check if credentials are expired
   */
  private isCredentialsExpired(): boolean {
    if (!this.credentials?.expiresAt) {
      return false
    }
    return Date.now() >= this.credentials.expiresAt
  }

  /**
   * Refresh OAuth 2.0 access token
   * This should be called by NextAuth.js refresh token callback
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<XApiCredentials> {
    const tokenUrl = 'https://api.x.com/2/oauth2/token'

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    })

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    )

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new AppError(
          response.status,
          ErrorCodes.X_API_ERROR,
          `Failed to refresh token: ${error.error_description || error.error}`,
          error
        )
      }

      const data = await response.json()

      const newCredentials: XApiCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      }

      this.credentials = newCredentials
      return newCredentials
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError(
        500,
        ErrorCodes.X_API_ERROR,
        'Failed to refresh access token',
        error
      )
    }
  }

  /**
   * Get authorization header
   */
  private getAuthHeader(): string {
    // Prefer user context (OAuth 2.0) over app context (Bearer Token)
    if (this.credentials?.accessToken) {
      return `Bearer ${this.credentials.accessToken}`
    }

    if (this.bearerToken) {
      return `Bearer ${this.bearerToken}`
    }

    throw new AppError(
      401,
      ErrorCodes.UNAUTHORIZED,
      'No authentication credentials provided'
    )
  }

  // ==========================================================================
  // HTTP Request Methods
  // ==========================================================================

  /**
   * Make a GET request to X API
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: { skipRateLimit?: boolean }
  ): Promise<XApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, params, options)
  }

  /**
   * Make a POST request to X API
   */
  async post<T>(
    endpoint: string,
    body?: any,
    options?: { skipRateLimit?: boolean }
  ): Promise<XApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, undefined, options)
  }

  /**
   * Make a DELETE request to X API
   */
  async delete<T>(
    endpoint: string,
    options?: { skipRateLimit?: boolean }
  ): Promise<XApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, undefined, options)
  }

  /**
   * Main request method with retry logic and rate limiting
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    params?: Record<string, any>,
    options?: { skipRateLimit?: boolean }
  ): Promise<XApiResponse<T>> {
    // Check rate limit before making request
    if (!options?.skipRateLimit) {
      await this.checkRateLimit(endpoint)
    }

    // Execute request with retry logic
    return this.retryHandler.execute(
      async () => {
        return await this.makeRequest<T>(method, endpoint, body, params)
      },
      { endpoint, identifier: this.getIdentifier() }
    )
  }

  /**
   * Make actual HTTP request
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<XApiResponse<T>> {
    // Check if credentials need refresh
    if (this.credentials && this.isCredentialsExpired()) {
      throw new AppError(
        401,
        ErrorCodes.UNAUTHORIZED,
        'Access token expired. Please refresh the token.'
      )
    }

    // Build URL
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, '')}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            url.searchParams.append(key, value.join(','))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    // Build request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        Authorization: this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      requestOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url.toString(), requestOptions)

      // Parse rate limit headers
      const rateLimit = parseRateLimitHeaders(response.headers)

      // Handle non-OK responses
      if (!response.ok) {
        await this.handleErrorResponse(response, rateLimit)
      }

      // Parse response
      const data = await response.json()

      // Check for API errors in response
      if (data.errors && data.errors.length > 0) {
        this.handleApiErrors(data.errors, response.status)
      }

      return {
        data: data as T,
        rateLimit: rateLimit || undefined,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      // Network or parsing errors
      throw new AppError(
        500,
        ErrorCodes.NETWORK_ERROR,
        'Network request failed',
        error
      )
    }
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(
    response: Response,
    rateLimit: RateLimitInfo | null
  ): Promise<never> {
    const status = response.status

    // Try to parse error body
    let errorBody: any
    try {
      errorBody = await response.json()
    } catch {
      errorBody = { message: response.statusText }
    }

    // Handle specific status codes
    switch (status) {
      case 400:
        throw new AppError(
          400,
          ErrorCodes.VALIDATION_ERROR,
          errorBody.detail || errorBody.message || 'Invalid request',
          errorBody
        )

      case 401:
        throw new AppError(
          401,
          ErrorCodes.UNAUTHORIZED,
          errorBody.detail || 'Authentication failed',
          errorBody
        )

      case 403:
        throw new AppError(
          403,
          ErrorCodes.FORBIDDEN,
          errorBody.detail || 'Access forbidden',
          errorBody
        )

      case 404:
        throw new AppError(
          404,
          ErrorCodes.NOT_FOUND,
          errorBody.detail || 'Resource not found',
          errorBody
        )

      case 429:
        // Rate limit exceeded
        const resetTimestamp = rateLimit?.reset || Math.floor(Date.now() / 1000) + 900 // 15 min default
        throw createRateLimitError(resetTimestamp, response.url) as AppError

      case 500:
      case 502:
      case 503:
      case 504:
        throw new AppError(
          status,
          ErrorCodes.X_API_ERROR,
          errorBody.detail || 'X API service error',
          errorBody
        )

      default:
        throw new AppError(
          status,
          ErrorCodes.X_API_ERROR,
          errorBody.detail || 'Unknown X API error',
          errorBody
        )
    }
  }

  /**
   * Handle API errors from response body
   */
  private handleApiErrors(errors: ApiError[], status: number): void {
    const error = errors[0]
    const message = error.detail || error.message || 'X API error'

    throw new AppError(status, ErrorCodes.X_API_ERROR, message, errors)
  }

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  /**
   * Check rate limit before making request
   */
  private async checkRateLimit(endpoint: string): Promise<void> {
    const identifier = this.getIdentifier()
    const result = await this.rateLimiter.checkLimit(endpoint, identifier)

    if (!result.allowed) {
      const resetDate = new Date(Date.now() + result.resetIn)
      throw new AppError(
        429,
        ErrorCodes.X_RATE_LIMIT,
        `Rate limit exceeded. Resets at ${resetDate.toISOString()}`,
        {
          resetIn: result.resetIn,
          remaining: result.remaining,
        }
      )
    }
  }

  /**
   * Get identifier for rate limiting (user ID or 'app')
   */
  private getIdentifier(): string {
    // In production, you would get the user ID from the credentials
    // For now, we'll use 'app' for app-only auth or 'user' for user auth
    return this.credentials ? 'user' : 'app'
  }

  /**
   * Get rate limiter instance (for testing or manual management)
   */
  getRateLimiter(): RateLimiterManager {
    return this.rateLimiter
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create X API client with Bearer Token (app-only auth)
 */
export function createXApiClient(bearerToken: string): XApiClient {
  return new XApiClient({ bearerToken })
}

/**
 * Create X API client with OAuth 2.0 user credentials
 */
export function createXApiClientWithOAuth(
  accessToken: string,
  refreshToken?: string
): XApiClient {
  return new XApiClient({ accessToken, refreshToken })
}

/**
 * Get X API client from environment variables
 */
export function getXApiClientFromEnv(): XApiClient {
  const bearerToken = process.env.X_BEARER_TOKEN

  if (!bearerToken) {
    throw new Error('X_BEARER_TOKEN environment variable is not set')
  }

  return createXApiClient(bearerToken)
}
