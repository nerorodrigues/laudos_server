const { ObjectID } = require("mongodb");
module.exports = {
    resolver: {
        Query: {
            getCompanies: async (root, args, { user, dbClient }) => {
                var companyCollection = dbClient.collection('company');
                var companies = await companyCollection.find({ $and: [{ parentId: new ObjectID(user.companyId) }, { status: true }] }).toArray();
                return companies.map(company => {
                    return {
                        id: company._id,
                        name: company.name,
                        city: company.city,
                        state: company.state,
                        status: company.status,
                    }
                });
            }
        },
        Mutation: {
            saveCompany: async (root, { company }, { user, dbClient }) => {
                var companyCollection = dbClient.collection('company');
                let result;
                if (!company.id) {
                    result = await companyCollection.insertOne({
                        name: company.name,
                        city: company.city,
                        state: company.state,
                        status: company.status,
                        parentId: user.companyId
                    });
                    company.id = result.insertedId;
                }
                else {
                    var companyResult = await companyCollection.findOne({
                        $and: [{ _id: new ObjectID(client.id) },
                        { parentId: new ObjectID(user.companyId) },
                        { status: true }]
                    });
                    if (!companyResult)
                        throw new Error('Não existe registro com o código informado.');
                    result = await companyCollection.updateOne({ _id: client.id },
                        {
                            $set: {
                                name: company.name,
                                city: company.city,
                                state: company.state,      
                                status: company.status
                            }
                        });
                }
                return company;
            }
        }
    }
}