/**
 * Post Generator
 * High-level API for generating X posts using Claude AI
 */

import { getClaudeClient } from './claude-client';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildRegenerationPrompt,
  buildImprovementPrompt,
  buildVariationPrompt,
  type PostGenerationContext,
  type ToneType,
  type LengthType,
} from './prompts';
import { ContentFilter, type ContentFilterResult } from './content-filter';

/**
 * Generated post result
 */
export interface GeneratedPost {
  text: string;
  hashtags: string[];
  reasoning?: string;
}

/**
 * Multiple post variations
 */
export interface PostVariations {
  variations: GeneratedPost[];
  basedOnTopic?: string;
}

/**
 * Post improvement analysis
 */
export interface PostImprovement {
  score: number;
  strengths: string[];
  improvements: string[];
  engagementPrediction: 'low' | 'medium' | 'high';
  reasoning: string;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  topic?: string;
  trendingTopics?: string[];
  userExpertise?: string[];
  userInterests?: string[];
  tone?: ToneType;
  length?: LengthType;
  includeHashtags?: boolean;
  includeEmoji?: boolean;
  avoidTopics?: string[];
  targetAudience?: string;
  variations?: number;
}

/**
 * Post Generator class
 */
export class PostGenerator {
  private claudeClient = getClaudeClient();

  /**
   * Generate a single post
   */
  async generatePost(options: GenerationOptions): Promise<GeneratedPost> {
    // Build context
    const context: PostGenerationContext = {
      topic: options.topic,
      trendingTopics: options.trendingTopics || [],
      userExpertise: options.userExpertise || [],
      userInterests: options.userInterests || [],
      tone: options.tone || 'professional',
      length: options.length || 'medium',
      includeHashtags: options.includeHashtags ?? true,
      includeEmoji: options.includeEmoji ?? false,
      avoidTopics: options.avoidTopics || [],
      targetAudience: options.targetAudience,
    };

    // Build prompts
    const systemPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(context);

    // Call Claude API
    const response = await this.claudeClient.sendMessageJSON<GeneratedPost>(
      systemPrompt,
      userPrompt,
      { temperature: 0.7, maxTokens: 500 }
    );

    // Validate and filter content
    await this.validatePost(response.text);

    return response;
  }

  /**
   * Generate multiple variations of a post
   */
  async generateVariations(
    options: GenerationOptions & { variations?: number }
  ): Promise<PostVariations> {
    const variationCount = options.variations || 3;

    if (variationCount < 1 || variationCount > 5) {
      throw new Error('Variation count must be between 1 and 5');
    }

    // First, generate a base post
    const basePost = await this.generatePost(options);

    if (variationCount === 1) {
      return {
        variations: [basePost],
        basedOnTopic: options.topic,
      };
    }

    // Generate variations of the base post
    const context: PostGenerationContext = {
      topic: options.topic,
      trendingTopics: options.trendingTopics || [],
      userExpertise: options.userExpertise || [],
      userInterests: options.userInterests || [],
      tone: options.tone || 'professional',
      length: options.length || 'medium',
      includeHashtags: options.includeHashtags ?? true,
      includeEmoji: options.includeEmoji ?? false,
      avoidTopics: options.avoidTopics || [],
      targetAudience: options.targetAudience,
    };

    const variationPrompt = buildVariationPrompt(
      basePost.text,
      variationCount - 1,
      context
    );

    const response = await this.claudeClient.sendMessageJSON<{
      variations: GeneratedPost[];
    }>(SYSTEM_PROMPT, variationPrompt, { temperature: 0.8, maxTokens: 1000 });

    // Validate all variations
    const allVariations = [basePost, ...response.variations];
    for (const variation of allVariations) {
      await this.validatePost(variation.text);
    }

    return {
      variations: allVariations,
      basedOnTopic: options.topic,
    };
  }

  /**
   * Regenerate a post with feedback
   */
  async regeneratePost(
    previousPost: string,
    feedback: string,
    context?: Partial<PostGenerationContext>
  ): Promise<GeneratedPost> {
    const fullContext: PostGenerationContext = {
      trendingTopics: context?.trendingTopics || [],
      userExpertise: context?.userExpertise || [],
      userInterests: context?.userInterests || [],
      tone: context?.tone || 'professional',
      length: context?.length || 'medium',
      includeHashtags: context?.includeHashtags ?? true,
      includeEmoji: context?.includeEmoji ?? false,
      avoidTopics: context?.avoidTopics || [],
      targetAudience: context?.targetAudience,
    };

    const regenerationPrompt = buildRegenerationPrompt(
      previousPost,
      feedback,
      fullContext
    );

    const response = await this.claudeClient.sendMessageJSON<GeneratedPost>(
      SYSTEM_PROMPT,
      regenerationPrompt,
      { temperature: 0.7, maxTokens: 500 }
    );

    // Validate and filter content
    await this.validatePost(response.text);

    return response;
  }

  /**
   * Get improvement suggestions for a draft
   */
  async improvePost(draft: string): Promise<PostImprovement> {
    const improvementPrompt = buildImprovementPrompt(draft);

    const response = await this.claudeClient.sendMessageJSON<PostImprovement>(
      SYSTEM_PROMPT,
      improvementPrompt,
      { temperature: 0.5, maxTokens: 500 }
    );

    return response;
  }

  /**
   * Validate post content
   */
  private async validatePost(text: string): Promise<void> {
    const filterResult = await ContentFilter.filterContent(text);

    if (filterResult.recommendation === 'reject') {
      throw new Error(
        `Generated post failed content filter: ${filterResult.issues.join(', ')}`
      );
    }

    if (filterResult.recommendation === 'revise') {
      console.warn('Generated post has issues:', filterResult.issues);
    }
  }

  /**
   * Get content filter result for a post
   */
  async filterPost(text: string): Promise<ContentFilterResult> {
    return ContentFilter.filterContent(text);
  }
}

/**
 * Convenience function: Generate a single post
 */
export async function generatePost(
  options: GenerationOptions
): Promise<GeneratedPost> {
  const generator = new PostGenerator();
  return generator.generatePost(options);
}

/**
 * Convenience function: Generate multiple variations
 */
export async function generatePostVariations(
  options: GenerationOptions & { variations?: number }
): Promise<PostVariations> {
  const generator = new PostGenerator();
  return generator.generateVariations(options);
}

/**
 * Convenience function: Regenerate with feedback
 */
export async function regeneratePost(
  previousPost: string,
  feedback: string,
  context?: Partial<PostGenerationContext>
): Promise<GeneratedPost> {
  const generator = new PostGenerator();
  return generator.regeneratePost(previousPost, feedback, context);
}

/**
 * Convenience function: Get improvement suggestions
 */
export async function improvePost(draft: string): Promise<PostImprovement> {
  const generator = new PostGenerator();
  return generator.improvePost(draft);
}

/**
 * Export types
 */
export type {
  PostGenerationContext,
  ToneType,
  LengthType,
  ContentFilterResult,
};
