const path = require('path');
const express = require("express");
const { CreateDatabase } = require("./db");
const { GraphQL, ConfigDownloadEndpoint } = require('./lib');
const cors = require('cors')

const corsOptions = {
    origin: process.env.CorsOrigin || 'http://localhost:3001',
    credentials: true
}


module.exports = {
    ConfigServer: async() => {
        var app = express();

        var db = await CreateDatabase();
        app.use(cors(corsOptions));
        app.use(express.urlencoded({ extended: true }))
        var schema = await GraphQL.createSchema();

        var middleware = await GraphQL.registerGraphQL(app, '/graphql', db, corsOptions, true, schema);

        ConfigDownloadEndpoint.configureDownloadService(middleware, db);

        middleware.use(express.static(path.join(__dirname, 'public')));
        middleware.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        middleware.get('/info', (req, res) => {
            res.json(process.env);
        });

        return middleware;
    },
    ConfigureSubscriptionServer: async(server) => {
        var schema = await GraphQL.createSchema();
        return GraphQL.configureSubscriptionServer(server, schema);
    }
};