import mongoose from 'mongoose';

const helpRequestSchema = new mongoose.Schema({
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  description: { type: String, required: true },
  location: { type: String, required: false },
  isResolved: { 
    type: Boolean, 
    required: false, 
    default: false 
  },
  volunteers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  invitedVolunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    required: false,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: false,
    default: Date.now
  }
}, { timestamps: false });

export default mongoose.model('HelpRequest', helpRequestSchema);
