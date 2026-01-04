const fs = require("fs");
const noIdCatalogInclude = [1234, 131289, 61037, 1235]



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


// Сохранение данных в файлу при загрузке данных
async function saveProductListToCVSFromLoadData(data, fName, brandName){
    const fileName = fName + '.cvs'

    let jsonData = ''


    for (var key in data)
        // TODO: Тут руслан просил только те кто не со склада вб выгрузить поэтому не все сохраняет
        if (parseInt(data[key].dtype) !== 2)
            jsonData += data[key].id+'\t'+data[key].subjectId+'\t'+ data[key].dtype+'\t'+data[key].promoTextCard  +'\t'+
                    parseInt(data[key].priceU)+'\t'+data[key].sale+'\t'+ parseInt(data[key].salePriceU) +`\n`


    // jsonData += data[key].id+'\t'+data[key].name+'\t'+ parseInt(data[key].priceU)+'\t'+data[key].sale+'\t'+ parseInt(data[key].salePriceU)+
        //     '\t' + data[key].dtype+'\t'+data[key].brandId+'\t'+brandName+'\t'+data[key].subjectId+'\t'+data[key].totalQuantity+`\n`

    fs.stat(String(fileName), (error, stats) => {
       try {
           stats.isFile()
       } catch {
           // const header = `id (Артикул)\tНазвание\tЦена\tЦена со скидкой\tСкидка\tdtype\tbrandId\tБрэнд\tsubjectId\ttotalQuantity\n`
           const header = `id товара\tid предмета\tdtype\tАкция\tЦена\tЦена со скидкой\tСкидка\n`

           fs.appendFileSync(String(fileName) , header, function(err) {

           })
       }

        fs.appendFileSync(String(fileName),  jsonData, function(err) {
            if (err) {
                console.log(err);
            }
        });
    })
}

module.exports = {
       saveProductLIstInfoToCVS
}
