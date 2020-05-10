const MongoDB = require("mongodb");
const crypto = require('crypto')
//laudos_admin
//F3tRwB1R9OmBT1aQ
const url = "mongodb://admin:syslaudos@localhost/admin";
const url_server = 'mongodb://laudos_admin:F3tRwB1R9OmBT1aQ@laudocluster-shard-00-00-f8ccz.azure.mongodb.net:27017/test?replicaSet=LaudoCluster-shard-0&ssl=true&authSource=admin'
const hash = crypto.createHash('sha256');

const CreateDatabase = async () => {
  var client = await MongoDB.connect(url_server, { useUnifiedTopology: true });
  var db = client.db("laudos");

  var userCollection = db.collection("user");

  var exameCollection = db.collection('exames');
  if (exameCollection == null) {
    await db.createCollection('exames');
  }

  var admin = await userCollection.findOne({ userName: "admin" });
  if (!admin) {
    userCollection.insertOne({ userName: "admin", password: hash.update('123456').digest('hex') });
  }

  return db;
};

module.exports = { CreateDatabase };
