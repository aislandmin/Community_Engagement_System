const typeDefs = `#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key"])

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

  type Query {
    summarize(text: String!): SummarizeResponse
    analyzeSentiment(text: String!): SentimentResponse
    analyzeReviewSentiment(comment: String!): ReviewSentimentResponse
    suggestVolunteers(eventId: ID, helpRequestId: ID): [VolunteerSuggestion]
    predictEventTiming(eventDescription: String!): String
  }
`;

export default typeDefs;
