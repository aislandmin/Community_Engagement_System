// server / microservices / auth - service / graphql / typeDefs.js
// GraphQL type definitions
// const typeDefs = `#graphql
//   type User {
//     id: ID!
//     username: String!
//     email: String!
//     role: String!
//     createdAt: String
//   }

//   type Query {
//     currentUser: User
//   }

//   type Mutation {
//     login(username: String!, password: String!): Boolean
//     register(username: String!, email: String!, password: String!, role: String): Boolean
//     logout: Boolean
//   }

// `;

// // Export as an ES Module
// export default typeDefs;

const typeDefs = `#graphql
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    username: String!
    email: String!
    role: String!
    interests: [String]
    location: String
  }

  type Query {
    currentUser: User
  }

  type Mutation {
    login(username: String!, password: String!): Boolean
    register(username: String!, email: String!, password: String!, role: String, interests: [String], location: String): Boolean
    updateUserProfile(interests: [String], location: String): User
    logout: Boolean
  }
`;

// Export as an ES Module
export default typeDefs;