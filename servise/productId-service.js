const sequelize = require("../db");
const {DataTypes} = require("sequelize");
const { Op } = require("sequelize");
const {saveErrorLog, saveParserFuncLog} = require("./log");


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// ********************************************************************************************************************
//                                  СЕРВИС РАБОТЫ СО СПИСКОМ ВОЗМОЖНЫХ ИД НА ВБ
//      Идея в том что мы храним много разных таблиц  wb_productIdList + Индекс от 1 и до 250
//      В Каждой таблице по ID_STEP_FOR_ONE_TABLE (1 млн) млн записей
//      Соотв таблицеа с nameIdx = 5 означает что в ней ид от 4_000_001 до 5_000_000 ИД-ков
//      Серввис позволяет создавать таблицы
// ********************************************************************************************************************



class ProductIdService {

    WBProductIdTable = sequelize.define('test',{
            id:{type: DataTypes.INTEGER, primaryKey: true},  // Соответсвует id карточки товара
            catalogId :{type: DataTypes.INTEGER},            // Ид каталога в который входит этот товар
        },
        { createdAt: false, updatedAt: false }
    )



    // Получаем информацию по выбранному ИД в базе данных
    async getIdInfo (id){
        let result = []
        let idInt = parseInt(id)
        if (idInt>0) {
            this.WBProductIdTable.tableName ='wb_productIdListAll'
            await this.WBProductIdTable.sync({ alter: true })
            // result = await this.WBProductIdTable.findOne({where:  { id  : { [Op.gte]: id }}})

            result = await this.WBProductIdTable.findOne({where: {id:idInt}})

        }
        return result
    }



    // Собираем информацию по ид и помещаем в мэп массив для простого доступа к инф-мм
    async getControlIdListByList (onlyIdList){
        const controlIdList = new Map()
        let idInfoList = []
        if (onlyIdList.length>0) {
            this.WBProductIdTable.tableName ='wb_productIdListAll'
            await this.WBProductIdTable.sync({ alter: true })
            idInfoList = await this.WBProductIdTable.findAll({where:
                    {id:{
                            [Op.in]: onlyIdList
                        }}

            })
        }
        if (idInfoList.length>0){


            for (let i in onlyIdList) {
                let isNoInBase = true
                for (let k in idInfoList)
                    if (idInfoList[k].id === onlyIdList[i]){

                        if (controlIdList.has(idInfoList[k].catalogId)) {
                            controlIdList.set(idInfoList[k].catalogId, [...controlIdList.get(idInfoList[k].catalogId), onlyIdList[i]])
                        } else controlIdList.set(idInfoList[k].catalogId, [onlyIdList[i]])
                        isNoInBase = false
                        break
                    }
                // Если товара нет в базе то моещаем его с key = 0 те отсортируем все их по отдельному ключу
                if (isNoInBase) {
                    if (controlIdList.has(0)) {
                        controlIdList.set(0, [...controlIdList.get(0), onlyIdList[i]])
                    } else controlIdList.set(0, [onlyIdList[i]])
                }

            }

        }
        return controlIdList
    }



}

module.exports = new ProductIdService()
