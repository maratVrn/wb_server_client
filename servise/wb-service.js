
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
