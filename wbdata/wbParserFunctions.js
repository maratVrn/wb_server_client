const axios = require('axios-https-proxy-fix');
const {saveParserProductListLog, saveErrorLog} = require('../servise/log')
const ProxyAndErrors = require('./proxy_and_errors')//require('../wbdata/proxy_and_errors');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// Получаем бренд лист и категории товаров для выбранного каталога
async function PARSER_GetBrandAndCategoriesList(currCatalog) {
    let isResult = false
    let needGetData = true

    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            // Загрузим бренды
            // const url = `https://catalog.wb.ru/catalog/${currCatalog.catalogParam.shard}/v6/filters?ab_testing=false&appType=1&${currCatalog.catalogParam.query}&curr=rub&dest=-3390370&filters=ffbrand&spp=30`
            // await axios.get(url, ProxyAndErrors.config).then(response => {
            //     const resData = response.data
            //     if (resData?.data?.filters[0]) {
            //         currCatalog.brandList = resData?.data?.filters[0].items
            //     }})
            // Загрузим бренды
            const url2 = `https://catalog.wb.ru/catalog/${currCatalog.catalogParam.shard}/v6/filters?ab_testing=false&appType=1&${currCatalog.catalogParam.query}&curr=rub&dest=-3390370&filters=xsubject&spp=30`
            await axios.get(url2, ProxyAndErrors.config).then(response => {
                const resData = response.data
                if (resData?.data?.filters[0]) {
                    currCatalog.subjectList = resData?.data?.filters[0].items
                    // console.log(currCatalog.subjectList);
                }})
            needGetData = false
            isResult = true
        } catch (err) {   needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetBrandAndCategoriesList', 'currCatalog '+currCatalog.toString())}
    }
    return isResult
}

// Получаем ИД сервара
function PARSER_GetBasketFromID(shortId){


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
        else if (shortId <= 3485)  basket = '20'
        else if (shortId <= 3701)  basket = '21'
        else if (shortId <= 3917)  basket = '22'
        else if (shortId <= 4133)  basket = '23'
        else if (shortId <= 4349)  basket = '24'
        else if (shortId <= 4565)  basket = '25'
        else if (shortId <= 4877)  basket = '26'
        else if (shortId <= 5189)  basket = '27'

        else if (shortId <= 5566)  basket = '28'
            // else if (shortId <= 5239)  basket = '29'
            // else if (shortId <= 5445)  basket = '30'
            // else if (shortId <= 5671)  basket = '31'
            // else if (shortId <= 5887)  basket = '32'
        // else if (shortId <= 6103)  basket = '33'
        else  basket = '29'
/// Вроде как 216 шаг стабильный полс время
        return basket

}

function PARSER_LoadLittlePhotoUrl(id){
    const shortId = Math.floor(id / 100000)
    const part = Math.floor(id / 1000)
    const basket = PARSER_GetBasketFromID(shortId)
    return `https://basket-${basket}.wbbasket.ru/vol${shortId}/part${part}/${id}/images/tm/1.webp`
}

function PARSER_LoadMiddlePhotoUrl(id){
    const shortId = Math.floor(id / 100000)
    const part = Math.floor(id / 1000)
    const basket = PARSER_GetBasketFromID(shortId)
    return `https://basket-${basket}.wbbasket.ru/vol${shortId}/part${part}/${id}/images/c516x688/1.webp`
}



async function PARSER_GetIAbout(url) {

    let needGetData = true
    let aboutData = {}
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {

            const res =  await axios.get(url, ProxyAndErrors.config).then(response => {
                let resData = response.data

                try {
                    const data = {
                        imt_name        : resData.imt_name,
                        nm_colors_names : resData.nm_colors_names,
                        colors          : resData.colors

                    }
                    aboutData = data
                } catch (err) {console.log(err);                  }


            })

            needGetData = false

        }  catch (err) {   needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetIAbout', 'url '+url.toString())}
    }
    return aboutData
}

