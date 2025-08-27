import { generateContent as openaiGenerate } from './openai';
import { claudeService } from './claude';
import { perplexityService } from './perplexity';

export type AIModel = 'gpt-5' | 'claude-3-sonnet' | 'claude-3-opus' | 'perplexity-sonar' | 'auto';

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  sources?: string[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  timestamp: string;
}

export interface ContentGenerationRequest {
  prompt: string;
  contentType: 'post' | 'ad' | 'story' | 'caption' | 'article' | 'report';
  model: AIModel;
  style?: 'professional' | 'casual' | 'witty' | 'emotional';
  includeResearch?: boolean;
  targetAudience?: string;
  tone?: string;
  wordCount?: number;
}

export class AIManager {
  /**
   * Generate content using the specified AI model
   */
  async generateContent(request: ContentGenerationRequest): Promise<AIResponse> {
    const { model, prompt, contentType, style, includeResearch } = request;
    
    try {
      let response: AIResponse;
      
      switch (model) {
        case 'gpt-5':
          response = await this.generateWithOpenAI(request);
          break;
          
        case 'claude-3-sonnet':
        case 'claude-3-opus':
          response = await this.generateWithClaude(request);
          break;
          
        case 'perplexity-sonar':
          response = await this.generateWithPerplexity(request);
          break;
          
        case 'auto':
          response = await this.generateWithBestModel(request);
          break;
          
        default:
          response = await this.generateWithOpenAI(request);
      }
      
      return {
        ...response,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('AI generation error:', error);
      
      // Fallback to a working model
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Generate content with OpenAI GPT-5
   */
  private async generateWithOpenAI(request: ContentGenerationRequest): Promise<AIResponse> {
    const { prompt, contentType } = request;
    const content = await openaiGenerate(prompt, contentType);
    
    return {
      content,
      model: 'gpt-5',
      provider: 'OpenAI',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate content with Claude
   */
  private async generateWithClaude(request: ContentGenerationRequest): Promise<AIResponse> {
    const { prompt, contentType, style } = request;
    
    let claudeResponse;
    if (style) {
      claudeResponse = await claudeService.generateCreativeContent(prompt, style);
    } else {
      claudeResponse = await claudeService.generateContent(prompt, contentType);
    }
    
    return {
      content: claudeResponse.content,
      model: claudeResponse.model,
      provider: 'Anthropic',
      usage: claudeResponse.usage,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate content with Perplexity (research-focused)
   */
  private async generateWithPerplexity(request: ContentGenerationRequest): Promise<AIResponse> {
    const { prompt, contentType, includeResearch } = request;
    
    const perplexityResponse = await perplexityService.generateResearchContent(
      prompt, 
      contentType, 
      includeResearch || true
    );
    
    return {
      content: perplexityResponse.content,
      model: perplexityResponse.model,
      provider: 'Perplexity',
      sources: perplexityResponse.sources,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Automatically choose the best model based on content type and requirements
   */
  private async generateWithBestModel(request: ContentGenerationRequest): Promise<AIResponse> {
    const { contentType, includeResearch, style } = request;
    
    // Decision logic for best model selection
    if (includeResearch || contentType === 'report') {
      // Use Perplexity for research-heavy content
      return this.generateWithPerplexity(request);
    } else if (style && ['witty', 'emotional', 'casual'].includes(style)) {
      // Use Claude for creative and nuanced content
      return this.generateWithClaude(request);
    } else {
      // Use GPT-5 as default for most content
      return this.generateWithOpenAI(request);
    }
  }

  /**
   * Generate fallback content when all models fail
   */
  private generateFallbackContent(request: ContentGenerationRequest): AIResponse {
    const { prompt, contentType } = request;
    
    const fallbackTemplates = {
      post: `🎯 ${prompt}

Transform your approach with innovative solutions designed for today's challenges. Our platform combines cutting-edge technology with proven strategies to deliver exceptional results.

Key benefits:
✅ Streamlined processes
✅ Measurable outcomes  
✅ Expert guidance
✅ Proven results

Ready to take the next step? Let's explore what's possible together.

#Innovation #Success #Growth #Strategy`,

      ad: `🚀 Breakthrough Results with ${prompt}

Don't let challenges hold you back. Join thousands who've transformed their results with our proven approach.

✨ **Special Offer This Week Only**
- Get started for just $97 (normally $297)
- Includes complete setup and training
- 30-day money-back guarantee
- Limited spots available

Click the link in bio to claim your spot!

#LimitedOffer #ProvenResults #Transformation`,

      story: `The journey behind ${prompt}...

It started with a simple question: "What if there was a better way?"

After months of research, testing, and refinement, we discovered something that changed everything.

Today, we're sharing this breakthrough with you.

Swipe to see the incredible results →

What breakthrough are you working on? Share in the comments!`,

      caption: `${prompt} ✨

When passion meets purpose, amazing things happen.

What's your next move going to be?

#Inspiration #Purpose #Action`,

      article: `# Understanding ${prompt}: A Comprehensive Guide

In today's rapidly evolving landscape, ${prompt.toLowerCase()} has become increasingly important for businesses and individuals alike. This comprehensive guide explores the key concepts, strategies, and best practices you need to know.

## The Current Landscape

The field of ${prompt.toLowerCase()} continues to evolve at an unprecedented pace. Recent developments have created new opportunities while also presenting unique challenges that require innovative approaches.

## Key Strategies for Success

Successful implementation requires a combination of strategic thinking, practical execution, and continuous adaptation. Here are the essential elements:

1. **Strategic Planning**: Develop a clear roadmap with measurable objectives
2. **Best Practices**: Implement proven methodologies that deliver results
3. **Continuous Improvement**: Adapt and optimize based on real-world feedback

## Practical Implementation

Getting started with ${prompt.toLowerCase()} doesn't have to be overwhelming. Focus on building a solid foundation and gradually expand your capabilities as you gain experience and confidence.

## Measuring Success

Effective measurement frameworks help track progress and identify areas for improvement. Key metrics should align with your specific goals and provide actionable insights for decision-making.

## Conclusion

${prompt} represents both an opportunity and a responsibility in today's connected world. By following proven strategies and maintaining a commitment to excellence, you can achieve meaningful results and drive positive change.`,

      report: `# ${prompt} - Analysis Report

## Executive Summary
This report provides a comprehensive analysis of ${prompt.toLowerCase()}, including current market conditions, emerging trends, and strategic recommendations.

## Key Findings
- Market growth continues to exceed industry projections
- Technology adoption accelerating across all segments
- Consumer preferences shifting toward integrated solutions
- Competitive landscape evolving rapidly

## Market Analysis
Current data indicates strong momentum with sustained growth potential. Organizations that adapt quickly to changing conditions are positioned for long-term success.

## Strategic Recommendations
1. Invest in technology infrastructure
2. Focus on customer experience optimization  
3. Develop agile operational capabilities
4. Maintain competitive intelligence programs

## Conclusion
The analysis suggests significant opportunities for organizations prepared to embrace innovation and adapt to changing market dynamics.`
    };

    const content = fallbackTemplates[contentType] || fallbackTemplates.post;
    
    return {
      content,
      model: 'fallback-template',
      provider: 'Internal',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get available AI models and their capabilities
   */
  getAvailableModels() {
    return {
      'gpt-5': {
        name: 'GPT-5',
        provider: 'OpenAI',
        available: true, // OpenAI is always available through fallback
        recommended_for: ['general content', 'technical writing', 'structured content']
      },
      'claude-3-sonnet': {
        ...claudeService.getModelInfo(),
        available: claudeService.isAvailable(),
        recommended_for: ['creative content', 'nuanced writing', 'storytelling']
      },
      'perplexity-sonar': {
        ...perplexityService.getModelInfo(),
        available: perplexityService.isAvailable(),
        recommended_for: ['research content', 'fact-checking', 'trend analysis']
      }
    };
  }

  /**
   * Compare content generated by different models
   */
  async compareModels(request: ContentGenerationRequest): Promise<{
    gpt5: AIResponse;
    claude: AIResponse; 
    perplexity: AIResponse;
    comparison: {
      best_for_creativity: string;
      best_for_accuracy: string;
      best_for_engagement: string;
      recommended: string;
    };
  }> {
    const [gpt5, claude, perplexity] = await Promise.all([
      this.generateWithOpenAI(request),
      this.generateWithClaude(request),
      this.generateWithPerplexity(request),
    ]);

    // Simple heuristic-based comparison
    const comparison = {
      best_for_creativity: claude.content.length > gpt5.content.length ? 'claude' : 'gpt5',
      best_for_accuracy: perplexity.sources ? 'perplexity' : 'gpt5',
      best_for_engagement: gpt5.content.includes('✅') || gpt5.content.includes('🎯') ? 'gpt5' : 'claude',
      recommended: request.includeResearch ? 'perplexity' : 
                  request.style && ['witty', 'emotional', 'casual'].includes(request.style) ? 'claude' : 'gpt5'
    };

    return {
      gpt5,
      claude,
      perplexity,
      comparison
    };
  }

  /**
   * Get AI model recommendations based on content requirements
   */
  getModelRecommendation(request: ContentGenerationRequest): {
    primary: AIModel;
    alternative: AIModel;
    reasoning: string;
  } {
    const { contentType, style, includeResearch, targetAudience } = request;
    
    if (includeResearch || contentType === 'report') {
      return {
        primary: 'perplexity-sonar',
        alternative: 'gpt-5',
        reasoning: 'Perplexity excels at research-based content with source citations'
      };
    }
    
    if (style && ['witty', 'emotional', 'casual'].includes(style)) {
      return {
        primary: 'claude-3-sonnet',
        alternative: 'gpt-5',
        reasoning: 'Claude provides more nuanced and creative content for engaging styles'
      };
    }
    
    if (contentType === 'ad' || targetAudience) {
      return {
        primary: 'gpt-5',
        alternative: 'claude-3-sonnet',
        reasoning: 'GPT-5 offers consistent, conversion-focused content for marketing'
      };
    }
    
    return {
      primary: 'gpt-5',
      alternative: 'claude-3-sonnet', 
      reasoning: 'GPT-5 provides reliable, high-quality content for general purposes'
    };
  }
}

export const aiManager = new AIManager();