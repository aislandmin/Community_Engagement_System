import Business from '../models/Business.js';
import Deal from '../models/Deal.js';
import Review from '../models/Review.js';
import Event from '../models/Event.js';

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
      
      const comment = args.comment.toLowerCase();
      let sentimentScore = 0;
      let businessFeedback = "Keep monitoring your reviews!";

      if (comment.includes('great') || comment.includes('excellent') || comment.includes('love')) {
        sentimentScore = 0.8;
        businessFeedback = args.dealId ? "The deal you posted is attracting very positive feedback!" : "Your customers love your service! Keep doing what you're doing.";
      } else if (comment.includes('bad') || comment.includes('poor') || comment.includes('horrible') || comment.includes('slow')) {
        sentimentScore = -0.7;
        businessFeedback = args.dealId ? "Customers are unhappy with the recent deal. Consider adjusting the offer." : "Customers are unhappy. Consider improving speed or service quality.";
      } else if (comment.includes('okay') || comment.includes('good')) {
        sentimentScore = 0.2;
        businessFeedback = "Solid performance, but there is room for improvement.";
      }

      const newReview = new Review({
        ...args,
        authorId: context.user.id,
        sentimentScore,
        businessFeedback,
        dealId: args.dealId
      });
      return await newReview.save();
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
      
      // Simulate AI timing prediction
      const desc = args.description.toLowerCase();
      let timingInsight = "Saturday afternoon at 2 PM is usually best for community events.";
      if (desc.includes('clean') || desc.includes('garden')) {
        timingInsight = "Saturday morning at 9 AM is optimal for outdoor physical activities.";
      } else if (desc.includes('meetup') || desc.includes('social')) {
        timingInsight = "Friday evening at 6 PM typically sees the highest social engagement.";
      } else if (desc.includes('workshop') || desc.includes('class')) {
        timingInsight = "Thursday evening at 7 PM is best for educational workshops.";
      }

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
  },
};

export default resolvers;
