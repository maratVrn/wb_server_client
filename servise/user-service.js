
const mailService = require('./mail-service')
const uuid  = require( 'uuid');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const UserStatService = require("../servise/userStat-service");
const {PARSER_GetProductListPriceInfo, PARSER_LoadMiddlePhotoUrl} = require("../wbdata/wbParserFunctions");

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
        const user = await  UserStatService.users.findOne( {where: {email:email}} )
        if (!user)  return this.setErrorResult(`Пользователь с емайл ${email} не найден `)
        const activationLink = uuid.v4()
        user.apl = activationLink
        await user.save()
        console.log(activationLink);

           // Отправляем на почту ссылку для активации

        try {
            await mailService.sendUpdatePasswordMail(email, `${process.env.CLIENT_URL}/updatePassword/${activationLink}`)
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
        const user = await  UserStatService.users.findOne( {where: {email:formData.email}} )
        if (!user)  return this.setErrorResult(`Пользователь с емайл ${formData.email} не найден `)
        const isPassEquals = await bcrypt.compare(formData.password, user.password)
        if (!isPassEquals) return  this.setErrorResult('Неверно введен пароль')
        const token = generateAccessToken(user.name, user.email)
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
        const user = await  UserStatService.users.findOne( {where: {email:decodedData.email}} )
        if (!user)  return this.setErrorResult(`Пользователь с емайл ${decodedData.email} не найден `)
        const newToken = generateAccessToken(user.name, user.email)
        return this.setUserResult(user, newToken)
    }


    async registration (formData) {

        const candidate = await  UserStatService.users.findOne( {where: {email:formData.email}} )
        if (candidate) return  this.setErrorResult( `Пользователь с емайл ${formData.email} уже существует`)

        // Хэешируем пароль полтзователя - будем хранить его в хэш виде
        const hashPassword = await bcrypt.hash(formData.password,3)
        const token = generateAccessToken(formData.userName, formData.email)

        let crRole = "USER"
        if (formData.email === 'begisgevmr@mail.ru')  crRole = "ADMIN"
        const user = await UserStatService.users.create({email : formData.email, password : hashPassword, role: crRole, token: token, userParam : {} , name : formData.username, apl : ''})

        return  this.setUserResult(user, token)
    }

    async newPassword(password, link) {
        const user = await  UserStatService.users.findOne( {where: {apl:link}} )
        if (!user) return  this.setErrorResult( `Ошибка обновления пароля: неверная ссылка регистрации`)
        user.password = await bcrypt.hash(password,3)
        const token = generateAccessToken(user.name, user.email)
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
        const users = await  UserStatService.users.findAll( {where: {needUpdateProducts:true}} )
        for (let i in users)
            if (users[i].userParam.trackProducts)
                if (users[i].userParam.trackProducts.length>0){
                    const updateTrackProducts = await this.updateCurTrackProducts(users[i].userParam.trackProducts)
                    users[i].userParam.trackProducts = updateTrackProducts
                    console.log(updateTrackProducts);
                    // await UserStatService.users.update({userParam: users[i].userParam,}, {where: {id: users[i].id}})
                }
        return  'isOk'
    }
    async updateCurTrackProducts ( trackProducts) {
        let updateTrackProducts = trackProducts


        return updateTrackProducts
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
