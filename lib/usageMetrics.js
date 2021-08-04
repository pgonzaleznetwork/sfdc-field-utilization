let {restAPI,metadataAPI} = require('sfdc-happy-api')();

async function usageMetrics(connection,field){

    let [object,fieldName] = field.split('.');

    let restApi = restAPI(connection,logError);
    let metadataApi = metadataAPI(connection,logError);

    let countQuery = `select count(id) from ${object}`;
    let countResult = await restApi.query({query:countQuery});
    let totalRecordsCount = countResult.records[0]['expr0'];

    let recordTypeQuery = `select developername from recordtype where SobjectType = '${object}'`;
    let recordTypeResult = await restApi.query({query:recordTypeQuery});

    let hasRecordTypes = recordTypeResult.records.length > 0;

    let metrics = {
        field,
        object,
        totalRecordsPopulated:0,
        totalRecords:totalRecordsCount,
        recordTypeCount:{}
    };


    let fieldDescribe = await metadataApi.readMetadata('CustomField',[field]);
    let isTextArea = fieldDescribe[0].type == 'LongTextArea'
  
    if(isTextArea && hasRecordTypes){

        let localTotalRecordsWithValue = 0;

        await Promise.all(

            recordTypeResult.records.map(async (recordType) => {

                    let recordsQuery = `SELECT ${fieldName} FROM ${object} WHERE RecordType.DeveloperName = '${recordType.DeveloperName}' AND CreatedDate = LAST_N_MONTHS:6 ORDER BY CreatedDate Desc LIMIT 1000`;
                    let recordsResult = await restApi.query({query:recordsQuery});
                    let countRecordsWithValue = 0;

                    recordsResult.records.forEach(record => {
                        if(record[fieldName] != null && record[fieldName] != ''){
                            countRecordsWithValue++;
                            localTotalRecordsWithValue++;
                        }
                    })

                    metrics.recordTypeCount[recordType.DeveloperName] = countRecordsWithValue;
                }
            )
        )

        metrics.recordTypeCount.populated = localTotalRecordsWithValue;
        metrics.recordTypeCount.empty = totalRecordsCount - localTotalRecordsWithValue;
        metrics.totalRecordsPopulated = localTotalRecordsWithValue;   
    }

    else if(isTextArea && !hasRecordTypes){

        let recordsQuery = `SELECT ${fieldName} FROM ${object} WHERE CreatedDate = LAST_N_MONTHS:6 ORDER BY CreatedDate Desc LIMIT 1000`;
        let recordsResult = await restApi.query({query:recordsQuery});
        let countRecordsWithValue = 0;

        recordsResult.records.forEach(record => {
            if(record[fieldName] != null && record[fieldName] != ''){
                countRecordsWithValue++;
            }
        })

        metrics.recordTypeCount.populated = countRecordsWithValue;
        metrics.recordTypeCount.empty = totalRecordsCount - countRecordsWithValue;
        metrics.totalRecordsPopulated = countRecordsWithValue;   

    }

    else if(!isTextArea && hasRecordTypes){

        await Promise.all(

            recordTypeResult.records.map(async (recordType) => {
            
                let recordsQuery = `SELECT count(id) FROM ${object} WHERE ${fieldName} != null AND RecordType.DeveloperName = '${recordType.DeveloperName}'`;
                let recordsResult = await restApi.query({query:recordsQuery});
                let countRecordsWithValue = recordsResult.records[0]['expr0'];
    
                metrics.totalRecordsPopulated += countRecordsWithValue;
                metrics.recordTypeCount[recordType.DeveloperName] = countRecordsWithValue;
    
                return null;
            })
        );

        metrics.recordTypeCount.empty = totalRecordsCount - metrics.totalRecordsPopulated;
    }
    

    if(!isTextArea && !hasRecordTypes){


        let recordsQuery = `SELECT COUNT(Id) FROM ${object} WHERE ${fieldName} != null`;
        let recordsResult = await restApi.query({query:recordsQuery});

        let countRecordsWithValue = recordsResult.records[0]['expr0'];

        metrics.recordTypeCount.populated = countRecordsWithValue;
        metrics.recordTypeCount.empty = totalRecordsCount - countRecordsWithValue;
        metrics.totalRecordsPopulated = countRecordsWithValue;  

     

    }
    

    metrics.percentagePopulated = Math.round((metrics.totalRecordsPopulated*100)/metrics.totalRecords);

    if(isTextArea){
        metrics.note = `The ${field} custom field is of type text area (which cannot be used to filter a SOQL query), so its usage was calculating by querying 1000 records by record type, created in the past 6 months`;
    }

    if(!isTextArea && metrics.totalRecordsPopulated > 1){

        let recentQuery = `SELECT Id, Name, CreatedDate,CreatedById,${fieldName},CreatedBy.Name FROM ${object} WHERE ${fieldName} != null ORDER BY CreatedDate DESC LIMIT 1`;
        let recordsResult = await restApi.query({query:recentQuery});

        let record = recordsResult.records[0];

        let mostRecentRecord = {
            recordUrl:`${connection.url}/${record.Id}`,
            createdDate:record.CreatedDate,
            createdByUrl:`${connection.url}/${record.CreatedById}`,
            createdByName:record.CreatedBy.Name,
            fieldValue:record[fieldName]
        }

        metrics.mostRecentRecord = mostRecentRecord;

    }

    return metrics;
}


function logError(error,params){
    console.log(error,params);
}

module.exports = usageMetrics;