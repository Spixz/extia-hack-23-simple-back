const nodemailer = require('nodemailer');
const MAIL_KEY = process.env.MAIL_KEY

// Création du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'extia.buddy@gmail.com',
    pass: MAIL_KEY
  }
});

function sendEmail(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        } else {
          console.log('E-mail envoyé avec succès. ID du message :', info.messageId);
        }
      });
}

module.exports = sendEmail;
