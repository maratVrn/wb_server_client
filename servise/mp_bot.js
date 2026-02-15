const { Telegraf, Markup } = require('telegraf');
const UserStatService = require("./userStat-service");
const ClientService = require("./client-service");
const {PARSER_LoadMiddlePhotoUrl} = require("../wbdata/wbParserFunctions");
const {calcDiscount}  = require("../wbdata/wbfunk");
const path = require('path');

function isValidTokenFormat(text) {
    // Проверка: строка 28 символов, формат Base64
    const tokenRegex = /^[A-Za-z0-9+/]{27,28}=?=?$/;
    return typeof text === 'string' && tokenRegex.test(text);
}

const setAboutMessage = () =>{
    let result = '<b>Информация по боту @mp_tracker_wb_bot </b> \n'
    result += 'Бот позволяет отслеживать изменения цен и остатки на товары на WB а также предоставляет информацию по товарам - среднюю цену, реальную скидку по любому товару \n'
    result += 'Для использования бота небходимо зарегистрироваться на сайте <b>'+process.env.CLIENT_SITE+'</b> и ввести токен, который генерируется в личном кабинете \n'


    return result

}

const setAccountMessage = (tUserFind) =>{
    let result = '<b>Информация по вашему аккаунту на сайте '+process.env.CLIENT_SITE+' </b> \n'
    result += 'Бот привязан к аккуанту \n'
    result += 'Имя: <b>'+tUserFind.uName+'</b>\n'
    result += 'EMail: <b>'+tUserFind.uEMail+'</b> '
    return result
}


const setProductMessage = (userParam) =>{
    let result = '<b>У вас нет отслеживаемых продуктов сайте '+process.env.CLIENT_SITE+'</b>'
    if (userParam?.trackProducts?.length > 0){
        result = '<b>Список ваших товаров на отслеживание ('+userParam?.trackProducts.length+' шт) </b>\n'
        for (let i in userParam?.trackProducts) {
            const idStr = userParam?.trackProducts[i].id.toString()
            const addPrice = userParam?.trackProducts[i].startPrice - userParam?.trackProducts[i].endPrice
            const addPriceInfo = addPrice > 0 ? '✅ Стало дешевле на <b> ' + Math.abs(addPrice) + ' ₽</b>':
                addPrice < 0? '❌ Цена выросла  на  <b>' + Math.abs(addPrice) + ' ₽</b>' : 'Цена не изменилась'

            const urlInfo = '<b> '+ '<a href="https://www.wildberries.ru/catalog/'+idStr+'/detail.aspx">перейти на wb</a>' + ' </b>'


            result += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n' +
                '<b>' + userParam?.trackProducts[i].name + ' </b> \n' +
                'ID <b>' + userParam?.trackProducts[i].id + '</b> '+ urlInfo+'\n' +
                'Стартовая цена <b>' + userParam?.trackProducts[i].startPrice + ' ₽</b> \n' +
                'Текущая цена <b>' + userParam?.trackProducts[i].endPrice + ' ₽</b> \n' +
                addPriceInfo + '\n'

            let selectedTrack = null
            let needQty = 0
            if (userParam?.trackProducts[i].qty.length > 1) {
                for (let z in userParam?.trackProducts[i].qty)
                    if (userParam?.trackProducts[i].qty[z].name === userParam?.trackProducts[i].selectedSizeTrack) {
                        selectedTrack = userParam?.trackProducts[i].qty[z].name + ' (' + userParam?.trackProducts[i].qty[z].qty + ')'
                        needQty = userParam?.trackProducts[i].qty[z].qty
                        break
                    }
                if (!selectedTrack) {
                    selectedTrack = userParam?.trackProducts[i].qty[0].name + ' (' + userParam?.trackProducts[i].qty[0].qty + ')'
                    needQty = userParam?.trackProducts[i].qty[0].qty
                }
            }
            if (!selectedTrack) { selectedTrack = userParam?.trackProducts[i].qty; needQty = selectedTrack}
            if (needQty > 0) result += 'Остатки сейчас <b>' + selectedTrack + ' шт. </b> \n'
                else result +='<b>❌ товар закончился  </b> \n'
            result +='<b>ℹ️ -- Параметры отслеживания -- </b>\n'
            let isTrackParam = false

            if (userParam?.trackProducts[i].needPriceTrack)  {result +='✅ Уменьшение цены до '+ userParam?.trackProducts[i].priceStep +' руб. \n'; isTrackParam = true}


            if (userParam?.trackProducts[i].needCountTrack)  {
                if (userParam?.trackProducts[i].qty.length > 1)
                    result +='✅ Уменьшение остатков для размера '+ userParam?.trackProducts[i].selectedSizeTrack +' до '+ userParam?.trackProducts[i].minCount +' шт. \n';
                    else result +='✅ Уменьшение остатков  до '+ userParam?.trackProducts[i].minCount +' шт. \n';
                isTrackParam = true}

            if (userParam?.trackProducts[i].needAddTrack)  {
                if (userParam?.trackProducts[i].qty.length > 1)
                    result +='✅ Поступление товаров для размера '+ userParam?.trackProducts[i].selectedSizeAddTrack +' \n';
                else result +='✅ Поступление товаров \n';
                isTrackParam = true}



            if (!isTrackParam) result +='Нет данных для отслежвиания \n'
            if (userParam?.trackProducts[i].needTelegramSend) result +='<b>✅ Уведомлять в telegram bot</b>\n'

        }



    }

    return result

}

