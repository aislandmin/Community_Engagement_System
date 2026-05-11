import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { Blob } from "node:buffer";
import Post from "../models/Post.js";
import Interaction from "../models/Interaction.js";
import dotenv from 'dotenv';
dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
  console.error("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY is not defined in the environment variables.");
}

const model = new ChatGoogleGenerativeAI({
  apiKey: geminiKey,
  model: "gemini-flash-latest",
  temperature: 0.7,
});

export const summarizeText = async (text) => {
  const prompt = PromptTemplate.fromTemplate(
    "Summarize the following community discussion or news post in 2-3 concise sentences. Focus on the main points and action items: {text}"
  );
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ text });
  return response.content;
};

export const analyzeSentiment = async (text) => {
  const prompt = PromptTemplate.fromTemplate(
    "Analyze the sentiment of the following text. Provide a JSON response with two fields: 'score' (a float between -1 and 1, where -1 is very negative and 1 is very positive) and 'label' (one of 'positive', 'neutral', 'negative'). Text: {text}"
  );
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ text });

  try {
    // Attempt to parse JSON from the response content
    const cleanedContent = response.content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error("Error parsing sentiment JSON:", error);
    return { score: 0, label: "neutral", feedback: "Analysis failed" };
  }
};

export const analyzeReviewSentiment = async (comment) => {
  const prompt = PromptTemplate.fromTemplate(
    "Analyze this business review. Return a JSON object with: " +
    "'score' (float -1 to 1), 'label' ('positive', 'neutral', 'negative'), " +
    "and 'businessFeedback' (a short, 1-sentence tip for the owner based on this specific review). " +
    "Review: {comment}"
  );
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ comment });
  try {
    const cleanedContent = response.content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (e) {
    return { score: 0, label: 'neutral', businessFeedback: 'Keep up the good work!' };
  }
};

export const predictTiming = async (description) => {
  const prompt = PromptTemplate.fromTemplate(
    "Suggest only the best event timing for maximum community engagement. Return one short line only. Do not explain, do not list reasons, do not use markdown. Format: Day, Month Date, Year at Time. Event: {description}"
  );
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ description });
  return response.content
    .replace(/[*#`]/g, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)[0] || 'Saturday at 2:00 PM';
};

export const suggestVolunteers = async (users, requirements) => {
  const extractTaskInfo = (text) => {
    const locationPart = text.split('TASK LOCATION:')[1] || '';
    const beforeLocation = text.split('TASK LOCATION:')[0] || '';
    const categoryMatch = beforeLocation.match(/Category:\s*([^.]+)/i);
    const titleMatch = beforeLocation.match(/titled\s+"([^"]+)"/i);
    const descriptionMatch = beforeLocation.match(/Description:\s*(.+)$/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : 'Community Event',
      category: categoryMatch ? categoryMatch[1].trim() : 'General',
      description: descriptionMatch ? descriptionMatch[1].trim() : beforeLocation.trim(),
      location: locationPart.trim() || 'General Neighborhood'
    };
  };

  const { title, description, location, category } = extractTaskInfo(requirements);

  const normalize = (value) => (value || '').toString().trim().toLowerCase();

  const categoryKeywordsMap = {
    meetings: ['meeting', 'discussion', 'community', 'projects', 'safety', 'security', 'planning'],
    social: ['social', 'community', 'fun', 'friends', 'networking'],
    cleanup: ['cleanup', 'clean-up', 'environment', 'outdoors', 'community'],
    gardening: ['gardening', 'plants', 'outdoors', 'greenery'],
    pets: ['pets', 'dogs', 'animals'],
    technology: ['tech', 'technology', 'computers', 'digital'],
    sports: ['sports', 'fitness', 'exercise', 'wellness'],
    food: ['food', 'cooking', 'meals']
  };

  const normalizedCategory = normalize(category);

  const eventKeywords = new Set([
    ...(categoryKeywordsMap[normalizedCategory] || []).map(normalize),
    ...normalize(title).split(/\W+/).filter((w) => w.length > 2),
    ...normalize(description).split(/\W+/).filter((w) => w.length > 2)
  ]);

  const scoredUsers = users.map((u) => {
    const username = u.username;
    const userLocation = normalize(u.location);
    const taskLocation = normalize(location);
    const interests = (u.interests || []).map(normalize);

    let score = 0;
    const reasons = [];

    const sameLocation = userLocation && taskLocation && userLocation === taskLocation;

    if (sameLocation) {
      score += 0.6;
      reasons.push(`same location (${location})`);
    }

    const matchedInterests = [...new Set(
      interests.filter((interest) => eventKeywords.has(interest))
    )];

    if (matchedInterests.length > 0) {
      score += Math.min(matchedInterests.length * 0.2, 0.4);
      reasons.push(`relevant interests: ${matchedInterests.join(', ')}`);
    }

    const result = {
      username,
      matchScore: Number(Math.min(score, 0.99).toFixed(2)),
      reason: reasons.join('; '),
      sameLocation,
      matchedInterests
    };

    return result;
  });

  const topMatches = scoredUsers
    .filter((u) => u.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  if (topMatches.length === 0) {
    return [];
  }

  try {
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful community assistant.

Rewrite each reason into one short, natural sentence.
Return ONLY a JSON array in this exact format:
[
  {{
    "username": "alice",
    "reason": "Alice is a strong match because ..."
  }}
]

Event title: {title}
Category: {category}
Description: {description}
Location: {location}

Matches:
{matches}
`);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      title,
      category,
      description,
      location,
      matches: JSON.stringify(topMatches, null, 2)
    });

    const rawContent =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    const cleanedContent = rawContent.replace(/```json|```/g, '').trim();
    const aiReasons = JSON.parse(cleanedContent);

    return topMatches.map((match) => {
      const enhanced = aiReasons.find((m) => m.username === match.username);
      return {
        username: match.username,
        matchScore: match.matchScore,
        reason: enhanced?.reason || match.reason
      };
    });
  } catch (error) {
    console.error('AI reason enhancement failed:', error);
    return topMatches.map(({ username, matchScore, reason }) => ({
      username,
      matchScore,
      reason
    }));
  }
};

/**
 * AI Service for community agent - Centralized in AI Service
 */
export const communityAIQuery = async (userQuery, userId) => {
  try {
    // 1. Fetch only community discussions
    const posts = await Post.find({ category: 'discussion' }).sort({ createdAt: -1 }).limit(50);

    // 2. Prepare content for TextLoader
    const content = posts.map(post =>
      `ID: ${post._id} | Title: ${post.title} | Content: ${post.content}`
    ).join("\n---\n");

    const loader = new TextLoader(new Blob([content], { type: "text/plain" }));
    const docs = await loader.load();
    const knowledgeBase = docs[0].pageContent;

    // 3. Fetch past interactions
    const pastInteractions = await Interaction.find({ userId })
      .sort({ timestamp: -1 })
      .limit(2);

    const contextHistory = pastInteractions.map(i =>
      `User: ${i.userInput}\nAI: ${i.aiResponse}`
    ).join("\n");

    // 4. Build Prompt
    const promptText = `
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
    const response = await model.invoke(promptText);

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
    console.error("Centralized AI Service Error:", error);
    return {
        text: "Community Activity Update\nI'm currently having trouble processing the discussions.",
        suggestedQuestions: ["What are the latest safety concerns?", "Are there any coffee shop recommendations?"],
        retrievedPosts: []
    };
  }
};
