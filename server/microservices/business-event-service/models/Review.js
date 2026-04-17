import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  response: { type: String },
  sentimentScore: { type: Number }, // To be filled by AI service
  businessFeedback: { type: String }, // AI-generated tip for the owner
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Review', reviewSchema);
