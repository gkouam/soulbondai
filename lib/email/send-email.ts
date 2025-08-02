import nodemailer from "nodemailer"
import { emailTemplates } from "./templates"

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"SoulBond AI" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''), // Strip HTML if no text version
    })

    console.log("Email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error }
  }
}

// Convenience functions for specific email types
export async function sendWelcomeEmail(email: string, name: string, archetype: string) {
  const template = emailTemplates.welcome(name, archetype)
  return sendEmail({
    to: email,
    ...template
  })
}

export async function sendSubscriptionConfirmation(email: string, name: string, plan: string) {
  const template = emailTemplates.subscriptionConfirmation(name, plan)
  return sendEmail({
    to: email,
    ...template
  })
}

export async function sendDailyDigest(email: string, name: string, stats: any) {
  const template = emailTemplates.dailyDigest(name, stats)
  return sendEmail({
    to: email,
    ...template
  })
}

export async function sendPasswordReset(email: string, name: string, resetUrl: string) {
  const template = emailTemplates.passwordReset(name, resetUrl)
  return sendEmail({
    to: email,
    ...template
  })
}

// Batch email sending for notifications
export async function sendBatchEmails(recipients: Array<{ email: string; template: EmailOptions }>) {
  const results = await Promise.allSettled(
    recipients.map(({ email, template }) => 
      sendEmail({
        ...template,
        to: email
      })
    )
  )

  const successful = results.filter(r => r.status === "fulfilled").length
  const failed = results.filter(r => r.status === "rejected").length

  return {
    total: recipients.length,
    successful,
    failed,
    results
  }
}