import mongoose from 'mongoose';
import { communityConnection } from '../config/mongoose.js';

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userInput: {
    type: String,
    required: true,
  },
  aiResponse: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default communityConnection.model('Interaction', interactionSchema);
