let {restAPI,metadataAPI} = require('sfdc-happy-api')();

async function usageMetrics(connection,object,field){

    let restApi = restAPI(connection,logError);
    let metadataApi = metadataAPI(connection,logError);

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

    let fieldDescribe = await metadataApi.readMetadata('CustomField',[`${object}.${field}`]);
    let isTextArea = fieldDescribe[0].type == 'LongTextArea'
  
    if(isTextArea && hasRecordTypes){

        await Promise.all(

            recordTypeResult.records.map(async (recordType) => {

                    let recordsQuery = `SELECT ${field} FROM ${object} WHERE RecordType.DeveloperName = '${recordType.DeveloperName}' AND CreatedDate = LAST_N_MONTHS:6 ORDER BY CreatedDate Desc LIMIT 1000`;
                    let recordsResult = await restApi.query({query:recordsQuery});
                    let countRecordsWithValue = 0;

                    recordsResult.records.forEach(record => {
                        if(record.Notes__c != null && record.Notes__c != ''){
                            countRecordsWithValue++;
                        }
                    })

                    metrics.recordTypeCount[recordType.DeveloperName] = countRecordsWithValue;
                }
            )
        )
    }

    else if(isTextArea && !hasRecordTypes){

        let recordsQuery = `SELECT ${field} FROM ${object} WHERE CreatedDate = LAST_N_MONTHS:6 ORDER BY CreatedDate Desc LIMIT 1000`;
        let recordsResult = await restApi.query({query:recordsQuery});
        let countRecordsWithValue = 0;

        recordsResult.records.forEach(record => {
            if(record.Notes__c != null && record.Notes__c != ''){
                countRecordsWithValue++;
            }
        })

        metrics.recordTypeCount[recordType.DeveloperName] = countRecordsWithValue;
    }

    else if(!isTextArea && hasRecordTypes){

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
    

    if(!isTextArea && !hasRecordTypes){


        let recordsQuery = `SELECT COUNT(Id) FROM ${object} WHERE ${field} != null`;
        let recordsResult = await restApi.query({query:recordsQuery});

        let totalRecords = recordsResult.records[0]['expr0'];

        metrics.recordTypeCount.master = totalRecords;
        metrics.totalRecordsPopulated = totalRecords;       

    }
    

    metrics.percentagePopulated = Math.round((metrics.totalRecordsPopulated*100)/metrics.totalRecords);
    if(isTextArea){
        metrics.note = `The ${object}.${field} custom field is of type text area (which cannot be used to filter a SOQL query), so its usage was calculating by querying 1000 records by record type, created in the past 6 months`;
    }

    return metrics;
}


function logError(error,params){
    console.log(error,params);
}

module.exports = usageMetrics;