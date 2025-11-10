/**
 * AI Generation Service
 * Service layer for AI post generation with Prisma integration
 */

import { PrismaClient, ToneType, PostStatus } from '@prisma/client';
import {
  PostGenerator,
  type GeneratedPost,
  type GenerationOptions,
  type PostVariations,
  type PostImprovement,
} from './post-generator';
import { ContentFilter } from './content-filter';

/**
 * Generation service configuration
 */
interface GenerationServiceConfig {
  userId: string;
  prisma: PrismaClient;
}

/**
 * Generation history entry
 */
interface GenerationHistory {
  id: string;
  text: string;
  tone: ToneType;
  status: PostStatus;
  createdAt: Date;
}

/**
 * AI Generation Service
 * Handles post generation with database persistence and history tracking
 */
export class GenerationService {
  private prisma: PrismaClient;
  private userId: string;
  private generator: PostGenerator;

  constructor(config: GenerationServiceConfig) {
    this.prisma = config.prisma;
    this.userId = config.userId;
    this.generator = new PostGenerator();
  }

  /**
   * Generate and save a post
   */
  async generateAndSave(
    options: GenerationOptions & { basedOnPostId?: string }
  ): Promise<{
    generated: GeneratedPost;
    saved: GenerationHistory;
  }> {
    try {
      // Get user profile for default settings
      const userProfile = await this.getUserProfile();

      // Merge options with user profile defaults
      const userTone = this.unmapTone(userProfile.tone);
      const finalOptions: GenerationOptions = {
        tone: options.tone || userTone,
        length: options.length || 'medium',
        includeHashtags: options.includeHashtags ?? true,
        includeEmoji: options.includeEmoji ?? false,
        userExpertise: options.userExpertise || userProfile.expertise,
        userInterests: options.userInterests || userProfile.interests,
        avoidTopics: options.avoidTopics || userProfile.avoidTopics,
        targetAudience: options.targetAudience || userProfile.targetAudience || undefined,
        topic: options.topic,
        trendingTopics: options.trendingTopics,
      };

      // Generate post
      const generated = await this.generator.generatePost(finalOptions);

      // Save to database
      const saved = await this.saveGeneratedPost({
        text: generated.text,
        basedOnTopic: options.topic,
        tone: this.mapTone(finalOptions.tone || 'professional'),
        hashtags: generated.hashtags,
        reasoning: generated.reasoning,
        basedOnPostId: options.basedOnPostId,
      });

      return { generated, saved };
    } catch (error) {
      // Log error
      await this.logError('generateAndSave', error);
      throw error;
    }
  }

  /**
   * Generate multiple variations and save all
   */
  async generateVariationsAndSave(
    options: GenerationOptions & { variations?: number; basedOnPostId?: string }
  ): Promise<{
    variations: PostVariations;
    saved: GenerationHistory[];
  }> {
    try {
      // Get user profile for default settings
      const userProfile = await this.getUserProfile();

      // Merge options with user profile defaults
      const userTone = this.unmapTone(userProfile.tone);
      const finalOptions = {
        ...options,
        tone: options.tone || userTone,
        userExpertise: options.userExpertise || userProfile.expertise,
        userInterests: options.userInterests || userProfile.interests,
        avoidTopics: options.avoidTopics || userProfile.avoidTopics,
        targetAudience: options.targetAudience || userProfile.targetAudience || undefined,
      };

      // Generate variations
      const variations = await this.generator.generateVariations(finalOptions);

      // Save all variations
      const saved: GenerationHistory[] = [];
      const variationsArray = Array.from(variations.variations.entries());
      for (const [index, variation] of variationsArray) {
        const savedPost = await this.saveGeneratedPost({
          text: variation.text,
          basedOnTopic: options.topic,
          tone: this.mapTone(finalOptions.tone || 'professional'),
          hashtags: variation.hashtags,
          reasoning: variation.reasoning,
          version: index + 1,
          basedOnPostId: options.basedOnPostId,
        });
        saved.push(savedPost);
      }

      return { variations, saved };
    } catch (error) {
      await this.logError('generateVariationsAndSave', error);
      throw error;
    }
  }

  /**
   * Regenerate post with feedback
   */
  async regenerateAndSave(
    postId: string,
    feedback: string
  ): Promise<{
    generated: GeneratedPost;
    saved: GenerationHistory;
  }> {
    try {
      // Get original post
      const originalPost = await this.prisma.generatedPost.findUnique({
        where: { id: postId, userId: this.userId },
      });

      if (!originalPost) {
        throw new Error('Original post not found');
      }

      // Get user profile
      const userProfile = await this.getUserProfile();

      // Regenerate with feedback
      const context = {
        tone: this.unmapTone(originalPost.tone),
        userExpertise: userProfile.expertise,
        userInterests: userProfile.interests,
        avoidTopics: userProfile.avoidTopics,
        targetAudience: userProfile.targetAudience || undefined,
      };

      const generated = await this.generator.regeneratePost(
        originalPost.text,
        feedback,
        context
      );

      // Save new version
      const saved = await this.saveGeneratedPost({
        text: generated.text,
        basedOnTopic: originalPost.basedOnTopic || undefined,
        tone: originalPost.tone,
        hashtags: generated.hashtags,
        reasoning: generated.reasoning,
        version: originalPost.version + 1,
      });

      return { generated, saved };
    } catch (error) {
      await this.logError('regenerateAndSave', error);
      throw error;
    }
  }

