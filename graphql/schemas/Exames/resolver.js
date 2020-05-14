// const path = require('path');
// const os = require('os');
// const shortid = require('shortid');
const { GridFSBucket } = require('mongodb');
const { PubSub } = require('apollo-server-express')

const pubSub = new PubSub();
// const { createWriteStream, unlink } = require('fs');
// const convertToBase64 = async (buffer) => {
//     return buffer.toString('Base64');
// };

// const salvarStream = async (stream, createReadStream) => {


//     var id = shortid.generate();
//     var path = `${os.tmpdir}\\${id}.tmp`;
//     var streamReader = createReadStream();

//     // // Store the file in the filesystem.
//     await new Promise((resolve, reject) => {
//         // Create a stream to which the upload will be written.
//         var writeStream = createWriteStream(path);

//         // When the upload is fully written, resolve the promise.
//         writeStream.on('finish', resolve);

//         // If there's an error writing the file, remove the partially written file
//         // and reject the promise.
//         writeStream.on('error', (error) => {
//             unlink(path, () => {
//                 reject(error);
//             });
//         });

//         // In node <= 13, errors are not automatically propagated between piped
//         // streams. If there is an error receiving the upload, destroy the write
//         // stream with the corresponding error.
//         stream.on('error', (error) => writeStream.destroy(error));

//         // Pipe the upload into the write stream.
//         stream.pipe(writeStream);
//     });

//     data = await streamReader.read(streamReader.readableHighWaterMark);
//     unlink(path, (error) => {
//         console.log(error);
//     });
//     return data;

// }

const LAUDO_SALVO = 'LAUDO_SALVO';

module.exports = {
    resolver: {
        Subscription: {
            laudoSalvo: {
                subscribe: async() => await pubSub.asyncIterator([LAUDO_SALVO])
            }
        },
        Query: {
            listarExames: async(root, args, { user, dbClient }, info) => {
                var exameCollection = await dbClient.collection('exames');

                var result;
                if (exameCollection)
                    result = await exameCollection.find().map(value => {
                        return {
                            id: value._id,
                            protocolo: value.protocolo,
                            nome: value.nome,
                            dataExame: value.dataExame,
                            dataCadastro: new Date().toLocaleString()
                        };
                    }).toArray();
                return result
            }
        },
        Mutation: {
            salvarExame: async(root, { exame }, { user, dbClient }) => {
                var exameCollection = dbClient.collection('exames');
                var { createReadStream, stream, filename, mimetype, encoding } = await exame.exameFile;

                var gridFs = new GridFSBucket(dbClient, {
                    bucketName: 'exames'
                });
                let result;
                if (!exame.id)
                    result = { nome, id, protocolo, dataExame } = await exameCollection.insertOne({
                        nome: exame.nome,
                        protocolo: exame.protocolo,
                        dataExame: exame.dataExame,
                        possuiMarcapasso: exame.possuiMarcapasso,
                        observacoes: exame.observacoes
                    });
                if (result)
                    await new Promise((resolve, reject) => {
                        var uploadStream = gridFs.openUploadStreamWithId(result.insertedId, filename);

                        uploadStream.on('finish', resolve);

                        uploadStream.on('error', (error) => {
                            console.log(error);
                            reject(error);
                        });
                        stream.on('error', (error) => uploadStream.destroy(error));

                        stream.pipe(uploadStream);
                    });
                var laudoResult = {
                    id: result.insertedId,
                    nome: exame.nome,
                    protocolo: exame.protocolo,
                    dataExame: exame.dataExame,
                    dataCadastro: exame.dataCadastro
                };
                pubSub.publish(LAUDO_SALVO, {
                    laudoSalvo: laudoResult,
                    payload: {
                        laudoSalvo: laudoResult
                    }
                });
                return laudoResult;
            }
        }
    }
}