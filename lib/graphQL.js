const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');
const IsLoggedIn = require('../graphql/directives/isLoggedIn');
const getSchema = require("../graphql");
const bodyParser = require("body-parser");
const { configureAuthenticationMiddleware, configureAuthRoute } = require('./auth');
const cookieParser = require('cookie-parser');
// const { makeExecutableSchema } = require('graphql-tools')
const { SubscriptionServer } = require('subscriptions-transport-ws')
const { subscribe, execute } = require('graphql')

module.exports = {
    createSchema: async() => {
        const { schema, resolver } = await getSchema('graphql/schemas');
        return makeExecutableSchema({
            typeDefs: schema,
            resolvers: resolver,
            schemaDirectives: {
                isLoggedIn: IsLoggedIn
            }
        });
    },
    configureSubscriptionServer: async(server, schema) => {
        return new SubscriptionServer({
            execute,
            subscribe,
            schema
        }, {
            server: server,
            path: '/subscriptions',
        });
    },
    registerGraphQL: async(expressServer, graphQLPath, dbClient, corsOptions, useAuthentication, schema) => {
        // const { schema, resolver } = await getSchema('graphql/schemas');
        expressServer.use(cookieParser());

        var apollo = new ApolloServer({
            // typeDefs: schema,
            // resolvers: resolver,
            // schemaDirectives: {
            //     isLoggedIn: IsLoggedIn
            // },
            schema,
            subscriptions: {
                onConnect: (connectionParams, webSocket) => {
                    console.log(connectionParams);
                    if (connectionParams.authToken) {
                        return true;
                    }
                }
            },
            context: ({ req }) => {
                return {
                    user: req.user,
                    dbClient
                }
            }
        });

        if (useAuthentication) {
            configureAuthRoute(expressServer, dbClient);
            configureAuthenticationMiddleware(expressServer, graphQLPath);
        }
        apollo.applyMiddleware({
            app: expressServer,
            path: graphQLPath,
            cors: corsOptions,
            bodyParserConfig: bodyParser.json(),
        });
        apollo.uploadsConfig = {
            maxFiles: 1
        }

        return expressServer;
    }


}