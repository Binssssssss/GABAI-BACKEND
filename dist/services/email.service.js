import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});
export async function sendEmail({ to, subject, text, html, }) {
    if (!process.env.MAIL_HOST) {
        throw new Error('MAIL_HOST is not configured.');
    }
    if (!process.env.MAIL_USER) {
        throw new Error('MAIL_USER is not configured.');
    }
    if (!process.env.MAIL_PASSWORD) {
        throw new Error('MAIL_PASSWORD is not configured.');
    }
    if (!process.env.MAIL_FROM) {
        throw new Error('MAIL_FROM is not configured.');
    }
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text,
        html,
    });
    return info;
}
//# sourceMappingURL=email.service.js.map