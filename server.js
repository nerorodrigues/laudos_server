const { ConfigServer, ConfigureSubscriptionServer } = require('./config');
const { createServer } = require('http');

const app_port = process.env.PORT || "3000";
const launchServer = async(port) => {
    var app = await ConfigServer();

    var server = createServer(app);
    return new Promise((resolve, reject) => {
        server.listen(port, err => (err ? reject(err) : resolve({ server, port })));
    })
}

launchServer(app_port).then(({ server, port }) => {
    console.log('Running server on ' + port);
    ConfigureSubscriptionServer(server).then(() => {
        console.log('Subscription Server Started on port');
    });
});