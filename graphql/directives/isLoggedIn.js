const jwt = require("jsonwebtoken");
const { ApolloServer, gql, SchemaDirectiveVisitor } = require("apollo-server-express");
const { defaultFieldResolver } = require('graphql')

class IsLoggedIn extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.role;
  }

  visitSchema(schema){
    var sch = schema;
  }

  visitObject(type) {
    ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.requires;
  }

  ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    Object.values(objectType.getFields()).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function (root, args, context, ...rest) {
        var { user, dbClient } = context;
        const requiredAuth = objectType._requiredAuthRole || field._requiredAuthRole;
        if (!requiredAuth)
          return resolve.call(this, root, args, context, ...rest);

        if (!user || !jwt.verify(user, "nero"))
          throw new Error("User not Authenticated");



        var payload = jwt.decode(user, "nero");

        var user = dbClient.collection("user").findOne({
          userName: payload.userName
        });

        if (user.Schema != this.args.role)
          throw new Error("Not Authorized.");
        return resolve.call(this, root, args, context, ...rest);
      };
    });
  }
}

module.exports = IsLoggedIn;
