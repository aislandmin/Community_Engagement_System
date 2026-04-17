import dotenv from 'dotenv';
dotenv.config();

export const config = {
    db: process.env.BUSINESS_EVENT_MONGO_URI || 'mongodb://localhost:27017/businessEventServiceDB',
    JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
    port: process.env.PORT || 4004,
};
