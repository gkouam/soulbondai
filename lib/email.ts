import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Use Gmail SMTP or any other email service
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback to console logging in development
  return {
    async sendMail(options: any) {
      console.log('📧 Email would be sent:', options);
      return { messageId: 'dev-' + Date.now() };
    }
  };
};

export async function sendEmail(options: EmailOptions) {
  const transporter = createTransporter();

  const mailOptions = {
    from: options.from || process.env.EMAIL_FROM || '"SoulBond AI Admin" <admin@soulbondai.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || options.text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Template for admin emails to users
export function createAdminEmailTemplate(content: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message from SoulBond AI Admin</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #8b5cf6;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
          }
          .content {
            margin-bottom: 30px;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #8b5cf6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SoulBond AI</div>
            <p style="margin: 10px 0 0 0; color: #666;">Your AI Companion Platform</p>
          </div>
          <div class="content">
            ${userName ? `<p>Dear ${userName},</p>` : ''}
            ${content}
          </div>
          <div class="footer">
            <p>This email was sent from the SoulBond AI admin team.</p>
            <p>If you have any questions, please contact us at support@soulbondai.com</p>
            <p style="margin-top: 20px;">© ${new Date().getFullYear()} SoulBond AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}