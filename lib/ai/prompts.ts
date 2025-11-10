/**
 * Claude AI Prompt Templates
 * System and user prompts for X post generation
 */

/**
 * Tone types for post generation
 */
export type ToneType = 'professional' | 'casual' | 'humorous';

/**
 * Length types for post generation
 */
export type LengthType = 'short' | 'medium' | 'long';

/**
 * Context for post generation
 */
export interface PostGenerationContext {
  trendingTopics?: string[];
  userExpertise?: string[];
  userInterests?: string[];
  tone: ToneType;
  length: LengthType;
  topic?: string;
  includeHashtags?: boolean;
  includeEmoji?: boolean;
  avoidTopics?: string[];
  targetAudience?: string;
}

/**
 * System prompt for X post generation
 */
export const SYSTEM_PROMPT = `You are an expert X (formerly Twitter) post writer and social media strategist. Your goal is to create engaging, high-quality posts that resonate with the target audience and drive meaningful engagement.

## Your Responsibilities:
1. Create compelling posts that combine trending topics with the user's expertise
2. Match the specified tone and style perfectly
3. Optimize for engagement (likes, retweets, replies)
4. Follow X best practices and content policies
5. Return structured JSON responses

## X Post Best Practices:
- Keep posts concise and impactful (280 characters max)
- Use clear, direct language
- Include a call-to-action when appropriate
- Use 2-3 relevant hashtags (if requested)
- Use emojis sparingly and purposefully (if requested)
- Start with a hook to grab attention
- End with engagement prompts when suitable
- Avoid clickbait and misleading content
- Ensure posts are authentic and provide value

## Content Quality Standards:
- Original insights, not generic statements
- Specific, not vague
- Actionable, not just informational
- Timely and relevant to current trends
- Appropriate for professional networks
- Free from offensive, harmful, or misleading content

## Output Format:
Always return a valid JSON object with the following structure:
{
  "text": "The complete post text (max 280 characters)",
  "hashtags": ["hashtag1", "hashtag2"],
  "reasoning": "Brief explanation of why this post will perform well"
}

Remember: Quality over quantity. Each post should add value to the reader's timeline.`;

/**
 * Generate user prompt based on context
 */
export function buildUserPrompt(context: PostGenerationContext): string {
  const {
    topic,
    trendingTopics = [],
    userExpertise = [],
    userInterests = [],
    tone,
    length,
    includeHashtags = true,
    includeEmoji = false,
    avoidTopics = [],
    targetAudience,
  } = context;

  // Character count targets
  const lengthTargets = {
    short: '~100-150 characters',
    medium: '~150-220 characters',
    long: '~220-280 characters',
  };

  // Tone descriptions
  const toneDescriptions = {
    professional: 'Professional, authoritative, and trustworthy. Use industry terminology appropriately.',
    casual: 'Conversational, friendly, and approachable. Like talking to a colleague over coffee.',
    humorous: 'Light-hearted, witty, and entertaining. Use humor to make points memorable.',
  };

  let prompt = `Create an engaging X post with the following requirements:\n\n`;

  // Topic
  if (topic) {
    prompt += `**Main Topic:** ${topic}\n\n`;
  }

  // Trending topics
  if (trendingTopics.length > 0) {
    prompt += `**Trending Topics to Consider:** ${trendingTopics.join(', ')}\n`;
    prompt += `Try to naturally incorporate these trends if relevant.\n\n`;
  }

  // User expertise
  if (userExpertise.length > 0) {
    prompt += `**User's Expertise:** ${userExpertise.join(', ')}\n`;
    prompt += `Leverage this expertise to provide unique insights.\n\n`;
  }

  // User interests
  if (userInterests.length > 0) {
    prompt += `**User's Interests:** ${userInterests.join(', ')}\n`;
    prompt += `Connect the topic to these interests when possible.\n\n`;
  }

  // Tone
  prompt += `**Tone:** ${tone.charAt(0).toUpperCase() + tone.slice(1)}\n`;
  prompt += `${toneDescriptions[tone]}\n\n`;

  // Length
  prompt += `**Target Length:** ${lengthTargets[length]}\n\n`;

  // Hashtags
  if (includeHashtags) {
    prompt += `**Hashtags:** Include 2-3 relevant, trending hashtags.\n`;
  } else {
    prompt += `**Hashtags:** Do not include hashtags in the post text. Return empty array.\n`;
  }

  // Emoji
  if (includeEmoji) {
    prompt += `**Emojis:** Use 1-2 relevant emojis to enhance engagement.\n`;
  } else {
    prompt += `**Emojis:** Do not use emojis.\n`;
  }
  prompt += '\n';

  // Target audience
  if (targetAudience) {
    prompt += `**Target Audience:** ${targetAudience}\n`;
    prompt += `Tailor the message for this specific audience.\n\n`;
  }

  // Avoid topics
  if (avoidTopics.length > 0) {
    prompt += `**Topics to Avoid:** ${avoidTopics.join(', ')}\n`;
    prompt += `Do not mention or reference these topics.\n\n`;
  }

  // Final instructions
  prompt += `**Instructions:**
1. Create ONE high-quality post that meets all requirements
2. Ensure the post is within the character limit
3. Make it engaging and valuable to the reader
4. Include a clear hook or insight
5. Return ONLY the JSON object, no additional text

Remember: The post should sound natural and authentic, not like it was written by AI.`;

  return prompt;
}

