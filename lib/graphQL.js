const { ApolloServer } = require('apollo-server-express');
const IsLoggedIn = require('../graphql/directives/isLoggedIn');
const getSchema = require("../graphql");
const bodyParser = require("body-parser");
const { configureAuthenticationMiddleware, configureAuthRoute } = require('./auth');
const cookieParser = require('cookie-parser');



module.exports = {
    registerGraphQL: async (expressServer, graphQLPath, dbClient, corsOptions, useAuthentication) => {
        const { schema, resolver } = await getSchema('graphql/schemas');

        expressServer.use(cookieParser());

        var apollo = new ApolloServer({
            typeDefs: schema,
            resolvers: resolver,
            schemaDirectives: {
                isLoggedIn: IsLoggedIn
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