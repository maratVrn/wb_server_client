const axios = require('axios-https-proxy-fix');
const ProxyAndErrors = require("../wbdata/proxy_and_errors");
const baseUrl = 'http://localhost:5006/api/'
async function getTestData() {

    let resData = 'noWBServerData'
    let url = baseUrl+'getAllTask'
    // url = encodeURI(url)
    // console.log(url);
    await axios.get(url).then(response => {
        resData = response.data
    })

    return resData
}

module.exports = {
    getTestData
}
