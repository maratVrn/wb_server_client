// Класс для работы со списком товаров внутри каталога
const sequelize = require("../db");
const {DataTypes, Op} = require("sequelize");
const {saveErrorLog, saveParserFuncLog} = require('../servise/log')


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductListService {

    WBCatalogProductList = sequelize.define('test_ok',{
            id              :   {type: DataTypes.INTEGER, primaryKey: true},
            maxPrice        :   {type: DataTypes.INTEGER},          // максимальная цена товара
            price           :   {type: DataTypes.INTEGER},          // максимальная цена товара
            reviewRating	:   {type: DataTypes.FLOAT},            // Рейтинг товара ПО Обзорам
            discount        :   {type: DataTypes.FLOAT},            // текущая скида
            subjectId       :   {type: DataTypes.INTEGER},          // ИД Позиции в предмета
            brandId         :   {type: DataTypes.INTEGER},          // ИД Позиции в бренда
            saleCount       :   {type: DataTypes.INTEGER},          // Обьем продаж за последний месяц
            totalQuantity   :   {type: DataTypes.INTEGER},          // Остатки последние
            saleMoney       :   {type: DataTypes.INTEGER},          // Обьем продаж за последний месяц в руб
            priceHistory:{type: DataTypes.JSON},         // История изменения цены Берем с первой позиции в sizes basic (БЕЗ скидки) и product	(со скидкой) - все в в ите чтобы проще хранить
            // countHistory:{type: DataTypes.JSON},         // История кол-ва товаров - берем только totalQuantity

        },
        { createdAt: false,   updatedAt: false  }  )


    // Проверяем наличие таблицы в базе данных по catalogId и создаем/обновляем параметры таблицы
    async checkTableName (catalogId){
        let result = false
        try {
            if (catalogId)
                if (parseInt(catalogId))
                    if (parseInt(catalogId) > 0) {
                        this.WBCatalogProductList.tableName ='productList'+ catalogId.toString()
                        //проверим существует ли таблица // либо создадим таблицу либо обновим ее поля
                        await this.WBCatalogProductList.sync({ alter: true })
                        result = true
                    }
            if (parseInt(catalogId) === 0) {

                this.WBCatalogProductList.tableName = 'productListNOID'
                //проверим существует ли таблица // либо создадим таблицу либо обновим ее поля
                await this.WBCatalogProductList.sync({alter: true})
                result = true
            }

        } catch (error) {
            saveErrorLog('productListService',`Ошибка в checkTableName при catalogId = `+catalogId.toString())
            saveErrorLog('productListService', error)
        }
        return result
    }


    // Тестовая функция
    async test (){
        let testResult = ['tut 1']


        console.log('isOk');
        return testResult
    }



    // ************************* Функции доступа к данным для клиентской части к таблицам таблицами productList *****************************
    // TODO:  Это должно быть реализовани в отдельном сервере
    async getProductList(catalogId){
        const isTable = await this.checkTableName(catalogId)
        let result = []
        if (isTable) try {

            console.log('юху');
            const data = await this.WBCatalogProductList.findAll({limit: 20, order: [['id']]})
            if (data) result = data
        }

        catch (error) {
            saveErrorLog('productListService',`Ошибка в checkId tableId `+catalogId+'  id = '+id)
            saveErrorLog('productListService', error)
            console.log(error);
        }

        return result
    }

    async getProductInfo(idInfo){

        let result = []

        if (idInfo.catalogId) {
            const isTable = await this.checkTableName(idInfo.catalogId)

            if (isTable)
                if (idInfo.id)
                try {
                    const id = parseInt(idInfo.id)
                    const data = await this.WBCatalogProductList.findOne({where: {id:id}})
                    if (data) result = data
            }

            catch (error) {console.log(error);  }
        }

        return result
    }

    async getProductInfoList(idList, catalogId){
        let result = []
        if (catalogId>0) {
            const isTable = await this.checkTableName(catalogId)
            if (isTable)
                try {result = await this.WBCatalogProductList.findAll({where: {id:{ [Op.in]: idList}}})}
                    catch (error) {console.log(error);  }
        }
        return result
    }

}

module.exports = new ProductListService()
