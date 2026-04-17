import dotenv from 'dotenv';
dotenv.config();

export const config = {
  MONGO_URI: process.env.COMMUNITY_MONGO_URI || 'mongodb://localhost:27017/communityServiceDB',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_here',
  port: process.env.PORT || 4003,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};
