interface ReCaptchaResponse {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
}

export async function verifyRecaptcha(token: string, action?: string): Promise<{
  success: boolean
  score: number
  errors?: string[]
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.warn("reCAPTCHA secret key not configured - skipping verification")
    return { success: true, score: 1.0 } // Allow in development if not configured
  }

  if (!token) {
    return { 
      success: false, 
      score: 0, 
      errors: ["No reCAPTCHA token provided"] 
    }
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data: ReCaptchaResponse = await response.json()

    if (!data.success) {
      return {
        success: false,
        score: 0,
        errors: data["error-codes"] || ["Verification failed"],
      }
    }

    // Check if action matches (if provided)
    if (action && data.action !== action) {
      return {
        success: false,
        score: data.score || 0,
        errors: ["Action mismatch"],
      }
    }

    // reCAPTCHA v3 returns a score (0.0 - 1.0)
    // 0.0 is likely a bot, 1.0 is likely human
    // We'll use 0.5 as the threshold
    const score = data.score || 0
    const isHuman = score >= 0.5

    return {
      success: isHuman,
      score,
      errors: isHuman ? undefined : ["Score too low - possible bot detected"],
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error)
    return {
      success: false,
      score: 0,
      errors: ["Verification service error"],
    }
  }
}

// Helper to check if request seems like a bot based on multiple factors
export function isSuspiciousRequest(
  headers: Headers,
  recaptchaScore?: number
): boolean {
  // Check for common bot user agents
  const userAgent = headers.get("user-agent")?.toLowerCase() || ""
  const botPatterns = [
    "bot", "crawler", "spider", "scraper", "curl", "wget", 
    "python", "java", "ruby", "perl", "php"
  ]
  
  const hasBoUserAgent = botPatterns.some(pattern => userAgent.includes(pattern))
  
  // Check for missing standard headers
  const hasReferer = headers.has("referer")
  const hasOrigin = headers.has("origin")
  
  // Suspicious if: bot user agent, very low reCAPTCHA score, or missing expected headers
  return hasBoUserAgent || 
         (recaptchaScore !== undefined && recaptchaScore < 0.3) ||
         (!hasReferer && !hasOrigin)
}