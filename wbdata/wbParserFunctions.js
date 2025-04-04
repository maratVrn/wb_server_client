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
                    let dtype = -1
                    if (resData.totalQuantity > 0) {
                        // Поиск цен. Пробегаемся по остаткам на размерах и если находим то прекращаем писк. Тут важно что если на остатках в размере 0 то и цен не будет
                        for (let k in resData.sizes) {
                            if (resData.sizes[k]?.price) {
                                price = resData.sizes[k]?.price?.product ? Math.round(parseInt(resData.sizes[k]?.price?.product) / 100) : -1
                                basicPrice = resData.sizes[k]?.price?.basic ? Math.round(parseInt(resData.sizes[k]?.price?.basic) / 100) : -1
                                if (basicPrice>0) discount = Math.round( 100 * (basicPrice - price)/basicPrice )
                                break
                            }
                        }
                        // Определим dtype
                        // TODO: Потом это убрать!! это надо сделать один раз при загрузке нового товара и забить и брать из описания
                        for (let k in resData.sizes) {
                            let isDType = false
                            if (resData.sizes[k]?.dtype) dtype = resData.sizes[k].dtype
                            if (resData.sizes[k]?.stocks)
                                for (let l in resData.sizes[k]?.stocks) {
                                    if (resData.sizes[k]?.stocks[l]?.dtype) dtype = resData.sizes[k]?.stocks[l]?.dtype
                                    if (dtype === 1) {isDType = true; break}
                                }
                            if (isDType) break
                        }
                    }

                    const data = {
                        price           : price,
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
                        dtype           : dtype,
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

async function PARSER_LoadCompetitorSeeAlsoInfo(id, seeAlso = true, seePhoto = false, SeeFind = false, findWord = '' ) {
    let idList = []
    let onlyIdList = []
    let needGetData = true
        needGetData = true
        while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
            try {

                let url = ''
                if (seeAlso) url = `https://recom.wb.ru/recom/ru/common/v5/search?ab_own_sim=new30&appType=1&curr=rub&dest=12358291&lang=ru&page=1&query=%D0%BF%D0%BE%D1%85%D0%BE%D0%B6%D0%B8%D0%B5%20${id}&resultset=catalog&spp=30`
                    else
                        if (seePhoto) url = `https://recom.wb.ru/visual/ru/common/v5/search?appType=1&curr=rub&dest=12358291&lang=ru&page=1&query=${id}&resultset=catalog&spp=30&suppressSpellcheck=false`
                            else if (SeeFind) {
                            url = `https://search.wb.ru/exactmatch/ru/common/v9/search?ab_testing=false&appType=1&curr=rub&dest=12358291&lang=ru&page=1&query=`+
                                findWord+'&resultset=catalog&sort=popular&spp=30'
                            url = encodeURI(url)
                        }
                await axios.get(url, ProxyAndErrors.config).then(response => {
                    const resData = response.data

                    if (resData?.data?.products) {

                        for (let k in resData?.data?.products)
                            try {

                                idList.push({
                                    id              : resData?.data?.products[k].id,
                                    pos             : parseInt(k)+1,
                                    brand           : resData?.data?.products[k].brand,
                                    name	        : resData?.data?.products[k].name	,
                                    supplier	    : resData?.data?.products[k].supplier,
                                    supplierId	    : resData?.data?.products[k].supplierId,

                                })
                                onlyIdList.push(resData?.data?.products[k].id)

                            } catch (e) {}


                    }
                })
                needGetData = false

            } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_LoadCompetitorSeeAlsoInfo', 'id '+id.toString())}
        }
    return [idList, onlyIdList]
}

