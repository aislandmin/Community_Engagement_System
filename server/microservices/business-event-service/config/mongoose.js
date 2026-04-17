import mongoose from 'mongoose';
import { config } from './config.js';

const connectDB = async () => {
    try {
        await mongoose.connect(config.db);
        console.log(`✅ Business & Event Service connected to MongoDB: ${config.db}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

export default connectDB;
