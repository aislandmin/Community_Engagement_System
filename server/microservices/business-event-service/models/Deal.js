import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  discount: { type: String },
  validUntil: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Deal', dealSchema);
