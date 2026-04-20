import dotenv from 'dotenv';
dotenv.config();

import { parse } from 'graphql';
import { config } from './config/config.js';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import connectDB from './config/mongoose.js';
import typeDefs from './graphql/typeDefs.js';
import resolvers from './graphql/resolvers.js';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

connectDB();

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('⚡ User connected for business updates:', socket.id);
});

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:4000'],
    credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const schema = buildSubgraphSchema([{ typeDefs: parse(typeDefs), resolvers }]);

const server = new ApolloServer({
    schema,
    introspection: true,
});

async function startServer() {
    await server.start();
    
    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req, res }) => {
            const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
            let user = null;
            if (token) {
                try {
                    const decoded = jwt.verify(token, config.JWT_SECRET);
                    user = { id: decoded.id, username: decoded.username };
                } catch (error) {
                    console.error("🚨 Token verification failed in Business Service:", error);
                }
            }
            return { user, req, res, io };
        }
    }));

    httpServer.listen(config.port, () => console.log(`🚀 Business & Event Service (Real-time enabled) running at http://localhost:${config.port}/graphql`));
}

startServer();
