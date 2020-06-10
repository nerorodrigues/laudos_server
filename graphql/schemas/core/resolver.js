const { PubSub } = require('apollo-server-express')

const pubSub = new PubSub();
module.exports = {
    resolver: {
        Subscription: {
            test: {
                subscribe: () => pubSub.asyncIterator('TESTE')
            }
        },
        Mutation: {
            testMutation: async (root, args, context) => {
                pubSub.publish('TESTE', { test: 'TESTE SUBSCRIPTION' });
                return 'TESTE Mutation';
            }
        },
        Query: {
            test: () => 'Test Query'
        }
    }
}