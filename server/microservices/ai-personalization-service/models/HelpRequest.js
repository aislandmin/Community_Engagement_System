import mongoose from 'mongoose';
import { communityConnection } from '../config/mongoose.js';

const helpRequestSchema = new mongoose.Schema({
    description: String,
    location: String,
});

// Use the explicit community connection
export default communityConnection.model('HelpRequest', helpRequestSchema);
