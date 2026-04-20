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
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
        credentials: true,
    })
);

app.use(cookieParser());

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

                console.log(` [${name}] incoming cookie from browser:`, cookieHeader || '(none)');

                if (cookieHeader) {
                    request.http.headers.set('cookie', cookieHeader);
                }
            },

            didReceiveResponse({ response, context }) {
                const setCookie = response.http?.headers?.get('set-cookie');

                console.log(`⬅️ [${name}] subgraph set-cookie:`, setCookie || '(none)');

                if (setCookie && context.res) {
                    context.res.setHeader('set-cookie', setCookie);
                    console.log(` [${name}] forwarded set-cookie to browser`);
                }

                return response;
            },
        });
    },
});

const server = new ApolloServer({
    gateway,
    introspection: true,
});

async function startServer() {
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
}

startServer();