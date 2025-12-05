const wbService = require('../servise/wb-service')
const ProductListService = require('../servise/productList-service')
const {getTestData} = require('./wbserverApi')

class WbController{


    async getLiteWBCatalog (req, res, next) {

        try {
            // console.log(req);
            const allWBCatalog  = await wbService.getLiteWBCatalog()
            res.json(allWBCatalog)

        } catch (e) {
            console.log(e);
            next(e)
        }

    }


    async test (req, res, next) {
        try {
            const testResult = 'isOk'
            console.log('tut');

            // const testResult  = await getTestData()
            res.json(testResult)
        } catch (e) {
            console.log(e);
            next(e)
        }
    }

}

module.exports = new WbController()
