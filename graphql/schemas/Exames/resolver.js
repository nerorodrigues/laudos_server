// const path = require('path');
// const os = require('os');
// const shortid = require('shortid');
const { GridFSBucket } = require('mongodb');
const { PubSub, withFilter } = require('apollo-server-express');
const { ObjectID } = require('mongodb');

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

const SAVED_EXAM = 'SAVED_EXAM';

module.exports = {
    resolver: {
        ExamsStatus: {
            WAITING: 0,
            READY: 1
        },
        Subscription: {
            savedExam: {
                subscribe: withFilter(
                    () => pubSub.asyncIterator([SAVED_EXAM]),
                    (payload, variables) => variables.id === payload.companyId)
            }
        },
        Query: {
            listarExames: async (root, args, { user, dbClient }, info) => {
                var filter = { $and: [{ companyId: new ObjectID(user.companyId) }] };
                if (args.filter.name)
                    filter = Object.assign({}, filter, {
                        $and: Object.assign([], filter.$and, [...filter.$and, { name: args.filter.name }])
                    });
                if (args.filter.protocolNumber)
                    filter = Object.assign({}, filter, {
                        $and: Object.assign([], filter.$and, [...filter.$and, { protocolNumber: args.filter.protocolNumber }])
                    });
                if (args.filter.examDate)
                    filter = Object.assign({}, filter, {
                        $and: Object.assign([], filter.$and, [...filter.$and, { dataExame: args.filter.examDate }])
                    });
                if (args.filter.status.length > 0)
                    filter = Object.assign({}, filter, {
                        $and: Object.assign([], filter.$and, [...filter.$and, { status: { $in: args.filter.status } }])
                    });

                var exameCollection = await dbClient.collection('exames');
                if (exameCollection)
                    return exameCollection.find(filter).map(value => {
                        return {
                            id: value._id,
                            protocolo: value.protocolo,
                            nome: value.nome,
                            dataExame: value.dataExame,
                            dataCadastro: value.dataCadastro,
                            observacoes: value.observacoes,
                            possuiMarcapasso: value.possuiMarcapasso,
                            status: value.status,
                            url: `${process.env.CorsOrigin || 'http://localhost:3000'}/download?id=${value._id}&download=${value.status === 0 ? 'exame' : 'laudo'}`
                        };
                    }).toArray();
                return;
            },
            listarExamesPorCliente: async (root, args, { user, dbClient }, info) => {
                //return getExames(args.companyId, dbClient, true);
                var exameCollection = await dbClient.collection('exames');
                var filter = { $and: [{ status: 0 }] };
                var companies = [args.companyId];
                if (!args.companyId) {
                    var companyCollection = await dbClient.collection('company');
                    companies = await companyCollection.find({ parentId: new ObjectID(user.companyId) }).map(company => company._id).toArray();
                }
                filter = Object.assign({}, filter, {
                    $and: Object.assign([], filter.$and, [...filter.$and, { companyId: { $in: companies } }])
                });
                if (exameCollection)
                    return exameCollection.find(filter).map(value => {
                        return {
                            id: value._id,
                            protocolo: value.protocolo,
                            nome: value.nome,
                            dataExame: value.dataExame,
                            dataCadastro: value.dataCadastro,
                            observacoes: value.observacoes,
                            possuiMarcapasso: value.possuiMarcapasso,
                            status: value.status,
                            url: `${process.env.CorsOrigin || 'http://localhost:3000'}/download?id=${value._id}&download=${value.status === 0 ? 'exame' : 'laudo'}`
                        };
                    }).toArray();
                return;
            }
        },
        Mutation: {
            salvarExame: async (root, { exame }, { user, dbClient }) => {
                var exameCollection = dbClient.collection('exames');
                var { createReadStream, filename, mimetype, encoding } = await exame.exameFile;

                var gridFs = new GridFSBucket(dbClient, {
                    bucketName: 'exames'
                });
                let result;
                if (!exame.id)
                    result = { nome, id, protocolo, dataExame } = await exameCollection.insertOne({
                        nome: exame.nome,
                        protocolo: exame.protocolo,
                        dataExame: exame.dataExame,
                        dataCadastro: new Date().toLocaleString('pt-BR', { day: 'numeric', month: 'numeric', year: 'numeric' }),
                        clienteId: new ObjectID(user.id),
                        companyId: new ObjectID(user.companyId),
                        possuiMarcapasso: exame.possuiMarcapasso,
                        status: 0,
                        observacoes: exame.observacoes
                    });
                if (result)
                    try {
                        await new Promise((resolve, reject) => {
                            var uploadStream = gridFs.openUploadStreamWithId(result.insertedId, filename);
                            var stream = createReadStream();
                            uploadStream.on('finish', resolve);

                            uploadStream.on('error', (error) => {
                                console.log(error);
                                reject(error);
                            });
                            stream.on('error', (error) => uploadStream.destroy(error));

                            stream.pipe(uploadStream);
                        });
                    } catch (error) {
                        console.log(error);
                    }
                var examResult = {
                    id: result.insertedId,
                    nome: exame.nome,
                    protocolo: exame.protocolo,
                    dataExame: exame.dataExame,
                    dataCadastro: exame.dataCadastro,
                    possuiMarcapasso: exame.possuiMarcapasso,
                    observacoes: exame.observacoes,
                    status: 0,
                    url: `${process.env.CorsOrigin || 'http://localhost:3000'}/download?id=${value._id}&download=exame`
                };
                pubSub.publish(SAVED_EXAM, {
                    savedExam: examResult,
                    companyId: user.companyId,
                });
                return examResult;
            },
            saveExamResult: async (root, { examResult: { examResultFile, examId } }, { user, dbClient }) => {
                var exameCollection = dbClient.collection('exames');
                var { createReadStream, filename, mimetype, encoding } = await examResultFile;

                var gridFsExamResult = new GridFSBucket(dbClient, { bucketName: 'laudos' });
                var gridFsExam = new GridFSBucket(dbClient, { bucketName: 'exames' });

                var result = await exameCollection.updateOne({ _id: new ObjectID(examId) }, { $set: { status: 1 } });
                if (result) {
                    await gridFsExam.delete(new ObjectID(examId));
                    await new Promise((resolve, reject) => {
                        var uploadStream = gridFsExamResult.openUploadStreamWithId(new ObjectID(examId), filename);
                        var stream = createReadStream();
                        uploadStream.on('finish', resolve);

                        uploadStream.on('error', (error) => {
                            console.log(error);
                            reject(error);
                        });
                        stream.on('error', (error) => uploadStream.destroy(error));

                        stream.pipe(uploadStream);
                    });
                }
                return `${process.env.CorsOrigin || 'http://localhost:3000'}/download?id=${examId}&download=laudo`
            }
        }
    }
}