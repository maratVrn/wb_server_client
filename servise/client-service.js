
const {PARSER_GetProductListInfoToClient, PARSER_SupplierProductIDList, PARSER_GetIdInfo,PARSER_LoadCompetitorSeeAlsoInfo,
    PARSER_SupplierInfo, PARSER_LoadIdListBySearchParam, PARSER_GetProductListPriceInfo, PARSER_LoadMiddlePhotoUrl} = require("../wbdata/wbParserFunctions")
const ProductListService = require('../servise/productList-service')
const ProductIdService = require('../servise/productId-service')
const WBService = require('../servise/wb-service')


class ClientService {



    async getSearchResult (searchParam){
        const result = await PARSER_LoadIdListBySearchParam(searchParam)
        return result
    }

    async getNowPriceInfo (idList){
        const result = []


        // Сначала обновим текущие цены
        const step2 = 350
        for (let j = 0; j < idList.length; j ++) {
            try {

                let end_j = j + step2 - 1 < idList.length ? j + step2 - 1 : idList.length - 1
                let productList = []

                for (let k = j; k <= end_j; k++)
                    productList.push(idList[k].id)


                const updateProductListInfo = await PARSER_GetProductListPriceInfo(productList)

                for (let z in updateProductListInfo)
                    for (let k in idList)
                        if (updateProductListInfo[z].id === idList[k].id) {
                            result.push({id:idList[k].id, price : updateProductListInfo[z].price, priceHistory : [],
                                photoUrl : PARSER_LoadMiddlePhotoUrl(idList[k].id), totalQuantity   : updateProductListInfo[z].totalQuantity})
                            break }
                j += step2 - 1
            } catch (error) {console.log(error) };


        }

        // Загрузим историю цен
        let onlyIdList = []
        for (let k in idList)  onlyIdList.push(idList[k].id)
        const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)

        const dt = new Date().toLocaleDateString()

        for (let key of controlIdList.keys()) {
            const currIdArray = controlIdList.get(key)
            const productInfo = await ProductListService.getProductInfoList(currIdArray, key)

            for (let i in productInfo) {
                for (let j in result)
                    if (productInfo[i].id === result[j].id) {
                        result[j].priceHistory = productInfo[i].priceHistory
                        const nowPrice =  {d: dt, sp: result[j].price}
                        if (result[j].priceHistory.length>0)
                            if (result[j].priceHistory.at(-1).d === dt) result[j].priceHistory.pop()
                        result[j].priceHistory.push(nowPrice)


                        break
                    }
            }
        }

        return result
    }





    async getProductList (param){
        let result = []
        const idList = await ProductListService.getProductList(param)
        const step2 = 350
        for (let j = 0; j < idList.length; j ++) {
            try {

                let end_j = j + step2 - 1 < idList.length ? j + step2 - 1 : idList.length - 1
                let productList = []

                for (let k = j; k <= end_j; k++)
                    productList.push(idList[k].id)


                const updateProductListInfo = await PARSER_GetProductListPriceInfo(productList)

                for (let z in updateProductListInfo)
                    for (let k in idList)
                        if (updateProductListInfo[z].id === idList[k].id)
                            if ((updateProductListInfo[z].totalQuantity>0) && (updateProductListInfo[z].price>0)) {



                                result.push({
                                    id               : idList[k].id,
                                    discount         : idList[k].discount,
                                    priceHistory     : idList[k].priceHistory,
                                    price            : updateProductListInfo[z].price,
                                    photoUrl         : PARSER_LoadMiddlePhotoUrl(idList[k].id),
                                    totalQuantity    : updateProductListInfo[z].totalQuantity,
                                    brand            : updateProductListInfo[z].brand ,
                                    name             : updateProductListInfo[z].name ,
                                    supplier	     : updateProductListInfo[z].supplier,
                                    reviewRating     : updateProductListInfo[z].reviewRating,
                                })
                                break
                            }
                j += step2 - 1
            } catch (error) {console.log(error) };


        }
        result.sort((a, b) => b.discount - a.discount)
        return result
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
                                photoUrl  : await PARSER_LoadLittlePhotoUrl(idList[j].id),
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
                                photoUrl        : PARSER_LoadLittlePhotoUrl(idList[j].id),
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
        let idInfoWB = []
        let productInfo = []

        try {
            idInfoWB = await PARSER_GetIdInfo(id)
            const idInfo = await ProductIdService.getIdInfo(id)
            if (idInfo) {
                isInBase = true
                productInfo = await ProductListService.getProductInfo(idInfo)
            }
            if (idInfoWB) {
                isInWB = true

            }
        } catch (e) { console.log(e);}
        return {isInWB : isInWB, isInBase : isInBase, idInfoWB : idInfoWB, productInfo : productInfo}
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
