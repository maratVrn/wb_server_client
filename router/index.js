const Router = require('express').Router
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
router.get('/getSimilarProducts/:link', clientController.getSimilarProducts)    // Получаем список похожих товаров со скидками
router.get('/userGoToWB', clientController.userGoToWB)                           // Переход пользователя на вб


// Функции по работе со стартовыми товарами
router.post('/loadStartProducts', wbController.loadStartProducts)
router.post('/addStartProduct', wbController.addStartProduct)

// Функции по работе со статистикой юзверей
router.post('/loadAllUserStat', wbController.loadAllUserStat)



// users routers
router.post('/registration',clientController.registration)
router.post('/login', clientController.login)
router.post('/tokenTest', clientController.tokenTest)




// router.post('/login', userController.login)
// router.post('/saveUser', userController.saveUser)
// router.post('/sendemailconfirm', userController.sendEmailConfirm)
// router.post('/logout', userController.logout)
// router.get('/activate/:link', userController.activate)
// // router.get('/refresh', userController.refresh)  // Реактивация токена
// router.post('/refresh', userController.refresh)  // Реактивация токена
// router.get('/users', authMiddleware, userController.getUsers)



module.exports = router
