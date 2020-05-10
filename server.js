const { ConfigServer } = require('./config');
//const next = require('next');

//const dev = process.env.NODE_ENV !== 'production'
// const app = next({ dev });
// const handle = app.getRequestHandler()
const app_port = process.env.PORT || "3000";
const launchServer = async (port) => {
    var server = await ConfigServer();
    // server.get('*', (req, res) => {
    //     return handle(req, res);
    // });
    return new Promise((resolve, reject) => {
        server.listen(port, err => (err ? reject(err) : resolve({ server, port })));
    })
}

// app.prepare().then(() => {
    launchServer(app_port).then(({ server, port }) => {

        server.use('/local', (req, res) => {
            res.type('application/json');
            res.statusCode = 200;
            res.json({
                'value': 'data'
            });
        });
        console.log('Running server on ' + port);
    })
// }).catch(err => {
//     console.error(err.stack);
// });