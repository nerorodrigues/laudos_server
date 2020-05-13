module.exports = {
    resolver: {
        Query: {
            getUser: (root, args, { user, dbClient }) => {
                return {
                    userName: 'adm',
                    password: '123456',
                    role: 'SYSTEM_ADMIN'
                };
            }
        },
        Mutation: {
            createUser: async(root, {userName,}, { user, dbClient }) => {
                var collection = await dbClient.collection('users');
                var result = await collection.insertOne({

                });
                return result;
            },
        }
    }
}