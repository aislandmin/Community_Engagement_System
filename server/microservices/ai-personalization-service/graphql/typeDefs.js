const typeDefs = `#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key", "@shareable"])

  enum PostCategory {
    news
    discussion
  }

  type User @key(fields: "id") {
    id: ID!
  }

  type SummarizeResponse {
    summary: String!
    originalLength: Int
    summaryLength: Int
  }

  type SentimentResponse {
    score: Float! # -1 to 1 or 0 to 1
    label: String! # positive, neutral, negative
    feedback: String
  }

  type VolunteerSuggestion {
    user: User
    matchScore: Float
    reason: String
  }

  type ReviewSentimentResponse {
    score: Float!
    label: String!
    businessFeedback: String
  }

  type Comment @shareable {
    id: ID!
    author: User
    username: String
    content: String!
    createdAt: String
  }

  type Post @key(fields: "id") @shareable {
    id: ID!
    author: User
    title: String!
    content: String!
    category: PostCategory!
    aiSummary: String
    comments: [Comment]
    createdAt: String
    updatedAt: String
  }

  type AIResponse {
    text: String!
    suggestedQuestions: [String]!
    retrievedPosts: [Post]!
  }

  type Query {
    summarize(text: String!): SummarizeResponse
    analyzeSentiment(text: String!): SentimentResponse
    analyzeReviewSentiment(comment: String!): ReviewSentimentResponse
    suggestVolunteers(eventId: ID, helpRequestId: ID): [VolunteerSuggestion]
    predictEventTiming(eventDescription: String!): String
    communityAIQuery(query: String!): AIResponse!
  }
`;

export default typeDefs;
