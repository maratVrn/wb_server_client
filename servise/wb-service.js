
const {WBCatalog, WBAllSubjects} = require('../models/models')
const axios = require('axios');
const { PARSER_GetBrandAndCategoriesList, PARSER_GetIAbout, PARSER_GetIdInfo,
    PARSER_GetProductPositionToClient, PARSER_GetProductListInfo_LITE_ToClient} = require("../wbdata/wbParserFunctions")
const ProductIdService = require('../servise/productId-service')
const ProductListService = require('../servise/productList-service')



class WBService {

    allWBCatalog = []



    // Загружаем с БД последнюю версию лайт каталога и отпарвляем на фронт для отображения списка
    async getLiteWBCatalog (){
        const WBCatalog_ALL = await WBCatalog.findAll()
        let result = []
        WBCatalog_ALL.sort((a, b) => a.id < b.id ? -1 : 1)
        if (WBCatalog_ALL.at(-1).catalogLite)  result = WBCatalog_ALL.at(-1).catalogLite
        if (WBCatalog_ALL.at(-1).catalogAll)  this.allWBCatalog = WBCatalog_ALL.at(-1).catalogAll
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

    getBasketFromID(shortId){

        let basket = ''
        if (shortId <= 143) { basket = '01'}
        else if (shortId <= 287)   basket = '02'
        else if (shortId <= 431)   basket = '03'
        else if (shortId <= 719)   basket = '04'
        else if (shortId <= 1007)  basket = '05'
        else if (shortId <= 1061)  basket = '06'
        else if (shortId <= 1115)  basket = '07'
        else if (shortId <= 1169)  basket = '08'
        else if (shortId <= 1313)  basket = '09'
        else if (shortId <= 1601)  basket = '10'
        else if (shortId <= 1655)  basket = '11'
        else if (shortId <= 1919)  basket = '12'
        else if (shortId <= 2045)  basket = '13'
        else if (shortId <= 2090)  basket = '14'
        else if (shortId <= 2189)  basket = '14'
        else if (shortId <= 2405)  basket = '15'
        else if (shortId <= 2621)  basket = '16'
        else if (shortId <= 2837)  basket = '17'
        else if (shortId <= 3053)  basket = '18'
        else if (shortId <= 3269)  basket = '19'
        else  basket = '20'
/// Вроде как 216 шаг стабильный полс время
        return basket
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
                    saleCount       : productInfo.saleCount,
                    saleMoney       : productInfo.saleMoney,
                    totalQuantity   : productInfo.totalQuantity,
                    photoUrl        : await this.loadLittlePhotoUrl(sortId[i]),
                    name            : cur_i_pi>=0 ? parserProductInfo[cur_i_pi].name : ' ',
                    color           : cur_i_pi>=0 ? parserProductInfo[cur_i_pi].color : ' ',
                }
                ProductColorsInfo.push(oneColor)
            }
        }
        return ProductColorsInfo
    }

    async loadProductAbout(id){
        let productAbout = {}
        const shortId = Math.floor(id / 100000)
        const part = Math.floor(id / 1000)
        const basket = this.getBasketFromID(shortId)
        const url = `https://basket-${basket}.wbbasket.ru/vol${shortId}/part${part}/${id}/info/ru/card.json`
        let productData = await PARSER_GetIAbout(url)

        let productInfo = await PARSER_GetIdInfo(id)

        const colors = []
        let sortId = []
        if (productData.colors) sortId =   productData.colors.sort((a, b) => a - b);

        for (let i in sortId){
            const idInfo = await  ProductIdService.getIdInfo(sortId[i])

            if (idInfo) {
                const oneColor = {
                    id: sortId[i],
                    photoUrl: await this.loadLittlePhotoUrl(sortId[i])
                }
                colors.push(oneColor)
            }
        }
        try {

            const data = {
                imt_name: productData?.imt_name,
                nm_colors_names : productData?.nm_colors_names,
            }
            productAbout = {
                data: data,
                info : productInfo,
                colors: colors
            }
        } catch (err) {console.log(err);  }


        return productAbout
    }

    async loadLittlePhotoUrl(id){
        const shortId = Math.floor(id / 100000)
        const part = Math.floor(id / 1000)
        const basket = this.getBasketFromID(shortId)
        return `https://basket-${basket}.wbbasket.ru/vol${shortId}/part${part}/${id}/images/tm/1.webp`
    }

    async loadPhotoUrl(id){
        let photoUrl = []
        const shortId = Math.floor(id / 100000)
        const part = Math.floor(id / 1000)
        const basket = this.getBasketFromID(shortId)
        const mainUrl = `https://basket-${basket}.wbbasket.ru/vol${shortId}/part${part}/${id}/images/c516x688/`

        const maxPhoto = 5 // TODO: Макс кол-во мелких фото пока так харкод хотя красивее грузить все листать их
        // console.log(mainUrl + '1.webp');
        for (let i = 1; i <= maxPhoto; i++) {
            const someUrl = mainUrl +i.toString() +'.webp'
            let needAdd = true
            await axios.get(someUrl).catch((error) => {
                    if (error.response.status == 404) {  needAdd = false  }});
            if (needAdd) photoUrl.push(someUrl)

        }

        return photoUrl
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
