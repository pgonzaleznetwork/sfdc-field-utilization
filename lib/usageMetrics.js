let {restAPI} = require('sfdc-happy-api')();

async function usageMetrics(connection,object,field){

    let restApi = restAPI(connection,logError);

    let countQuery = `select count(id) from ${object}`;
    let countResult = await restApi.query({query:countQuery});
    let totalRecords = countResult.records[0]['expr0'];

    let recordTypeQuery = `select developername from recordtype where SobjectType = '${object}'`;
    let recordTypeResult = await restApi.query({query:recordTypeQuery});

    let hasRecordTypes = recordTypeResult.records.length > 0;

    let metrics = {};
    metrics.field = `${object}.${field}`;
    metrics.totalRecordsPopulated = 0;
    metrics.totalRecords = totalRecords;
    metrics.recordTypeCount = {};

    if(hasRecordTypes){

        await Promise.all(

            recordTypeResult.records.map(async (recordType) => {
            
                let recordsQuery = `SELECT count(id) FROM ${object} WHERE ${field} != null AND RecordType.DeveloperName = '${recordType.DeveloperName}'`;
              
                let recordsResult = await restApi.query({query:recordsQuery});
                let totalRecords = recordsResult.records[0]['expr0'];
                
    
                metrics.totalRecordsPopulated += totalRecords;
                metrics.recordTypeCount[recordType.DeveloperName] = totalRecords;
    
                return null;
            })
        );
    }
    else{

        let recordsQuery = `SELECT COUNT(Id) FROM ${object} WHERE ${field} != null`;
        let recordsResult = await restApi.query({query:recordsQuery});

        let totalRecords = recordsResult.records[0]['expr0'];

        metrics.recordTypeCount.master = totalRecords;
        metrics.totalRecordsPopulated = totalRecords;
    }

    metrics.percentagePopulated = Math.round((metrics.totalRecordsPopulated*100)/metrics.totalRecords);

    return metrics;
}


function logError(error,params){
    console.log(error,params);
}

module.exports = usageMetrics;