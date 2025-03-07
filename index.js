require('dotenv').config()
const express = require('express')
const cors = require('cors')
const sequelize = require('./db')
const cookieParser = require('cookie-parser')
const router = require('./router/index')
const cron = require("node-cron");       // Для выполнения задачи по расписанию
const errorMiddleware = require('./exceptions/error-middleware')


const PORT = process.env.PORT ||  5003;
// const PORT = 5002;
const app = express()



// Запускаем функцию перерасчета портфелей
// cron.schedule("0 9 * * 2-6", function() {
//     updateProfitData()
// });

app.use(express.json({limit: '10mb'}));
app.use(cookieParser());
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


        app.get('/test', (req, res) => {
            console.log('log_work');
            res.send(JSON.stringify(testData))

        })
        //
        // await sequelize.authenticate()
        // await sequelize.sync()
        //

        app.listen(PORT, ()=> console.log(`Server is start ${PORT}`))


    } catch (e) {
        console.log(e)
    }

}

start()
