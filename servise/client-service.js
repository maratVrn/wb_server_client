
const {PARSER_GetProductListInfoToClient, PARSER_SupplierProductIDList, PARSER_GetIdInfo,
    PARSER_LoadCompetitorSeeAlsoInfo, PARSER_SupplierInfo} = require("../wbdata/wbParserFunctions")
const ProductListService = require('../servise/productList-service')
const ProductIdService = require('../servise/productId-service')
const WBService = require('../servise/wb-service')


class ClientService {

    async getProductList (catalogId){
        let result = []
        const loadProducts = await ProductListService.getProductList(catalogId)
        //TODO: Важно сейчас мы передаем текущий весь продукт лист а если там более 500 штук то запрос не выполнится
        // Внутри PARSER_GetProductListInfoToClient надо обновить дискаунты!
        result = await PARSER_GetProductListInfoToClient(loadProducts)
        // console.log('Итоговое кол-во '+result.length);
        // for (let i in result) {
        //     console.log(result[i].id+'  '+result[i].discount);
        // }
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
        // console.log('supplierId = '+supplierId);
        let result = []

        const supplierInfo = await PARSER_SupplierInfo(supplierId)
        const [idList, onlyIdList] = await PARSER_SupplierProductIDList(supplierId,100)

        const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)
        result = await  this.getResultProductInfoList_ByControlIdListByList(controlIdList, idList)
        return [result,supplierInfo]
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
        let isFbo = false
        try {
            const idInfoWB = await PARSER_GetIdInfo(id)
            const idInfo = await ProductIdService.getIdInfo(id)
            if (idInfo) isInBase = true
            if (idInfoWB) {
                isInWB = true
                if (idInfoWB.dtype) if (idInfoWB.dtype === 4) isFbo = true
            }
        } catch (e) { console.log(e);}
        return {isInWB : isInWB, isInBase : isInBase, isFbo : isFbo}
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
        console.log('tut');
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
