import { Request, Response } from 'express';
import { sendEmail } from '@/services/email.service';

export async function testEmail(
  req: Request,
  res: Response
) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const result = await sendEmail({
      to: email,
      subject: 'GabAi Email Test',
      text: 'This is a test email from your GabAi backend.',
      html: `
        <h2>GabAi Email Test</h2>

        <p>Hello!</p>

        <p>
          This email was successfully sent using
          <strong>GabAi + Nodemailer + Mailgun SMTP</strong>.
        </p>

        <p>🎉 Your email system is working!</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully.',
      data: {
        messageId: result.messageId,
      },
    });
  } catch (error) {
    console.error('❌ Email sending error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send email.',
    });
  }
}