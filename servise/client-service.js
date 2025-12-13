
const { PARSER_GetIdInfo, PARSER_GetProductListPriceInfo, PARSER_LoadMiddlePhotoUrl, PARSER_GetSimilarProducts} = require("../wbdata/wbParserFunctions")
const ProductListService = require('../servise/productList-service')
const ProductIdService = require('../servise/productId-service')
const MySearch = require('../wbdata/search')
const { WBAllSubjects} = require("../models/models");


class ClientService {



    async getSearchResult (searchParam){


        const searchData = MySearch.getSearchParam(searchParam.searchQuery)
        // console.log(searchData);
        let param = {catalogIdList : searchData.catalogIdList, idCount: searchParam.param.idCount,
            filters : searchParam.param.filters
        }
        if (!param.filters.isXsubjectFilterChecked){
            param.filters.isXsubjectFilterChecked = true
            param.filters.xSubjectIdArray = searchData.subjectIdList
        }
        const [result, noFilters] = await this.getProductList(param)

        // TODO: пока очень криво сделал поиск имен предметов переделать по нормальному - братьиз отдельной таблицы

        let filters = {subjects:[]}
        for (let j in searchData.subjectIdList)
            filters.subjects.push({id:searchData.subjectIdList[j], needAdd : true, name : ''})

        for (let i in searchData.catalogIdList) {
            const catalogId = searchData.catalogIdList[i] ? searchData.catalogIdList[i] : 0
            const oneC = await WBAllSubjects.findOne({where: {catalogId: catalogId}})
            if (oneC) if (oneC.subjects)
                for (let k in oneC.subjects)
                    for (let j in filters.subjects)
                        if (filters.subjects[j].needAdd)
                        if (oneC.subjects[k].id === filters.subjects[j].id){
                            filters.subjects[j].name = oneC.subjects[k].name
                            filters.subjects[j].needAdd = false
                            break
                        }
        }

        return  [result, filters]
    }






    async getProductList (param){

        let result = []

        let filters = {subjects:[]}


        const catalogId = param?.catalogIdList[0]? param.catalogIdList[0] : null
        const oneC = await WBAllSubjects.findOne({where: {catalogId: catalogId}})
        if (oneC) if (oneC.subjects) filters.subjects = oneC.subjects
        // Добавим предметы если их нет и каталог 1 (это в случсае запроса по каталогу
        let startCatalogSearch = false

        if ((param?.catalogIdList?.length === 1) && (param?.filters?.xSubjectIdArray?.length === 0)) {
            for (let i in filters.subjects)
                param?.filters?.xSubjectIdArray.push(filters.subjects[i].id)

            startCatalogSearch = true
        }

        const idList = await ProductListService.getProductList(param, startCatalogSearch)
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
                                const dt = new Date().toLocaleDateString()
                                const nowPrice =  {d: dt, sp: updateProductListInfo[z].price, q : updateProductListInfo[z].totalQuantity}
                                if (idList[k].priceHistory.length>0)
                                    if (idList[k].priceHistory.at(-1).d === dt) idList[k].priceHistory.pop()
                                idList[k].priceHistory.push(nowPrice)




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
                                    subjectId        : updateProductListInfo[z].subjectId,
                                    feedbacks        : updateProductListInfo[z].feedbacks,
                                })
                                break
                            }
                j += step2 - 1
            } catch (error) {console.log(error) };


        }

        return [result, filters]
    }



    async getSimilarProducts (id){
        let similarProducts = []
        try {

            const products = await PARSER_GetSimilarProducts(id)
            let onlyIdList = []
            for (let i in products) onlyIdList.push(products[i].id)
            const controlIdList = await ProductIdService.getControlIdListByList(onlyIdList)
            let idList = await ProductListService.getProductsInfoListByControlIdLis(controlIdList)
            for (let z in products)
                for (let k in idList)
                    if (products[z].id === idList[k].id)
                        if ((products[z].totalQuantity>0) && (products[z].price>0)) {
                            const dt = new Date().toLocaleDateString()
                            const nowPrice =  {d: dt, sp: products[z].price, q : products[z].totalQuantity}
                            if (idList[k].priceHistory.length>0)
                                if (idList[k].priceHistory.at(-1).d === dt) idList[k].priceHistory.pop()
                            idList[k].priceHistory.push(nowPrice)
                            similarProducts.push({
                                id               : idList[k].id,
                                discount         : idList[k].discount,
                                priceHistory     : idList[k].priceHistory,
                                price            : products[z].price,
                                photoUrl         : PARSER_LoadMiddlePhotoUrl(idList[k].id),
                                totalQuantity    : products[z].totalQuantity,
                                brand            : products[z].brand ,
                                name             : products[z].name ,
                                supplier	     : products[z].supplier,
                                reviewRating     : products[z].reviewRating,
                                subjectId        : products[z].subjectId,
                                feedbacks        : products[z].feedbacks,
                            })
                            break
                        }



        } catch (e) { console.log(e);}
        console.log(similarProducts.length+'sdsd');
        return similarProducts
    }

    async getProductStartInfo (id){
        let isInWB = false
        let isInBase = false
        let idInfoWB = []
        let productInfo = []
        let idInfo = []

        try {
            idInfoWB = await PARSER_GetIdInfo(id)
            idInfo = await ProductIdService.getIdInfo(id)
            if (idInfo) {
                isInBase = true
                productInfo = await ProductListService.getProductInfo(idInfo)
            }
            if (idInfoWB) {
                isInWB = true

            }
        } catch (e) { console.log(e);}
        return {isInWB : isInWB, isInBase : isInBase, idInfoWB : idInfoWB, productInfo : productInfo, idInfo : idInfo}
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


}

module.exports = new  ClientService()
