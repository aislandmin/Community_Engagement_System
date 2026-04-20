const typeDefs = `#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key"])

  enum PostCategory {
    news
    discussion
  }

  type User @key(fields: "id") {
    id: ID!
  }

  type Comment {
    id: ID!
    author: User
    username: String
    content: String!
    createdAt: String
  }

  type Post {
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

  type HelpRequest {
    id: ID!
    author: User
    description: String!
    location: String
    isResolved: Boolean!
    volunteers: [User]
    invitedVolunteers: [User]
    createdAt: String
    updatedAt: String
  }

  type Alert {
    id: ID!
    author: User
    title: String!
    description: String!
    category: String!
    location: String
    isActive: Boolean!
    createdAt: String
  }

  type AIResponse {
    text: String!
    suggestedQuestions: [String]!
    retrievedPosts: [Post]!
  }

  type Query {
    posts(category: PostCategory): [Post]
    helpRequests: [HelpRequest]
    post(id: ID!): Post
    helpRequest(id: ID!): HelpRequest
    alerts(category: String): [Alert]
    communityAIQuery(query: String!): AIResponse!
  }

  type Mutation {
    createPost(title: String!, content: String!, category: PostCategory!): Post
    updatePost(id: ID!, title: String, content: String, category: PostCategory, aiSummary: String): Post
    addComment(postId: ID!, content: String!): Post
    
    createHelpRequest(description: String!, location: String): HelpRequest
    updateHelpRequest(id: ID!, description: String, location: String, isResolved: Boolean): HelpRequest
    volunteerForHelpRequest(id: ID!): HelpRequest
    resolveHelpRequest(id: ID!): HelpRequest
    inviteVolunteer(helpRequestId: ID, eventId: ID, volunteerId: ID!): HelpRequest

    createAlert(title: String!, description: String!, category: String!, location: String): Alert
    resolveAlert(id: ID!): Alert
  }
`;

export default typeDefs;