const setTrackProductMessage = (trackProduct) =>{

    let needMessage = false
    let message = ''
    if (trackProduct.needTelegramSend){


        const idStr = trackProduct.id.toString()
        const urlInfo = '<b> '+ '<a href="https://www.wildberries.ru/catalog/'+idStr+'/detail.aspx">перейти на wb</a>' + ' </b>'


        const addPrice = trackProduct.startPrice - trackProduct.endPrice
        const addPriceInfo = addPrice > 0 ? '✅ Стало дешевле на <b> ' + Math.abs(addPrice) + ' ₽</b>':
                addPrice < 0? '❌ Цена выросла  на  <b>' + Math.abs(addPrice) + ' ₽</b>' : 'Цена не изменилась'

        message ='<b>' + trackProduct.name + ' </b> \n' +
                'ID <b>' + trackProduct.id + '</b> '+ urlInfo+'\n'+
                'Стартовая цена <b>' + trackProduct.startPrice + ' ₽</b> \n' +
                'Текущая цена <b>' + trackProduct.endPrice + ' ₽</b> \n' +
                addPriceInfo + '\n'

        if ((trackProduct.needPriceTrack) && (trackProduct.endPrice<=trackProduct.priceStep)) { needMessage = true; trackProduct.needPriceTrack = false}

        let selectedTrack = null
        let needQty = 0
        if (trackProduct.qty.length > 1) {
            for (let z in trackProduct.qty)
                if (trackProduct.qty[z].name === trackProduct.selectedSizeTrack) {
                    selectedTrack = trackProduct.qty[z].name + ' (' + trackProduct.qty[z].qty + ')'
                    needQty = trackProduct.qty[z].qty
                    break
                }
            if (!selectedTrack) {
                selectedTrack = trackProduct.qty[0].name + ' (' + trackProduct.qty[0].qty + ')'
                needQty = trackProduct.qty[0].qty
            }
        }
        if (!selectedTrack) { selectedTrack = trackProduct.qty; needQty = selectedTrack}
        let addmes = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n'
        if (needQty > 0) addmes += 'Остатки сейчас <b>' + selectedTrack + ' шт. </b> \n'
        else addmes +='<b>❌ '+selectedTrack+' товар закончился  </b> \n'
        message += addmes


        if ((trackProduct.needCountTrack) && (needQty<=trackProduct.minCount))  { needMessage = true; trackProduct.needCountTrack = false}

        if (trackProduct.needAddTrack) {
            selectedTrack = null
            needQty = 0
            if (trackProduct.qty.length > 1) {
                for (let z in trackProduct.qty)
                    if (trackProduct.qty[z].name === trackProduct.selectedSizeAddTrack.name) {
                        selectedTrack = trackProduct.qty[z].name + ' (' + trackProduct.qty[z].qty + ')'
                        needQty = trackProduct.qty[z].qty

                        break
                    }
                if (!selectedTrack) {
                    selectedTrack = trackProduct.qty[0].name + ' (' + trackProduct.qty[0].qty + ')'
                    needQty = trackProduct.qty[0].qty
                }
            }
            if (!selectedTrack) {
                selectedTrack = trackProduct.qty;
                needQty = selectedTrack
            }
            addmes = '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n'
            if (needQty > 0) {
                trackProduct.needAddTrack = false
                addmes += '✅ Снова в наличии <b>' + selectedTrack + ' шт. </b> \n'
                needMessage = true
                message += addmes
            }
        }

    }
    message += '⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n'
    return [message, needMessage]

}

