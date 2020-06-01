const jwt = require("jsonwebtoken");
const { ApolloServer, gql, SchemaDirectiveVisitor } = require("apollo-server-express");
const { defaultFieldResolver } = require('graphql')

class IsLoggedIn extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType);
    field._requiredAuthRole = this.args.role;
    field._requiredAuthSchema = this.args.schema;
  }

  visitSchema(schema) {
    var sch = schema;
  }

  visitObject(type) {
    ensureFieldsWrapped(type);
    type._requiredAuthRole = this.args.role;
    type._requiredAuthSchema = this.args.schema;
  }

  ensureFieldsWrapped(objectType) {
    if (objectType._authFieldsWrapped) return;
    objectType._authFieldsWrapped = true;

    Object.values(objectType.getFields()).forEach((field) => {
      const { resolve = defaultFieldResolver } = field;

      field.resolve = async function (root, args, context, ...rest) {
        var { user, dbClient } = context;

        if (!user)
          throw new Error("User not Authenticated");

        const requiredRole = objectType._requiredAuthRole || field._requiredAuthRole;

        if (!requiredRole)
          return resolve.call(this, root, args, context, ...rest);
        if (!user.schema.roles.find(value => value.name === requiredRole))
          throw new Error("Usuário não possui permissão para acessar esse recurso.");
        return resolve.call(this, root, args, context, ...rest);
      };
    });
  }
}

module.exports = IsLoggedIn;
