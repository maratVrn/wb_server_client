const wbService = require('../servise/wb-service')
const StartProductsService = require('../servise/startProducts-service')
const UserStatService = require('../servise/userStat-service')


class WbController{


    async getLiteWBCatalog (req, res, next) {

        try {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log('getLiteWBCatalog');
            UserStatService.addIpInfo(ip).then()
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
    async loadStartProducts (req, res, next) {
        try {
            const needDelete    = req.body.needDelete? req.body.needDelete : false
            const deleteIdList = req.body.deleteIdList? req.body.deleteIdList : []
            const  result  = await StartProductsService.loadStartProducts(needDelete, deleteIdList)
            res.json(result)
        } catch (e) {
            console.log(e);
            next(e)
        }
    }
    async addStartProduct (req, res, next) {
        try {
            const id = req.body.id? req.body.id : 0
            const startDiscount    = req.body.startDiscount? req.body.startDiscount : 0
            const startQty   = req.body.startQty? req.body.startQty : 0
            const startPrice = req.body.startPrice? req.body.startPrice : 0

            let result = 0
            if (id>0)  result  = await StartProductsService.addStartProduct(id, startDiscount, startQty, startPrice)
            res.json(result)
        } catch (e) {
            console.log(e);
            next(e)
        }
    }



}


module.exports = new WbController()
