const MongoDB = require('mongodb');
const crypto = require('crypto')
//laudos_admin
//F3tRwB1R9OmBT1aQ
//const url = 'mongodb://admin:syslaudos@localhost/admin';
//const url_server = 'mongodb://laudos_admin:F3tRwB1R9OmBT1aQ@laudocluster-shard-00-00-f8ccz.azure.mongodb.net:27017/test?replicaSet=LaudoCluster-shard-0&ssl=true&authSource=admin'
const url = process.env.MongoDbConn || 'mongodb://admin:syslaudos@localhost/admin';

const operations = [
  { codigo: 1, nome: 'EXAME_UPLOAD' },
  { codigo: 2, nome: 'LAUDO_UPLOAD' },
  { codigo: 3, nome: 'RELACAO_CLINICAS' },
  { codigo: 4, nome: 'ADICIONAR_USUARIOS' },
  { codigo: 6, nome: 'CONSULTAR_USUARIOS' },
  { codigo: 4, nome: 'ADICIONAR_CLIENTES' },
  { codigo: 6, nome: 'CONSULTAR_CLIENTES' },
]
// const schemas = [
//   {
//     name: 'SYSTEM_ADMIN',
//     roles: [
//       operations[3],
//       operations[4],
//       operations[5],
//       operations[6],
//     ]
//   },
//   {
//     name: 'ADMIN',
//     roles: [
//       operations[1],
//       operations[2],
//     ]
//   },
//   {
//     name: 'ADMIN',
//     roles: [
//       operations[1],
//       operations[2],
//     ]
//   }
// ]

// const createPermissions = async (db) => {
//   var operationCollection = db.collection('roles');

// }

const InsertUserIfNotExists = async (collection, userName, password, schema, parentId) => {
  var user = await collection.findOne({ userName: userName });
  if (!user) {
    user = await collection.insertOne({
      userName: userName,
      schema: schema,
      parent: parentId,
      password: crypto.createHash('sha256').update(password).digest('hex'),
    });
  }
  return user._id || user.insertedId;
}

const CreateDatabase = async () => {
  var client = await MongoDB.connect(url, { useUnifiedTopology: true });
  var db = client.db('laudos');

  var userCollection = db.collection('user');

  var adminID = await InsertUserIfNotExists(userCollection, 'admin', '123456', 'SYSTEM_ADMIN', null);
  var marcusID = await InsertUserIfNotExists(userCollection, 'marcus', '123456', 'ADMIN', adminID);
   await InsertUserIfNotExists(userCollection, 'clinica', '123456', 'USER', marcusID);

  return db;
};

module.exports = { CreateDatabase };