const setCaptionFindProduct = (productInfo, isTrack= false) =>{
    const tmp = productInfo.meanPrice - productInfo.price
    let realDiscount = tmp > 0 ? '✅ Реальная скидка <b> ' + Math.abs(productInfo.discount) + ' % </b> (<b>'+ tmp + '  ₽</b>)':
        '❌ Цена завышена на  <b>' + Math.abs(productInfo.discount)+ '%, '+ Math.abs(tmp) + ' ₽</b>'

    let trackInfo = isTrack ? '✅ Вы отслеживаете этот товар - мы сообщим вам о скидках первыми' :
        '💡 Добавьте этот товар в отслеживаемые и узнавайте о скидках первыми'
    let priceInfo = productInfo.price > 0 ? '<b>'+ productInfo.price + `   ₽ </b> цена на WB сейчас без учета wb-кошелька` :
        '❌ товар закончился но мы можем сообщить о поступлении'
    // let priceInfo = 'xxcxc'
    const caption = `🚀 Товар найден! \n` + '<b>' + productInfo.name + '</b> \n' +
        priceInfo + `    \n` +
        'ℹ️ Средняя цена за 90 дней: ' + productInfo.meanPrice + ' ₽ \n' + realDiscount +'\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n' +
        '📉 Детальный график цены на этот товар на нашем сайте'+'\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n' + trackInfo


    // let result = '<b>У вас нет отслеживаемых продуктов сайте '+process.env.CLIENT_SITE+'</b>'
    return caption

}
class Mp_bot {

