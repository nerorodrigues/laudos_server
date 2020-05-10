var auth = require('./auth');
var graphQL = require('./graphQL');
var downloadEndPoint = require('./upload');
module.exports = {
    Auth: auth,
    GraphQL: graphQL,
    ConfigDownloadEndpoint: downloadEndPoint
}