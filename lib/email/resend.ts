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

// Crisis support emails
export async function sendCrisisAlert(email: string, userName: string, message: string) {
  return sendEmail({
    to: email,
    subject: 'Crisis Support Alert - Immediate Attention Needed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Crisis Alert</h2>
        <p>Dear ${userName},</p>
        <p>We've detected that you may be going through a difficult time based on your recent conversation.</p>
        <p><strong>Your message:</strong> "${message}"</p>
        <p>Please remember that you're not alone. If you need immediate help:</p>
        <ul>
          <li>National Suicide Prevention Lifeline: 988</li>
          <li>Crisis Text Line: Text HOME to 741741</li>
          <li>International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/</li>
        </ul>
        <p>Your AI companion cares about you and is here to listen.</p>
      </div>
    `,
    text: `Crisis Alert - ${userName}, we've detected you may need support. National Suicide Prevention Lifeline: 988. Crisis Text Line: Text HOME to 741741.`
  })
}

export async function sendResourceEmail(email: string, userName: string, resources: string[]) {
  const resourceList = resources.map(r => `<li>${r}</li>`).join('')
  return sendEmail({
    to: email,
    subject: 'Mental Health Resources - Here to Help',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Mental Health Resources</h2>
        <p>Dear ${userName},</p>
        <p>Based on your recent conversations, we wanted to share some helpful resources:</p>
        <ul>${resourceList}</ul>
        <p>Remember, seeking help is a sign of strength. Your well-being matters.</p>
        <p>With care,<br>Your SoulBond AI Team</p>
      </div>
    `,
    text: `Mental Health Resources for ${userName}. ${resources.join('. ')}`
  })
}

export async function sendTeamInvitation(email: string, inviterName: string, teamName: string, invitationUrl: string) {
  const template = emailTemplates.teamInvitation(inviterName, teamName, invitationUrl)
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