// Класс заданий на работу сервера по получению и обновлению данных с ВБ
// Основной смысл в том что каждое задание это запись в базе данных , по каждому подзаданию сохраняется информация
// о ходе выполнения задания. Если задание было прервано то можно продолжить выполнять его с момента где оно было остановлено

const sequelize = require("../db");
const {DataTypes, Op, where} = require("sequelize");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class TaskService{

    AllTask = sequelize.define('allTask',{
            id              :   {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
            taskName        :   {type: DataTypes.STRING},           // Название задачи (соотв фугкции которая его вызывает)
            isEnd           :   {type: DataTypes.BOOLEAN},          // Завершено ли
            startDateTime	:   {type: DataTypes.STRING},           // Стартовое время задания
            taskData        :   {type: DataTypes.JSON},             // Данные по заданию
            taskResult      :   {type: DataTypes.JSON},             // результат выполнения задания

        })

    // ОБновляем информацию по всем товарам в базе - цену и колличество

    // async updateAllProductList (){
    //     const taskName = 'updateAllProductList'
    //     let needTask = {}
    //
    //     // Сначала разберемся с задачей - продолжать ли старую или создать новую
    //     saveParserFuncLog('taskService ', '  ----------  Запускаем задачу updateAllProductList -------')
    //     try {
    //
    //         const allNoEndTask = await this.AllTask.findAll({
    //             where: {isEnd: false, taskName: taskName},
    //             order: [['id']]
    //         })
    //
    //         let currTask = {
    //             taskName: taskName,
    //             isEnd: false,
    //             startDateTime: new Date().toString(),
    //             taskData: [],
    //             taskResult: []
    //         }
    //
    //
    //         if (allNoEndTask.length > 0) {
    //             needTask = allNoEndTask[0]
    //             saveParserFuncLog('taskService ', '  --- Нашли НЕ завершенную задачу с ID '+needTask.id)
    //         } else {
    //             const allProductListTableName = await ProductListService.getAllProductListTableName()
    //             for (let i in allProductListTableName) {
    //                 const oneTaskData = {
    //                     tableName: allProductListTableName[i],
    //                     tableTaskEnd: false,
    //                     tableTaskResult: ''
    //                 }
    //                 currTask.taskData.push(oneTaskData)
    //             }
    //
    //             needTask = await this.AllTask.create(currTask)
    //             saveParserFuncLog('taskService ', '  --- Создали новую задачу с ID '+needTask.id)
    //
    //         }
    //
    //     } catch (error) { saveErrorLog('taskService',`Ошибка в updateAllProductList при определении задачи новая или продолжаем `)
    //         saveErrorLog('taskService', error)}
    //
    //     // Далее запустим процедуру  обновления по списку задач
    //     let taskData = [...needTask.taskData]
    //     let allTableIsUpdate = true
    //     for (let i in taskData){
    //
    //         if (!taskData[i].tableTaskEnd) try {
    //
    //             console.log(taskData[i].tableName);
    //             const [updateResult,updateCount]  = await ProductListService.updateAllWBProductListInfo_fromTable2(taskData[i].tableName)
    //
    //             saveParserFuncLog('taskService ', '  --- Обновляем таблицу  '+taskData[i].tableName+'  кол-во '+updateCount)
    //
    //             if (updateCount > 0){
    //                 taskData[i].tableTaskEnd = true
    //                 taskData[i].tableTaskResult = updateResult
    //                 await this.AllTask.update({taskData: taskData,}, {where: {id: needTask.id,},})
    //             } else allTableIsUpdate = false
    //             // break
    //             await delay(0.1 * 60 * 1000)
    //         } catch(error) {
    //             saveErrorLog('taskService',`Ошибка в updateAllProductList при обновлении таблицы `+taskData[i].tableName)
    //             saveErrorLog('taskService', error)
    //         }
    //
    //     }
    //     if (allTableIsUpdate) await this.AllTask.update({isEnd: true}, {where: {id: needTask.id},})
    //
    //     console.log('updateAllProductList isOk');
    //     saveParserFuncLog('taskService ', ' ********  ЗАВЕРШЕНО **************')
    // }




}

module.exports = new TaskService()
