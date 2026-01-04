const {saveErrorLog} = require("../servise/log");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProxyAndErrors {

    myProxy = []
    config = {}
    proxyId = -1

    cookie = '_ga_TXRZMJQDFE=GS2.1.s1759049348$o7$g0$t1759049348$j60$l0$h0; _ga=GA1.1.1812723687.1758564601; external-locale=ru; _wbauid=5008695551766416174; cfidsw-wb=H8jlcc8qq+Mvh980e0CGWuvVX0rONlM/EmSOleVZwKceNdP3NqBgSZNpnhTgMGNcOgCw3DC11y6pqnuC7zm2lgWKLPUPjRl1Y2pvNJxrZvlaHYFfBkehb8qcNMmLDcSezU60LnF4c7RPSeZzx8GuJzYHetcKezZLziEgyUIa; __zzatw-wb=MDA0dC0yYBwREFsKEH49WgsbSl1pCENQGC9LXz1uLWEPJ3wjYnwgGWsvC1RDMmUIPkBNOTM5NGZwVydgTl8mRFVSCSUdFHhsH0FLVCNyM3dlaXceViUTFmcPRyJ1F0hAGxI6aCU6f1JpGWUzDldjGAsmVDVfP3wnHhl7dChQcX9NfXY3PmJ+MQ9pOSRjCh9+OFoLDWk3XBQ8dWU+SHN6KjtqJV9LXCBDUT9FbllGaXUVF0M8HHsNKkNtLToZUXYQQlh4cBpEN0AYfxVZUnUpbn06MBtFVyVkfRMfSFhRM1sgEnt0WFg5DF9xQ3Z1XzxlIWRKFSd2R0lrZU5TQixmG3EVTQgNND1aciIPWzklWAgSPwsmIBd+bCNUDwtfQEJtbxt/Nl0cOWMRCxl+OmNdRkc3FSR7dSYKCTU3YnAvTCB7SykWRxsyYV5GaXUVUggMGENHJi4mPiFRG0RdI0RbSjIoHkV0bSwNfxQUPkZ1dzJAVxlRDxZhDhYYRRcje0I3Yhk4QhgvPV8/YngiD2lIYCVKVk1+LRkVe3IlS3FPLH12X30beylOIA0lVBMhP05yxROy0w==; wbx-validation-key=1b586389-7e25-4ec7-a4e6-cafd95b079ba; x-supplier-id-external=311e66ac-3ddd-4416-a35d-29f09a158495; x_wbaas_token=1.1000.e80f0fe5cb084555ba7df2a579fb1901.MHwxMDkuMTA2LjEzNy4xNzR8TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NDsgcnY6MTQ2LjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvMTQ2LjB8MTc2ODc0MDkwNHxyZXVzYWJsZXwyfGV5Sm9ZWE5vSWpvaUluMD18MHwzfDE3NjgxMzYxMDR8MQ==.MEUCIQClFTg8TxPlnMjbbbM/tmJmqivVYutHXyd4mSoAoJt2BQIgI0p8CR05xOMfXwMIyS4c7/0kMDCerVl37OkRMg4WxSU='

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