
const mailService = require('./mail-service')
const uuid  = require( 'uuid');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const UserStatService = require("../servise/userStat-service");
const mpBot = require('./mp_bot')
const {PARSER_GetProductListPriceInfo, PARSER_LoadMiddlePhotoUrl} = require("../wbdata/wbParserFunctions");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateAccessToken = ( userName, email) => {
    const payLoad = {

        userName,
        email
    }
    return  jwt.sign(payLoad, process.env.ACCESS_SECRET_KEY, {expiresIn: '10d'})
}

class UserService {

    setUserResult (user, token) {
        const result = {
            isError : false,
            errorMessage : '',
            id : user.id,
            userName : user.name,
            email : user.email,
            role : user.role,
            token : token
        }
        return result
    }

    setErrorResult (message) {
        const result = {
            isError : true,
            errorMessage : message,
            id : 0,
            userName : 'нет данных',
            email : 'нет данных',
            role : 'нет данных',
            token : ''
        }
        return result

    }

    async updatePassword(email) {
        const user = await  UserStatService.users.findOne( {where: {email:email.toLowerCase()}} )
        if (!user)  return this.setErrorResult(`Пользователь с емайл ${email} не найден `)
        const activationLink = uuid.v4()
        user.apl = activationLink
        await user.save()


           // Отправляем на почту ссылку для активации

        try {
            await mailService.sendUpdatePasswordMail(email.toLowerCase(), `${process.env.CLIENT_URL}/updatePassword/${activationLink}`)
        } catch (e) {
            // console.log(e);
            console.log(e.message);
            // throw ApiError.BadRequest('Ошибка отправки письма активации проверьте правильность email ')

        }

        return  {
            isError : false,
            errorMessage : 'На вашу почту отправлено письмо с сылкой для обновления пароля',
        }
    }


    async login(formData) {
        const user = await  UserStatService.users.findOne( {where: {email:formData.email.toLowerCase()}} )
        if (!user)  return this.setErrorResult(`Пользователь с емайл ${formData.email} не найден `)
        const isPassEquals = await bcrypt.compare(formData.password, user.password)
        if (!isPassEquals) return  this.setErrorResult('Неверно введен пароль')
        const token = generateAccessToken(user.name, user.email.toLowerCase())
        return this.setUserResult(user, token)
    }


    async tokenTest(token) {
        let isDecoded = false
        let decodedData = {}
        try {
            decodedData = jwt.verify(token, process.env.ACCESS_SECRET_KEY)
            isDecoded = true
        } catch (e) {}
        if (!isDecoded) return this.setErrorResult(`Не удалось расшифровать токен`)
        const user = await  UserStatService.users.findOne( {where: {email:decodedData.email.toLowerCase()}} )
        if (!user)  return this.setErrorResult(`Пользователь с емайл ${decodedData.email} не найден `)
        const newToken = generateAccessToken(user.name, user.email.toLowerCase())
        return this.setUserResult(user, newToken)
    }


    async registration (formData) {

        const candidate = await  UserStatService.users.findOne( {where: {email:formData.email.toLowerCase()}} )
        if (candidate) return  this.setErrorResult( `Пользователь с емайл ${formData.email} уже существует`)

        // Хэешируем пароль полтзователя - будем хранить его в хэш виде
        const hashPassword = await bcrypt.hash(formData.password,3)
        const token = generateAccessToken(formData.userName, formData.email.toLowerCase())

        let crRole = "USER"
        if (formData.email === 'begisgevmr@mail.ru')  crRole = "ADMIN"
        const user = await UserStatService.users.create({email : formData.email.toLowerCase(), password : hashPassword, role: crRole, token: token, userParam : {} , name : formData.username, apl : ''})

        return  this.setUserResult(user, token)
    }

    async newPassword(password, link) {
        const user = await  UserStatService.users.findOne( {where: {apl:link}} )
        if (!user) return  this.setErrorResult( `Ошибка обновления пароля: неверная ссылка регистрации`)
        user.password = await bcrypt.hash(password,3)
        const token = generateAccessToken(user.name, user.email.toLowerCase())
        await user.save()
        return  this.setUserResult(user, token)
    }

    async addTrackProduct (addProductInfo = {}, userId = 0) {
        const user = await  UserStatService.users.findOne( {where: {id:userId}} )
        if (!user) return  this.setErrorResult( `Пользователь не найдет`)
        if (!user.userParam.trackProducts) user.userParam.trackProducts = []
        let needAdd = true
        for (let i in user.userParam.trackProducts)
            if (user.userParam.trackProducts[i].id === addProductInfo.id){
                needAdd = false
                // TODO:
                console.log('Уже есть такой товар придумать механизм обновления');
                break
            }
        if (needAdd) {
            user.userParam.trackProducts.push(addProductInfo)
            await UserStatService.users.update({userParam: user.userParam, needUpdateProducts : true}, {where: {id: userId,},})
        }
        return  { sError : false, errorMessage : ''}
    }

