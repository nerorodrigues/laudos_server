const path = require('path');
const express = require("express");

const { CreateDatabase } = require("./db");
const { GraphQL, ConfigDownloadEndpoint } = require('./lib');
const cors = require('cors')
const session = require('express-session')

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
}
const ConfigServer = async () => {
  var app = express();
  
  var db = await CreateDatabase();
  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }))

  var middleware = await GraphQL.registerGraphQL(app, '/graphql', db, corsOptions, true);

  ConfigDownloadEndpoint.configureDownloadService(middleware, db);

  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  return app;
};

module.exports = { ConfigServer };