    calcProductInfo (data){
        let price = 0
        if (data) {
            if (data?.idInfoWB?.price) if (data?.idInfoWB?.price>0){
                price = data?.idInfoWB?.price
                const dt = new Date().toLocaleDateString()
                const nowPrice =  {d: dt, sp: data?.idInfoWB?.price, q:data?.idInfoWB?.totalQuantity? data?.idInfoWB?.totalQuantity : 0}
                if (data?.productInfo?.priceHistory.at(-1).d === dt) data?.productInfo?.priceHistory.pop()
                data?.productInfo?.priceHistory.push(nowPrice)
            }

        }
        let photoUrl = data?.idInfo?.id? PARSER_LoadMiddlePhotoUrl(data?.idInfo.id) : ''
        let discountData = calcDiscount(data?.productInfo?.priceHistory)
        const meanPrice = discountData.isDataCalc? discountData.meanPrice : 'нет данных'
        const discount = discountData.isDataCalc? discountData.discount : 'нет данных'

        return {
            price : price,
            name : data?.idInfoWB?.name? data?.idInfoWB?.name : '',
            photoUrl : photoUrl,
            meanPrice : meanPrice,
            discount : discount
        }
    }
    constructor() {

        this.bot = new Telegraf(process.env.BOT_API);


        this.bot.start((ctx) => {
                const tid = ctx.from.id
                UserStatService.findUserByTID(tid).then(()=>{
                    if (UserStatService.tUserFind.isFind)
                        ctx.reply(`Привет! ${UserStatService.tUserFind.uName} ваш email: ${UserStatService.tUserFind.uEMail}`)
                           else
                                ctx.reply(
                                    '<b>Вы не зарегестрированы на сайте '+process.env.CLIENT_SITE+'</b>\n' + 'Если у вас есть аккаунт введие токен который указан в вашем личном кабинете ',
                                    { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                                );


                })
        });


        this.bot.command('products', (ctx) => {


            UserStatService.findUserByTID(ctx.from.id).then(async () => {
                if (UserStatService.tUserFind.isFind) {

                    ctx.reply(setProductMessage(UserStatService.tUserFind.userParam),
                        { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                    );

                }
                else ctx.reply(
                    '<b>Вы не зарегестрированы на сайте '+process.env.CLIENT_SITE+'</b>\n' + 'Если у вас есть аккаунт введие токен который указан в вашем личном кабинете ',
                    { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                );
            })

        });

        this.bot.command('account', (ctx) => {


            UserStatService.findUserByTID(ctx.from.id).then(async () => {
                if (UserStatService.tUserFind.isFind) {

                    ctx.reply(setAccountMessage(UserStatService.tUserFind),
                        { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                    );

                }
                else ctx.reply(
                    '<b>Вы не зарегестрированы на сайте '+process.env.CLIENT_SITE+'</b>\n' + 'Если у вас есть аккаунт введие токен который указан в вашем личном кабинете ',
                    { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                );
            })

        });


        this.bot.command('about', (ctx) => {
            ctx.reply(setAboutMessage(),
                { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
            );
        });

        this.bot.command('info', (ctx) => {
            const tid = ctx.from.id
            UserStatService.findUserByTID(tid,'waiting_for_link').then(()=>{
                if (UserStatService.tUserFind.isFind) {
                    ctx.reply(`Напишите ID товара`)
                }
                else ctx.reply(
                    '<b>Вы не зарегестрированы на сайте '+process.env.CLIENT_SITE+'</b>\n' + 'Если у вас есть аккаунт введие токен который указан в вашем личном кабинете ',
                    { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                );
            })

        });

        // Обработка нажатия

        this.bot.action(/^stop:([^|]+)\|(.+)$/, async (ctx) => {
            const uniqueId = ctx.match[1];
            const name = ctx.match[2];
            const tid = ctx.from.id
            console.log('tid = '+ tid + '  uniqueId = '+uniqueId+' name = '+name);

            await ctx.answerCbQuery();
            await ctx.reply(
                `Уведомления по товару\n<b>💡${name}</b>\nне будут приходить в telegram\n`,
                { parse_mode: 'HTML' }
            );
        });


        this.bot.on('text', (ctx) => {
            let needNext = true
            // Пользватель прислал email (скорее всего он хочет прявязать аккаунт)
            if (isValidTokenFormat(ctx.message.text.trim())) {

                const tg_token = ctx.message.text.trim()
                const tid = ctx.from.id

                UserStatService.setUserTIDByTGToken(tg_token, tid).then(()=>{
                    if (UserStatService.tUserFind.isFind)
                        ctx.reply(`Привет! ${UserStatService.tUserFind.uName} Вы успешно прявязали аккаунт к боту трекера сайта `+process.env.CLIENT_SITE+' теперь все данные об изменениях цен и остатов ваших товаров будем присылать вам сюда')
                    else ctx.reply(`Аккатунт с токеном ${tg_token} не найден на сайте `+process.env.CLIENT_SITE+' проверьте правильность введенных данных')
                })


                needNext = false
            }

            // Попробуем посмотреть может какая то команда от пользователя пришла
            if (needNext) {
                UserStatService.findUserByTID(ctx.from.id).then(async () => {
                    if (UserStatService.tUserFind.isFind) {
                        if (UserStatService.tUserFind.command === 'waiting_for_link') {
                            const id = parseInt(ctx.message.text);
                            let noInfo = true
                            if (id > 0) {
                                const result = await ClientService.getProductStartInfo(id)
                                if (result?.isInBase) {
                                    let isTrack = false
                                    if (UserStatService.tUserFind?.userParam?.trackProducts?.length > 0)
                                        for (let j in UserStatService.tUserFind?.userParam?.trackProducts)
                                            if (UserStatService.tUserFind?.userParam?.trackProducts[j].id === id){
                                                isTrack = true
                                                break
                                            }


                                    const productInfo = this.calcProductInfo(result)
                                    noInfo = false

                                    const localPath = path.join(__dirname, '\\tmp_images\\temp_image.jpg'); // Путь сохранения
                                    let replyCount = 0
                                    let needReply = true
                                    while (needReply)
                                        try {

                                            // 3. Отправляем локальный файл делаем несколько попыток тк иногда прога зависает
                                            ctx.reply(setCaptionFindProduct(productInfo, isTrack),
                                                { parse_mode: 'HTML' ,

                                                    reply_markup: {
                                                        inline_keyboard: [
                                                            [{
                                                                text: '📦 wildberries.ru',
                                                                url:  `https://www.wildberries.ru/catalog/${id}/detail.aspx`
                                                            },
                                                                {
                                                                    text: '📦 '+process.env.CLIENT_SITE,
                                                                    url: 'https://' + process.env.CLIENT_SITE + '/productInfo/' + id.toString()
                                                                }]
                                                        ]
                                                    }

                                                }
                                            );


                                            needReply = false

                                        } catch (e) {
                                            await new Promise(resolve => setTimeout(resolve, 500));
                                            replyCount++
                                            if (replyCount > 3) {
                                                needReply = false
                                                console.log('Все устал');
                                                ctx.reply('Не удалось загрузить или отправить изображение попробуйте запросить информацию снова');
                                            }
                                        }
                                }
                            }
                            if (noInfo) {
                                ctx.reply('Товар не найден ')
                            }
                        }

                    } else ctx.reply(
                        '<b>Вы не зарегестрированы на сайте '+process.env.CLIENT_SITE+'</b>\n' + 'Если у вас есть аккаунт введие ваш email или пройдите регистрацию на сайте',
                        { parse_mode: 'HTML' ,  reply_markup: {inline_keyboard: [ [{ text: '📦 '+process.env.CLIENT_SITE, url: 'https://' + process.env.CLIENT_SITE}]]}}
                    );
                })

            }


            // if (needNext) {
            //     console.log(ctx.message.text);
            //     console.log(ctx.from.id)
            //
            // }

        })
        //

        // this.bot.on('message', (ctx) => {
        //     console.log('ID пользователя:', ctx.from.id);
        //     ctx.reply('Ваш ID сохранен!');
        // });
        this.bot.launch();
        console.log('Бот запущен!');
    }


    sendMess(userId, trackProduct){


        try {
            const productId = trackProduct.id
            const name = trackProduct.name.substring(0, 20)+'...'
            const callbackData = `stop:${productId}|${name}`
            const  [message, needMessage] = setTrackProductMessage(trackProduct)
            if (needMessage) this.bot.telegram.sendMessage(
                userId, message,
                {parse_mode: 'HTML',
                    // reply_markup: { inline_keyboard: [[{text: `⏹ Не присылать сообщения по этому товару`,callback_data: callbackData}]]}

                }).then().catch();

        } catch(e) {}

    }

}


module.exports = new Mp_bot()

