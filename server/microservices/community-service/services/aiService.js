import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
dotenv.config();

let chatModel = null;
const getChatModel = () => {
  if (!chatModel) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is not defined.");
    }
    chatModel = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-flash-latest",
      temperature: 0.7,
    });
  }
  return chatModel;
};

/**
 * Real AI Summarization for discussions/news
 */
export const summarizeText = async (text) => {
    try {
        const model = getChatModel();
        const prompt = `Summarize the following community discussion or news post in 2-3 concise sentences. Focus on the main points and action items: ${text}`;
        
        const response = await model.invoke(prompt);
        return response.content.trim();
    } catch (error) {
        console.error("AI Summarization Error:", error);
        // Fallback to a simple snippet if AI fails
        return text.split(/\s+/).slice(0, 20).join(' ') + '...';
    }
};
