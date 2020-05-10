module.exports = {
    resolver: {
        Mutation: {
            saveClient: async (root, { client }, { user, dbClient }) => {
                var clientCollection = dbClient.collection('cliente');
                let result;
                if (!client.id)
                    result = await clientCollection.insertOne({
                        nome: client.nome,
                        cidade: client.cidade,
                        estado: client.estado,
                        telefone: client.telefone,
                        ativo: client.ativo
                    });
                else {
                    var todos = await clientCollection.find();
                    var clientResult = await clientCollection.findOne({ _id: client.id });
                    if (!client)
                        throw new Error('Não existe registro com o código informado.');
                    result = await clientCollection.updateOne({ _id: client.id },
                        {
                            $set: {
                                nome: client.nome,
                                cidade: client.cidade,
                                estado: client.estado,
                                telefone: client.telefone,
                                ativo: client.ativo
                            }
                        });
                }
                client.id = result.insertedId;
                return client;
            }
        }
    }
}