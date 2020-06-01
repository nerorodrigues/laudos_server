const MongoDB = require('mongodb');
const crypto = require('crypto')
//laudos_admin
//F3tRwB1R9OmBT1aQ
//const url = 'mongodb://admin:syslaudos@localhost/admin';
//const url_server = 'mongodb://laudos_admin:F3tRwB1R9OmBT1aQ@laudocluster-shard-00-00-f8ccz.azure.mongodb.net:27017/test?replicaSet=LaudoCluster-shard-0&ssl=true&authSource=admin'
const url = process.env.MongoDbConn || 'mongodb://admin:syslaudos@localhost/admin';

const roles = [
  { id: 1, name: 'CADASTRAR_EXAME' },
  { id: 2, name: 'LISTAR_EXAME' },
  { id: 3, name: 'BAIXAR_EXAME' },
  { id: 4, name: 'CADASTRAR_LAUDO' },
  { id: 5, name: 'BAIXAR_LAUDOS' },
  { id: 6, name: 'CADASTRAR_EMPRESA' },
  { id: 7, name: 'LISTAR_EMPRESA' },
];

const ENUM_SCHEMA = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER'
}

const schemas = [
  {
    name: ENUM_SCHEMA.SYSTEM_ADMIN,
    roles: [roles[5], roles[6]]
  },
  {
    name: ENUM_SCHEMA.ADMIN,
    roles: [roles[1], roles[2], roles[3], roles[4], roles[5], roles[6]]
  },
  {
    name: ENUM_SCHEMA.USER,
    roles: [roles[0], roles[1]]
  }
]; 0

const sysAdim =
{
  name: 'NRCL',
  city: 'Goiânia',
  state: 'Goiás',
  status: true,
  users: [
    {
      userName: 'admin',
      password: '123456',
      name: 'Administrator',
      schema: 'SYSTEM_ADMIN'
    }
  ],
  children: [
    {
      name: 'Cardio Diagnosticos',
      city: 'Goiânia',
      state: 'Goiás',
      status: true,
      users: [{
        userName: 'marcus',
        password: '123456',
        name: 'Marcus',
        schema: 'ADMIN',
      }],
      children: [
        {
          name: 'Clinica',
          city: 'Goiânia',
          state: 'Goiás',
          status: true,
          users: [{
            userName: 'clinica',
            password: '123456',
            name: 'Clínica',
            schema: 'USER'
          }]
        }
      ]
    }
  ]
}

async function createRoles(collection, schema) {
  if (schema.roles)
    await schema.roles.forEach(async (role) => {
      var schemaResult = await collection.findOne({ schema: schema.name, name: role.name })
      if (!schemaResult)
        schemaResult = await collection.insertOne({
          name: role.name,
          schema: schema.name,
          roleId: role.id
        });
    });
}

async function createCompany(companyCollection, company, userCollection, parentID) {
  var companyResult = await companyCollection.findOne({ name: company.name })
  if (!companyResult)
    companyResult = await companyCollection.insertOne({
      name: company.name,
      city: company.city,
      state: company.state,
      status: true,
      parentId: parentID
    });
  if (company.children)
    company.children.forEach(child => createCompany(companyCollection, child, userCollection, companyResult._id || companyResult.insertedId));
  if (company.users)
    company.users.forEach(user => createUser(userCollection, user, companyResult._id || companyResult.insertedId));
}

async function createUser(collection, user, companyId) {
  var userResult = await collection.findOne({ userName: user.userName })
  if (!userResult)
    userResult = await collection.insertOne({
      userName: user.userName,
      schema: user.schema,
      companyId: companyId,
      password: crypto.createHash('sha256').update(user.password).digest('hex'),
    });
}

const CreateDatabase = async () => {
  var client = await MongoDB.connect(url, { useUnifiedTopology: true });
  var db = client.db('laudos');

  var companyCollection = db.collection('company');
  var userCollection = db.collection('user');
  var rolesCollection = db.collection('roles');

  await schemas.forEach(schema => createRoles(rolesCollection, schema));
  await createCompany(companyCollection, sysAdim, userCollection);
  return db;
};

module.exports = { CreateDatabase };