async function PARSER_GetIdInfo(id) {
    // console.log('PARSER_GetIdInfo');
    let needGetData = true
    let infoData = null
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+parseInt(id).toString()
            const res =  await axios.get(url,  ProxyAndErrors.config).then(response => {

                if (response.data.data.products[0])
                try {
                    let resData = response.data.data.products[0]

                    let price = 0
                    let basicPrice = 0
                    let discount = 0


                    let realTotalQuantity = 0
                    let needCalcPrice = true
                    if (resData.totalQuantity > 0) {
                        // Поиск цен. Пробегаемся по остаткам на размерах и если находим то прекращаем писк. Тут важно что если на остатках в размере 0 то и цен не будет
                        for (let k in resData.sizes) {
                            if (resData.sizes[k]?.price) {
                                if (needCalcPrice) {
                                    price = resData.sizes[k]?.price?.product ? Math.round(parseInt(resData.sizes[k]?.price?.product) / 100) : -1
                                    basicPrice = resData.sizes[k]?.price?.basic ? Math.round(parseInt(resData.sizes[k]?.price?.basic) / 100) : -1
                                    if (basicPrice > 0) discount = Math.round(100 * (basicPrice - price) / basicPrice)
                                    needCalcPrice = false

                                }

                                for (let z in resData.sizes[k].stocks)
                                    try { realTotalQuantity += resData.sizes[k].stocks[z].qty }catch (e) {  }


                            }
                        }
                                   }

                    const data = {
                        price           : price,
                        name            : resData.name,
                        basicPrice      : basicPrice,
                        discount        : discount,
                        brand           : resData.brand,
                        brandId         : resData.brandId,
                        supplier        : resData.supplier,
                        supplierId      : resData.supplierId,
                        supplierRating  : resData.supplierRating,
                        reviewRating    : resData.reviewRating,
                        feedbacks       : resData.feedbacks,
                        sizes           : resData.sizes,
                        totalQuantity   : realTotalQuantity
                    }


                    infoData = data
                } catch (err) {console.log(err);                  }


            })

            needGetData = false

        } catch (err) {
            needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetIdInfo', 'id '+id.toString())

        }
    }
    // console.log('infoData.brand '+ infoData.brand);
    return infoData
}

async function PARSER_GetSupplierSubjects(supplierId) {
    let supplierSubjectsList = []
    let needGetData = true
        needGetData = true
        while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
            try {

                const url2 =`https://catalog.wb.ru/sellers/v8/filters?ab_testing=false&appType=1&curr=rub&dest=12358291&filters=xsubject&spp=30&supplier=${supplierId}`
                await axios.get(url2, ProxyAndErrors.config).then(response => {
                    const resData = response.data

                    try {if (resData.data.filters[0]) supplierSubjectsList = resData.data.filters[0].items} catch (e) {}

                })
                needGetData = false

            } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetSupplierSubjects', 'supplierId '+supplierId.toString())}
        }

    return supplierSubjectsList
}


async function PARSER_GetProductListPriceInfo(productIdList) {
    let productListInfo = []
    let needGetData = true
    let productListStr = ''
    for (let i in productIdList) {
        if (i>0) productListStr += ';'
        productListStr += parseInt(productIdList[i]).toString()
    }
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+productListStr
               await axios.get(url).then(response => {
                const resData = response.data
                if (resData.data) {

                    for (let i in resData.data.products){
                        const currProduct = resData.data.products[i]
                        let realTotalQuantity = 0
                        let needCalcPrice = true

                            let price = -1
                            for (let k in currProduct.sizes) {

                                if (needCalcPrice) {
                                    price = currProduct.sizes[k]?.price?.product ? Math.round(parseInt(currProduct.sizes[k]?.price?.product) / 100) : -1
                                    needCalcPrice = false
                                }
                                for (let z in currProduct.sizes[k].stocks)
                                    try { realTotalQuantity += currProduct.sizes[k].stocks[z].qty }catch (e) {  }


                            }
                            const newProduct = {
                                id               : currProduct?.id ? currProduct.id : 0,
                                price            : price,
                                totalQuantity    : realTotalQuantity,
                                brand            : currProduct?.brand? currProduct?.brand : '',
                                name             : currProduct?.name? currProduct?.name : '',
                                supplier	     : currProduct?.supplier? currProduct?.supplier : ''	,
                                reviewRating     : currProduct?.reviewRating? currProduct?.reviewRating : 0,
                                subjectId        : currProduct?.subjectId? currProduct?.subjectId : 0,
                                feedbacks        : currProduct?.feedbacks? currProduct?.feedbacks : 0,
                            }


                        productListInfo.push(newProduct)
                       }
              }})
            needGetData = false
        } catch (err) {
            needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetProductListInfo', 'noData ')
        }
    }
    return productListInfo
}



