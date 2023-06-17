const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

function sendEmail(mailOptions) {
    const msg = {
        to: 'mammar.cyril@epitech.eu',
        from: 'extia-buddy@fsocietyy.org',
        subject: mailOptions.subject,
        html: mailOptions.html,
      }
      
      sgMail
        .send(msg)
        .then((response) => {
          console.log(response[0].statusCode)
          console.log(response[0].headers)
        })
        .catch((error) => {
          console.error(error)
        })
}

module.exports = sendEmail;