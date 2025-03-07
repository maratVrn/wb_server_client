const sequelize = require("../db");
const {DataTypes} = require("sequelize");

const fs = require('fs');

class WordStatisticService{
    AWordStatistic = sequelize.define('test_ok',{
            id                  :   {type: DataTypes.INTEGER, primaryKey: true},
            wordSearch          :   {type: DataTypes.STRING},     // Поисковый запрос
            trendPower          :   {type: DataTypes.INTEGER},    // Сила тренда - поисковые запросы которые растут в колл-ве
            endCountSearch      :   {type: DataTypes.INTEGER},    // последнее кол-во запросов
            endCountDate	    :   {type: DataTypes.DATE},       // Дата когда обновлена инф-я о кол-ве
            searchCountHistory  :   {type: DataTypes.JSON},       // История изменения кол-ва запросов

        },
        { createdAt: false,   updatedAt: false  }  )
    // Тестовая функция
    async test (){
        let testResult = ['tut 1']


        console.log('isOk');
        return testResult
    }
}

module.exports = new WordStatisticService()