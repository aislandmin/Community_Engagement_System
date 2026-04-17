import Post from '../models/Post.js';
import HelpRequest from '../models/HelpRequest.js';
import Alert from '../models/Alert.js';
import { communityAIQuery as aiQueryService } from '../services/aiService.js';

// Simple "AI" simulation logic
const generateAISummary = (content) => {
  const words = content.split(/\s+/);
  const brief = words.slice(0, 20).join(' ');
  const suffix = words.length > 20 ? '...' : '';

  // Simulated AI "insights"
  const sentiments = ['positive', 'informative', 'community-focused', 'urgent'];
  const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

  return `This post appears to be ${sentiment}. Key takeaway: "${brief}${suffix}"`;
};

const resolvers = {
  Post: {
    author: (post) => ({ id: post.author }),
    comments: (post) => post.comments || [],
  },
  Comment: {
    author: (comment) => ({ id: comment.authorId }),
  },
  HelpRequest: {
    author: (req) => ({ id: req.authorId }),
    volunteers: (req) => req.volunteers.map(id => ({ id })),
    invitedVolunteers: (req) => req.invitedVolunteers.map(id => ({ id })),
  },
  Alert: {
    author: (alert) => ({ id: alert.authorId }),
  },
  Query: {
    posts: async (_, { category }) => {
      const filter = category ? { category } : {};
      return await Post.find(filter).sort({ createdAt: -1 });
    },
    post: async (_, { id }) => await Post.findById(id),
    helpRequests: async () => await HelpRequest.find().sort({ createdAt: -1 }),
    helpRequest: async (_, { id }) => await HelpRequest.findById(id),
    alerts: async (_, { category }) => {
        const filter = category ? { category } : {};
        return await Alert.find(filter).sort({ createdAt: -1 });
    },
    communityAIQuery: async (_, { query }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      return await aiQueryService(query, context.user.id);
    },
  },
  Mutation: {
    createPost: async (_, { title, content, category }, context) => {
      if (!context.user) throw new Error('Unauthorized');

      const aiSummary = generateAISummary(content);

      const newPost = new Post({
        title,
        content,
        category,
        aiSummary,
        author: context.user.id,
      });
      return await newPost.save();
    },
    updatePost: async (_, { id, ...updates }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const post = await Post.findById(id);
      if (!post) throw new Error('Post not found');
      if (post.author.toString() !== context.user.id) throw new Error('Forbidden');

      Object.assign(post, updates);
      post.updatedAt = new Date();
      return await post.save();
    },
    addComment: async (_, { postId, content }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const post = await Post.findById(postId);
      if (!post) throw new Error('Post not found');

      post.comments.push({
        authorId: context.user.id,
        username: context.user.username,
        content,
        createdAt: new Date()
      });

      return await post.save();
    },
    createHelpRequest: async (_, { description, location }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const newRequest = new HelpRequest({
        description,
        location,
        authorId: context.user.id,
      });
      return await newRequest.save();
    },
    updateHelpRequest: async (_, { id, ...updates }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const request = await HelpRequest.findById(id);
      if (!request) throw new Error('Help request not found');
      if (request.authorId.toString() !== context.user.id) throw new Error('Forbidden');

      Object.assign(request, updates);
      request.updatedAt = new Date();
      return await request.save();
    },
    volunteerForHelpRequest: async (_, { id }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const request = await HelpRequest.findById(id);
      if (!request) throw new Error('Help request not found');

      if (request.authorId.toString() === context.user.id) {
        throw new Error('You cannot volunteer for your own help request.');
      }

      if (!request.volunteers.includes(context.user.id)) {
        request.volunteers.push(context.user.id);
        request.updatedAt = new Date();
        return await request.save();
      }

      throw new Error('You have already volunteered for this request.');
    },
    resolveHelpRequest: async (_, { id }, context) => {
        if (!context.user) throw new Error('Unauthorized');
        const request = await HelpRequest.findById(id);
        if (!request) throw new Error('Help request not found');
        if (request.authorId.toString() !== context.user.id) throw new Error('Forbidden: Only the author can resolve this request');
        
        request.isResolved = true;
        request.updatedAt = new Date();
        return await request.save();
    },
    inviteVolunteer: async (_, { helpRequestId, volunteerId }, context) => {
        if (!context.user) throw new Error('Unauthorized');
        const request = await HelpRequest.findById(helpRequestId);
        if (!request) throw new Error('Help request not found');
        
        if (!request.invitedVolunteers.includes(volunteerId)) {
            request.invitedVolunteers.push(volunteerId);
            const savedRequest = await request.save();
            
            // Send Real-time Invitation via Socket.io
            if (context.io) {
                context.io.emit('new-volunteer-invitation', {
                    requestId: helpRequestId,
                    volunteerId,
                    requesterName: context.user.username,
                    description: request.description
                });
            }
            return savedRequest;
        }
        return request;
    },
    createAlert: async (_, args, context) => {
        if (!context.user) throw new Error('Unauthorized');
        const newAlert = new Alert({
            ...args,
            authorId: context.user.id,
        });
        const savedAlert = await newAlert.save();
        
        // Broadcast the alert in real-time via Socket.io
        if (context.io) {
            context.io.emit('new-emergency-alert', {
                ...savedAlert.toObject(),
                author: { username: context.user.username } 
            });
        }
        
        return savedAlert;
    },
    resolveAlert: async (_, { id }, context) => {
        if (!context.user) throw new Error('Unauthorized');
        const alert = await Alert.findById(id);
        if (!alert) throw new Error('Alert not found');
        if (alert.authorId.toString() !== context.user.id) throw new Error('Forbidden');
        
        alert.isActive = false;
        return await alert.save();
    }
  },
};

export default resolvers;
