const Router = require('express').Router
const userController = require('../controllers/user-controller')
const authMiddleware = require('../controllers/auth-middleware')
const wbController = require('../controllers/wb-controller')
const clientController = require('../controllers/client-controller')



const router = new Router()

// Для валидации запросов
const {body} = require('express-validator')


router.get('/test', wbController.test)         // тестовая функция для отладки

router.get('/getLiteWBCatalog', wbController.getLiteWBCatalog)         //Загрузка Лайт Версии каталога ВБ с Базы данных, последняя доступная версия


// Роутеры для получения данных о товаре
router.get('/getProductList/:link', clientController.getProductList)  // Получаем список товаров в заданном каталоге

// Роутеры для получения данных о товаре
router.get('/getIdInfo/:link', clientController.getIdInfo)  // Получаем список товаров в заданном каталоге
// Роутеры для получения данных о товаре
router.get('/getProductInfo/:link', clientController.getProductInfo)  // Получаем список товаров в заданном каталоге
router.get('/getProductPhoto/:link', clientController.getProductPhoto)  // Получаем список ссылок на фото
router.get('/getProductAbout/:link', clientController.getProductAbout)
router.get('/getProductColorsInfo/:link', clientController.getProductColorsInfo)  // Получаем список ссылок на фото
router.get('/getSupplierInfo/:link', clientController.getSupplierInfo)  // Получаем список ссылок на фото

// Роутеры для работы со статистикой запросов
router.get('/searchTest', clientController.searchTest)  // Получаем список товаров в заданном каталоге
router.post('/searchWordsUpload', clientController.searchTest)  // Получаем список товаров в заданном каталоге


// router.post('/registration',
//     // Валидируем емайл и пароль
//     body('email').isEmail(),
//     body('password').isLength({min:5, max:20}),
//     userController.registration)

// users routers
// router.post('/login', userController.login)
// router.post('/saveUser', userController.saveUser)
// router.post('/sendemailconfirm', userController.sendEmailConfirm)
// router.post('/logout', userController.logout)
// router.get('/activate/:link', userController.activate)
// // router.get('/refresh', userController.refresh)  // Реактивация токена
// router.post('/refresh', userController.refresh)  // Реактивация токена
// router.get('/users', authMiddleware, userController.getUsers)



module.exports = router