// Получаем список товарв для выбранного предмета и типа сортировки
async function PARSER_SupplierProductIDList(supplierId, maxPage=30){
    let idList = []
    let onlyIdList = []
    let needGetData = true
    let needGetNextProducts = true
    const supplierSubjectsList = await PARSER_GetSupplierSubjects(supplierId)

    for (let i = 1; i <= maxPage; i++) {
        let page = i
        needGetData = true
        while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
            try {


                const url2 =`https://catalog.wb.ru/sellers/v2/catalog?ab_testing=false&appType=1&curr=rub&dest=12358291&lang=ru&page=${page}&sort=popular&spp=30&supplier=${supplierId}`
                await axios.get(url2,  ProxyAndErrors.config).then(response => {
                    const resData = response.data
                    if (resData?.data?.products) {
                        console.log(resData?.data?.products.length);
                        for (let k in resData?.data?.products)
                            try {
                                let subjectId = 0
                                let subjectName = ''
                                if (resData?.data?.products[k].subjectId){
                                    subjectId = resData?.data?.products[k].subjectId
                                    for (let j in supplierSubjectsList)
                                        if (supplierSubjectsList[j].id === subjectId) {
                                            subjectName = supplierSubjectsList[j].name
                                            break
                                        }
                                }

                                idList.push({ id    : resData?.data?.products[k].id,
                                    subjectId       : subjectId,
                                    subjectName     : subjectName
                                })
                                onlyIdList.push(resData?.data?.products[k].id)

                            } catch (e) {}
                        try { if (resData?.data?.products.length<100) needGetNextProducts = false } catch (e) {needGetNextProducts = false}

                    }
                })
                needGetData = false

            } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_SupplierProductIDList', 'supplierId '+supplierId.toString())}
        }
        if (!needGetNextProducts) break
    }
    return [idList, onlyIdList]
}

// Получаем бренд лист для выбранного каталога
async function PARSER_GetBrandsAndSubjectsList(catalogParam, needBrands = true) {
    let brandList = []
    let subjectList = []
    let needGetData = true
    while (needGetData) {
        try {
            if (needBrands) {
                // Загрузим Список брендов
                saveParserProductListLog(catalogParam.name, 'Получаем бренды в каталоге')
                const url = `https://catalog.wb.ru/catalog/${catalogParam.shard}/v6/filters?ab_testing=false&appType=1&${catalogParam.query}&curr=rub&dest=-3390370&filters=ffbrand&spp=30`
                saveParserProductListLog(catalogParam.name, `Начинаем загрузку брендов по ссылке: ` + url)
                await axios.get(url, ProxyAndErrors.config).then(response => {
                    const resData = response.data
                    if (resData?.data?.filters[0]) {
                        brandList = resData?.data?.filters[0].items
                        let brandCount = brandList.length ? brandList.length : 0
                        saveParserProductListLog(catalogParam.name, 'Бренды успешно загруженны, колличество брендов ' + brandCount.toString())
                    }
                    needGetData = false
                })
            }
            // Загрузим Список категорий товаров
            needGetData = true
            saveParserProductListLog(catalogParam.name, 'Получаем список категорий товаров  в каталоге')
            const url2 = `https://catalog.wb.ru/catalog/${catalogParam.shard}/v6/filters?ab_testing=false&appType=1&${catalogParam.query}&curr=rub&dest=-3390370&filters=xsubject&spp=30`
            await axios.get(url2, {proxy: global.axiosProxy} ).then(response => {
                const resData = response.data
                if (resData?.data?.filters[0]) {
                    subjectList = resData?.data?.filters[0].items
                    let subjectCount = subjectList.length ? subjectList.length : 0
                }
                needGetData = false
            })
        } catch (err) {needGetData = await ProxyAndErrors.view_error(err, 'PARSER_GetBrandsAndSubjectsList', 'catalogParam '+catalogParam.toString())}
    }
    return [brandList, subjectList]
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
                                saleCount       = productIdList[i].saleCount
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
                            saleCount       : saleCount,

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
    PARSER_GetProductListInfoToClient,PARSER_GetIAbout,PARSER_GetIdInfo,PARSER_SupplierProductIDList,
    PARSER_GetProductPositionToClient,PARSER_LoadCompetitorSeeAlsoInfo
}
