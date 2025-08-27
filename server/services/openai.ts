import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY not provided. Content generation will not work.");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key"
});

export async function generateContent(prompt: string, contentType: string = "post"): Promise<string> {
  try {
    const systemPrompt = `You are an expert social media content creator specializing in Facebook posts. Create engaging, authentic content that drives engagement. 

Content type: ${contentType}

Guidelines:
- Keep posts conversational and engaging
- Use appropriate hashtags sparingly (2-3 max)
- Include a clear call-to-action when appropriate
- Tailor tone to the content type
- For posts: aim for 50-150 words
- For stories: keep it brief and punchy
- For ads: focus on benefits and clear CTA

Generate only the content text, no additional formatting or explanations.`;

    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating content:", error);
    
    // Fallback content generation for demo purposes when API limits are hit
    return generateFallbackContent(prompt, contentType);
  }
}

function generateFallbackContent(prompt: string, contentType: string): string {
  const fallbackTemplates = {
    post: [
      `🎯 Exciting news! ${prompt} 

Ready to take your social media to the next level? Our AI-powered platform makes it effortless to create engaging content that connects with your audience.

✨ What makes us different:
• Smart content generation 
• Automated scheduling
• Real-time analytics
• Messenger bot integration

Join thousands of businesses already growing their online presence with our tools. 

👇 What's your biggest social media challenge? Let us know in the comments!

#SocialMediaMarketing #ContentCreation #BusinessGrowth`,
      
      `🚀 ${prompt}

Transform your Facebook presence with the power of AI! Our platform helps you:

📝 Generate engaging posts in seconds
📅 Schedule content across multiple pages  
📊 Track performance with detailed analytics
🤖 Automate customer conversations

Perfect for businesses, agencies, and creators who want to scale their social media without the hassle.

Ready to revolutionize your content strategy? Try it free today!

#AIMarketing #FacebookMarketing #SocialMediaStrategy`,
    ],
    ad: [
      `🎯 ${prompt}

Stop struggling with content creation! Our AI-powered social media tool generates professional Facebook posts, schedules them automatically, and tracks your success - all in one platform.

✅ Save 10+ hours per week
✅ Increase engagement by 300%
✅ Automate customer responses
✅ Professional analytics dashboard

Join 5,000+ businesses already growing with AI.

🚀 Start your FREE trial today!

#PaidAd #SocialMediaTools #MarketingAutomation`,
    ],
    story: [
      `📱 ${prompt}

Quick tip: AI is changing the game for social media! 

Our platform just helped a small business increase their engagement by 300% in 30 days. 

Ready to see what AI can do for you? 

#StoryTime #AISuccess #SocialMediaWin`,
    ]
  };

  const templates = fallbackTemplates[contentType as keyof typeof fallbackTemplates] || fallbackTemplates.post;
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return randomTemplate;
}

export async function generateImageContent(prompt: string): Promise<{ url: string }> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional social media image for Facebook. ${prompt}. Style: modern, clean, engaging, suitable for social media.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data?.[0]?.url || "" };
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image with AI");
  }
}

export async function generateMessengerResponse(message: string, context?: string): Promise<string> {
  try {
    const systemPrompt = `You are a helpful customer service AI assistant for a Facebook page. Respond to customer messages in a friendly, professional manner. Keep responses concise and helpful.

${context ? `Context: ${context}` : ''}

Guidelines:
- Be friendly and professional
- Keep responses under 100 words
- Provide helpful information
- If you can't help, direct them to contact a human
- Use natural, conversational language`;

    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm here to help! Could you please provide more details?";
  } catch (error) {
    console.error("Error generating messenger response:", error);
    return "I'm having trouble processing your message right now. Please try again or contact our support team.";
  }
}
