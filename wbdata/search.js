

const sequelize = require("../db");
const {DataTypes} = require("sequelize");
const fs = require("fs");
const levenshtein = require('fast-levenshtein');

class MySearch {

    SearchData = sequelize.define('searchData',{
            id                 :   {type: DataTypes.INTEGER, primaryKey: true},
            searchDataArray    :   {type: DataTypes.JSON},       // Массив поисковых запросов со список каталогов и предметов соотв поисковой строке
            addInfo            :   {type: DataTypes.JSON},       // доп Информация

        },
        { createdAt: false,   updatedAt: false  }  )

    searchArray  = []
    constructor() {

        this.loadSearchArray().then(()=>{
            // this.getSearchParam('Электротренажер для пресса')
        })

    }

    async loadSearchArray(){
        this.searchArray =  await this.SearchData.findOne({where : {id : 1}})
        console.log('Поисковые фразы загружены');


    }

    async saveSearchArrayToJsonFile (){

        let  time2 = performance.now()
        console.log('--- Сохраняем в файл allSearch.txt ---');
        let fs = require('fs');
        // await fs.writeFile('log/allSearch.txt', JSON.stringify(this.searchArray.searchDataArray), function(err) {
        //     if (err) { console.log(err);  }}, null);

        console.log('-----------------  result  ---------------------');

        // Чтение из файла
        // const a = await fs.readFileSync('log/allSearch.txt', 'utf8')
        // const jsonData = JSON.parse(a)
        // console.log(jsonData[0]);


        let time1 = performance.now()
        console.log(`Затраченное время ${(time1 - time2)/1000} сек`)

        return 'saveSearchArrayToJsonFile Ok'
    }


    // Определение параметров запроса для сервера исходя из поисковой фразы
    getSearchParam(query){
        let  time2 = performance.now()
        // console.log('--------------------------');
        // console.log('производим поиск');
        let minDest = 1000

        let res = {}
        for (let i in this.searchArray.searchDataArray){
            const crDist  = levenshtein.get(this.searchArray.searchDataArray[i].searchWord, query);
            if (minDest > crDist) {
                res = this.searchArray.searchDataArray[i]
                minDest = crDist
            }
        }
        // console.log('-----------------  result  ---------------------');
        // console.log(res);
        // console.log('minDest = '+minDest);
        // let time1 = performance.now()
        // console.log(`Затраченное время ${(time1 - time2)/1000} сек`)
        return res

    }

    async testSearch (){



        return 'testOk'
    }


}

module.exports = new  MySearch()
