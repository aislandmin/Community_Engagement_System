import Business from '../models/Business.js';
import Deal from '../models/Deal.js';
import Review from '../models/Review.js';
import Event from '../models/Event.js';
import { analyzeReviewSentiment, predictTiming } from '../services/aiService.js';

const resolvers = {
  Business: {
    owner: (bus) => ({ id: bus.ownerId }),
    deals: async (bus) => await Deal.find({ businessId: bus.id }),
    reviews: async (bus) => await Review.find({ businessId: bus.id }).sort({ createdAt: -1 }),
  },
  Deal: {
    business: async (deal) => await Business.findById(deal.businessId),
  },
  Review: {
    author: (rev) => ({ id: rev.authorId }),
    business: async (rev) => await Business.findById(rev.businessId),
    deal: async (rev) => rev.dealId ? await Deal.findById(rev.dealId) : null,
  },
  Event: {
    organizer: (evt) => ({ id: evt.organizerId }),
    rsvps: (evt) => evt.rsvps.map(id => ({ id })),
    invitedVolunteers: (evt) => evt.invitedVolunteers.map(id => ({ id })),
    volunteers: (evt) => evt.volunteers.map(id => ({ id })),
  },
  Query: {
    businesses: async (_, { category }) => {
      const filter = category ? { category } : {};
      return await Business.find(filter).sort({ createdAt: -1 });
    },
    business: async (_, { id }) => await Business.findById(id),
    deals: async () => await Deal.find().sort({ createdAt: -1 }),
    events: async (_, { category }) => {
      const filter = category ? { category } : {};
      return await Event.find(filter).sort({ date: 1 });
    },
    event: async (_, { id }) => await Event.findById(id),
  },
  Mutation: {
    createBusiness: async (_, { initialDeal, ...args }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const newBusiness = new Business({
        ...args,
        ownerId: context.user.id,
      });
      const savedBiz = await newBusiness.save();
      
      if (initialDeal) {
        const newDeal = new Deal({
          ...initialDeal,
          businessId: savedBiz.id
        });
        await newDeal.save();
      }
      
      return savedBiz;
    },
    updateBusiness: async (_, { id, ...updates }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const business = await Business.findById(id);
      if (!business) throw new Error('Business not found');
      if (business.ownerId.toString() !== context.user.id) throw new Error('Forbidden');
      
      Object.assign(business, updates);
      business.updatedAt = new Date();
      return await business.save();
    },
    createDeal: async (_, args, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const business = await Business.findById(args.businessId);
      if (!business) throw new Error('Business not found');
      if (business.ownerId.toString() !== context.user.id) throw new Error('Forbidden');
      
      const newDeal = new Deal(args);
      return await newDeal.save();
    },
    createReview: async (_, args, context) => {
      if (!context.user) throw new Error('Unauthorized');
      
      const { score, label, businessFeedback } = await analyzeReviewSentiment(args.comment);

      const newReview = new Review({
        ...args,
        authorId: context.user.id,
        sentimentScore: score,
        businessFeedback,
        dealId: args.dealId
      });
      const savedReview = await newReview.save();

      // Emit real-time notification via Socket.io
      if (context.io) {
        context.io.emit('new-review', {
          businessId: args.businessId,
          reviewerName: context.user.username
        });
      }

      return savedReview;
    },
    respondToReview: async (_, { reviewId, response }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const review = await Review.findById(reviewId);
      if (!review) throw new Error('Review not found');
      
      const business = await Business.findById(review.businessId);
      if (business.ownerId.toString() !== context.user.id) throw new Error('Forbidden');
      
      review.response = response;
      return await review.save();
    },
    createEvent: async (_, args, context) => {
      if (!context.user) throw new Error('Unauthorized');
      
      const timingInsight = await predictTiming(args.description);

      const newEvent = new Event({
        ...args,
        organizerId: context.user.id,
        timingInsight
      });
      return await newEvent.save();
    },
    updateEvent: async (_, { id, ...updates }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const event = await Event.findById(id);
      if (!event) throw new Error('Event not found');
      if (event.organizerId.toString() !== context.user.id) throw new Error('Forbidden');
      
      Object.assign(event, updates);
      event.updatedAt = new Date();
      return await event.save();
    },
    rsvpToEvent: async (_, { eventId }, context) => {
      if (!context.user) throw new Error('Unauthorized');
      const event = await Event.findById(eventId);
      if (!event) throw new Error('Event not found');
      
      if (!event.rsvps.includes(context.user.id)) {
        event.rsvps.push(context.user.id);
        return await event.save();
      }
      return event;
    },
    inviteVolunteerToEvent: async (_, { eventId, volunteerId }, context) => {
        if (!context.user) throw new Error('Unauthorized');
        const event = await Event.findById(eventId);
        if (!event) throw new Error('Event not found');
        if (event.organizerId.toString() !== context.user.id) throw new Error('Forbidden');

        if (!event.invitedVolunteers.includes(volunteerId)) {
            event.invitedVolunteers.push(volunteerId);
            await event.save();

            // Send Real-time Invitation via Socket.io
            if (context.io) {
                context.io.emit('new-volunteer-invitation', {
                    eventId,
                    volunteerId,
                    requesterName: context.user.username,
                    description: `You've been invited to help with: ${event.title}`
                });
            }
        }
        return event;
    },
    volunteerForEvent: async (_, { eventId }, context) => {
        if (!context.user) throw new Error('Unauthorized');
        const event = await Event.findById(eventId);
        if (!event) throw new Error('Event not found');
        
        if (!event.volunteers.includes(context.user.id)) {
            event.volunteers.push(context.user.id);
            // Also RSVP them if they haven't already
            if (!event.rsvps.includes(context.user.id)) {
                event.rsvps.push(context.user.id);
            }
            return await event.save();
        }
        return event;
    },
  },
};

export default resolvers;
