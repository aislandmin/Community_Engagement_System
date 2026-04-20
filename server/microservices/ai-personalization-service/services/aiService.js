import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
dotenv.config();

const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
  console.error("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY is not defined in the environment variables.");
}

const model = new ChatGoogleGenerativeAI({
  // model: "gemini-1.0-pro",
  // maxOutputTokens: 2048,
  // apiKey: apiKey,
  apiKey: geminiKey,
  model: "gemini-flash-latest",//"gemini-1.5-flash",
  temperature: 0.7,
});

// chatModel = new ChatGoogleGenerativeAI({
//   apiKey: geminiKey,
//   model: "gemini-flash-latest",//"gemini-1.5-flash",
//   temperature: 0.7,
// });

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
    "Based on the following event description, suggest the best day of the week and time of day to hold this event for maximum community engagement in a typical residential neighborhood. Event: {description}"
  );
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ description });
  return response.content;
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

  console.log('--- Hybrid Matching Debug ---');
  console.log('Event Title:', title);
  console.log('Category:', category);
  console.log('Location:', location);
  console.log('Keywords:', [...eventKeywords]);
  console.log('Top Matches:', JSON.stringify(topMatches, null, 2));

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

    console.log('Raw AI response:', rawContent);

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