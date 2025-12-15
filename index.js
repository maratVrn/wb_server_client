require('dotenv').config()
const express = require('express')
const cors = require('cors')
const UserStatService = require('./servise/userStat-service')
const sequelize= require('./db')
const cookieParser = require('cookie-parser')
const router = require('./router/index')
const cron = require("node-cron");       // Для выполнения задачи по расписанию
const errorMiddleware = require('./exceptions/error-middleware')
const PORT = process.env.PORT ||  5003;
const app = express()
// Сохраняем статистику посещений раз в 10 минут
cron.schedule("*/10 * * * *", function() {
    UserStatService.saveCurrStatData().then()
});


app.use(express.json({limit: '10mb'}));
// app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin:process.env.CLIENT_URL
    // optionsSuccessStatus: 200,
}));
app.use('/api', router)
// Подключать вконце!
app.use(errorMiddleware)

const testData = [
    {
        id : 1,
        body : "доступ к телу есть"
    }
]

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        await UserStatService.startDb()

        app.listen(PORT, ()=> console.log(`Server is start ${PORT}`))


    } catch (e) {
        console.log(e)
    }

}

start()
