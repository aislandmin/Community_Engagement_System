import mongoose from 'mongoose';
import { config } from './config.js';

// Initialize connections immediately so they are available for model definitions
const authConnection = mongoose.createConnection(config.auth_db);
const communityConnection = mongoose.createConnection(config.community_db);
const businessConnection = mongoose.createConnection(config.business_db);

const connectDB = async () => {
    try {
        // Wait for all connections to establish
        await Promise.all([
            authConnection.asPromise(),
            communityConnection.asPromise(),
            businessConnection.asPromise()
        ]);
        console.log(`✅ AI Service connected to Auth, Community & Business DBs`);
    } catch (error) {
        console.error('❌ MongoDB connection error in AI Service:', error.message);
        process.exit(1);
    }
};

export { connectDB, authConnection, communityConnection, businessConnection };
export default connectDB;
