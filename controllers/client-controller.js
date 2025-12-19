const ClientService = require('../servise/client-service')
const ProductListService = require('../servise/productList-service')
const UserStatService = require("../servise/userStat-service");
const UserService = require("../servise/user-service");

class ClientController {




    async getSearchResult(req, res, next) {

        try {

            const searchParam = {
                searchQuery :   req.body.searchQuery? req.body.searchQuery : '',
                param   :   req.body.param? req.body.param : {},
            }

            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            UserStatService.addIpInfo(ip, 'search').then()

            const result =  await ClientService.getSearchResult2(searchParam)
            res.json(result)

        } catch (e) {
            next(e)
        }

    }
    async getProductList(req, res, next) {

        try {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            UserStatService.addIpInfo(ip, 'productList').then()

            let  param = req.body? req.body : {}
            const result = await ClientService.getProductList(param)
            res.json(result)
        } catch (e) {
            next(e)
        }

    }


    async getSimilarProducts(req, res, next) {

        try {
            const id = req.params.link
            const result = await ClientService.getSimilarProducts(id)

            res.json(result)

        } catch (e) {
            next(e)
        }

    }


    async userGoToWB(req, res, next) {
        try {
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            UserStatService.addIpInfo(ip, 'wbTransit').then()
            res.json('isOk')
        } catch (e) {
            next(e)
        }

    }

    async getProductStartInfo(req, res, next) {

        try {
            console.log('getProductStartInfo');
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            UserStatService.addIpInfo(ip, 'viewProduct').then()


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

    async duplicateTest(req, res, next) {
        try {

            const id = req.body.id
            const cat1 = req.body.cat1
            const cat2 = req.body.cat2
            console.log('tut '+id+'  '+cat1+' '+cat2);

            const data1 = await ProductListService.getProductInfo({catalogId:cat1, id: id})
            const data2 = await ProductListService.getProductInfo({catalogId:cat2, id: id})
            console.log(data2);
            const res1 = data1?.id? {
                catalogId: cat1,
                subjectId : data1.subjectId,
                dateStart: data1.priceHistory[0].d,
                priceHistory : data1.priceHistory
            }: null

            const res2 = data2?.id?  {
                catalogId: cat2,
                subjectId : data2.subjectId,
                dateStart: data2.priceHistory[0].d,
                priceHistory : data2.priceHistory
            } : null

            let result = [res1, res2]

            res.json(result)

        } catch (e) {  next(e)  }
    }


    async registration(req, res, next) {
        try {
            const formData = req.body.formData
            const result = await UserService.registration(formData)
            res.json(result)
        } catch (e) {
            next(e)
        }
    }

    async login(req, res, next) {
        try {
            const formData = req.body.formData
            const result = await UserService.login(formData)
            res.json(result)
        } catch (e) {
            next(e)
        }
    }
    async tokenTest(req, res, next) {
        try {
            const token = req.body.token
            const result = await UserService.tokenTest(token)
            res.json(result)
        } catch (e) {
            next(e)
        }
    }





}
module.exports = new ClientController()
