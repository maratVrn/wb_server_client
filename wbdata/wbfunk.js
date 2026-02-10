const fs = require("fs");



function getPriceFromHistoryLight (history = [], dayCount = 30 ){


    let startDateInBase = ''                        // С Какой даты товар в базе
    let AllHistory = []
    let crDate = new Date()
    crDate.setDate(crDate.getDate() - dayCount);

    let needStartI = 0

    for (let i =history.length-1 ; i>=0; i--){
        const s = history[i].d.split('.')
        const nowDate = new Date(s[2]+'-'+s[1]+'-'+s[0]);
        if (nowDate <= crDate) {
            needStartI = i
            break
        }
    }



    let crHistory = {}


    // Сначала соберем полный массив цен с учетом пропусков
    if (history?.length >0) {
        startDateInBase = history[needStartI].d
        const s = startDateInBase.split('.')
        crDate = new Date(s[2]+'-'+s[1]+'-'+s[0]);
        crHistory = history[needStartI]
        AllHistory.push(crHistory.sp)
    }


    for (let i =needStartI+1 ; i<history.length; i++){

        let needNextDay = true
        let counter = 0
        while (needNextDay){
            counter++
            crDate.setDate(crDate.getDate() + 1);

            const s = history[i].d.split('.')
            const nd = new Date(s[2]+'-'+s[1]+'-'+s[0]);


            if (nd<crDate) needNextDay = false
            else {
                if (crDate.toLocaleDateString() === history[i].d) {
                    crHistory = history[i]
                    AllHistory.push(crHistory.sp > 0 ? crHistory.sp : AllHistory.at(-1))
                    needNextDay = false
                } else {
                    AllHistory.push(crHistory.sp > 0 ? crHistory.sp : AllHistory.at(-1))
                }
                if (counter > 365) needNextDay = false // Исключим случай если год не менялась цена
            }


        }
    }
    let needHistory = []
    if (AllHistory.length>dayCount) needHistory = AllHistory.slice(AllHistory.length-dayCount, AllHistory.length)
    else needHistory = AllHistory

    return  needHistory
}
function calcDiscount (history = []){
    const dayCalc = 90
    const priceArray= getPriceFromHistoryLight(history, dayCalc)
    let isDataCalc = false
    let endPrice = priceArray.at(-1)

    let medianPrice = 0
    let discount2 = 0
    // Правильнее по медиане посчитать
    if (endPrice>0)
        if (priceArray.length >= dayCalc/2) {
            priceArray.sort(function (a, b) {return b - a;})
            medianPrice = priceArray[Math.round(priceArray.length / 2)]
            discount2 = Math.round(100 * (medianPrice - endPrice) / medianPrice)
            isDataCalc = true
        }

    return {isDataCalc : isDataCalc, meanPrice : medianPrice, discount : discount2}
}

async function saveProductLIstInfoToCVS(productList,productListInfo ){


    let filteredNumbers =  [].concat(productList);
    let jsonData = ''
    let jsonDataNull = ''

    // Подготовим списки на сохранение данных
    for (let i in productListInfo){
        //  получим список ид на которые не нашлось информации
        filteredNumbers = filteredNumbers.filter((id) => id !== parseInt(productListInfo[i].id));
        const addLine = productListInfo[i].id+'\t'+productListInfo[i].subjectId+'\t'+ productListInfo[i].totalQuantity+`\n`

        if (parseInt(productListInfo[i].totalQuantity)>3) jsonData += addLine // Если кол-во больше нуля то это живая карточка товара
            else jsonDataNull += addLine // Если меньше то неактивная

    }
    const header = `id\tsubjectId\ttotalQuantity\n`

    // console.log(jsonDataNull);

    const fs = require('fs');

    // Сохраним живые карточки товаров
    const productFileName = "products.cvs"
    fs.stat( productFileName, (error, stats) => {
        // fs.appendFileSync(productFileName + ".cvs", header, function(err) { })
        fs.appendFileSync(productFileName + ".cvs", jsonData, function(err) { if (err) {   console.log(err);}  });
    })

    // Сохраним карточки с нулевыми остатками
    const productFileNameNull = "productsNull.cvs"
    fs.stat( productFileNameNull, (error, stats) => {
        // fs.appendFileSync(productFileNameNull + ".cvs", header, function(err) { })
        fs.appendFileSync(productFileNameNull + ".cvs", jsonDataNull, function(err) { if (err) {   console.log(err);}  });
    })

    // Сохраним не используемые ид
    const productFileNameNoId = "productsNoId.cvs"
    fs.stat( productFileNameNoId, (error, stats) => {

        fs.appendFileSync(productFileNameNoId + ".cvs", filteredNumbers.toString()+',', function(err) { if (err) {   console.log(err);}  });
    })


}


module.exports = {
    getPriceFromHistoryLight, calcDiscount
}
