var auth = require('./auth');
var graphQL = require('./graphQL');
var downloadEndPoint = require('./download');
module.exports = {
    Auth: auth,
    GraphQL: graphQL,
    ConfigDownloadEndpoint: downloadEndPoint
}