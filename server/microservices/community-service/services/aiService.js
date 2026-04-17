import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { Blob } from "node:buffer";
import Post from "../models/Post.js";
import Interaction from "../models/Interaction.js";
import { config } from "../config/config.js";

// Initialize the model once (Singleton) for better performance
let chatModel = null;
const getChatModel = () => {
  if (!chatModel) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is not defined.");
    }
    chatModel = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-flash-latest",//"gemini-1.5-flash",
      temperature: 0.7,
    });
  }
  return chatModel;
};

/**
 * AI Service for community agent
 */
export const communityAIQuery = async (userQuery, userId) => {
  try {
    // 1. Fetch only community discussions (Optimized query)
    const posts = await Post.find({ category: 'discussion' }).sort({ createdAt: -1 }).limit(50);

    // 2. Prepare content for TextLoader
    const content = posts.map(post =>
      `ID: ${post._id} | Title: ${post.title} | Content: ${post.content}`
    ).join("\n---\n");

    const loader = new TextLoader(new Blob([content], { type: "text/plain" }));
    const docs = await loader.load();
    const knowledgeBase = docs[0].pageContent;

    // 3. Fetch past interactions (Minimal context)
    const pastInteractions = await Interaction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(2);

    const contextHistory = pastInteractions.map(i =>
      `User: ${i.userInput}\nAI: ${i.aiResponse}`
    ).join("\n");

    // 4. Build Optimized Prompt
    const prompt = `
      You are a helpful Community Engagement Assistant.
      
      Knowledge Base (Discussions):
      ${knowledgeBase}
      
      History:
      ${contextHistory}
      
      User Query: "${userQuery}"
      
      Instructions:
      - Use a context-aware heading mirroring the user's terms (e.g. "Main Discussion Topics"). Include an emoji.
      - Use bullet points (- ) to summarize key points.
      - PLAIN TEXT ONLY. NO MARKDOWN (** or #).
      - Provide 3 suggested questions.
      - Include EXACT post IDs in "retrievedPostIds".
      
      Respond in JSON:
      {
        "text": "Heading\n- point 1\n- point 2",
        "suggestedQuestions": ["Q1?", "Q2?", "Q3?"],
        "retrievedPostIds": ["id1", "id2"]
      }
    `;

    // 5. Invoke Model
    const model = getChatModel();
    let response;
    try {
      response = await model.invoke(prompt);
    } catch (apiError) {
      console.error("Gemini API Error (Quota/Rate Limit):", apiError.message);

      // Fallback response if API is down or quota exceeded
      return {
        text: "Community Activity Update\nI'm currently receiving a lot of questions! While I wait for my connection to the AI to reset, I've still found some relevant discussions for you below. Please try asking again in a few seconds.",
        suggestedQuestions: ["What are the latest safety concerns?", "Are there any coffee shop recommendations?", "How can I join the yoga group?"],
        retrievedPosts: posts.slice(0, 3) // Still show the latest discussions as a fallback
      };
    }

    // 6. Parse and Save
    let aiResult;
    try {
      const cleanResponse = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
      aiResult = JSON.parse(cleanResponse);
    } catch (e) {
      aiResult = { text: response.content, suggestedQuestions: [], retrievedPostIds: [] };
    }

    await new Interaction({ userId, userInput: userQuery, aiResponse: aiResult.text }).save();

    // 7. Map relevant posts
    const relevantPosts = aiResult.retrievedPostIds?.length > 0
      ? posts.filter(p => aiResult.retrievedPostIds.includes(p._id.toString())).slice(0, 3)
      : [];

    return {
      text: aiResult.text,
      suggestedQuestions: aiResult.suggestedQuestions.slice(0, 3),
      retrievedPosts: relevantPosts
    };

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};