    async getAllTrackProducts ( userId, needDelete = false, deleteIdList =[]) {
        const user = await  UserStatService.users.findOne( {where: {id:userId}} )
        if (!user) return  this.setErrorResult( `Пользователь не найдет`)
        if (!user.userParam.trackProducts) user.userParam.trackProducts = []
        if (needDelete){
            const newTrackProducts = user.userParam.trackProducts.filter(product => !deleteIdList.includes(product.id));
            user.userParam.trackProducts = newTrackProducts
            let needUpdateProducts =  newTrackProducts.length>0
            await UserStatService.users.update({userParam: user.userParam, needUpdateProducts :needUpdateProducts }, {where: {id: userId,},})
        }
        return  user.userParam.trackProducts
    }




    async saveTrackProduct(userId, trackProduct) {
        const user = await  UserStatService.users.findOne( {where: {id:userId}} )
        if (!user) return  this.setErrorResult( `Пользователь не найдет`)
        if (!user.userParam.trackProducts) user.userParam.trackProducts = []
        if (trackProduct.id){
            for (let i in user.userParam.trackProducts)
                if (trackProduct.id === user.userParam.trackProducts[i].id){

                    user.userParam.trackProducts[i] = trackProduct
                    break
                }
            await UserStatService.users.update({userParam: user.userParam,}, {where: {id: userId,},})
        }
        return  user.userParam.trackProducts
    }


    // Функция обновления данных для отслеживаемых продуктов
    async updateAllTrackProducts ( ) {
        // const chatId  = `752332479`
        // mpBot.sendMess(chatId)


        const users = await  UserStatService.users.findAll( {where: {needUpdateProducts:true}} )
        let isOk = false
        for (let i in users)
            if (users[i].userParam.trackProducts)
                if (users[i].userParam.trackProducts.length>0){
                    // console.log('Операция');
                    // console.time('Операция');
                    //
                    isOk = await this.updateCurTrackProducts(users[i].userParam.trackProducts, users[i].tid)
                    if (isOk) await UserStatService.users.update({userParam: users[i].userParam,}, {where: {id: users[i].id}})
                    await delay(10)
                    // console.timeEnd('Операция');

                }

        return  isOk
    }
    async updateCurTrackProducts (trackProducts, userTId = null) {
        // Если следили за ппоступлением и товар поступил то убираем галочку следить
        // и наоборот если уеньтшение и уменьшилось до 0 то также убираем галочку
        let isOk = true
        const viewIdProducts = trackProducts.map(item => item.id);
        let nawDay = new Date()
        try {
            const updateProductListInfo = await PARSER_GetProductListPriceInfo(viewIdProducts)
            for (let i in trackProducts)
                for (let k in updateProductListInfo)
                    if (updateProductListInfo[k].id === trackProducts[i].id){

                        trackProducts[i].endUpdateDT = nawDay.toLocaleTimeString()
                        trackProducts[i].endPrice =  updateProductListInfo[k].price > 0 ? updateProductListInfo[k].price : trackProducts[i].startPrice

                        const  sizes =  updateProductListInfo[k].sizes
                        let allQty = []
                        let allQtySum = 0
                        for (let z in sizes) {
                            let oneSize = {name: sizes[z].name, qty: 0}
                            for (let i in sizes[z].stocks)
                                try {
                                    oneSize.qty += sizes[z].stocks[i].qty
                                    allQtySum +=sizes[z].stocks[i].qty
                                } catch (e) {}
                            allQty.push(oneSize)
                        }
                        if (allQty.length > 0)  if (allQty.length > 1) {
                            trackProducts[i].qty = allQty
                        }
                        else {
                            trackProducts[i].qty =  updateProductListInfo[k].totalQuantity  > allQty[0].qty ?
                                updateProductListInfo[k].totalQuantity  : allQty[0].qty

                        }
                        if ((trackProducts[i].needTelegramSend) && (userTId)){
                            mpBot.sendMess(userTId, trackProducts[i])

                        }

                        break


                    }

        } catch (e) {  console.log(e); isOk = false}




        return isOk
    }


    // async getAllUsers (){
    //     const users = await Users.findAll()
    //     return users
    // }
    //
    // async getUserInfoByChatID(chatId) {
    //     const chatIdStr = String(chatId)
    //     let res = null
    //     const user = await  Users.findOne( {where: {role:chatIdStr}} )
    //
    //     if (user){
    //         res = 'Вы зарегистрированы на сайте www.bm-algoritmik.ru'+'\n'
    //         res += 'Ваш email: '+'\n'
    //         res += user.email +'\n'
    //         res += 'Подписка на получение торговых сигналов: НЕТ '+'\n'
    //     }
    //     return res
    // }
    //
    // async connectClient(chatId, email) {
    //     const chatIdStr = String(chatId)
    //     let res = null
    //     const user = await  Users.findOne( {where: {email:email}} )
    //
    //     if (user){
    //         user.role = chatIdStr
    //         await user.save().then(()=>{
    //             res = 'Вы зарегегестрирвоаны на  сайте www.bm-algoritmik.ru'+'\n'
    //             res += 'Ваш имя: '+'\n'
    //             res += user.name +'\n'
    //         })
    //
    //         // res += 'Подписка на получение торговых сигналов: НЕТ '+'\n'
    //     }
    //     return res
    // }


}

module.exports = new UserService()
