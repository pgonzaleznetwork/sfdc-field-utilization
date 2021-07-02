let getUsageMetrics = require('../src/index');

/**
* @token A session id or oauth token with API access
* @url Your instance url i.e login.salesforce.com or mydomain.my.salesforce.com
* @apiVersion the version of the Salesforce API. If not specified or if it's lower than 49.0, we use 49.0 by default
*/
let connection = {
    token: '00D3h000005XLUw!AQkAQJIu7tHdjJZrznl2eeXjpEz3NS6DIpxAKiGP5OMHWW17rE2z9uoh9Hxs8EUmc4IuOuFac.BcHZjawhlnolDhHcvfzkaU',
    url:'https://brave-raccoon-mm7crl-dev-ed.my.salesforce.com',
    apiVersion:'49.0'
};

//let customField = 'Case.CS_Carbon_Copy_Email_1__c';
//let customField = 'Opportunity.Notes__c'
let customField = 'Account.CustomerPriority__c';

async function example(){
    console.log('Getting usage metrics...');
    let response = await getUsageMetrics(connection,customField);
    console.log(response);
}

example();