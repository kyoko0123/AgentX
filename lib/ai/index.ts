/**
 * AgentX AI Module
 * Main export file for AI post generation functionality
 */

// Claude Client
export { getClaudeClient, ClaudeClient, MODEL, MAX_TOKENS, DEFAULT_TEMPERATURE } from './claude-client';

// Post Generator
export {
  PostGenerator,
  generatePost,
  generatePostVariations,
  regeneratePost,
  improvePost,
  type GeneratedPost,
  type PostVariations,
  type PostImprovement,
  type GenerationOptions,
  type PostGenerationContext,
  type ToneType,
  type LengthType,
  type ContentFilterResult,
} from './post-generator';

// Generation Service
export {
  GenerationService,
  createGenerationService,
  type GenerationServiceConfig,
  type GenerationHistory,
} from './generation-service';

// Content Filter
export {
  ContentFilter,
  quickFilter,
  MAX_TWEET_LENGTH,
  PROHIBITED_WORDS,
  SENSITIVE_TOPICS,
} from './content-filter';

// Prompts
export {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildRegenerationPrompt,
  buildImprovementPrompt,
  buildVariationPrompt,
  buildTopicExtractionPrompt,
  buildHashtagPrompt,
  buildContentPolicyPrompt,
  promptBuilders,
} from './prompts';
