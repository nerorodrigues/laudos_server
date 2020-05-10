//var jwt = require("jsonwebtoken");
const { Auth } = require('../../../lib/index');


module.exports = {
  resolver: {
    Mutation: {
      signIn: async (root, { userName, password }, { dbClient }, props,d,x) => {
        var user = await dbClient.collection("user").findOne({ userName: userName });
        if(!user)
          throw new Error("Nome do usuário ou senha inválidos.");
        var tokenJWT = Auth.authenticate({ userName: user.userName, role: 'SYSTEM_ADMIN' }, {
          expiresIn: "12h"
        });

        var tokenCollection = await dbClient.collection('activeTokens');
        if (!tokenCollection)
          tokenCollection = await dbClient.createCollection("activeTokens")

        var token = await tokenCollection.insertOne({
          userID: user._id,
          token: tokenJWT
        });


        return {
          token: tokenJWT
        };
      }
    }
  }
};
