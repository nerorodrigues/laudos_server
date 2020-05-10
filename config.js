const express = require("express");
const { CreateDatabase } = require("./db");
const { GraphQL, ConfigDownloadEndpoint } = require('./lib');
const cors = require('cors')
const session = require('express-session')

const corsOptions = {
  origin: '*',
  credentials: true
}
const ConfigServer = async () => {
  var app = express();

  var db = await CreateDatabase();
  app.use(cors());
  app.use(express.urlencoded({ extended: true }))

  var middleware = await GraphQL.registerGraphQL(app, '/graphql', db, null /*corsOptions*/, true);

  ConfigDownloadEndpoint.configureDownloadService(middleware, db);

  app.get("/", (req, res) => {
    return res.send("Hello");
  })

  return app;
};

module.exports = { ConfigServer };
