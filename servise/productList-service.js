// Класс для работы со списком товаров внутри каталога
const sequelize = require("../db");
const {DataTypes, Op} = require("sequelize");
const {saveErrorLog, saveParserFuncLog} = require('../servise/log')
const ProductIdService = require('../servise/productId-service')

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProductListService {

    WBCatalogProductList = sequelize.define('test_ok',{
            id              :   {type: DataTypes.INTEGER, primaryKey: true},
            price           :   {type: DataTypes.INTEGER},          // максимальная цена товара
            reviewRating	:   {type: DataTypes.FLOAT},            // Рейтинг товара ПО Обзорам
            subjectId       :   {type: DataTypes.INTEGER},          // ИД Позиции в предмета
            brandId         :   {type: DataTypes.INTEGER},          // ИД Позиции в бренда
            totalQuantity   :   {type: DataTypes.INTEGER},          // Остатки последние
            priceHistory    :   {type: DataTypes.JSON},             // История изменения цены Берем с первой позиции в sizes basic (БЕЗ скидки) и product	(со скидкой) - все в в ите чтобы проще хранить
            discount	    :   {type: DataTypes.FLOAT},            // Расчетная скидка товара

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



    // ************************* Функции доступа к данным для клиентской части к таблицам таблицами productList *****************************
    // TODO:  Это должно быть реализовани в отдельном сервере
    async getProductList(param){

        // console.log(param);
        const catalogId = param.catalogID? param.catalogID : null
        const idCount = param.idCount? parseInt(param.idCount) : 100

        let result = []

        if (catalogId) {
            const isTable = await this.checkTableName(catalogId)
            if (isTable) try {
                let whereParam = {totalQuantity: {[Op.gt]: 2 }, reviewRating: {[Op.gt]: 3 } , discount: {[Op.lte]: 90 }}
                // if (param.filters)
                if (param.filters.isXsubjectFilterChecked) whereParam.subjectId =   {[Op.or]: param.filters.xSubjectIdArray}

                if (param.filters.usePriceMin) whereParam.price =   {[Op.gte]: param.filters.priceMin}
                if (param.filters.usePriceMax) whereParam.price =   {[Op.lte]: param.filters.priceMax}
                if ((param.filters.usePriceMin) && (param.filters.usePriceMax)) whereParam.price =   {[Op.between]: [param.filters.priceMin-1,param.filters.priceMax+1]}


                const data = await this.WBCatalogProductList.findAll({
                    limit: idCount, order: [
                        ['discount', 'DESC']  // Получаем поля с максимальными продажами
                    ],

                    where: whereParam
                })
                        if (data) result = data
            } catch (error) {
                saveErrorLog('productListService', `Ошибка в checkId tableId ` + catalogId + '  id = ')
                saveErrorLog('productListService', error)
                console.log(error);
            }
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


    // удаляем товары которых больше нет на вб по ним saleCount равно null
    async deleteZeroID() {

        console.log('tut');
        let allIdToDeleteCount = 0

        const allTablesName = await sequelize.getQueryInterface().showAllTables()
        if (allTablesName)
            for (let i = 0; i < allTablesName.length; i ++)
            {
                const tableName = allTablesName[i]
                if (tableName.toString().includes('productList') && !tableName.toString().includes('all'))  {

                    this.WBCatalogProductList.tableName = tableName
                    console.log(i+ '  ' + tableName);

                    const data = await this.WBCatalogProductList.findAll({where:{saleCount:null}})


                    if (data.length > 0) {


                        allIdToDeleteCount+=data.length
                        const IdList = []
                        // let idListString = ''

                        for (let j in data) {
                            IdList.push(data[j].id)
                            // idListString += data[j].id.toString()+' '
                        }
                        console.log('    ------------Удаляем   '+data.length);

                        // await data.destroy()

                        // saveErrorLog('deleteId', '    ---------------------------------------------         ')
                        // saveErrorLog('deleteId', 'Список нерабочих ид в '+tableName+' всего '+ IdList.length)
                        // saveErrorLog('deleteId', idListString)




                    }


                }
                if (i > 5) break
            }
        saveErrorLog('deleteId','     ---------------------------------------------         ')
        saveErrorLog('deleteId','Всег надо удалить '+ allIdToDeleteCount)



    }
}

module.exports = new ProductListService()
