const nodeMailer = require('nodemailer')

class MailService {
    constructor() {


        this.transporter = nodeMailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth : {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }

        })

    }

    async sendUpdatePasswordMail(to, link){
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject:'Изменение пароля на сайту mp-tracker.ru',
            text:'',
            html:
            `
                <div>
                    <h1>Для изменения пароля перейдите по ссылке</h1>
                    <a href="${link}">${link}</a>
                
                </div>
                
            `
        })
    }

}

module.exports = new MailService()
