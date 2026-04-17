import dotenv from 'dotenv';
dotenv.config();

export const config = {
    auth_db: process.env.AUTH_MONGO_URI || 'mongodb://localhost:27017/authServiceDB',
    community_db: process.env.COMMUNITY_MONGO_URI || 'mongodb://localhost:27017/communityServiceDB',
    business_db: process.env.BUSINESS_MONGO_URI || 'mongodb://localhost:27017/businessEventServiceDB',
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
    port: process.env.PORT || 4005,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
};
