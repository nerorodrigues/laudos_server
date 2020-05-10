const schemaglue = require('schemaglue')

const getSchemas = async (path) => {
    return await schemaglue(path);
}

module.exports = getSchemas;