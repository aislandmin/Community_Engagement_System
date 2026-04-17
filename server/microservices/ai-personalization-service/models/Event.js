import mongoose from 'mongoose';
import { businessConnection } from '../config/mongoose.js';

const eventSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  rsvps: [{ type: mongoose.Schema.Types.ObjectId }],
  volunteersNeeded: { type: Number, default: 0 },
  volunteerInterests: [{ type: String }],
  timingInsight: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default businessConnection.model('Event', eventSchema);
