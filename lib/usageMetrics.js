let {restAPI} = require('sfdc-happy-api')();

async function usageMetrics(connection,object,field){

    let metrics;

    let restApi = restAPI(connection,logError);

    let countQuery = `select count(id) from ${object}`;
    let countResult = await restApi.query({query:countQuery});
    let totalRecords = countResult.records[0]['expr0'];

    let recordTypeQuery = `select developername from recordtype where SobjectType = '${object}'`;
    let recordTypeResult = await restApi.query({query:recordTypeQuery});

    let hasRecordTypes = recordTypeResult.records.length > 0;

    if(hasRecordTypes){

        let recordsQuery = `SELECT ${field}, recordType.DeveloperName FROM ${object} WHERE ${field} != null ORDER BY RecordTypeId`;
        let recordsResult = await restApi.query({query:recordsQuery});

        let total = recordsResult.records.length;

        let recordsByRecordTypeName = new Map();

        recordsResult.records.forEach(record => {

            if(recordsByRecordTypeName.has(record.RecordType.DeveloperName)){
                recordsByRecordTypeName.get(record.RecordType.DeveloperName).add(record);
            }
            else{
                recordsByRecordTypeName.set(record.RecordType.DeveloperName,new Set());
                recordsByRecordTypeName.get(record.RecordType.DeveloperName).add(record);
            }
        });

        let stats = {};

        recordTypeResult.records.forEach(recordType => {
            stats[recordType.DeveloperName] = 0;
        })

        let totalRecordsPopulated = 0;
        
        for(let [recordType,records] of recordsByRecordTypeName){
            stats[recordType] = records.size;
            totalRecordsPopulated += records.size;
        }

        let percentagePopulated = Math.round((totalRecordsPopulated*100)/totalRecords);

        metrics = {
            field:`${object}.${field}`,
            totalRecords,
            totalRecordsPopulated,
            percentagePopulated,
            byRecordType:stats
        }

        console.log(metrics)
    }
    else{

        let recordsQuery = `SELECT Id FROM ${object} WHERE ${field} != null`;
        let recordsResult = await restApi.query({query:recordsQuery});

        let totalRecordsPopulated = recordsResult.records.length;

        let percentagePopulated = Math.round((totalRecordsPopulated*100)/totalRecords);

        metrics = {
            field:`${object}.${field}`,
            totalRecords,
            totalRecordsPopulated,
            percentagePopulated
        }
    }

    return metrics;
}


function logError(error,params){
    console.log(error,params);
}

module.exports = usageMetrics;