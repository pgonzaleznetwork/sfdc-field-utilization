let getUsageMetrics = require('../src/index');

/**
* @token A session id or oauth token with API access
* @url Your instance url i.e login.salesforce.com or mydomain.my.salesforce.com
* @apiVersion the version of the Salesforce API. If not specified or if it's lower than 49.0, we use 49.0 by default
*/
let connection = {
    token: '00D7c000008sDrY!ARoAQMStwR3Gg6CwQNWp1eUSbCT88DwqB3b.bGb2XuIkd8G77N2yJ7xZohBVmutR4R8yS7SsKHWAHq5A6pjb.6Px_3S2iz8W',
    url:'https://guidewire--projectdev.my.salesforce.com',
    apiVersion:'49.0'
};

//let customField = 'Case.CS_Carbon_Copy_Email_1__c';
let customField = 'CS_Program__c.NPE_Contracted__c'

async function example(){
    console.log('Getting usage metrics...');
    let response = await getUsageMetrics(connection,customField);
    console.log(response);
}

example();