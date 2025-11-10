/**
 * Usage Examples for AI Post Generation
 * Examples demonstrating how to use the AI generation system
 */

import { PrismaClient } from '@prisma/client';
import { generatePost, generatePostVariations, regeneratePost, improvePost } from './post-generator';
import { createGenerationService } from './generation-service';
import { ContentFilter } from './content-filter';

/**
 * Example 1: Simple post generation
 */
export async function example1_SimpleGeneration() {
  console.log('=== Example 1: Simple Post Generation ===\n');

  try {
    const post = await generatePost({
      topic: 'The future of AI in software development',
      tone: 'professional',
      length: 'medium',
      includeHashtags: true,
      includeEmoji: false,
    });

    console.log('Generated Post:');
    console.log(post.text);
    console.log('\nHashtags:', post.hashtags.join(', '));
    console.log('\nReasoning:', post.reasoning);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Generate with user expertise and interests
 */
export async function example2_PersonalizedGeneration() {
  console.log('\n=== Example 2: Personalized Generation ===\n');

  try {
    const post = await generatePost({
      topic: 'New web development trends',
      userExpertise: ['React', 'TypeScript', 'Next.js'],
      userInterests: ['Web Performance', 'Developer Experience', 'Open Source'],
      tone: 'casual',
      length: 'medium',
      includeHashtags: true,
      includeEmoji: true,
      targetAudience: 'Frontend developers and tech enthusiasts',
    });

    console.log('Generated Post:');
    console.log(post.text);
    console.log('\nHashtags:', post.hashtags.join(', '));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Generate multiple variations
 */
export async function example3_GenerateVariations() {
  console.log('\n=== Example 3: Generate Variations ===\n');

  try {
    const result = await generatePostVariations({
      topic: 'Tips for remote work productivity',
      tone: 'professional',
      length: 'short',
      variations: 3,
      includeHashtags: true,
    });

    console.log(`Generated ${result.variations.length} variations:\n`);

    result.variations.forEach((variation, index) => {
      console.log(`Variation ${index + 1}:`);
      console.log(variation.text);
      console.log('Hashtags:', variation.hashtags.join(', '));
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Regenerate with feedback
 */
export async function example4_RegenerateWithFeedback() {
  console.log('\n=== Example 4: Regenerate with Feedback ===\n');

  const originalPost =
    'AI is changing software development. New tools are emerging every day. #AI #SoftwareDevelopment';

  try {
    const improved = await regeneratePost(
      originalPost,
      'Make it more specific and add a call-to-action. Focus on practical benefits.',
      {
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      }
    );

    console.log('Original Post:');
    console.log(originalPost);
    console.log('\nImproved Post:');
    console.log(improved.text);
    console.log('\nHashtags:', improved.hashtags.join(', '));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 5: Get improvement suggestions
 */
export async function example5_GetImprovements() {
  console.log('\n=== Example 5: Get Improvement Suggestions ===\n');

  const draft = 'Just finished a project. It was hard work. #coding';

  try {
    const analysis = await improvePost(draft);

    console.log('Draft:', draft);
    console.log('\nAnalysis:');
    console.log('Score:', analysis.score, '/ 10');
    console.log('Engagement Prediction:', analysis.engagementPrediction);
    console.log('\nStrengths:');
    analysis.strengths.forEach(s => console.log(`  - ${s}`));
    console.log('\nSuggested Improvements:');
    analysis.improvements.forEach(i => console.log(`  - ${i}`));
    console.log('\nReasoning:', analysis.reasoning);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 6: Content filtering
 */
export async function example6_ContentFiltering() {
  console.log('\n=== Example 6: Content Filtering ===\n');

  const posts = [
    'Check out this amazing new tool! #WebDev #React',
    'CLICK HERE NOW!!! BUY THIS AMAZING PRODUCT!!!',
    'This is a test post that is way too long and exceeds the 280 character limit for X posts. It just keeps going and going and going and it will never end because I want to demonstrate what happens when a post is too long for the platform requirements.',
  ];

  for (const post of posts) {
    console.log('Post:', post.substring(0, 50) + '...');

    const result = await ContentFilter.filterContent(post);

    console.log('Passed:', result.passed);
    console.log('Severity:', result.severity);
    console.log('Recommendation:', result.recommendation);
    if (result.issues.length > 0) {
      console.log('Issues:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log('---\n');
  }
}

/**
 * Example 7: Using GenerationService with Prisma
 */
export async function example7_GenerationService() {
  console.log('\n=== Example 7: Generation Service with Database ===\n');

  // Initialize Prisma client
  const prisma = new PrismaClient();

  try {
    // Note: Replace 'user-id-here' with actual user ID
    const userId = 'user-id-here';

    // Create service instance
    const service = createGenerationService(userId, prisma);

    // Generate and save post
    const result = await service.generateAndSave({
      topic: 'The importance of code reviews',
      tone: 'professional',
      length: 'medium',
      includeHashtags: true,
    });

    console.log('Generated and saved post:');
    console.log('ID:', result.saved.id);
    console.log('Text:', result.saved.text);
    console.log('Status:', result.saved.status);
    console.log('Created:', result.saved.createdAt);

    // Get generation history
    const history = await service.getHistory(5);
    console.log('\nRecent generation history:');
    history.forEach((post, index) => {
      console.log(`${index + 1}. ${post.text.substring(0, 50)}...`);
      console.log(`   Status: ${post.status}, Created: ${post.createdAt}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Example 8: Complete workflow
 */
export async function example8_CompleteWorkflow() {
  console.log('\n=== Example 8: Complete Workflow ===\n');

  const prisma = new PrismaClient();

  try {
    const userId = 'user-id-here';
    const service = createGenerationService(userId, prisma);

    // Step 1: Generate variations
    console.log('Step 1: Generating variations...');
    const { saved: drafts } = await service.generateVariationsAndSave({
      topic: 'Best practices for TypeScript',
      userExpertise: ['TypeScript', 'JavaScript', 'Node.js'],
      tone: 'professional',
      length: 'medium',
      variations: 3,
      includeHashtags: true,
    });

    console.log(`Generated ${drafts.length} variations\n`);

    // Step 2: Analyze first draft
    console.log('Step 2: Analyzing first draft...');
    const analysis = await service.analyzeDraft(drafts[0].id);
    console.log('Score:', analysis.score);
    console.log('Engagement:', analysis.engagementPrediction);
    console.log('Improvements:', analysis.improvements.join(', '));
    console.log();

    // Step 3: If score is low, regenerate with feedback
    if (analysis.score < 7) {
      console.log('Step 3: Score is low, regenerating...');
      const { generated: improved } = await service.regenerateAndSave(
        drafts[0].id,
        analysis.improvements.join('. ')
      );
      console.log('Improved post:', improved.text);
    } else {
      console.log('Step 3: Score is good, approving draft...');
      await service.approveDraft(drafts[0].id);
      console.log('Draft approved for scheduling!');
    }

    // Step 4: View history
    console.log('\nStep 4: View generation history:');
    const history = await service.getHistory(10);
    console.log(`Total posts generated: ${history.length}`);
    history.forEach((post, index) => {
      console.log(
        `${index + 1}. [${post.status}] ${post.text.substring(0, 40)}...`
      );
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('========================================');
  console.log('AgentX AI Post Generation Examples');
  console.log('========================================\n');

  // Examples 1-6 don't require database
  await example1_SimpleGeneration();
  await example2_PersonalizedGeneration();
  await example3_GenerateVariations();
  await example4_RegenerateWithFeedback();
  await example5_GetImprovements();
  await example6_ContentFiltering();

  // Examples 7-8 require database setup
  // Uncomment when you have a valid user ID and database connection
  // await example7_GenerationService();
  // await example8_CompleteWorkflow();

  console.log('\n========================================');
  console.log('All examples completed!');
  console.log('========================================');
}

/**
 * Quick test function
 */
export async function quickTest() {
  console.log('Quick Test: Generating a simple post...\n');

  try {
    const post = await generatePost({
      topic: 'Why TypeScript is great',
      tone: 'casual',
      length: 'short',
      includeHashtags: true,
    });

    console.log('Success!');
    console.log('Post:', post.text);
    console.log('Hashtags:', post.hashtags.join(', '));
  } catch (error) {
    console.error('Failed:', error);
  }
}

// If running this file directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
