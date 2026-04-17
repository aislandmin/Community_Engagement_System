import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import dotenv from 'dotenv';
dotenv.config();

// Database URIs from environment variables
const AUTH_MONGO_URI = process.env.AUTH_MONGO_URI || 'mongodb://localhost:27017/authServiceDB';
const COMMUNITY_MONGO_URI = process.env.COMMUNITY_MONGO_URI || 'mongodb://localhost:27017/communityServiceDB';
const BUSINESS_EVENT_MONGO_URI = process.env.BUSINESS_EVENT_MONGO_URI || 'mongodb://localhost:27017/businessEventServiceDB';

// --- User Schema for Auth DB ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['resident', 'business_owner', 'community_organizer'] },
  interests: [{ type: String }],
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// --- Post Schema for Community DB ---
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['news', 'discussion'], required: true },
  aiSummary: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- HelpRequest Schema for Community DB ---
const helpRequestSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  description: { type: String, required: true },
  location: { type: String },
  isResolved: { type: Boolean, default: false },
  volunteers: [{ type: mongoose.Schema.Types.ObjectId }],
  invitedVolunteers: [{ type: mongoose.Schema.Types.ObjectId }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

async function seedData() {
  try {
    // 1. Connect to Auth DB and seed users
    const authConn = await mongoose.createConnection(AUTH_MONGO_URI).asPromise();
    console.log('Connected to Auth Database');
    const User = authConn.model('User', userSchema);

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        username: 'john',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'resident',
        interests: ['coffee', 'yoga', 'safety'],
        location: 'Oak Avenue'
      },
      {
        username: 'jane',
        email: 'jane@example.com',
        password: hashedPassword,
        role: 'community_organizer',
        interests: ['environment', 'security', 'gardening'],
        location: 'Central Park Area'
      },
      { 
        username: 'xiaomin', 
        email: 'bakery@example.com', 
        password: hashedPassword, 
        role: 'business_owner',
        interests: ['baking', 'local business', 'traffic'],
        location: 'Main St'
      },
      { 
        username: 'alice', 
        email: 'alice@example.com', 
        password: hashedPassword, 
        role: 'resident',
        interests: ['pets', 'walking', 'dogs'],
        location: 'highway1 and don mills'
      },
      { 
        username: 'bob', 
        email: 'bob@example.com', 
        password: hashedPassword, 
        role: 'resident',
        interests: ['gardening', 'plants', 'outdoors'],
        location: 'Main St'
      },
      { 
        username: 'charlie', 
        email: 'charlie@example.com', 
        password: hashedPassword, 
        role: 'resident',
        interests: ['tech', 'gaming', 'computers'],
        location: 'North York'
      }
    ]);
    const johnId = users[0]._id;
    const janeId = users[1]._id;
    const xiaominId = users[2]._id;
    const aliceId = users[3]._id;

    console.log(`Seeded ${users.length} users`);
    await authConn.close();

    // 2. Connect to Community DB and seed posts and help requests
    const commConn = await mongoose.createConnection(COMMUNITY_MONGO_URI).asPromise();
    console.log('Connected to Community Database');
    const Post = commConn.model('Post', postSchema);
    const HelpRequest = commConn.model('HelpRequest', helpRequestSchema);

    // Clear existing posts and help requests
    await Post.deleteMany({});
    await HelpRequest.deleteMany({});
    console.log('Cleared existing community data');

    const now = new Date();

    // Seed Posts
    await Post.insertMany([
      {
        author: janeId,
        title: 'Neighborhood Cleanup Day!',
        content: 'Join us this Saturday at 10 AM in the Central Park for our monthly neighborhood cleanup. Equipment provided.',
        category: 'news',
        aiSummary: 'Monthly neighborhood cleanup this Saturday at 10 AM in Central Park.',
        createdAt: now,
        updatedAt: now
      },
      {
        author: johnId,
        title: 'Best Coffee Nearby?',
        content: 'I just moved here. Any recommendations for the best espresso in the neighborhood? I prefer quiet places.',
        category: 'discussion',
        aiSummary: 'A new resident is looking for local coffee shop recommendations, specifically quiet spots.',
        createdAt: new Date(now - 86400000),
        updatedAt: new Date(now - 3600000)
      }
    ]);
    console.log('Seeded sample posts');

    // Seed Help Requests
    await HelpRequest.insertMany([
      {
        authorId: johnId,
        description: 'Need help moving a heavy couch to the 3rd floor.',
        location: '123 Maple St',
        isResolved: false,
        volunteers: [janeId],
        createdAt: now,
        updatedAt: now
      },
      {
        authorId: janeId,
        description: 'Looking for someone to water my plants next week.',
        location: '456 Oak Ave',
        isResolved: false,
        volunteers: [],
        createdAt: new Date(now - 86400000),
        updatedAt: new Date(now - 86400000)
      }
    ]);
    console.log('Seeded help requests');

    await commConn.close();
    console.log('Seeding completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
