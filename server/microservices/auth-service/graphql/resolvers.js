// // server/microservices/auth-service/graphql/resolvers.js
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// import bcrypt from 'bcrypt';
// import { config } from '../config/config.js'; // Use default import
// //
// //
// const resolvers = {
//     //
//     Query: {
//         currentUser: async (_, __, context) => {
//             console.log("🔍 Debugging context:", context);  // Debugging
//             const { req } = context;

//             if (!req || !req.cookies) {  // Ensure `req` exists
//                 console.log("Request object is missing!");
//                 return null;
//             }

//             const token = req.cookies.token;
//             if (!token) {
//                 console.log("Request req.cookies.token: null!");
//                 return null;  // No user is logged in
//             }

//             try {
//                 console.log("JWT_SECRET in resolvers.js:", config.JWT_SECRET);
//                 const decoded = jwt.verify(token, config.JWT_SECRET);
//                 const user = await User.findOne({ username: decoded.username });
//                 if (!user) return null;
//                 return {
//                     // id: user._id.toString(),
//                     username: user.username,
//                     // email: user.email,
//                     // role: user.role,
//                     // createdAt: user.createdAt.toISOString(),
//                 };
//             } catch (error) {
//                 console.error("Error verifying token:", error);
//                 return null;
//             }
//         },
//     },

//     //
//     Mutation: {
//         //
//         login: async (_, { username, password }, { res }) => {
//             const user = await User.findOne({ username });
//             if (!user) {
//                 throw new Error('User not found');
//             }

//             const match = await user.comparePassword(password);
//             if (!match) {
//                 throw new Error('Invalid password');
//             }

//             const token = jwt.sign({ username, id: user._id.toString() }, config.JWT_SECRET, { expiresIn: '1d' });

//             //Ensure cookie is set with the correct attributes
//             res.cookie('token', token, {
//                 httpOnly: true, // Prevents JavaScript access
//                 //secure: false,  // Change to true for HTTPS
//                 //sameSite: 'None', // Use 'None' if different origins
//                 maxAge: 24 * 60 * 60 * 1000, // 1 day
//             });
//             console.log("✅ Cookie set in response:", res.getHeaders()['set-cookie']);

//             return true;
//         },

//         register: async (_, { username, email, password, role }) => {
//             const existingUser = await User.findOne({ $or: [{ username }, { email }] });
//             if (existingUser) {
//                 throw new Error('Username or email is already taken');
//             }
//             // Password hashing is handled by the pre-save hook in the User model
//             const newUser = new User({ username, email, password, role });
//             await newUser.save();
//             return true;
//         },

//         logout: (_, __, { res }) => {
//             res.clearCookie('token');
//             return true;
//         },
//     },
// };

// export default resolvers;

// server/microservices/auth-service/graphql/resolvers.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/config.js';

const resolvers = {
    User: {
        __resolveReference: async (userReference) => {
            return await User.findById(userReference.id);
        },
    },
    Query: {
        currentUser: async (_, __, context) => {
            console.log('🔍 Debugging context:', context);

            const { req } = context;

            if (!req) {
                console.log('❌ Request object is missing!');
                return null;
            }

            if (!req.cookies) {
                console.log('❌ req.cookies is missing!');
                return null;
            }

            console.log('🔍 Auth Microservice: Checking request cookies:', req.cookies);

            const token = req.cookies.token;
            if (!token) {
                console.log('❌ Request req.cookies.token: null!');
                return null;
            }

            try {
                console.log('JWT_SECRET in resolvers.js:', config.JWT_SECRET);

                const decoded = jwt.verify(token, config.JWT_SECRET);
                console.log('✅ Decoded token:', decoded);

                const user = await User.findById(decoded.id);
                if (!user) {
                    console.log('❌ User not found!');
                    return null;
                }

                return user;
            } catch (error) {
                console.error('❌ Error verifying token:', error);
                return null;
            }
        },
    },

    Mutation: {
        login: async (_, { username, password }, { res }) => {
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('User not found');
            }

            const match = await user.comparePassword(password);
            if (!match) {
                throw new Error('Invalid password');
            }

            const token = jwt.sign(
                { username, id: user._id.toString() },
                config.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: false, // use true only with HTTPS
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });

            console.log('✅ Cookie set in auth-service response:', res.getHeaders()['set-cookie']);

            return true;
        },

        register: async (_, { username, email, password, role, interests, location }) => {
            const existingUser = await User.findOne({
                $or: [{ username }, { email }],
            });

            if (existingUser) {
                throw new Error('Username or email is already taken');
            }

            const newUser = new User({ username, email, password, role, interests, location });
            await newUser.save();
            return true;
        },

        updateUserProfile: async (_, { interests, location }, { user }) => {
            if (!user) throw new Error('Not authenticated');
            
            const updatedUser = await User.findByIdAndUpdate(
                user.id,
                { $set: { interests, location } },
                { new: true }
            );
            return updatedUser;
        },

        logout: (_, __, { res }) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
            });

            return true;
        },
    },
};

export default resolvers;