
// const wbUsers = require("../db");
const {DataTypes} = require("sequelize");
const fs = require('fs');
const {Sequelize} = require('sequelize')
const wbUsers = require("../db");

class UserStatService{
    wbUsers = new Sequelize('wb_users', 'postgres', 'admin', {
        host: 'localhost',
        dialect: 'postgres',
        logging: false
    });

    IPInfo = this.wbUsers.define('ipInfo',{
            id                 :   {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            ip                 :   {type: DataTypes.STRING},
            dt                 :   {type: DataTypes.STRING},

        },
        { createdAt: false,   updatedAt: false  }  )


    constructor() {
         // this.wbUsers.authenticate()
         // this.wbUsers.sync()

    }
    async startDb(){
        await this.wbUsers.authenticate()
        await this.wbUsers.sync()
    }

    async addIpInfo(ip){
        let now = new Date()
        console.log(now.toLocaleDateString()+',  '+now.toLocaleTimeString());
        console.log(ip.replace(", 127.0.0.1", ""));

        const newPoint = {
            ip : ip.replace(", 127.0.0.1", ""),
            dt : now.toLocaleDateString()+',  '+now.toLocaleTimeString()
        }


        this.IPInfo.create(newPoint).then()
        // await this.wbUsers.authenticate()
        // await this.wbUsers.sync()
        // console.log('tut');
        // const res = await this.IPInfo.bulkCreate([{id:1,ip:ip}],{    updateOnDuplicate: ["ip"] }).then(() => {})
        // return  res
    }




}

module.exports = new UserStatService()