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
    throw new Error("Failed to generate content with AI");
  }
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
