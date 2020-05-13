const jwt = require('express-jwt');
const jsonWebToken = require('jsonwebtoken');
const crypto = require('crypto')
const fs = require('fs');

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
        getToken: (req) => {
            var token = req.cookies['authToken'];
            if (token && jsonWebToken.verify(token, publicKEY, jsonWebTokenOptions))
                return token;
            return null;
        }
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
    verifyToken: (authToken) => this.verifyJsonWebToken(authToken),
    configureAuthRoute: (expressServer, dbClient) => {

        configureAuthenticationMiddleware(expressServer, '/logoff', true);

        expressServer.post('/logoff', async (req, res) => {
            res.cookie('authToken', '', {
                expires: new Date(Date.now() + 1),
            }).send({ sucess: true });
        });

        expressServer.post('/login', async (req, res) => {
            var hash = crypto.createHash('sha256');
            var { userName, password } = req.body;
            var cryptPassword = hash.update(password).digest('hex');
            var user = await dbClient.collection('user').findOne({ userName: userName, password: cryptPassword });
            if (!user)
                throw new Error("Nome do usuário ou senha inválidos.");
            var token = jsonWebToken.sign({ userName: user.userName, role: user.role }, privateKEY, {
                algorithm: 'RS256',
                issuer: 'laudos',
                expiresIn: "12h"
            });

            res.cookie('authToken', token, {
                httpOnly: true,
                expires: new Date(Date.now() + 900000),
            });

            res.send({ sucess: true });
        })
    }

}
