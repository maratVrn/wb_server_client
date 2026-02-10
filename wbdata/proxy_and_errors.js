const {saveErrorLog} = require("../servise/log");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProxyAndErrors {

    myProxy = []
    config = {}
    proxyId = -1

    cookie = '_wbauid=8898648211741974483; _ga_TXRZMJQDFE=GS2.1.s1758873409$o4$g0$t1758873409$j60$l0$h0; _ga=GA1.1.1123006456.1758441126; x_wbaas_token=1.1000.4bf38ef3f4c042b2acd8b166811e0413.MHwxMDkuMTA2LjEzNy4xNzR8TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6MTQ3LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTQ3LjB8MTc3MTgzMDcyOXxyZXVzYWJsZXwyfGV5Sm9ZWE5vSWpvaUluMD18MHwzfDE3NzEyMjU5Mjl8MQ==.MEQCIBrqBh9sYwzKJN/gz9hTcuqj6ZsVlR2vtNF5VkwzD5wTAiACF2vWxXLd5E41YC8uIXAWEUxCy1GlwyjH3zpYbilIkA=='
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    // Реалистичный User-Agent для Chrome на Windows
    browserHeaders = {
        'User-Agent': this.userAgent,  'Cookie' : this.cookie,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7', 'Connection': 'keep-alive',  'Upgrade-Insecure-Requests': '1', // Сигнализирует о желании перейти на HTTPS
    };

    constructor() {

        this.myProxy.push({
            proxy: { host: '45.88.149.19', port: 8000, protocol: 'https', auth: { username: 'OmzRbS1', password: 'OmzRbS123' } },
            is_Socket_Closed : false, })

        this.myProxy.push({
            proxy: { host: '46.8.111.94', port  :  8000, protocol :'https', auth  :   {  username: 'OmzRbS1', password  : 'OmzRbS123'  } },
            is_Socket_Closed : false, })


        this.getNextProxy()


    }

    getNextProxy(isClosed = false){
        console.log('getNextProxy');
        // isClosed Если по текущему прокси закрыто соединение то обозначаем это и выбираем следующий

        let isProxy = false // установили ли проки

        // Если прокси оказался нерабочим то закроем его
        if (isClosed) if ((this.proxyId>=0) && (this.proxyId<this.myProxy.length)) this.myProxy[this.proxyId].is_Socket_Closed = true

        // Далее найдем следующий рабочий прокси и установим его
        // сначала в сторону следующего по списку
        for (let i = this.proxyId+1; i < this.myProxy.length; i++) {
            if (!this.myProxy[i].is_Socket_Closed){
                this.config = {proxy: this.myProxy[i].proxy}
                this.proxyId = i
                isProxy = true
                break
            }
        }

        // Если не нашлось то с нуля до текущего
        if (!isProxy)
            for (let i = 0; i < this.proxyId; i++) {
                if (!this.myProxy[i].is_Socket_Closed){
                    this.config = {proxy: this.myProxy[i].proxy}
                    this.proxyId = i
                    isProxy = true
                    break
                }
            }


        // Если прокси не установлен то ставим пустой конфиг чтобы хоть как то работало и
        if (!isProxy) {
            // TODO: Отправить сообщение куда то АЛЛЕРТ - все прокси сломалось надо что то делать!
            console.log('Отправить сообщение куда то АЛЛЕРТ - все прокси сломалось надо что то делать!');
            this.config = {}
            this.proxyId = -1
        }

        console.log('Установили прокси '+   this.proxyId);
    }

    // Универсальный обработчик ошибок для парсеров
    async view_error (err, funcName, funcParam){
        let needGetData = false
        if (err.response?.status) if (err.response.status === 498) console.log('Устарели куки');

        console.log(err.code)

        // Временно не доступен сайт ВБ
        if (err.code === 'ECONNRESET') {
            saveErrorLog('ProxyAndErrors', funcName+'  '+funcParam+'  '+err.code);
            await delay(50);
            needGetData = true
        }

        // Сломался интернет
        if (err.code === 'ETIMEDOUT') {
            saveErrorLog('ProxyAndErrors', funcName+'  '+funcParam+'  '+err.code);
            await delay(5000);
            needGetData = true
        }


        // Сломался прокис
        if (err.code === 'ERR_SOCKET_CLOSED') {
            // прокси сломался
            saveErrorLog('ProxyAndErrors', funcName+'  '+funcParam+'  '+err.code);
            saveErrorLog('ProxyAndErrors', funcName+' неработающий прокси с idx '+this.proxyId);
            this.getNextProxy(true)
            saveErrorLog('ProxyAndErrors', funcName+' установили прокси с idx '+this.proxyId);
            if (this.proxyId<0) saveErrorLog('ProxyAndErrors', funcName+' ВАЖНО Не осталось работающих прокси!! ');
            await delay(50);
            needGetData = true
        }

        // Частое подключение к серверу - меняем прокси
        if ((err.status === 429) || (err.response?.status === 429)) {
            saveErrorLog('ProxyAndErrors', funcName+'  '+funcParam+'  '+'Частое подключение к серверу')
            this.getNextProxy()
            await delay(50);
            needGetData = true
        }



        // Необработанная ошибка
        if (!needGetData){
            saveErrorLog('ProxyAndErrors', funcName+'  '+funcParam+'  '+'Необработанная ошибка err.code = '+err.code)

        }

        return needGetData
    }
}
module.exports = new  ProxyAndErrors()