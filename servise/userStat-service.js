const {DataTypes} = require("sequelize");
const {Sequelize} = require('sequelize')

class UserStatService{


    wbUsers = new Sequelize('wb_users', 'postgres', 'admin', {
        host: 'localhost',
        dialect: 'postgres',
        logging: false
    });

    maxActionCount = 100  // Максимальное кол-во действий разрешенное для IP

    statInfo = {Date, crDate : '', statIPInfo : []}

    users = this.wbUsers.define('users',{
            id              :   {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            name            :   {type: DataTypes.STRING},
            email           :   {type: DataTypes.STRING},
            password        :   {type: DataTypes.STRING},
            token           :   {type: DataTypes.STRING},
            role            :   {type: DataTypes.STRING},
            apl             :   {type: DataTypes.STRING},  // используем для изменения пароля если забыли
            needUpdateProducts :  {type: DataTypes.BOOLEAN}, // Есть ли продукты для обновления данных
            userParam       :   {type: DataTypes.JSON},
        },
        { createdAt: false,   updatedAt: false  }  )

    statInfoDB = this.wbUsers.define('statInfo',{
            id              :   {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            Date            :   {type: DataTypes.DATE},
            crDate          :   {type: DataTypes.STRING},
            statIPInfo      :   {type: DataTypes.JSON},       // Формат хранения статистики данных за день в виде массива
                            // statIPInfo : [
                            //             {
                            //                 endEntryTime : 0,       // Последнее время в милиссекундах на вход
                            //                 ip : '',                // IP
                            //                 ipInt : 0,              // IP  в цифре для упрощенного поиска
                            //                 entryCount : 0,         // кол-во входа в систему (если прошло пол часа то считается следущий вход)
                            //                 viewProductCount : 0,   // колл-во просмотров товара
                            //                 searchCount : 0,        // Кол-во поисковых запросов
                            //                 wbTransitCount : 0,     // кол-во переходов на вб
                            //                 productListCount : 0,   // Просмотры продукт листов
                            //                 allActionCount : 0      // общее кол-во действий за сегодня (если ограниченно то выдаем ошибку что больше нельзя)
                            //             }
                            //         ]
        },
        { createdAt: false,   updatedAt: false  }  )


    async startDb(){
        await this.wbUsers.authenticate()
        await this.wbUsers.sync()
        // Загрузим или создадим статистику на сегодня
        try {
            let now = new Date()
            let dateStr = now.toLocaleDateString()
            const crStat = await this.statInfoDB.findOne({where: {crDate: dateStr}})
            if (crStat) this.statInfo = crStat
            else {
                const crStatInfo =  {Date : now, crDate : dateStr, statIPInfo : []}
                this.statInfo = await this.statInfoDB.create(crStatInfo)
            }
        } catch (e) {console.log(e);}

    }
    async saveCurrStatData() {
        await this.statInfoDB.update({statIPInfo: this.statInfo.statIPInfo,}, {where: {id: this.statInfo.id,}})

        let now = new Date()
        let dateStr = now.toLocaleDateString()
        if (this.statInfo.crDate !== dateStr){
            this.statInfo = await this.statInfoDB.create({Date : now, crDate : dateStr, statIPInfo : []})
        }

    }
    // Добавляем в статистику данные о действиях IP ка за сегодня а также проверяем кол-во совершенных действий если более то ставим запрает на получение данных
    async addIpInfo(ip, actionVariant = 'startEntry'){
        let now = new Date()
        // console.log(now.toLocaleDateString()+',  '+now.toLocaleTimeString());
        const crIP = ip.replace(", 127.0.0.1", "")
        // console.log(crIP);
        const crIPInt = parseInt((crIP.replace(".", "")).replace(".", ""))

        let isInStat = false // уэе есть этот IP в статистике
        let crI = -1
        for (let i in this.statInfo.statIPInfo) if (this.statInfo.statIPInfo[i].ipInt === crIPInt){
            isInStat = true
            crI = parseInt(i)
            break
        }
        if (isInStat) {
            try {
                this.statInfo.statIPInfo[crI].endEntryTime = now


                if (actionVariant === 'startEntry'){
                    const diffMs = now - this.statInfo.statIPInfo[crI].endEntryTime;
                    const minutes = Math.floor(diffMs / (1000 * 60))
                    if (minutes>30) this.statInfo.statIPInfo[crI].entryCount ++  // Новый заход в базу одного IP если прошло блее 30 минут
                }

                if (actionVariant === 'viewProduct') this.statInfo.statIPInfo[crI].viewProductCount ++
                if (actionVariant === 'search') this.statInfo.statIPInfo[crI].searchCount ++
                if (actionVariant === 'productList') this.statInfo.statIPInfo[crI].productListCount ++
                if (actionVariant === 'wbTransit') this.statInfo.statIPInfo[crI].wbTransitCount ++


                this.statInfo.statIPInfo[crI].allActionCount ++


            } catch (e) {console.log(e);}
        }
        else this.statInfo.statIPInfo.push({
            endEntryTime : now,
            ip : crIP,
            ipInt : crIPInt,
            entryCount : 1,
            viewProductCount : 0,
            searchCount : 0,
            wbTransitCount : 0,
            productListCount : 0,
            allActionCount : 1
        })
    }

    async loadStartProducts(needDelete, deleteIdList){
        if (needDelete) await this.statInfoDB.destroy({where: {id: deleteIdList}})
        const userStat = await this.statInfoDB.findAll()
        return  userStat
    }

}

module.exports = new UserStatService()