// Берем актуальную информацию по товарам для отображения на клиенте (упрощенный вариант)
async function PARSER_GetProductListInfo_LITE_ToClient(productIdList) {
    let productListInfo = []
    let needGetData = true
    let productListStr = ''
    for (let i in productIdList) {
        if (i>0) productListStr += ';'
        productListStr += parseInt(productIdList[i]).toString()
    }
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+productListStr

            await axios.get(url, ProxyAndErrors.config).then(response => {
                const resData = response.data

                if (resData.data) {
                    // console.log('-----------ыы--------->   '+resData.data.products.length);
                    for (let i in resData.data.products){
                        const currProduct = resData.data.products[i]
                        const totalQuantity = currProduct.totalQuantity?         parseInt(currProduct.totalQuantity)      : 0
                        // Если остатков товара больше 0  то найдем цену
                        let price = 0
                        let basicPrice = 0

                        if (totalQuantity > 0) {
                            // Поиск цен. Пробегаемся по остаткам на размерах и если находим то прекращаем писк. Тут важно что если на остатках в размере 0 то и цен не будет

                            for (let k in currProduct.sizes) {
                                if (currProduct.sizes[k]?.price) {
                                    price = currProduct.sizes[k]?.price?.product ? Math.round(parseInt(currProduct.sizes[k]?.price?.product) / 100) : -1
                                    basicPrice = currProduct.sizes[k]?.price?.basic ? Math.round(parseInt(currProduct.sizes[k]?.price?.basic) / 100) : -1
                                    if (basicPrice>0) discount = Math.round( 100 * (basicPrice - price)/basicPrice )
                                    break
                                }
                            }
                        }

                        // Поиск цвета
                        let color = ''
                        for (let k in currProduct.colors) {
                            if (currProduct.colors[k]?.name) {
                                color = currProduct.colors[k]?.name
                                break
                            }
                        }


                        const newproduct = {
                            id              : currProduct?.id ? currProduct.id : 0,
                            basicPrice      : basicPrice,
                            price           : price,
                            totalQuantity   : totalQuantity,
                            reviewRating    : currProduct.reviewRating	 ? currProduct.reviewRating : 0,
                            feedbacks	    : currProduct.feedbacks ? currProduct.feedbacks : 0,
                            name		    : currProduct.name	    ? currProduct.name		 : "",
                            color           : color,
                        }
                        productListInfo.push(newproduct)

                    }
                }

            })
            needGetData = false
        } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetProductListInfo_LITE_ToClient', '')}
    }





    return productListInfo
}

