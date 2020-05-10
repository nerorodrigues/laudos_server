const fs = require('fs');
const { ObjectID, GridFSBucket } = require('mongodb')
module.exports = {
    configureDownloadService: (expressServer, dbClient) => {
        expressServer.get('/download', async (req, res) => {
            var fileCollection;
            var chunksCollection;
            var bucket
            var objectID = new ObjectID(req.query.id);
            if (req.query.download === 'exame') {
                fileCollection = await dbClient.collection('exames.files');
                chunksCollection = await dbClient.collection('exames.chunks');
                bucket = new GridFSBucket(dbClient, {
                    bucketName: 'exames'
                });
            } else {
                fileCollection = await dbClient.collection('laudos.files');
                chunksCollection = await dbClient.collection('laudos.chunks');
                bucket = new GridFSBucket(dbClient, {
                    bucketName: 'laudos'
                });
            }
            var fileInfo = await fileCollection.findOne({ _id: objectID })
            var stream = bucket.openDownloadStream(objectID);
            if (fileInfo) {
                res.set('Content-Disposition', `attachment; filename="${fileInfo._id}${fileInfo.filename.substr(fileInfo.filename.lastIndexOf('.'))}"`);
                var chunks = chunksCollection.find({ files_id: objectID })
                // if (chunks)
                //     res.set('Content-Length', chunks.count() * 255)
            }
            stream.pipe(res);
            return res.status(200);
        });
    }

}