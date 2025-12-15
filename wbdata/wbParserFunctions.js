const axios = require('axios-https-proxy-fix');
const {saveParserProductListLog, saveErrorLog} = require('../servise/log')
const ProxyAndErrors = require('./proxy_and_errors')//require('../wbdata/proxy_and_errors');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


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

// НУЖНА
async function PARSER_GetIdInfo(id) {
    // console.log('PARSER_GetIdInfo');
    let needGetData = true
    let infoData = null
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
        //     const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+parseInt(id).toString()

            // const url = `https://www.wildberries.ru/__internal/u-card/cards/v4/list?dest=-3390370&nm=`+parseInt(id).toString()
            const url = `https://www.wildberries.ru/__internal/u-card/cards/v4/detail?dest=-1255987&lang=ru&nm=`+parseInt(id).toString()

            // console.log(url);
            // Реалистичный User-Agent для Chrome на Windows
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            const myCookie = ProxyAndErrors.cookie
            const browserHeaders = {
                'User-Agent': userAgent,  'Cookie' : myCookie,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 'Connection': 'keep-alive',  'Upgrade-Insecure-Requests': '1', // Сигнализирует о желании перейти на HTTPS
            };

            const res =  await axios.get(url, {headers: browserHeaders}).then(response => {
                const products = response.data.products

                if (products[0])
                try {
                    let resData = products[0]

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

                                    if (price>0) needCalcPrice = false

                                }
                                for (let z in resData.sizes[k].stocks)
                                    try { realTotalQuantity += resData.sizes[k].stocks[z].qty
                                        // console.log(realTotalQuantity);
                                    }catch (e) {  }


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
            console.log(err.message);
            needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetIdInfo', 'id '+id.toString())

        }
    }
    // console.log('infoData.brand '+ infoData.brand);
    return infoData
}


// НУЖНА ищем похожие товары по ИД товара
async function PARSER_GetSimilarProducts(id) {
    let similarProducts = []
    let needGetData = true

    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {

            let url = `https://www.wildberries.ru/__internal/u-recom/recom/ru/common/v8/search?dest=-1255987&page=1&query=похожие ${id}&resultset=catalog`

            // Реалистичный User-Agent для Chrome на Windows
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            const myCookie = ProxyAndErrors.cookie
            const browserHeaders = {
                'User-Agent': userAgent,  'Cookie' : myCookie,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 'Connection': 'keep-alive',  'Upgrade-Insecure-Requests': '1', // Сигнализирует о желании перейти на HTTPS
            };
            url = encodeURI(url)
            await axios.get(url, {headers: browserHeaders}).then(response => {
                const products = response.data.products
                if (products) {

                    for (let i in products){
                        try {
                            const currProduct = products[i]

                            let needCalcPrice = true
                            let price = -1
                            for (let k in currProduct.sizes) {

                                try {
                                    if (needCalcPrice) {
                                        price = currProduct.sizes[k]?.price?.product ? Math.round(parseInt(currProduct.sizes[k]?.price?.product) / 100) : -1
                                        if (price>0) needCalcPrice = false
                                    }
                                } catch (e) {console.log(e.message);}
                            }

                            const newProduct = {
                                id: currProduct?.id ? currProduct.id : 0,
                                price: price,
                                totalQuantity: currProduct.totalQuantity ? currProduct.totalQuantity : 0,
                                brand: currProduct?.brand ? currProduct?.brand : '',
                                name: currProduct?.name ? currProduct?.name : '',
                                supplier: currProduct?.supplier ? currProduct?.supplier : '',
                                reviewRating: currProduct?.reviewRating ? currProduct?.reviewRating : 0,
                                subjectId: currProduct?.subjectId ? currProduct?.subjectId : 0,
                                feedbacks: currProduct?.feedbacks ? currProduct?.feedbacks : 0,
                            }


                            similarProducts.push(newProduct)

                        } catch (e) {console.log(e); }
                    }
                }

            })
            needGetData = false
        } catch (err) {
            // console.log(err);
            needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetSimilarProducts', 'noData ')
        }
    }

    return similarProducts
}



// НУЖНА
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
            // const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+productListStr
            // const url = `https://www.wildberries.ru/__internal/u-card/cards/v4/list?dest=-3390370&nm=`+productListStr
            const url = `https://www.wildberries.ru/__internal/u-card/cards/v4/detail?dest=-1255987&lang=ru&nm=`+productListStr
            // Реалистичный User-Agent для Chrome на Windows
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            const myCookie = ProxyAndErrors.cookie
            const browserHeaders = {
                'User-Agent': userAgent,  'Cookie' : myCookie,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 'Connection': 'keep-alive',  'Upgrade-Insecure-Requests': '1', // Сигнализирует о желании перейти на HTTPS
            };


            await axios.get(url, {headers: browserHeaders}).then(response => {
                const products = response.data.products
                if (products) {

                    for (let i in products){
                        const currProduct = products[i]
                        let realTotalQuantity = 0
                        let needCalcPrice = true
                            let price = -1
                            for (let k in currProduct.sizes) {

                                try {
                                    if (needCalcPrice) {
                                        price = currProduct.sizes[k]?.price?.product ? Math.round(parseInt(currProduct.sizes[k]?.price?.product) / 100) : -1
                                        if (price>0) needCalcPrice = false
                                    }

                                    for (let z in currProduct.sizes[k].stocks)
                                        try { realTotalQuantity += currProduct.sizes[k].stocks[z].qty
                                        }catch (e) {  }

                                } catch (e) { console.log(e.message);}
                            }
                                //  использовать если сломается остатки по размерам
                                //     realTotalQuantity = currProduct.totalQuantity? currProduct.totalQuantity : 0
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


module.exports = {
    PARSER_GetIAbout,PARSER_GetIdInfo,  PARSER_GetProductListPriceInfo, PARSER_GetSimilarProducts,  PARSER_LoadMiddlePhotoUrl
}
