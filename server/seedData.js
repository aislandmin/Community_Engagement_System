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

// --- Business Schema for BusinessEvent DB ---
const businessSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  location: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// --- Deal Schema for BusinessEvent DB ---
const dealSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  discount: { type: String },
  validUntil: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// --- Event Schema for BusinessEvent DB ---
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
      },
      { 
        username: 'david', 
        email: 'david@example.com', 
        password: hashedPassword, 
        role: 'business_owner',
        interests: ['mechanic', 'cars', 'tools'],
        location: '123 Garage Rd'
      }
    ]);
    const johnId = users[0]._id;
    const janeId = users[1]._id;
    const xiaominId = users[2]._id;
    const davidId = users[6]._id;

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

    // 3. Connect to Business Event DB and seed businesses, deals, and events
    const beConn = await mongoose.createConnection(BUSINESS_EVENT_MONGO_URI).asPromise();
    console.log('Connected to Business Event Database');
    const Business = beConn.model('Business', businessSchema);
    const Deal = beConn.model('Deal', dealSchema);
    const Event = beConn.model('Event', eventSchema);

    // Clear existing data
    await Business.deleteMany({});
    await Deal.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared existing business and event data');

    // Seed Business for David
    const davidBusiness = await Business.create({
      ownerId: davidId,
      name: 'David\'s Auto Workshop',
      description: 'The best car repair service in town.',
      category: 'Automotive',
      location: '123 Garage Rd'
    });
    console.log('Seeded David\'s business');

    // Seed 3 Deals for David's Business
    await Deal.insertMany([
      {
        businessId: davidBusiness._id,
        title: 'Spring Oil Change',
        description: 'Get your car ready for spring with a fresh oil change.',
        discount: '20%',
        validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        businessId: davidBusiness._id,
        title: 'Tire Rotation',
        description: 'Free tire rotation with any major service.',
        discount: 'Free',
        validUntil: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        businessId: davidBusiness._id,
        title: 'Brake Check',
        description: 'Complimentary brake inspection for new customers.',
        discount: '100% off Inspection',
        validUntil: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Seeded 3 deals for David\'s business');

    // Seed 2 Events for Community Owner (jane)
    await Event.insertMany([
      {
        organizerId: janeId,
        title: 'Community Town Hall',
        description: 'Discuss upcoming community projects and security improvements.',
        category: 'Meetings',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        location: 'Community Center',
        volunteersNeeded: 2,
        volunteerInterests: ['organization', 'public speaking']
      },
      {
        organizerId: janeId,
        title: 'Local Food Festival',
        description: 'Celebrate local flavors with music and fun activities.',
        category: 'Social',
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        location: 'Main St Square',
        volunteersNeeded: 5,
        volunteerInterests: ['cooking', 'hospitality', 'security']
      }
    ]);
    console.log('Seeded 2 events for Community Organizer (Jane)');

    await beConn.close();

    console.log('Seeding completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
