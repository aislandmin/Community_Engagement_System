import mongoose from 'mongoose';
import { authConnection } from '../config/mongoose.js';

const userSchema = new mongoose.Schema({
    username: String,
    role: String,
    interests: [String],
    location: String
});

// Use the explicit auth connection
export default authConnection.model('User', userSchema);
