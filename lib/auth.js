const jwt = require('express-jwt');
const jsonWebToken = require('jsonwebtoken');
const crypto = require('crypto')
const fs = require('fs');
const { ObjectID } = require('mongodb')

const privateKEY = fs.readFileSync('private.key', 'utf8');
const publicKEY = fs.readFileSync('public.key', 'utf8');

const isRevokedCallback = function (req, payload, done) {
    return done(null, false);
}

const verifyJsonWebToken = (token) => {
    return jsonWebToken.verify(token, publicKEY, jsonWebTokenOptions);
}

const jsonWebTokenOptions = {
    algorithm: 'RS256',
    issuer: 'laudos',
};

const configureAuthenticationMiddleware = (expressServer, path, credentialsRequired = false) => {
    var auth = new jwt({
        secret: publicKEY,
        credentialsRequired,
        getToken: (req) => req.headers.authorization || ''
    });

    expressServer.use(path, auth);
};

module.exports = {
    configureAuthenticationMiddleware,
    authenticate: (payload, authenticateOptions) => {
        var options = {
            ...jsonWebTokenOptions,
            ...authenticateOptions
        };

        return jsonWebToken.sign(payload, privateKEY, options);
    },
    verifyToken: (authToken) => verifyJsonWebToken(authToken),
    configureAuthRoute: (expressServer, dbClient) => {

        // configureAuthenticationMiddleware(expressServer, '/logoff', true);

        // expressServer.post('/logoff', async (req, res) => {
        //     res.cookie('authToken', '', {
        //         expires: new Date(Date.now() + 1),
        //     }).send({ sucess: true });
        // });

        expressServer.post('/auth', async (req, res, next) => {
            var result = {};
            try {
                var hash = crypto.createHash('sha256');
                var { userName, password } = req.body;

                if (!userName || !password)
                    throw new Error('Nome do usuário e senha devem ser informados');

                var cryptPassword = hash.update(password).digest('hex');
                var user = await dbClient.collection('user').findOne({ userName: userName, password: cryptPassword });

                if (!user)
                    throw new Error("Nome do usuário ou senha inválidos.");

                var roles = await dbClient.collection('roles').find({ schema: user.schema }).toArray();
                roles = roles.map(pX => { return { id: pX.roleID, name: pX.name } });

                var token = jsonWebToken.sign({
                    id: user._id,
                    userName: user.userName,
                    schema: { name: user.schema, roles: roles },
                    companyId: user.companyId
                }, privateKEY, {
                    algorithm: 'RS256',
                    issuer: 'laudos',
                    expiresIn: "9h"
                });

                res.send({ token: token });
            } catch (error) {
                res.status(403);
                next(error);
            }
        });

        configureAuthenticationMiddleware(expressServer, '/changepassword', true);

        expressServer.post('/changepassword', async (req, res, next) => {
            try {
                var { userID, oldPassword, newPassword } = req.body;
                var cryptPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');
                var user = await dbClient.collection('user').findOne({ _id: new ObjectID(req.user.id) });
                if (!user || user.password !== cryptPassword)
                    throw Error('Error');
                cryptPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
                await dbClient.collection('user').updateOne({ _id: new ObjectID(req.user.id) }, { $set: { password: cryptPassword } });
                res.send();
            } catch (error) {
                next(error);
            }
        });
    }

}
