/**
 * Claude API Client
 * Anthropic Claude API v1 integration for AgentX
 */

import Anthropic from '@anthropic-ai/sdk';

// Configuration
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-3-5-sonnet-20241022';
const MAX_TOKENS = 300;
const DEFAULT_TEMPERATURE = 0.7;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Claude API client instance
 */
class ClaudeClient {
  private client: Anthropic;
  private lastRequestTime: number = 0;

  constructor() {
    if (!CLAUDE_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    this.client = new Anthropic({
      apiKey: CLAUDE_API_KEY,
    });
  }

  /**
   * Rate limiting: Ensure minimum delay between requests
   */
  private async rateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delayTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Send a message to Claude API with retry logic
   */
  async sendMessage(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      retries?: number;
    }
  ): Promise<string> {
    const temperature = options?.temperature ?? DEFAULT_TEMPERATURE;
    const maxTokens = options?.maxTokens ?? MAX_TOKENS;
    const maxRetries = options?.retries ?? MAX_RETRIES;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Apply rate limiting
        await this.rateLimitDelay();

        // Call Claude API
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: maxTokens,
          temperature: temperature,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        });

        // Extract text from response
        const content = response.content[0];
        if (content.type === 'text') {
          return content.text;
        }

        throw new Error('Unexpected response format from Claude API');
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (this.isRetryableError(error)) {
          if (attempt < maxRetries) {
            // Wait before retrying
            const delay = RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
            console.warn(
              `Claude API request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
              error
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        // Non-retryable error or max retries reached
        throw this.handleError(error);
      }
    }

    // Should not reach here, but just in case
    throw lastError || new Error('Claude API request failed after all retries');
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // Rate limit errors (429)
    if (error.status === 429) {
      return true;
    }

    // Server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    return false;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any): Error {
    // API key errors
    if (error.status === 401) {
      return new Error('Invalid Claude API key');
    }

    // Rate limit errors
    if (error.status === 429) {
      return new Error('Claude API rate limit exceeded. Please try again later.');
    }

    // Invalid request errors
    if (error.status === 400) {
      return new Error(`Invalid request to Claude API: ${error.message}`);
    }

    // Server errors
    if (error.status >= 500) {
      return new Error('Claude API is currently unavailable. Please try again later.');
    }

    // Unknown errors
    return new Error(`Claude API error: ${error.message || 'Unknown error'}`);
  }

  /**
   * Send message with JSON response parsing
   * Useful for structured outputs
   */
  async sendMessageJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      retries?: number;
    }
  ): Promise<T> {
    const response = await this.sendMessage(systemPrompt, userPrompt, options);

    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;

      return JSON.parse(jsonString.trim()) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response from Claude: ${response}`);
    }
  }

  /**
   * Test connection to Claude API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage(
        'You are a helpful assistant.',
        'Say "Hello" in one word.',
        { maxTokens: 10 }
      );
      return true;
    } catch (error) {
      console.error('Claude API connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let claudeClientInstance: ClaudeClient | null = null;

/**
 * Get Claude client instance (singleton)
 */
export function getClaudeClient(): ClaudeClient {
  if (!claudeClientInstance) {
    claudeClientInstance = new ClaudeClient();
  }
  return claudeClientInstance;
}

/**
 * Export for testing or direct usage
 */
export { ClaudeClient };

/**
 * Export constants
 */
export { MODEL, MAX_TOKENS, DEFAULT_TEMPERATURE };