/**
 * Regeneration prompt
 */
export function buildRegenerationPrompt(
  originalPost: string,
  feedback: string,
  context: PostGenerationContext
): string {
  let prompt = `I need you to improve this X post based on feedback.\n\n`;

  prompt += `**Original Post:**\n"${originalPost}"\n\n`;

  prompt += `**Feedback:**\n${feedback}\n\n`;

  prompt += `**Requirements:**\n`;
  prompt += `- Tone: ${context.tone}\n`;
  prompt += `- Length: ${context.length}\n`;
  prompt += `- Hashtags: ${context.includeHashtags ? 'Include 2-3' : 'None'}\n`;
  prompt += `- Emojis: ${context.includeEmoji ? 'Use 1-2' : 'None'}\n\n`;

  if (context.avoidTopics && context.avoidTopics.length > 0) {
    prompt += `**Topics to Avoid:** ${context.avoidTopics.join(', ')}\n\n`;
  }

  prompt += `Create an improved version that addresses the feedback while maintaining the core message. Return ONLY the JSON object.`;

  return prompt;
}

/**
 * Improvement suggestions prompt
 */
export function buildImprovementPrompt(draft: string): string {
  return `Analyze this X post draft and provide specific improvement suggestions:\n\n"${draft}"\n\nReturn a JSON object with:
{
  "score": 1-10 (overall quality score),
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "engagement_prediction": "low" | "medium" | "high",
  "reasoning": "Brief explanation"
}`;
}

/**
 * Variation generation prompt
 */
export function buildVariationPrompt(
  basePost: string,
  variationCount: number,
  context: PostGenerationContext
): string {
  let prompt = `Create ${variationCount} variations of this X post:\n\n`;
  prompt += `**Base Post:**\n"${basePost}"\n\n`;

  prompt += `**Requirements for Each Variation:**\n`;
  prompt += `- Same core message and topic\n`;
  prompt += `- Different wording and structure\n`;
  prompt += `- Maintain ${context.tone} tone\n`;
  prompt += `- Target length: ${context.length}\n`;
  prompt += `- ${context.includeHashtags ? 'Include 2-3 hashtags' : 'No hashtags'}\n`;
  prompt += `- ${context.includeEmoji ? 'Use 1-2 emojis' : 'No emojis'}\n\n`;

  prompt += `Return a JSON object with:\n`;
  prompt += `{
  "variations": [
    {
      "text": "variation 1 text",
      "hashtags": ["tag1", "tag2"],
      "reasoning": "why this variation works"
    },
    // ... more variations
  ]
}`;

  return prompt;
}

/**
 * Topic extraction prompt (for analyzing collected posts)
 */
export function buildTopicExtractionPrompt(posts: string[]): string {
  let prompt = `Analyze these X posts and extract the main topics and themes:\n\n`;

  posts.forEach((post, index) => {
    prompt += `${index + 1}. "${post}"\n`;
  });

  prompt += `\nReturn a JSON object with:\n`;
  prompt += `{
  "topics": ["topic1", "topic2", ...],
  "trending_keywords": ["keyword1", "keyword2", ...],
  "themes": [
    {
      "theme": "theme name",
      "description": "brief description",
      "post_count": number
    }
  ]
}`;

  return prompt;
}

/**
 * Hashtag suggestions prompt
 */
export function buildHashtagPrompt(postText: string, count: number = 3): string {
  return `Suggest ${count} highly relevant and trending hashtags for this X post:\n\n"${postText}"\n\nReturn a JSON array of hashtags (without # symbol):\n["hashtag1", "hashtag2", "hashtag3"]`;
}

/**
 * Content policy check prompt
 */
export function buildContentPolicyPrompt(postText: string): string {
  return `Analyze this X post for potential policy violations or sensitive content:\n\n"${postText}"\n\nReturn a JSON object:
{
  "safe": true/false,
  "issues": ["issue1", "issue2"] or [],
  "severity": "none" | "low" | "medium" | "high",
  "recommendation": "approve" | "revise" | "reject",
  "explanation": "brief explanation"
}`;
}

/**
 * Export all prompt builders
 */
export const promptBuilders = {
  buildUserPrompt,
  buildRegenerationPrompt,
  buildImprovementPrompt,
  buildVariationPrompt,
  buildTopicExtractionPrompt,
  buildHashtagPrompt,
  buildContentPolicyPrompt,
};
