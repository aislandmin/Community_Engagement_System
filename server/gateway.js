// server/gateway.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import {
    ApolloGateway,
    IntrospectAndCompose,
    RemoteGraphQLDataSource,
} from '@apollo/gateway';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
    cors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://127.0.0.1:3204'],
        credentials: true,
    })
);

app.use(cookieParser());

async function startServer() {
    let serverStarted = false;
    let retryCount = 0;
    const maxRetries = 10;

    while (!serverStarted && retryCount < maxRetries) {
        try {
            console.log(`Starting Gateway (Attempt ${retryCount + 1})...`);

            const gateway = new ApolloGateway({
                supergraphSdl: new IntrospectAndCompose({
                    subgraphs: [
                        { name: 'auth', url: 'http://localhost:4001/graphql' },
                        { name: 'community', url: 'http://localhost:4003/graphql' },
                        { name: 'business', url: 'http://localhost:4004/graphql' },
                        { name: 'ai', url: 'http://localhost:4005/graphql' },
                    ],
                }),

                buildService({ name, url }) {
                    return new RemoteGraphQLDataSource({
                        url,
                        willSendRequest({ request, context }) {
                            const cookieHeader = context.req?.headers?.cookie;
                            if (cookieHeader) {
                                request.http.headers.set('cookie', cookieHeader);
                            }
                        },
                        didReceiveResponse({ response, context }) {
                            const setCookie = response.http?.headers?.get('set-cookie');
                            if (setCookie && context.res) {
                                context.res.setHeader('set-cookie', setCookie);
                            }
                            return response;
                        },
                    });
                },
            });

            const server = new ApolloServer({
                gateway,
            });

            await server.start();

            app.use(
                '/graphql',
                expressMiddleware(server, {
                    context: async ({ req, res }) => ({ req, res }),
                })
            );

            app.listen(4000, () => {
                console.log('API Gateway ready at http://localhost:4000/graphql');
            });

            serverStarted = true;
            } catch (error) {
            retryCount++;
            console.error(`Gateway failed to start (Attempt ${retryCount}):`);
            console.error(error.message);
            if (error.details) {
                console.error('Error Details:', JSON.stringify(error.details, null, 2));
            }
            console.error(`Retrying in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            }
            }

            if (!serverStarted) {
            console.error('Critical Error: Gateway failed to start after multiple attempts.');
            process.exit(1);
            }
            }


startServer();
