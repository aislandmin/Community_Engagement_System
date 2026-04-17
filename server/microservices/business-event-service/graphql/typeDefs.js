const typeDefs = `#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
  }

  type Business @key(fields: "id") {
    id: ID!
    owner: User
    name: String!
    description: String!
    category: String!
    images: [String]
    location: String
    deals: [Deal]
    reviews: [Review]
    createdAt: String
    updatedAt: String
  }

  type Deal {
    id: ID!
    business: Business
    title: String!
    description: String!
    discount: String
    validUntil: String
    createdAt: String
  }

  type Review {
    id: ID!
    author: User
    business: Business
    deal: Deal
    rating: Int!
    comment: String!
    response: String
    sentimentScore: Float
    businessFeedback: String
    createdAt: String
  }

  type Event @key(fields: "id") {
    id: ID!
    organizer: User
    title: String!
    description: String!
    category: String!
    date: String!
    location: String!
    rsvps: [User]
    volunteersNeeded: Int
    volunteerInterests: [String]
    timingInsight: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    businesses(category: String): [Business]
    business(id: ID!): Business
    deals: [Deal]
    events(category: String): [Event]
    event(id: ID!): Event
  }

  input InitialDealInput {
    title: String!
    description: String!
    discount: String
  }

  extend type Mutation {
    createBusiness(name: String!, description: String!, category: String!, images: [String], location: String, initialDeal: InitialDealInput): Business
    updateBusiness(id: ID!, name: String, description: String, category: String, images: [String], location: String): Business
    
    createDeal(businessId: ID!, title: String!, description: String!, discount: String, validUntil: String): Deal
    
    createReview(businessId: ID!, dealId: ID, rating: Int!, comment: String!): Review
    respondToReview(reviewId: ID!, response: String!): Review
    
    createEvent(title: String!, description: String!, category: String!, date: String!, location: String!, volunteersNeeded: Int, volunteerInterests: [String]): Event
    updateEvent(id: ID!, title: String, description: String, category: String, date: String, location: String, volunteersNeeded: Int): Event
    rsvpToEvent(eventId: ID!): Event
  }
`;

export default typeDefs;
