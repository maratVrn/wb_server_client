
const {PARSER_GetProductListInfoToClient, PARSER_SupplierProductIDList, PARSER_GetIdInfo,PARSER_LoadCompetitorSeeAlsoInfo} = require("../wbdata/wbParserFunctions")
const ProductListService = require('../servise/productList-service')
const ProductIdService = require('../servise/productId-service')
const WBService = require('../servise/wb-service')


class ClientService {

    async getProductList (catalogId){
        let result = []
        const loadProducts = await ProductListService.getProductList(catalogId)
        result = await PARSER_GetProductListInfoToClient(loadProducts)
        return result
    }



    async getProductPhoto (id){
        let photoUrl = []
        if (id) {
            photoUrl =  await WBService.loadPhotoUrl(id)
        }
        return photoUrl
    }
    async getProductAbout (id){
        let productAbout = []
        if (id) {
            productAbout = await WBService.loadProductAbout(id)
        }
        return productAbout
    }

    async loadCompetitorSeeAlsoInfo(id){
        let result = []
        const [idList, onlyIdList] = await PARSER_LoadCompetitorSeeAlsoInfo(id, true)
        const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)
        result = await  this.getResultProductInfoList_ByControlIdListByList(controlIdList, idList)
        return result
    }
    async loadCompetitorSeeFindInfo(id, findText){
        let result = []
        const [idList, onlyIdList] = await PARSER_LoadCompetitorSeeAlsoInfo(id, false, false, true, findText)
        const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)
        result = await  this.getResultProductInfoList_ByControlIdListByList(controlIdList, idList)
        return result
    }

    async loadCompetitorSeePhotoInfo(id){
        let result = []
        const [idList, onlyIdList] = await PARSER_LoadCompetitorSeeAlsoInfo(id, false, true)
        const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)
        result = await  this.getResultProductInfoList_ByControlIdListByList(controlIdList, idList)
        return result
    }


    async getSupplierInfo(supplierId){
        let result = []
        const [idList, onlyIdList] = await PARSER_SupplierProductIDList(supplierId,100)
        const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)
        result = await  this.getResultProductInfoList_ByControlIdListByList(controlIdList, idList)
        return result
    }

    // Подгрузим информацию по ид-кам и вернем полную картину из нашей БД
    async  getResultProductInfoList_ByControlIdListByList (controlIdList,idList){
        let result = []

        for (let key of controlIdList.keys()) {
            const currIdArray = controlIdList.get(key)
            if (key === 0){
                // Если товаров нету в базе
                for (let i in currIdArray){
                    for (let j in idList)
                        if (currIdArray[i]===idList[j].id){
                            const oneInfo = {
                                id: idList[j].id,
                                idInfo : idList[j],
                                productInfo : null,
                                photoUrl  : await WBService.loadLittlePhotoUrl(idList[j].id),
                            }
                            result.push(oneInfo)
                            break
                        }
                }
            } else {
                const productInfo = await ProductListService.getProductInfoList(currIdArray, key)
                for (let i in productInfo){
                    for (let j in idList)
                        if (productInfo[i].id===idList[j].id){
                            const oneInfo = {
                                id: idList[j].id,
                                idInfo : idList[j],
                                productInfo: productInfo[i],
                                photoUrl        :await  WBService.loadLittlePhotoUrl(idList[j].id),
                            }
                            result.push(oneInfo)
                            break
                        }
                }
            }
        }
        return result

    }

    async getProductStartInfo (id){
        let isInWB = false
        let isInBase = false
        const idInfoWB = await PARSER_GetIdInfo(id)
        if (idInfoWB) {
            isInWB = true
            const idInfo = await ProductIdService.getIdInfo(id)
            if (idInfo) isInBase = true
        }
        return {isInWB : isInWB, isInBase : isInBase}
    }

    async getProductInfo (id){

        let result = []
        const idInfo = await ProductIdService.getIdInfo(id)
        let productInfo = []
        if (idInfo) {
            productInfo = await ProductListService.getProductInfo(idInfo)
            result.push(idInfo)
            result.push(productInfo)
        }
        return result
    }

    async getIdInfo (id){
        let result = []
        const idInfo = await ProductIdService.getIdInfo(id)

        let productInfo = []

        if (idInfo) {
            productInfo = await ProductListService.getProductInfo(idInfo)

            result.push(idInfo)
            result.push(productInfo)

        }
        return result
    }

}

module.exports = new  ClientService()
