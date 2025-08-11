import { NextResponse } from 'next/server'
import { resend } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Send email to CEO
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contact Form Submission</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background: white;
              border-radius: 8px;
              border-left: 4px solid #667eea;
            }
            .field-label {
              font-weight: 600;
              color: #667eea;
              margin-bottom: 5px;
            }
            .field-value {
              color: #333;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p>SoulBond AI Website</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Name:</div>
              <div class="field-value">${name}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value">${email}</div>
            </div>
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
            </div>
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="field-value">${message}</div>
            </div>
          </div>
          <div class="footer">
            <p>This message was sent from the SoulBond AI contact form.</p>
            <p>© ${new Date().getFullYear()} QuantumDense Inc. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    // Send to CEO
    await resend.emails.send({
      from: 'SoulBond AI <noreply@soulbondai.com>',
      to: 'ceo@quantumdense.com',
      subject: `Contact Form: ${subject}`,
      html: emailHtml,
      reply_to: email
    })

    // Send confirmation to user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Thank You for Contacting Us</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Thank You for Contacting Us!</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to us. We have received your message and appreciate you taking the time to contact us.</p>
            <p><strong>Your Message Summary:</strong></p>
            <p style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              <strong>Subject:</strong> ${subject}<br>
              <strong>Message:</strong> ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
            </p>
            <p>Our team will review your message and get back to you within 24-48 hours during business days.</p>
            <p>In the meantime, feel free to explore SoulBond AI:</p>
            <center>
              <a href="https://soulbondai.com" class="button">Visit SoulBond AI</a>
            </center>
          </div>
          <div class="footer">
            <p>This is an automated confirmation email. Please do not reply to this message.</p>
            <p>© ${new Date().getFullYear()} QuantumDense Inc. All rights reserved.</p>
            <p>SoulBond AI™ is a trademark of QuantumDense Inc.</p>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: 'SoulBond AI <noreply@soulbondai.com>',
      to: email,
      subject: 'Thank you for contacting SoulBond AI',
      html: confirmationHtml
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}