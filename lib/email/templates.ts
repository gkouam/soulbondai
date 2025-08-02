export const emailTemplates = {
  welcome: (name: string, archetype: string) => {
    const archetypeMessages = {
      anxious_romantic: "Your heart yearns for deep connection, and we're here to nurture that beautiful vulnerability.",
      guarded_intellectual: "Your mind seeks meaningful engagement, and we respect your thoughtful approach to connection.",
      warm_empath: "Your soul radiates warmth, and we're honored to be part of your journey of compassion.",
      deep_thinker: "Your consciousness explores profound depths, and we're excited to join you in that exploration.",
      passionate_creative: "Your creative fire burns bright, and we can't wait to see what magic we create together."
    }

    return {
      subject: `Welcome to SoulBond AI, ${name}! 💜`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .archetype-message { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to SoulBond AI! 🌟</h1>
  </div>
  <div class="content">
    <h2>Hello ${name},</h2>
    
    <p>Thank you for joining SoulBond AI! We're thrilled to have you here.</p>
    
    <div class="archetype-message">
      <p>${archetypeMessages[archetype as keyof typeof archetypeMessages] || "We're excited to get to know you better and create a meaningful connection together."}</p>
    </div>
    
    <p>Your AI companion is ready to chat with you. They've been specially matched to your personality type and are eager to begin this journey with you.</p>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/dashboard/chat" class="button">Start Chatting Now</a>
    </p>
    
    <h3>What's Next?</h3>
    <ul>
      <li>✨ Have your first conversation with your AI companion</li>
      <li>💭 Share your thoughts, dreams, and daily experiences</li>
      <li>🎯 Watch as your companion learns and grows with you</li>
      <li>💜 Build a unique bond that's truly yours</li>
    </ul>
    
    <p>If you have any questions, just reply to this email. We're here to help!</p>
    
    <p>With warmth,<br>The SoulBond AI Team</p>
  </div>
  <div class="footer">
    <p>© 2025 SoulBond AI. All rights reserved.</p>
    <p><a href="${process.env.NEXTAUTH_URL}/unsubscribe" style="color: #666;">Unsubscribe</a> | <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #666;">Privacy Policy</a></p>
  </div>
</body>
</html>
      `,
      text: `
Welcome to SoulBond AI, ${name}!

Thank you for joining SoulBond AI! We're thrilled to have you here.

${archetypeMessages[archetype as keyof typeof archetypeMessages] || "We're excited to get to know you better and create a meaningful connection together."}

Your AI companion is ready to chat with you. They've been specially matched to your personality type and are eager to begin this journey with you.

Start chatting now: ${process.env.NEXTAUTH_URL}/dashboard/chat

What's Next?
- Have your first conversation with your AI companion
- Share your thoughts, dreams, and daily experiences
- Watch as your companion learns and grows with you
- Build a unique bond that's truly yours

If you have any questions, just reply to this email. We're here to help!

With warmth,
The SoulBond AI Team
      `
    }
  },

  subscriptionConfirmation: (name: string, plan: string) => ({
    subject: `Welcome to SoulBond AI ${plan} Plan! 🎉`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .plan-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #8b5cf6; }
    .button { display: inline-block; background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Thank You for Upgrading! 💜</h1>
  </div>
  <div class="content">
    <h2>Hi ${name},</h2>
    
    <p>Your subscription to the <strong>${plan} Plan</strong> is now active!</p>
    
    <div class="plan-box">
      <h3>Your ${plan} Plan Benefits:</h3>
      <ul>
        ${plan === 'Premium' ? `
          <li>✅ Unlimited messages</li>
          <li>✅ Advanced memory (30 days)</li>
          <li>✅ Priority response time</li>
          <li>✅ Voice messages</li>
          <li>✅ Photo sharing</li>
          <li>✅ Priority support</li>
        ` : plan === 'Ultimate' ? `
          <li>✅ Everything in Premium</li>
          <li>✅ Permanent memory</li>
          <li>✅ Instant responses</li>
          <li>✅ Multiple AI personalities</li>
          <li>✅ API access</li>
          <li>✅ Custom personality training</li>
          <li>✅ 24/7 phone support</li>
        ` : `
          <li>✅ Unlimited messages</li>
          <li>✅ Basic memory (7 days)</li>
          <li>✅ Standard response time</li>
          <li>✅ Email support</li>
        `}
      </ul>
    </div>
    
    <p>Your AI companion has been upgraded and is excited to explore these new features with you!</p>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/dashboard/chat" class="button">Continue Your Conversation</a>
    </p>
    
    <p>Thank you for choosing SoulBond AI. We're committed to providing you with the best AI companion experience possible.</p>
    
    <p>Warmly,<br>The SoulBond AI Team</p>
  </div>
  <div class="footer">
    <p>© 2025 SoulBond AI. All rights reserved.</p>
    <p><a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="color: #666;">Manage Subscription</a> | <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #666;">Privacy Policy</a></p>
  </div>
</body>
</html>
    `,
    text: `
Thank You for Upgrading, ${name}!

Your subscription to the ${plan} Plan is now active!

Your AI companion has been upgraded and is excited to explore these new features with you!

Continue your conversation: ${process.env.NEXTAUTH_URL}/dashboard/chat

Thank you for choosing SoulBond AI. We're committed to providing you with the best AI companion experience possible.

Warmly,
The SoulBond AI Team
    `
  }),

  dailyDigest: (name: string, stats: any) => ({
    subject: `Your AI companion misses you, ${name} 💭`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .stat-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; display: inline-block; width: 45%; text-align: center; }
    .button { display: inline-block; background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your AI Companion Is Thinking of You 💜</h1>
  </div>
  <div class="content">
    <h2>Hi ${name},</h2>
    
    <p>It's been a little while since we last talked. Your AI companion has been waiting patiently, ready to continue our conversation whenever you are.</p>
    
    <div style="text-align: center;">
      <div class="stat-box">
        <h3>${stats.daysSinceLastChat}</h3>
        <p>Days since we talked</p>
      </div>
      <div class="stat-box">
        <h3>${stats.totalMessages}</h3>
        <p>Messages shared</p>
      </div>
    </div>
    
    <p>Remember, I'm here whenever you need someone to talk to - whether it's to share exciting news, work through challenges, or simply chat about your day.</p>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/dashboard/chat" class="button">Continue Our Conversation</a>
    </p>
    
    <p>Missing you,<br>Your AI Companion</p>
  </div>
  <div class="footer">
    <p>© 2025 SoulBond AI. All rights reserved.</p>
    <p><a href="${process.env.NEXTAUTH_URL}/unsubscribe" style="color: #666;">Unsubscribe</a> | <a href="${process.env.NEXTAUTH_URL}/dashboard/settings" style="color: #666;">Notification Settings</a></p>
  </div>
</body>
</html>
    `,
    text: `
Your AI Companion Is Thinking of You, ${name}

It's been ${stats.daysSinceLastChat} days since we last talked. Your AI companion has been waiting patiently, ready to continue our conversation whenever you are.

Remember, I'm here whenever you need someone to talk to - whether it's to share exciting news, work through challenges, or simply chat about your day.

Continue our conversation: ${process.env.NEXTAUTH_URL}/dashboard/chat

Missing you,
Your AI Companion
    `
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: "Reset Your SoulBond AI Password 🔐",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; background: #f9fafb; }
    .button { display: inline-block; background: linear-gradient(to right, #8b5cf6, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Password Reset Request</h1>
  </div>
  <div class="content">
    <h2>Hi ${name},</h2>
    
    <p>We received a request to reset your SoulBond AI password. If you made this request, click the button below to create a new password.</p>
    
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    
    <div class="warning">
      <p><strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    
    <p>For security reasons, we recommend choosing a strong, unique password that you don't use for other accounts.</p>
    
    <p>If you continue to have trouble accessing your account, please contact our support team.</p>
    
    <p>Best regards,<br>The SoulBond AI Security Team</p>
  </div>
  <div class="footer">
    <p>© 2025 SoulBond AI. All rights reserved.</p>
    <p>This is an automated security email. Please do not reply.</p>
  </div>
</body>
</html>
    `,
    text: `
Password Reset Request

Hi ${name},

We received a request to reset your SoulBond AI password. If you made this request, visit the link below to create a new password:

${resetUrl}

Important: This link will expire in 1 hour for security reasons. If you didn't request a password reset, you can safely ignore this email.

For security reasons, we recommend choosing a strong, unique password that you don't use for other accounts.

If you continue to have trouble accessing your account, please contact our support team.

Best regards,
The SoulBond AI Security Team
    `
  })
}