const { ConfigServer } = require('./config');

const app_port = process.env.PORT || "3000";
const launchServer = async (port) => {
    var server = await ConfigServer();
   
    return new Promise((resolve, reject) => {
        server.listen(port, err => (err ? reject(err) : resolve({ server, port })));
    })
}

launchServer(app_port).then(({ server, port }) => {
    console.log('Running server on ' + port);
});