// Берем актуальную информацию по товарам для отображения на клиенте
async function PARSER_GetProductListInfoToClient(productIdList) {
    let productListInfo = []
    let needGetData = true
    let productListStr = ''
    for (let i in productIdList) {
        if (i>0) productListStr += ';'
        productListStr += parseInt(productIdList[i].id).toString()
    }
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+productListStr

            await axios.get(url, ProxyAndErrors.config).then(response => {
                const resData = response.data

                if (resData.data) {
                    console.log('-------------------->   '+resData.data.products.length);
                    for (let i in resData.data.products){
                        const currProduct = resData.data.products[i]
                        const totalQuantity = currProduct.totalQuantity?         parseInt(currProduct.totalQuantity)      : 0
                        // Если остатков товара больше 0  то найдем цену
                        let price = -1
                        let basicPrice = -1
                        let wb_discount = 0
                        let saleCount = 0
                        if (totalQuantity > 0) {
                            // Поиск цен. Пробегаемся по остаткам на размерах и если находим то прекращаем писк. Тут важно что если на остатках в размере 0 то и цен не будет

                            for (let k in currProduct.sizes) {
                                if (currProduct.sizes[k]?.price) {
                                    price = currProduct.sizes[k]?.price?.product ? Math.round(parseInt(currProduct.sizes[k]?.price?.product) / 100) : -1
                                    basicPrice = currProduct.sizes[k]?.price?.basic ? Math.round(parseInt(currProduct.sizes[k]?.price?.basic) / 100) : -1
                                    if (basicPrice>0) wb_discount = Math.round( 100 * (basicPrice - price)/basicPrice )
                                    break
                                }
                            }
                        }
                        // Далее сохраним необходимую инфомацию в обьекте
                        let priceHistory_tmp = []

                        for (let i in productIdList) {
                            if (productIdList[i].id === currProduct?.id) {

                                currProduct.discount = productIdList[i].discount
                                priceHistory_tmp = productIdList[i].priceHistory
                                // Если остатки нулевые возмем цену из товара
                                if (totalQuantity ===0){
                                    price =  productIdList[i].price
                                    basicPrice = price
                                    wb_discount = 0
                                }

                                break
                            }
                        }

                        const newproduct = {
                            id              : currProduct?.id ? currProduct.id : 0,
                            basicPrice      : basicPrice,
                            price           : price,
                            totalQuantity   : totalQuantity,
                            reviewRating    : currProduct.reviewRating	 ? currProduct.reviewRating : 0,
                            discount        : currProduct.discount,
                            wb_discount     : wb_discount,
                            feedbacks	    : currProduct.feedbacks ? currProduct.feedbacks : 0,
                            brand		    : currProduct.brand	    ? currProduct.brand	 : "",
                            name		    : currProduct.name	    ? currProduct.name		 : "",
                            photoUrl        : '',
                            priceHistory    : priceHistory_tmp,

                        }
                        productListInfo.push(newproduct)

                        }
                    }

             })
            needGetData = false
        } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetProductListInfoToClient', '')}
    }





    return productListInfo
}

async function PARSER_GetProductPositionToClient(id, searchWord) {
    // console.log(id);
    // console.log(searchWord);

    let position = 0
    let isThere = false
    let needGetData = true
    let needGetNextProducts = true
    let maxPage = 10
    const need_id = parseInt(id)
    let pageResult = 0
    let total = 0

    for (let i = 1; i <= maxPage; i++) {
        let page = i
        needGetData = true
        while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
            try {



                let url = `https://search.wb.ru/exactmatch/ru/common/v9/search?ab_testing=false&appType=1&curr=rub&dest=12358291&lang=ru&page=${page}&query=`+
                    searchWord+'&resultset=catalog&sort=popular&spp=30'
                url = encodeURI(url)
                // console.log(url);
                await axios.get(url, ProxyAndErrors.config).then(response => {
                    const resData = response.data
                    total = resData?.data?.total;

                    if (resData?.data?.products) {

                        for (let k in resData?.data?.products) {
                            try {
                                if (parseInt(resData?.data?.products[k].id) === need_id) {
                                    position += parseInt(k) + 1
                                    // console.log('нашли ' + position+' i '+ i+' k '+k);
                                    isThere = true
                                    needGetNextProducts = false
                                }

                            } catch (e) {
                            }
                            try {
                                if (resData?.data?.products.length < 100) needGetNextProducts = false
                            } catch (e) {
                                needGetNextProducts = false
                            }
                            if (isThere) {
                                needGetNextProducts = false
                                break
                            }
                        }
                    }
                })
                needGetData = false

            } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetProductPositionToClient', 'id '+id.toString())}
        }
        pageResult = i
        if (!needGetNextProducts) break
        // break //TODO: отладка
        position += 100
    }





    return {searchWord : searchWord, position: position, pageResult:pageResult, total:total}
}


module.exports = {
    PARSER_GetBrandAndCategoriesList, PARSER_GetProductListInfo_LITE_ToClient,
    PARSER_GetProductListInfoToClient,PARSER_GetIAbout,PARSER_GetIdInfo,
    PARSER_GetProductPositionToClient,
    PARSER_GetProductListPriceInfo, PARSER_GetBasketFromID, PARSER_LoadLittlePhotoUrl, PARSER_LoadMiddlePhotoUrl
}
