let yourFunction = require('../src/index');
require('dotenv');

/**
* @token A session id or oauth token with API access
* @url Your instance url i.e login.salesforce.com or mydomain.my.salesforce.com
* @apiVersion the version of the Salesforce API. If not specified or if it's lower than 49.0, we use 49.0 by default
*/
let connection = {
    token: env.TOKEN,
    url:env.URL,
    apiVersion:'49.0'
};

async function example(){
    let response = await yourFunction(connection);
    console.log(response);
}

example();