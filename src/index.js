let usageMetrics = require('../lib/usageMetrics');

async function getUsageMetrics(connection,field){

    let [object,fieldName] = field.split('.');

    if(!object || !fieldName){
        throw new Error('Invalid field name. Must be object.Field');
    }

    let response = await usageMetrics(connection,field);
    return response;

}

module.exports = getUsageMetrics;