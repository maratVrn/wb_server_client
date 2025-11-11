
const {WBCatalog, WBAllSubjects} = require('../models/models')
const axios = require('axios');
const { PARSER_GetBrandAndCategoriesList, PARSER_GetIAbout, PARSER_GetIdInfo,
    PARSER_GetProductPositionToClient, PARSER_GetProductListInfo_LITE_ToClient, PARSER_GetBasketFromID, PARSER_LoadLittlePhotoUrl} = require("../wbdata/wbParserFunctions")
const ProductIdService = require('../servise/productId-service')
const ProductListService = require('../servise/productList-service')



class WBService {

    allWBCatalog = []



    // Загружаем с БД последнюю версию лайт каталога и отпарвляем на фронт для отображения списка
    async getLiteWBCatalog (){

        const WBCatalog_ALL = await WBCatalog.findOne({
                order: [ [ 'createdAt', 'DESC' ]],
            })
        let result = []

        if (WBCatalog_ALL.catalogLite)  result = WBCatalog_ALL.catalogLite
        if (WBCatalog_ALL.catalogAll)  this.allWBCatalog = WBCatalog_ALL.catalogAll
        return result
    }


    async loadSubjects_fromWB (catalogData){
        let allSubjects = []
        console.log('catalogData.length '+catalogData.length);
        if (catalogData.length){

            for (let i in catalogData) {

                // if (i>1) break // TODO: для отлалдки
                console.log('----> '+i);
                const currResult = await PARSER_GetBrandAndCategoriesList(catalogData[i])
                if (currResult)
                    for (let j in catalogData[i].subjectList){
                        const oneSubject = {
                            id : catalogData[i].subjectList[j].id,
                            name : catalogData[i].subjectList[j].name,
                            catalogId : catalogData[i].id
                        }
                        allSubjects.push(oneSubject)
                    }

                // if (!currResult) {
                //     saveErrorLog('wb-Service',`Остановка в процедуре загрузки каталогов на catalogId `+catalogData[i].id.toString())
                //
                //     break
                // }
            }
        }
        return allSubjects
    }


    async loadProductColorsInfo(id){
        let ProductColorsInfo = []
        const shortId = Math.floor(id / 100000)
        const part = Math.floor(id / 1000)
        const basket = this.getBasketFromID(shortId)
        const url = `https://basket-${basket}.wbbasket.ru/vol${shortId}/part${part}/${id}/info/ru/card.json`
        let productData = await PARSER_GetIAbout(url)
        let sortId = []
        // sortId.push(id)
        if (productData.colors) sortId =   productData.colors.sort((a, b) => a - b);
        const parserProductInfo = await PARSER_GetProductListInfo_LITE_ToClient(sortId)
        console.log('PARSER_GetProductListInfo_LITE_ToClient');
        // console.log(sortId);
        // console.log(parserProductInfo);

        for (let i in sortId){
            const idInfo = await  ProductIdService.getIdInfo(sortId[i])

            if (idInfo) {

                let cur_i_pi = -1
                for (let k in parserProductInfo)
                    if (parserProductInfo[k].id === sortId[i]) { cur_i_pi = k; break}


                const productInfo = await ProductListService.getProductInfo(idInfo)

                const oneColor = {
                    id              : sortId[i],
                    reviewRating    : productInfo.reviewRating,
                    price           : productInfo.price,
                    discount        : productInfo.discount,
                    totalQuantity   : productInfo.totalQuantity,
                    photoUrl        : PARSER_LoadLittlePhotoUrl(sortId[i]),
                    name            : cur_i_pi>=0 ? parserProductInfo[cur_i_pi].name : ' ',
                    color           : cur_i_pi>=0 ? parserProductInfo[cur_i_pi].color : ' ',
                    priceHistory    : productInfo.priceHistory ? productInfo.priceHistory : [],
                }
                ProductColorsInfo.push(oneColor)
            }
        }
        return ProductColorsInfo
    }





    async loadPositionsInfo(id, searchArray){
        let positionsInfo = []

        for (let i in searchArray){
            const onePositionInfo = await PARSER_GetProductPositionToClient(id, searchArray[i])
            // break //TODO: отдладка
            positionsInfo.push(onePositionInfo)
        }

        return positionsInfo
    }

    // Тестовая функция
    async test (){
        // id:{type: DataTypes.INTEGER, primaryKey: true},
        // catalogId:{type: DataTypes.INTEGER},        // ИД Позиции в каталога
        // subjectId:{type: DataTypes.INTEGER},        // ИД Позиции в предмета
        // brandId:{type: DataTypes.INTEGER}           // ИД Позиции в бренда
        // console.log('tut');
        // const testResult = 'kuku'
        // const testResult = await WBProductListAll.create({id : 22, catalogId : 1, subjectId : 2,brandId:3}).then( )


        return testResult
    }




}

module.exports = new WBService()
