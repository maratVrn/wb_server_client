
const mailService = require('./mail-service')
const uuid  = require( 'uuid');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const UserStatService = require("../servise/userStat-service");

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
        const user = await UserStatService.users.create({email : formData.email, password : hashPassword, role: crRole, token: token, userParam : {} , name : formData.username})

        // const decodedData = jwt.verify(token, process.env.ACCESS_SECRET_KEY)
        // console.log(decodedData);

        // // Создаем ссылку для активации емайл
        // const activationLink = uuid.v4()
        // // console.log(user)
        // // Генерируем jwt токен
        //
        // // Отправляем на почту ссылку для активации
        //
        // try {
        //     await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)
        // } catch (e) {
        //     console.log(e);
        //     console.log(e.message);
        //     throw ApiError.BadRequest('Ошибка отправки письма активации проверьте правильность email ')
        //
        // }
        //
        //
        // console.log('Users.create');
        // // Создаем пользователя в базе данных
        // let crRole = "USER"
        // if (email === 'begisgevmr@mail.ru')  crRole = "ADMIN"
        // const user = await Users.create({email, password : hashPassword, role: crRole, activationLink})
        // console.log('Получили user '+user);
        //
        //
        // // Создаем ДТО для шифрования (получаем payload) инфо в токене
        // const userDto = new UserDto(user)
        // // Генерируем токены и сохраняем рефреш в БД
        // const tokens = tokenService.generateTokens({...userDto})
        // await  tokenService.saveToken(userDto.id, tokens.refreshToken)
        // // return{...tokens, user: userDto}
        return  this.setUserResult(user, token)
    }

    // async sendEmailConfirm (email) {
    //     const candidate = await  Users.findOne( {where: {email:email}} )
    //     if (candidate){
    //         try {
    //             await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${candidate.activationLink}`)
    //             return{user: candidate}
    //         } catch (e) {
    //             throw ApiError.BadRequest('Ошибка отправки письма активации проверьте правильность email ')
    //         }
    //
    //     }  else { throw ApiError.BadRequest(`Пользователь с емайл ${email} не найден`)}
    // }

    // async saveUser(user){
    //
    //     let  updateUser = await Users.findOne({where: {id:user.id}})
    //     if (!updateUser){
    //         throw ApiError.BadRequest('Пользователь не найден')
    //     }
    //     updateUser.name = user.name
    //     updateUser.phone = user.phone
    //     updateUser.email = user.email
    //     updateUser.role = user.role
    //     updateUser.isActivated = user.isActivated
    //     updateUser.about = user.about
    //
    //     await updateUser.save()
    //
    // }
    //
    //
    // async activate(activationLink){
    //
    //     const user = await Users.findOne({where: {activationLink:activationLink}})
    //     if (!user){
    //         throw ApiError.BadRequest('Неккоректная ссылка активации')
    //     }
    //     user.isActivated = true
    //
    //     await user.save()
    //
    // }
    //
    //
    // async refresh(refreshToken){
    //     if (!refreshToken){
    //         throw ApiError.UnauthorizedError()
    //     }
    //     const userData = tokenService.validateRefreshToken(refreshToken)
    //     const tokenDataDb = await tokenService.findToken(refreshToken)
    //
    //     if (!userData || !tokenDataDb){
    //         throw ApiError.UnauthorizedError()
    //     }
    //
    //     const user = await Users.findOne({where:{id:userData.id}})
    //
    //     const userDto = new UserDto(user)
    //     // Генерируем токены и сохраняем рефреш в БД
    //     const tokens = tokenService.generateTokens({...userDto})
    //     await  tokenService.saveToken(userDto.id, tokens.refreshToken)
    //     // return{...tokens, user: userDto}
    //     return{...tokens, user: user}
    //
    // }
    //
    // async logout(refreshToken){
    //
    //     const token  = await tokenService.removeToken(refreshToken)
    //     return token
    //
    // }



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
