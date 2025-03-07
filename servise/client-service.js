const axios = require('axios');
const {PARSER_GetProductListInfoToClient, PARSER_SupplierProductIDList} = require("../wbdata/wbParserFunctions")
const ProductListService = require('../servise/productList-service')
const ProductIdService = require('../servise/productId-service')
const WBService = require('../servise/wb-service')
const { performance } = require('perf_hooks');

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

    async getSupplierInfo(supplierId){


        let result = []
        // TODO: тут надо собирать по категориям! тк если товаров больше 10_000 не все соберется
        const [idList, onlyIdList] = await PARSER_SupplierProductIDList(supplierId,100)
               //Новый вариант сбора
        const idInfoList = await ProductIdService.getIdInfoByList(onlyIdList)

        // Соберем Ассоциативный массив по catalogID чтобы потом сделать групповую загрузку
        const controlIdList = new Map()
        for (let i in onlyIdList) {
            let isNoInBase = true
            for (let k in idInfoList)
                if (idInfoList[k].id === onlyIdList[i]){

                    if (controlIdList.has(idInfoList[k].catalogId)) {
                        controlIdList.set(idInfoList[k].catalogId, [...controlIdList.get(idInfoList[k].catalogId), onlyIdList[i]])
                    } else controlIdList.set(idInfoList[k].catalogId, [onlyIdList[i]])
                    isNoInBase = false
                    break
                }
            if (isNoInBase) {
                if (controlIdList.has(0)) {
                    controlIdList.set(0, [...controlIdList.get(0), onlyIdList[i]])
                } else controlIdList.set(0, [onlyIdList[i]])
            }

        }
        let one = true
        for (let key of controlIdList.keys()) {
            const currIdArray = controlIdList.get(key)
            if (key === 0){
                for (let i in currIdArray){
                    for (let j in idList)
                        if (currIdArray[i]===idList[j].id){
                            const oneInfo = {
                                id: idList[j].id,
                                subjectId: idList[j].subjectId,
                                subjectName: idList[j].subjectName,
                                productInfo: null,
                                photoUrl        : await WBService.loadLittlePhotoUrl(idList[j].id),
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
                                subjectId: idList[j].subjectId,
                                subjectName: idList[j].subjectName,
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
