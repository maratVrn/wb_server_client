const axios = require('axios-https-proxy-fix');
const {saveParserProductListLog, saveErrorLog} = require('../servise/log')
// const sea = require("node:sea");


global.axiosProxy  ={ host: '46.8.111.94', port: 8000, protocol: 'https', auth: { username: 'OmzRbS', password: '9blCjmBKmH' } };
global.axiosProxy2  ={ host: '45.88.149.19', port: 8000, protocol: 'https', auth: { username: 'OmzRbS', password: '9blCjmBKmH' } };


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// Получаем бренд лист и категории товаров для выбранного каталога
async function PARSER_GetBrandAndCategoriesList(currCatalog) {
    let isResult = false
    let needGetData = true

    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            // Загрузим бренды
            // const url = `https://catalog.wb.ru/catalog/${currCatalog.catalogParam.shard}/v6/filters?ab_testing=false&appType=1&${currCatalog.catalogParam.query}&curr=rub&dest=-3390370&filters=ffbrand&spp=30`
            // await axios.get(url, {proxy: global.axiosProxy}).then(response => {
            //     const resData = response.data
            //     if (resData?.data?.filters[0]) {
            //         currCatalog.brandList = resData?.data?.filters[0].items
            //     }})
            // Загрузим бренды
            const url2 = `https://catalog.wb.ru/catalog/${currCatalog.catalogParam.shard}/v6/filters?ab_testing=false&appType=1&${currCatalog.catalogParam.query}&curr=rub&dest=-3390370&filters=xsubject&spp=30`
            await axios.get(url2, {proxy: global.axiosProxy}).then(response => {
                const resData = response.data
                if (resData?.data?.filters[0]) {
                    currCatalog.subjectList = resData?.data?.filters[0].items
                    // console.log(currCatalog.subjectList);
                }})
            needGetData = false
            isResult = true
        } catch (err) {
            needGetData = false
            console.log(err);
            if (err.code === 'ECONNRESET') {
                saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Словили ECONNRESET')
                await delay(50);
                needGetData = true
            }

            if ((err.status === 429) || (err.response?.status === 429)) {
                saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Частое подключение к серверу')
                await delay(50);
                needGetData = true
            }
        }
    }
    return isResult
}

async function PARSER_GetIDInfo(id,subject,kind, brand) {
    let catalogId = -1
    let needGetData = true

    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            // const url2 ='https://www.wildberries.ru/webapi/product/145561667/data?subject=80&kind=7&brand=310866989'
            const url2 =`https://www.wildberries.ru/webapi/product/${id}/data?subject=${subject}&kind=${kind}&brand=${brand}`

            const res =  await axios.post(url2, {proxy: global.axiosProxy}).then(response => {
                const resData = response.data

                try {catalogId = resData.value.data.sitePath.at(-2).id} catch (err) {
                    // console.log(err);
                }

            })

            needGetData = false
            isResult = true
        } catch (err) {
            needGetData = false
            // console.log(err);
            // if (err.code === 'ECONNRESET') {
            //     saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Словили ECONNRESET')
            //     await delay(50);
            //     needGetData = true
            // }
            //
            // if ((err.status === 429) || (err.response?.status === 429)) {
            //     saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Частое подключение к серверу')
            //     await delay(50);
            //     needGetData = true
            // }
        }
    }
    return catalogId
}

async function PARSER_GetIAbout(url) {

    let needGetData = true
    let aboutData = {}
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {

            const res =  await axios.get(url, {proxy: global.axiosProxy}).then(response => {
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

        } catch (err) {
            needGetData = false
            console.log(err);
            if (err.code === 'ECONNRESET') {
                saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Словили ECONNRESET')
                await delay(50);
                needGetData = true
            }

            if ((err.status === 429) || (err.response?.status === 429)) {
                saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Частое подключение к серверу')
                await delay(50);
                needGetData = true
            }
        }
    }
    return aboutData
}

async function PARSER_GetIdInfo(id) {

    let needGetData = true
    let infoData = {}
    while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
        try {
            const url = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-3390370&spp=30&ab_testing=false&nm=`+parseInt(id).toString()
            const res =  await axios.get(url, {proxy: global.axiosProxy}).then(response => {


                try {
                    let resData = response.data.data.products[0]

                    let price = 0
                    let basicPrice = 0
                    let discount = 0
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
                    }

                    infoData = data
                } catch (err) {console.log(err);                  }


            })

            needGetData = false

        } catch (err) {
            needGetData = false
            console.log(err);
            if (err.code === 'ECONNRESET') {
                saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Словили ECONNRESET')
                await delay(50);
                needGetData = true
            }

            if ((err.status === 429) || (err.response?.status === 429)) {
                saveErrorLog('PARSER_GetBrandAndCategoriesList', 'Частое подключение к серверу')
                await delay(50);
                needGetData = true
            }
        }
    }
    return infoData
}

async function PARSER_GetSupplierSubjects(supplierId) {
    let supplierSubjectsList = []
    let needGetData = true
    let proxy = global.axiosProxy




        needGetData = true
        while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
            try {

                const url2 =`https://catalog.wb.ru/sellers/v8/filters?ab_testing=false&appType=1&curr=rub&dest=12358291&filters=xsubject&spp=30&supplier=${supplierId}`
                await axios.get(url2, {proxy: proxy}).then(response => {
                    const resData = response.data

                    try {if (resData.data.filters[0]) supplierSubjectsList = resData.data.filters[0].items} catch (e) {}

                })
                needGetData = false

            } catch (err) {
                needGetData = false

                if (err.code === 'ECONNRESET') {
                    saveErrorLog('PARSER_GetCurrProductList', 'Словили ECONNRESET')
                    await delay(50);
                    needGetData = true
                }

                if ((err.status === 429) || (err.response?.status === 429)) {
                    console.log('Частое подключение к серверу');
                    await delay(50);
                    needGetData = true
                }
            }
        }

    return supplierSubjectsList
}

