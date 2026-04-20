// // server/gateway.js
// //
// import dotenv from 'dotenv';
// dotenv.config();
// import express from 'express';
// import { ApolloServer } from '@apollo/server';
// import { expressMiddleware } from '@apollo/server/express4';
// import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// //

// const app = express();

// // ✅ Fix: Add middleware to parse JSON requests
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Enable CORS and Cookie Parsing
// app.use(cors({
//     origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
//     credentials: true,
// }));
// app.use(cookieParser());

// // Configure the Apollo Gateway for microservices
// const gateway = new ApolloGateway({
//     supergraphSdl: new IntrospectAndCompose({
//         subgraphs: [
//             { name: 'auth', url: 'http://localhost:4001/graphql' },
//             { name: 'community', url: 'http://localhost:4003/graphql' },
//         ],
//     }),
//     buildService({ name, url }) {
//         return new RemoteGraphQLDataSource({
//             url,
//             willSendRequest({ request, context }) {
//                 // Pass the cookie header from the gateway to the subgraph
//                 if (context.req && context.req.headers.cookie) {
//                     request.http.headers.set('cookie', context.req.headers.cookie);
//                 }
//             },
//         });
//     },
// });

// // Initialize Apollo Server
// const server = new ApolloServer({
//     gateway,
//     introspection: true,
// });

// async function startServer() {
//     await server.start();

//     // Apply Express middleware for Apollo Server
//     app.use('/graphql', expressMiddleware(server, {
//         context: async ({ req, res }) => ({ req, res }),
//     }));

//     // Start Express server
//     app.listen(4000, () => {
//         console.log(`🚀 API Gateway ready at http://localhost:4000/graphql`);
//     });
// }

// startServer();

// server/gateway.js
// import dotenv from 'dotenv';
// dotenv.config();

// import express from 'express';
// import { ApolloServer } from '@apollo/server';
// import { expressMiddleware } from '@apollo/server/express4';
// import {
//     ApolloGateway,
//     IntrospectAndCompose,
//     RemoteGraphQLDataSource,
// } from '@apollo/gateway';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';

// const app = express();

// // Parse request bodies
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Enable CORS and cookie parsing
// app.use(
//     cors({
//         origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
//         credentials: true,
//     })
// );
// app.use(cookieParser());

// // Configure Apollo Gateway
// const gateway = new ApolloGateway({
//     supergraphSdl: new IntrospectAndCompose({
//         subgraphs: [
//             { name: 'auth', url: 'http://localhost:4001/graphql' },
//             { name: 'community', url: 'http://localhost:4003/graphql' },
//         ],
//     }),

//     buildService({ name, url }) {
//         return new RemoteGraphQLDataSource({
//             url,

//             willSendRequest({ request, context }) {
//                 // Forward browser cookies from gateway -> subgraph
//                 if (context.req?.headers?.cookie) {
//                     request.http.headers.set('cookie', context.req.headers.cookie);
//                     console.log(`➡️ Forwarding cookie to ${name} subgraph:`, context.req.headers.cookie);
//                 }
//             },

//             didReceiveResponse({ response, context }) {
//                 // Forward Set-Cookie from subgraph -> browser
//                 const setCookie = response.http?.headers?.get('set-cookie');

//                 if (setCookie && context.res) {
//                     context.res.setHeader('set-cookie', setCookie);
//                     console.log(`✅ Forwarded Set-Cookie from ${name} subgraph to browser:`, setCookie);
//                 }

//                 return response;
//             },
//         });
//     },
// });

// // Initialize Apollo Server
// const server = new ApolloServer({
//     gateway,
//     introspection: true,
// });

// async function startServer() {
//     await server.start();

//     app.use(
//         '/graphql',
//         expressMiddleware(server, {
//             context: async ({ req, res }) => ({ req, res }),
//         })
//     );

//     app.listen(4000, () => {
//         console.log('🚀 API Gateway ready at http://localhost:4000/graphql');
//     });
// }

// startServer();

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
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
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