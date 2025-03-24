const ClientService = require('../servise/client-service')
const WBService = require("../servise/wb-service");
const WordStatisticService = require("../servise/wordStatistic-service")

class ClientController {
    async getProductList(req, res, next) {

        try {
            const catalogId = req.params.link
            const result = await ClientService.getProductList(catalogId)
            res.json(result)
        } catch (e) {
            next(e)
        }

    }


    async getIdInfo(req, res, next) {

        try {
            const id = req.params.link
            const result = await ClientService.getIdInfo(id)

            res.json(result)

        } catch (e) {
            next(e)
        }

    }


    async getProductStartInfo(req, res, next) {

        try {
            const id = req.params.link
            const result = await ClientService.getProductStartInfo(id)

            res.json(result)

        } catch (e) {
            next(e)
        }

    }

    async getProductInfo(req, res, next) {

        try {
            const id = req.params.link
            const result = await ClientService.getProductInfo(id)

            res.json(result)

        } catch (e) {
            next(e)
        }

    }
    async getPositionsInfo(req, res, next) {

        try {
            const id = req.body.id
            let result = []
            if (id) {
                const searchArray  = req.body.searchArray
                result =   await WBService.loadPositionsInfo(id, searchArray)

            }
            res.json(result)

        } catch (e) {
            next(e)
        }

    }

    async getSupplierInfo(req, res, next) {

        try {
            const supplierId = req.params.link
            let result = []
            if (supplierId) {
                result = await ClientService.getSupplierInfo(supplierId)
            }
            res.json(result)

        } catch (e) {
            next(e)
        }

    }

    async getCompetitorSeeAlsoInfo(req, res, next) {
        try {
            const id = req.params.link
            let result = []
            if (id)  result = await ClientService.loadCompetitorSeeAlsoInfo(id)
            res.json(result)
        } catch (e) {  next(e)  }
    }


    async getCompetitorSeeFindInfo(req, res, next) {
        try {
            console.log('tut');
            const id = req.body.id
            let result = []
            if (id) {
                const findText  = req.body.findText
                result =   await ClientService.loadCompetitorSeeFindInfo(id, findText)

            }
            res.json(result)

        } catch (e) {  next(e)  }
    }
    async getCompetitorSeePhotoInfo(req, res, next) {
        try {
            const id = req.params.link
            let result = []
            if (id)  result = await ClientService.loadCompetitorSeePhotoInfo(id)
            res.json(result)
        } catch (e) {  next(e)  }
    }





    async getProductColorsInfo(req, res, next) {
        try {
            const id = req.params.link
            let result = []
            if (id)  result = await WBService.loadProductColorsInfo(id)
            res.json(result)
        } catch (e) {  next(e)  }
    }


    async getProductAbout(req, res, next) {

        try {
            const id = req.params.link
            const result = await ClientService.getProductAbout(id)

            res.json(result)

        } catch (e) {
            next(e)
        }

    }

    async getProductPhoto(req, res, next) {

        try {
            const id = req.params.link
            const result = await ClientService.getProductPhoto(id)

            res.json(result)

        } catch (e) {
            next(e)
        }

    }
    async searchTest(req, res, next) {

        try {

            const result = await WordStatisticService.test()

            res.json(result)

        } catch (e) {
            next(e)
        }

    }


}
module.exports = new ClientController()