// Получаем список товарв для выбранного предмета и типа сортировки
async function PARSER_SupplierProductIDList(supplierId, maxPage=30){
    let idList = []
    let onlyIdList = []
    let needGetData = true
    let needGetNextProducts = true
    let isProxyOne = true
    let proxy = global.axiosProxy

    const supplierSubjectsList = await PARSER_GetSupplierSubjects(supplierId)


    for (let i = 1; i <= maxPage; i++) {
        let page = i
        needGetData = true
        while (needGetData) {  // Делаем в цикле т.к. вдруг вылетит частое подключение к серверу то перезапустим
            try {


                const url2 =`https://catalog.wb.ru/sellers/v2/catalog?ab_testing=false&appType=1&curr=rub&dest=12358291&lang=ru&page=${page}&sort=popular&spp=30&supplier=${supplierId}`
                await axios.get(url2, {proxy: proxy}).then(response => {
                    const resData = response.data
                    if (resData?.data?.products) {

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

            } catch (err) {
                needGetData = false

                if (err.code === 'ECONNRESET') {
                    saveErrorLog('PARSER_GetCurrProductList', 'Словили ECONNRESET')
                    await delay(50);
                    needGetData = true
                }

                if ((err.status === 429) || (err.response?.status === 429)) {
                    console.log('Частое подключение к серверу');
                    if (isProxyOne)  proxy = global.axiosProxy2
                    else proxy = global.axiosProxy
                    isProxyOne = !isProxyOne

                    await delay(50);
                    needGetData = true
                }
            }
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
                await axios.get(url, {proxy: global.axiosProxy}).then(response => {
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
        } catch (error) {
            console.log(error);
            needGetData = false
            console.log('error ' + error.response?.status);
            saveErrorLog('wbParserFunctions', `Ошибка в PARSER_GetBrandsAndSubjectsList в разделе `+catalogParam.name+'  id '+catalogParam.id)
            saveErrorLog('wbParserFunctions', error)
            // TODO: Сделать механизм отработки 429 ошибки универсальным для всех парсер функций c переключением прокси и т.п.
            let code429 = false
            if (error.status) if (error.status === 429) code429 = true
            if (error.response?.status) if (error.response?.status === 429) code429 = true
            if (code429) {
                saveParserProductListLog(catalogParam.name, 'Частое подключение к серверу')
                await delay(50);
                needGetData = true
            }  // console.log(err.message);


        }
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

            await axios.get(url, {proxy: global.axiosProxy}).then(response => {
                const resData = response.data

                if (resData.data) {
                    console.log('-------------------->   '+resData.data.products.length);
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
        } catch (err) {
            needGetData = false
            // TODO: Удалить
            console.log(' ---------  error  -------');
            console.log(err);
            //TODO: ENETUNREACH Обработать когда нет интернета!!

            if (err.code === 'ECONNRESET') {
                await delay(50);
                needGetData = true
            }

            if ((err.status === 429) || (err.response?.status === 429)) {
                await delay(50);
                needGetData = true
            }

        }
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

            await axios.get(url, {proxy: global.axiosProxy}).then(response => {
                const resData = response.data

                if (resData.data) {
                    console.log('-------------------->   '+resData.data.products.length);
                    for (let i in resData.data.products){
                        const currProduct = resData.data.products[i]
                        const totalQuantity = currProduct.totalQuantity?         parseInt(currProduct.totalQuantity)      : 0
                        // Если остатков товара больше 0  то найдем цену
                        let price = -1
                        let basicPrice = -1
                        let discount = 0
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
                        // Далее сохраним необходимую инфомацию в обьекте
                        let priceHistory_tmp = []

                        for (let i in productIdList) {
                            if (productIdList[i].id === currProduct?.id) {
                                priceHistory_tmp = productIdList[i].priceHistory
                                // Если остатки нулевые возмем цену из товара
                                if (totalQuantity ===0){
                                    price =  productIdList[i].price
                                    basicPrice = price
                                    discount = 0
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
                            discount        : discount,
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
        } catch (err) {
            needGetData = false
            // TODO: Удалить
            console.log(' ---------  error  -------');
            console.log(err);
            //TODO: ENETUNREACH Обработать когда нет интернета!!

            if (err.code === 'ECONNRESET') {
                await delay(50);
                needGetData = true
            }

            if ((err.status === 429) || (err.response?.status === 429)) {
                await delay(50);
                needGetData = true
            }

        }
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
    let isProxyOne = true
    let proxy = global.axiosProxy
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
                await axios.get(url, {proxy: proxy}).then(response => {
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

            } catch (err) {
                needGetData = false

                if (err.code === 'ECONNRESET') {
                    saveErrorLog('PARSER_GetCurrProductList', 'Словили ECONNRESET')
                    await delay(50);
                    needGetData = true
                }

                if ((err.status === 429) || (err.response?.status === 429)) {
                    console.log('Частое подключение к серверу');
                    if (isProxyOne)  proxy = global.axiosProxy2
                    else proxy = global.axiosProxy
                    isProxyOne = !isProxyOne

                    await delay(50);
                    needGetData = true
                }
            }
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
    PARSER_GetProductPositionToClient
}
