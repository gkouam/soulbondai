import { Resend } from 'resend'
import { emailTemplates } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(options: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: options.from || 'SoulBond AI <noreply@soulbondai.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    console.log('Email sent:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Email sending error:', error)
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