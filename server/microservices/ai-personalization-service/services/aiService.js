import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR: GEMINI_API_KEY or GOOGLE_API_KEY is not defined in the environment variables.");
}

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  maxOutputTokens: 2048,
  apiKey: apiKey,
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
    "Based on the following event description, suggest the best day of the week and time of day to hold this event for maximum community engagement in a typical residential neighborhood. Event: {description}"
  );
  const chain = prompt.pipe(model);
  const response = await chain.invoke({ description });
  return response.content;
};

// export const suggestVolunteers = async (users, requirements) => {
//   console.log("AI Matching Request:", requirements);
//   console.log(`Analyzing ${users.length} potential volunteers...`);
//   console.log(`${users}`);

//   const prompt = PromptTemplate.fromTemplate(
//     "Return ONLY a JSON array. No preamble, no explanation.\n\n" +
//     "You are a community assistant. Match this request to the top 3 best volunteers from the list provided.\n\n" +
//     "MATCHING RULES:\n" +
//     "1. SAME LOCATION PRIORITY: If a member's location is IDENTICAL or very similar to the request location, they are a 0.95+ match. Proximity is the most important factor.\n" +
//     "2. INTEREST MATCH: Match keywords in the description to user interests.\n\n" +
//     "Return as: [ { \"username\": \"...\", \"matchScore\": 0.95, \"reason\": \"...\" } ]\n\n" +
//     "Request: {requirements}\n\nNeighbors: {members}"
//   );
//   const chain = prompt.pipe(model);

//   const membersData = users.map(u => `Username: ${u.username}, Interests: ${u.interests.join(', ')}, Location: ${u.location}`).join('\n');

//   const response = await chain.invoke({
//     requirements,
//     members: membersData
//   });

//   try {
//     const cleanedContent = response.content.replace(/```json|```/g, '').trim();
//     const jsonResponse = JSON.parse(cleanedContent);
//     console.log("✅ AI Suggestions Found:", jsonResponse.length);
//     return jsonResponse;
//   } catch (error) {
//     console.error("❌ AI Parsing Error. Raw Content:", response.content);
//     return [];
//   }
// };

export const suggestVolunteers = async (users, requirements) => {
  console.log(users);
  console.log(requirements);
  // const normalize = (str = '') => str.trim().toLowerCase();

  // const extractTaskInfo = (text) => {
  //   // Clean up template literal whitespace
  //   const cleanText = text.replace(/^\s+/gm, '');

  //   // Improved regex to capture content between labels, or until end of string
  //   const descriptionMatch = cleanText.match(/TASK DESCRIPTION:\s*([\s\S]*?)(?=TASK LOCATION:|$)/i);
  //   const locationMatch = cleanText.match(/TASK LOCATION:\s*([\s\S]*?)$/i);

  //   return {
  //     description: descriptionMatch ? descriptionMatch[1].trim() : cleanText.trim(),
  //     location: locationMatch ? locationMatch[1].trim() : 'General'
  //   };
  // };

  // const { description, location } = extractTaskInfo(requirements);

  const extractTaskInfo = (text) => {
    const cleanText = text.replace(/^\s+/gm, '');

    const descriptionMatch = cleanText.match(/TASK DESCRIPTION:\s*([\s\S]*?)(?=TASK LOCATION:|$)/i);
    const locationMatch = cleanText.match(/TASK LOCATION:\s*([\s\S]*?)$/i);
    const categoryMatch = cleanText.match(/Category:\s*([^.]+)\.?/i);

    return {
      description: descriptionMatch ? descriptionMatch[1].trim() : cleanText.trim(),
      location: locationMatch ? locationMatch[1].trim() : 'General',
      category: categoryMatch ? categoryMatch[1].trim() : ''
    };
  };

  const { description, location, category } = extractTaskInfo(requirements);

  console.log("AI Matching Request for Event/Task:", description);
  console.log("Analyzed Location:", location);

  //   const prompt = PromptTemplate.fromTemplate(
  //     `Return ONLY a JSON array. No preamble, no explanation.

  // You are a community assistant. Match this request to the best volunteers from the list provided.

  // CRITICAL RULES:
  // 1. USE EXACT USERNAMES: You must return the EXACT username string as it appears in the "Neighbors" list below. Do not change case or spelling.
  // 2. INTEREST ALIGNMENT: Prioritize members whose interests (e.g., social, gardening, tech) match the nature of the request description: "{description}".
  // 3. KEYWORD MATCH: If the category is "Social" or "Help", you MUST look for related keywords in the interests list.
  // 4. LOCATION: Favor members in the same or nearby locations.

  // Return format:
  // [
  //   { "username": "EXACT_NAME_FROM_LIST", "matchScore": 0.95, "reason": "Reasoning based on interest and location..." }
  // ]

  // Request description: {description}
  // Request location: {location}

  // Neighbors to choose from:
  // {members}`
  //   );

  const prompt = PromptTemplate.fromTemplate(`
Return ONLY a JSON array. No preamble, no explanation.

You are a community assistant. Match this request to the best volunteers from the list provided.

CRITICAL RULES:
1. USE EXACT USERNAMES: You must return the EXACT username string as it appears in the "Neighbors" list below.
2. CATEGORY MATCH: Strongly prioritize members whose interests contain the exact normalized category.
3. LOCATION MATCH: Strongly prioritize members in the exact same location.
4. INTEREST ALIGNMENT: Also consider whether other interests fit the description.

Request category: {category}
Request description: {description}
Request location: {location}

Neighbors to choose from:
{members}
`);

  const chain = prompt.pipe(model);

  const membersData = users
    .map(
      (u) =>
        `Username: ${u.username}, Interests: ${(u.interests || []).join(', ')}, Location: ${u.location || 'Unknown'}`
    )
    .join('\n');

  const response = await chain.invoke({
    description,
    location,
    members: membersData
  });

  try {
    const cleanedContent = response.content.replace(/```json|```/g, '').trim();
    const jsonResponse = JSON.parse(cleanedContent);
    return jsonResponse;
  } catch (error) {
    console.error("❌ AI Parsing Error:", response.content);
    return [];
  }
};
