/**
 * Content Filtering and Policy Compliance
 * Ensures generated content complies with X (Twitter) content policies
 */

/**
 * Filter result interface
 */
export interface ContentFilterResult {
  passed: boolean;
  issues: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  recommendation: 'approve' | 'revise' | 'reject';
  filteredText?: string;
}

/**
 * Prohibited words and patterns (expandable)
 */
const PROHIBITED_WORDS = [
  // Violence and threats
  'kill', 'murder', 'bomb', 'terrorist', 'weapon',
  // Hate speech (basic list - should be expanded)
  'hate', 'racist', 'sexist',
  // Explicit content
  'explicit', 'nsfw', 'porn',
  // Spam indicators
  'click here', 'buy now', 'limited time',
];

/**
 * Sensitive topics that require careful handling
 */
const SENSITIVE_TOPICS = [
  'politics',
  'religion',
  'cryptocurrency',
  'medical advice',
  'legal advice',
  'financial advice',
  'weight loss',
  'gambling',
];

/**
 * Spam patterns (simple regex patterns)
 */
const SPAM_PATTERNS = [
  /\b(buy|get|click|download)\s+(now|here|today)\b/gi,
  /\b(100%|guaranteed|free|limited time)\b/gi,
  /https?:\/\/bit\.ly|tinyurl/gi, // Shortened URLs can be suspicious
  /(!!!+|FREE|BUY NOW)/g, // Excessive punctuation/caps
  /(\$\$+|\d+\$)/g, // Money emphasis
];

/**
 * Character limit for X posts
 */
const MAX_TWEET_LENGTH = 280;

/**
 * Main content filter class
 */
export class ContentFilter {
  /**
   * Check if content passes all filters
   */
  static async filterContent(text: string): Promise<ContentFilterResult> {
    const issues: string[] = [];
    let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

    // 1. Length check
    if (text.length > MAX_TWEET_LENGTH) {
      issues.push(`Post exceeds ${MAX_TWEET_LENGTH} character limit (${text.length} characters)`);
      severity = 'high';
    }

    if (text.length === 0) {
      issues.push('Post is empty');
      severity = 'high';
      return {
        passed: false,
        issues,
        severity,
        recommendation: 'reject',
      };
    }

    // 2. Prohibited words check
    const prohibitedCheck = this.checkProhibitedWords(text);
    if (prohibitedCheck.found.length > 0) {
      issues.push(`Contains prohibited words: ${prohibitedCheck.found.join(', ')}`);
      severity = 'high';
    }

    // 3. Spam patterns check
    const spamCheck = this.checkSpamPatterns(text);
    if (spamCheck.isSpam) {
      issues.push(`Potential spam detected: ${spamCheck.reasons.join(', ')}`);
      severity = this.maxSeverity(severity, 'medium');
    }

    // 4. Sensitive topics check
    const sensitiveCheck = this.checkSensitiveTopics(text);
    if (sensitiveCheck.found.length > 0) {
      issues.push(`Contains sensitive topics: ${sensitiveCheck.found.join(', ')}`);
      severity = this.maxSeverity(severity, 'low');
    }

    // 5. URL safety check
    const urlCheck = this.checkURLs(text);
    if (!urlCheck.safe) {
      issues.push('Contains potentially unsafe URLs');
      severity = this.maxSeverity(severity, 'medium');
    }

    // 6. Excessive capitalization check
    const capsCheck = this.checkExcessiveCaps(text);
    if (capsCheck.excessive) {
      issues.push('Excessive capitalization detected (may appear as shouting)');
      severity = this.maxSeverity(severity, 'low');
    }

    // 7. Repetitive content check
    const repetitiveCheck = this.checkRepetitiveContent(text);
    if (repetitiveCheck.isRepetitive) {
      issues.push('Contains repetitive patterns');
      severity = this.maxSeverity(severity, 'low');
    }

    // Determine recommendation
    let recommendation: 'approve' | 'revise' | 'reject';
    if (severity === 'none') {
      recommendation = 'approve';
    } else if (severity === 'high') {
      recommendation = 'reject';
    } else {
      recommendation = 'revise';
    }

    return {
      passed: severity === 'none',
      issues,
      severity,
      recommendation,
      filteredText: text,
    };
  }

  /**
   * Check for prohibited words
   */
  private static checkProhibitedWords(text: string): {
    found: string[];
    locations: number[];
  } {
    const found: string[] = [];
    const locations: number[] = [];
    const lowerText = text.toLowerCase();

    for (const word of PROHIBITED_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        found.push(word);
        const index = lowerText.indexOf(word);
        if (index !== -1) locations.push(index);
      }
    }

