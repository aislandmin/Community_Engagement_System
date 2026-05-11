import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv';
dotenv.config();

let chatModel = null;
const getChatModel = () => {
    if (!chatModel) {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            throw new Error("GEMINI_API_KEY is not defined in business-event-service.");
        }
        chatModel = new ChatGoogleGenerativeAI({
            apiKey: geminiKey,
            model: "gemini-flash-latest",
            temperature: 0.7,
        });
    }
    return chatModel;
};

export const analyzeReviewSentiment = async (comment) => {
    try {
        const model = getChatModel();
        const prompt = `Analyze this business review. Return a JSON object with: 
        "score" (float -1 to 1), "label" ("positive", "neutral", "negative"), 
        and "businessFeedback" (a short, 1-sentence tip for the owner based on this specific review). 
        Review: ${comment}`;
        
        const response = await model.invoke(prompt);
        const cleanedContent = response.content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedContent);
    } catch (error) {
        console.error("AI Review Sentiment Error:", error);
        return { score: 0, label: 'neutral', businessFeedback: 'Keep up the good work!' };
    }
};

export const predictTiming = async (description) => {
    try {
        const model = getChatModel();
        const prompt = `Suggest only the best event timing for maximum community engagement. Return one short line only. Do not explain, do not list reasons, do not use markdown. Format: Day, Month Date, Year at Time. Event: ${description}`;
        
        const response = await model.invoke(prompt);
        return response.content
            .replace(/[*#`]/g, '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)[0] || 'Saturday at 2:00 PM';
    } catch (error) {
        console.error("AI Timing Prediction Error:", error);
        return "Saturday at 2:00 PM";
    }
};