  /**
   * Get improvement suggestions for a draft
   */
  async analyzeDraft(postId: string): Promise<PostImprovement> {
    try {
      const post = await this.prisma.generatedPost.findUnique({
        where: { id: postId, userId: this.userId },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      return await this.generator.improvePost(post.text);
    } catch (error) {
      await this.logError('analyzeDraft', error);
      throw error;
    }
  }

  /**
   * Get generation history
   */
  async getHistory(limit: number = 10): Promise<GenerationHistory[]> {
    const posts = await this.prisma.generatedPost.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        text: true,
        tone: true,
        status: true,
        createdAt: true,
      },
    });

    return posts;
  }

  /**
   * Delete a generated post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.prisma.generatedPost.delete({
        where: { id: postId, userId: this.userId },
      });
    } catch (error) {
      await this.logError('deletePost', error);
      throw error;
    }
  }

  /**
   * Approve a draft for scheduling
   */
  async approveDraft(postId: string): Promise<GenerationHistory> {
    try {
      // Validate post exists and belongs to user
      const post = await this.prisma.generatedPost.findUnique({
        where: { id: postId, userId: this.userId },
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Validate content one more time
      const filterResult = await ContentFilter.filterContent(post.text);
      if (filterResult.recommendation === 'reject') {
        throw new Error(
          `Post cannot be approved: ${filterResult.issues.join(', ')}`
        );
      }

      // Update status to APPROVED
      const updated = await this.prisma.generatedPost.update({
        where: { id: postId },
        data: { status: PostStatus.APPROVED },
        select: {
          id: true,
          text: true,
          tone: true,
          status: true,
          createdAt: true,
        },
      });

      return updated;
    } catch (error) {
      await this.logError('approveDraft', error);
      throw error;
    }
  }

  /**
   * Get user profile with fallback defaults
   */
  private async getUserProfile() {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: this.userId },
    });

    return (
      profile || {
        expertise: [],
        interests: [],
        tone: ToneType.PROFESSIONAL,
        avoidTopics: [],
        targetAudience: null,
      }
    );
  }

  /**
   * Save generated post to database
   */
  private async saveGeneratedPost(data: {
    text: string;
    basedOnTopic?: string;
    tone: ToneType;
    hashtags: string[];
    reasoning?: string;
    version?: number;
    basedOnPostId?: string;
  }): Promise<GenerationHistory> {
    const post = await this.prisma.generatedPost.create({
      data: {
        userId: this.userId,
        text: data.text,
        basedOnTopic: data.basedOnTopic,
        tone: data.tone,
        version: data.version || 1,
        status: PostStatus.DRAFT,
        model: 'claude-3-5-sonnet-20241022',
        prompt: data.reasoning
          ? JSON.stringify({
              hashtags: data.hashtags,
              reasoning: data.reasoning,
            })
          : null,
      },
      select: {
        id: true,
        text: true,
        tone: true,
        status: true,
        createdAt: true,
      },
    });

    return post;
  }

  /**
   * Map tone string to ToneType enum
   */
  private mapTone(tone: string): ToneType {
    const toneMap: Record<string, ToneType> = {
      professional: ToneType.PROFESSIONAL,
      casual: ToneType.CASUAL,
      humorous: ToneType.HUMOROUS,
    };
    return toneMap[tone.toLowerCase()] || ToneType.PROFESSIONAL;
  }

  /**
   * Map ToneType enum to tone string
   */
  private unmapTone(tone: ToneType): import('./prompts').ToneType {
    switch (tone) {
      case ToneType.PROFESSIONAL:
        return 'professional';
      case ToneType.CASUAL:
        return 'casual';
      case ToneType.HUMOROUS:
        return 'humorous';
      default:
        return 'professional';
    }
  }

  /**
   * Log error to database (optional)
   */
  private async logError(operation: string, error: any): Promise<void> {
    try {
      await this.prisma.systemLog.create({
        data: {
          userId: this.userId,
          level: 'ERROR',
          message: `AI Generation Error in ${operation}`,
          metadata: {
            operation,
            error: error.message || String(error),
          },
          errorStack: error.stack || null,
        },
      });
    } catch (logError) {
      // If logging fails, just console.error
      console.error('Failed to log error:', logError);
    }
  }
}

/**
 * Factory function to create GenerationService instance
 */
export function createGenerationService(
  userId: string,
  prisma: PrismaClient
): GenerationService {
  return new GenerationService({ userId, prisma });
}

/**
 * Export types
 */
export type { GenerationServiceConfig, GenerationHistory };