    return { found, locations };
  }

  /**
   * Check for spam patterns
   */
  private static checkSpamPatterns(text: string): {
    isSpam: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(text)) {
        reasons.push(`Matches spam pattern: ${pattern.source}`);
      }
    }

    // Check for excessive hashtags
    const hashtags = text.match(/#\w+/g) || [];
    if (hashtags.length > 5) {
      reasons.push(`Too many hashtags (${hashtags.length})`);
    }

    // Check for excessive mentions
    const mentions = text.match(/@\w+/g) || [];
    if (mentions.length > 5) {
      reasons.push(`Too many mentions (${mentions.length})`);
    }

    return {
      isSpam: reasons.length > 0,
      reasons,
    };
  }

  /**
   * Check for sensitive topics
   */
  private static checkSensitiveTopics(text: string): {
    found: string[];
  } {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const topic of SENSITIVE_TOPICS) {
      if (lowerText.includes(topic.toLowerCase())) {
        found.push(topic);
      }
    }

    return { found };
  }

  /**
   * Check URLs for safety
   */
  private static checkURLs(text: string): {
    safe: boolean;
    urls: string[];
  } {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    // Check for suspicious URL shorteners (excluding trusted ones)
    const suspiciousShorteners = ['bit.ly', 'tinyurl.com', 'goo.gl'];
    const hasSuspiciousUrl = urls.some(url =>
      suspiciousShorteners.some(shortener => url.includes(shortener))
    );

    return {
      safe: !hasSuspiciousUrl,
      urls,
    };
  }

  /**
   * Check for excessive capitalization
   */
  private static checkExcessiveCaps(text: string): {
    excessive: boolean;
    percentage: number;
  } {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) {
      return { excessive: false, percentage: 0 };
    }

    const capitals = text.replace(/[^A-Z]/g, '');
    const percentage = (capitals.length / letters.length) * 100;

    // More than 50% capitalization is excessive
    return {
      excessive: percentage > 50,
      percentage,
    };
  }

  /**
   * Check for repetitive content
   */
  private static checkRepetitiveContent(text: string): {
    isRepetitive: boolean;
  } {
    // Check for repeated words
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      if (word.length > 3) {
        // Ignore short words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // If any word appears more than 3 times, it's potentially repetitive
    const counts = Array.from(wordCounts.values());
    for (const count of counts) {
      if (count > 3) {
        return { isRepetitive: true };
      }
    }

    // Check for repeated characters (e.g., "!!!!", "???")
    const repeatedCharsRegex = /(.)\1{4,}/;
    if (repeatedCharsRegex.test(text)) {
      return { isRepetitive: true };
    }

    return { isRepetitive: false };
  }

  /**
   * Get maximum severity
   */
  private static maxSeverity(
    current: 'none' | 'low' | 'medium' | 'high',
    newSeverity: 'none' | 'low' | 'medium' | 'high'
  ): 'none' | 'low' | 'medium' | 'high' {
    const severityOrder = { none: 0, low: 1, medium: 2, high: 3 };
    return severityOrder[newSeverity] > severityOrder[current] ? newSeverity : current;
  }

  /**
   * Validate post length
   */
  static validateLength(text: string): {
    valid: boolean;
    length: number;
    remaining: number;
  } {
    const length = text.length;
    return {
      valid: length > 0 && length <= MAX_TWEET_LENGTH,
      length,
      remaining: MAX_TWEET_LENGTH - length,
    };
  }

  /**
   * Sanitize text (remove potentially harmful content)
   */
  static sanitize(text: string): string {
    // Remove control characters
    let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Check if text complies with X content policy (basic check)
   */
  static async checkXPolicy(text: string): Promise<{
    compliant: boolean;
    violations: string[];
  }> {
    const violations: string[] = [];

    // Basic policy checks
    const filterResult = await this.filterContent(text);

    if (!filterResult.passed) {
      violations.push(...filterResult.issues);
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }
}

/**
 * Quick filter function for simple checks
 */
export async function quickFilter(text: string): Promise<boolean> {
  const result = await ContentFilter.filterContent(text);
  return result.passed;
}

/**
 * Export constants for external use
 */
export { MAX_TWEET_LENGTH, PROHIBITED_WORDS, SENSITIVE_TOPICS };
