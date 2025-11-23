const Router = require('express').Router
const userController = require('../controllers/user-controller')
const authMiddleware = require('../controllers/auth-middleware')
const wbController = require('../controllers/wb-controller')
const clientController = require('../controllers/client-controller')



const router = new Router()

// Для валидации запросов
const {body} = require('express-validator')


router.get('/wbServerTest', wbController.test)         // тестовая функция для отладки
router.post('/duplicateTest', clientController.duplicateTest)


router.get('/getLiteWBCatalog', wbController.getLiteWBCatalog)         //Загрузка Лайт Версии каталога ВБ с Базы данных, последняя доступная версия


// Роутеры для получения данных о товаре

router.post('/getSearchResult', clientController.getSearchResult)  // Получаем список по поисковому запросу
router.post('/getProductList', clientController.getProductList)  // Получаем список товаров в заданном каталоге

// Роутеры для получения данных о товаре

router.get('/getProductStartInfo/:link', clientController.getProductStartInfo)  // Получаем список товаров в заданном каталоге
router.get('/getProductInfo/:link', clientController.getProductInfo)            // Получаем список товаров в заданном каталоге



router.post('/getPositionsInfo', clientController.getPositionsInfo)


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
