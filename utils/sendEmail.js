const { text } = require('body-parser');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
service: 'gmail', // or use host/port if you use a different provider
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}
});

const sendFaqAnswerEmail = async (to, question, answer) => {
    const mailOptions = {
    // from: "Your Ministry" <${process.env.EMAIL_USERNAME}>,
    to,
    subject: 'Your question has been answered',
    // html: <p><strong>Q:</strong> ${question}</p> <p><strong>A:</strong> ${answer}</p> <p>Thank you for reaching out to us.</p>
    text: `Q: ${question}\nA: ${answer}\n\nThank you for reaching out to us.`,
    };
    
    await transporter.sendMail(mailOptions);
    };

async function sendEmail(to, subject, message) {
await transporter.sendMail({
// from: "Ministry Web App" <${user}>,
to,
subject,
html: message
});
};


module.exports = sendFaqAnswerEmail;
module.exports = sendEmail;