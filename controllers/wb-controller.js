const wbService = require('../servise/wb-service')
const ProductListService = require('../servise/productList-service')

class WbController{


    async getLiteWBCatalog (req, res, next) {

        try {
            const allWBCatalog  = await wbService.getLiteWBCatalog()
            res.json(allWBCatalog)
        } catch (e) {
            console.log(e);
            next(e)
        }

    }


    async test (req, res, next) {
        try {



            const testResult  = await ProductListService.deleteZeroID()
            console.log('testResult = '+testResult);
            res.json(testResult)
        } catch (e) {
            console.log(e);
            next(e)
        }
    }

}

module.exports = new WbController()
