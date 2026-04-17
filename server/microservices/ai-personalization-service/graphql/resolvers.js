import { summarizeText, analyzeSentiment, predictTiming, suggestVolunteers } from '../services/aiService.js';
import User from '../models/User.js';
import HelpRequest from '../models/HelpRequest.js';
import Event from '../models/Event.js';

const resolvers = {
  Query: {
    summarize: async (_, { text }) => {
      const summary = await summarizeText(text);
      return {
        summary,
        originalLength: text.length,
        summaryLength: summary.length
      };
    },
    analyzeSentiment: async (_, { text }) => {
      return await analyzeSentiment(text);
    },
    analyzeReviewSentiment: async (_, { comment }) => {
      return await analyzeReviewSentiment(comment);
    },
    predictEventTiming: async (_, { eventDescription }) => {
      return await predictTiming(eventDescription);
    },
    suggestVolunteers: async (_, { eventId, helpRequestId }) => {
      let requirements = "General community help request.";
      let requesterId = null;

      // 1. Fetch REAL details from the DBs
      if (helpRequestId) {
        const request = await HelpRequest.findById(helpRequestId);
        if (request) {
          requesterId = request.authorId?.toString();
          requirements = `TASK DESCRIPTION: ${request.description}\nTASK LOCATION: ${request.location || 'Not specified'}`;
        }
      } else if (eventId) {
        const event = await Event.findById(eventId);
        if (event) {
          requesterId = event.organizerId?.toString();
          requirements = `TASK DESCRIPTION: Community event titled "${event.title}". Category: ${event.category}. Description: ${event.description}.\nTASK LOCATION: ${event.location || 'Not specified'}`;
        }
      }

      // 2. Fetch all residents EXCEPT the requester
      const users = await User.find({
        role: 'resident',
        _id: { $ne: requesterId }
      });

      // 3. Perform AI Matching with REAL data
      const suggestions = await suggestVolunteers(users, requirements);

      return suggestions.map(s => {
        const user = users.find(u => u.username.toLowerCase() === s.username.toLowerCase());
        return {
          user: user ? { id: user._id.toString() } : null,
          matchScore: s.matchScore,
          reason: s.reason
        };
      });
    }
  }
};

export default resolvers;
