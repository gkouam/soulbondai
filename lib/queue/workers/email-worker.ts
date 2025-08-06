import { Worker } from 'bullmq'
import { connection } from '../redis-connection'
import { QUEUE_NAMES } from '../queues'
import { sendEmail } from '@/lib/email/resend'

interface EmailJobData {
  type: 'welcome' | 'reset-password' | 'subscription' | 'notification'
  to: string
  subject?: string
  data: any
}

export const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { type, to, subject, data } = job.data
    
    console.log(`Processing email job ${job.id}: ${type} to ${to}`)
    
    try {
      switch (type) {
        case 'welcome':
          await sendEmail({
            to,
            subject: subject || 'Welcome to SoulBond AI!',
            html: `
              <h1>Welcome ${data.name || 'Friend'}!</h1>
              <p>We're excited to have you join SoulBond AI.</p>
              <p>Your AI companion is ready to meet you!</p>
            `
          })
          break
          
        case 'reset-password':
          await sendEmail({
            to,
            subject: subject || 'Reset your password',
            html: `
              <h1>Password Reset Request</h1>
              <p>Click the link below to reset your password:</p>
              <a href="${data.resetUrl}">Reset Password</a>
              <p>This link will expire in 1 hour.</p>
            `
          })
          break
          
        case 'subscription':
          await sendEmail({
            to,
            subject: subject || 'Subscription Update',
            html: `
              <h1>Subscription ${data.action}</h1>
              <p>${data.message}</p>
            `
          })
          break
          
        case 'notification':
          await sendEmail({
            to,
            subject: subject || 'Notification from SoulBond AI',
            html: data.html || data.message
          })
          break
      }
      
      console.log(`Email job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`Email job ${job.id} failed:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // 10 emails per second max
    },
  }
)

emailWorker.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`)
})

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err)
})