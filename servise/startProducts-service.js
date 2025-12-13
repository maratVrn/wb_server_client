const sequelize = require("../db");

const {DataTypes} = require("sequelize");
const fs = require('fs');
const {PARSER_GetProductListPriceInfo, PARSER_LoadMiddlePhotoUrl} = require("../wbdata/wbParserFunctions");

class StartProductsService{


    StartProducts = sequelize.define('startProducts',{
            id                 :   {type: DataTypes.INTEGER, primaryKey: true},
            startDiscount      :   {type: DataTypes.INTEGER},
            startQty           :   {type: DataTypes.INTEGER},
            startPrice         :   {type: DataTypes.INTEGER},
        },
        { createdAt: false,   updatedAt: false  }  )

    // StartProducts = wbData.define('startProducts',{
    //         id                 :   {type: DataTypes.INTEGER, primaryKey: true},
    //         startDiscount      :   {type: DataTypes.INTEGER},
    //         startQty           :   {type: DataTypes.INTEGER},
    //         startPrice         :   {type: DataTypes.INTEGER},
    //     },
    //     { createdAt: false,   updatedAt: false  }  )


    async loadStartProducts(needDelete, deleteIdList){
        let result =[]

        if (needDelete) await this.StartProducts.destroy({where: {id: deleteIdList}})
        const startProducts = await this.StartProducts.findAll()

        let productList = []
        for (let k in startProducts)
            productList.push(startProducts[k].id)


        const updateProductListInfo = await PARSER_GetProductListPriceInfo(productList)

        for (let z in updateProductListInfo)
            for (let k in startProducts)
                if (updateProductListInfo[z].id === startProducts[k].id){

                    let  addDiscount = 0
                    try {addDiscount = Math.round(-1000*(updateProductListInfo[z].price - startProducts[k].startPrice)/(startProducts[k].startPrice+0.1))/10} catch (e) {addDiscount = 0}
                    const nowDiscount =  Math.round(startProducts[k].startDiscount+addDiscount)

                    result.push({
                        id               : startProducts[k].id,
                        startDiscount    : startProducts[k].startDiscount,
                        discount         : nowDiscount,
                        startQty         : startProducts[k].startQty,
                        startPrice       : startProducts[k].startPrice,
                        name             : updateProductListInfo[z].name,
                        crPrice          : updateProductListInfo[z].price,
                        price            : updateProductListInfo[z].price,
                        photoUrl         : PARSER_LoadMiddlePhotoUrl(startProducts[k].id),
                        crQty            : updateProductListInfo[z].totalQuantity,
                        totalQuantity    : updateProductListInfo[z].totalQuantity,
                        brand            : updateProductListInfo[z].brand ,
                        supplier	     : updateProductListInfo[z].supplier,
                        reviewRating     : updateProductListInfo[z].reviewRating,
                        subjectId        : updateProductListInfo[z].subjectId,
                        feedbacks        : updateProductListInfo[z].feedbacks,
                        // crDiscount :
                    })
                    break
                }




        return  result
    }

    async addStartProduct(id, startDiscount, startQty, startPrice){
        const oneAddProduct = [{id:id, startDiscount : startDiscount, startQty : startQty, startPrice : startPrice}]
        const res = await this.StartProducts.bulkCreate(oneAddProduct,{    updateOnDuplicate: ["startDiscount", "startQty", "startPrice"] }).then(() => {})
        return  res
    }



    // // Сохраняем данные а файл для отладки
    // async saveSearchDataToFile(){
    //     let result = ' Данные сохранены '
    //     try {
    //         const searchArray = await this.SearchData.findAll()
    //         let str = JSON.stringify(searchArray)
    //         let fs = require('fs');
    //         fs.writeFile("log/searchArray.txt", str, function (err) {
    //             if (err) {
    //                 console.log(err);
    //             }
    //         })
    //     } catch (e) { console.log(e); result = 'Ошибка сохранения'}
    //     return result
    //
    // }
    //
    // async loadSearchDataFromFile(){
    //     let result = 'Загрузка завершена'
    //     try {
    //         let newDataJSON = []
    //
    //         const newData = fs.readFileSync("log/searchArray.txt" , "utf-8");
    //         newDataJSON = JSON.parse(newData)
    //
    //         console.log(newDataJSON.length);
    //         const res = await this.SearchData.bulkCreate(newDataJSON,{    updateOnDuplicate: ["searchDataArray","addInfo"] }).then(() => {
    //             console.log('Загрузка завершена');
    //
    //         })
    //
    //
    //     } catch (e){ console.log(e);   result = 'Ошибка загрузки данных '}
    //
    //     return result;        return result
    //
    // }
    //
    //


}

module.exports = new StartProductsService()