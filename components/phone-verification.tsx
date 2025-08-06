"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"

interface PhoneVerificationProps {
  currentPhone?: string | null
  isVerified?: boolean
  onUpdate?: () => void
}

export function PhoneVerification({ 
  currentPhone, 
  isVerified = false,
  onUpdate 
}: PhoneVerificationProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<'input' | 'verify' | 'complete'>('input')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  
  useEffect(() => {
    if (currentPhone && isVerified) {
      setStep('complete')
      setPhoneNumber(currentPhone)
    }
  }, [currentPhone, isVerified])
  
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])
  
  const formatPhoneDisplay = (phone: string) => {
    // Show only last 4 digits for privacy
    if (phone.length >= 4) {
      return `•••• •••• ${phone.slice(-4)}`
    }
    return phone
  }
  
  const handleSendCode = async () => {
    if (!phoneNumber) {
      toast({
        type: 'error',
        title: 'Phone number required',
        description: 'Please enter a valid phone number'
      })
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/phone/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send code')
      }
      
      toast({
        type: 'success',
        title: 'Verification code sent',
        description: 'Check your phone for the code'
      })
      
      setStep('verify')
      setTimeLeft(60) // 60 seconds before resend
    } catch (error) {
      toast({
        type: 'error',
        title: 'Failed to send code',
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        type: 'error',
        title: 'Invalid code',
        description: 'Please enter the 6-digit code'
      })
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/phone/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: verificationCode })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid code')
      }
      
      toast({
        type: 'success',
        title: 'Phone verified!',
        description: 'Your phone number has been verified'
      })
      
      setStep('complete')
      onUpdate?.()
    } catch (error) {
      toast({
        type: 'error',
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleResendCode = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/phone/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        if (data.retryAfter) {
          setTimeLeft(data.retryAfter)
        }
        throw new Error(data.error || 'Failed to resend code')
      }
      
      toast({
        type: 'success',
        title: 'Code resent',
        description: 'Check your phone for the new code'
      })
      
      setTimeLeft(60)
    } catch (error) {
      toast({
        type: 'error',
        title: 'Failed to resend code',
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleRemovePhone = async () => {
    if (!confirm('Are you sure you want to remove your phone number?')) {
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/phone/remove', {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove phone')
      }
      
      toast({
        type: 'success',
        title: 'Phone removed',
        description: 'Your phone number has been removed'
      })
      
      setStep('input')
      setPhoneNumber('')
      setVerificationCode('')
      onUpdate?.()
    } catch (error) {
      toast({
        type: 'error',
        title: 'Failed to remove phone',
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-violet-500" />
          Phone Verification
        </CardTitle>
        <CardDescription>
          Add a phone number for enhanced account security
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
              <p className="text-xs text-gray-500">
                We'll send a verification code to this number
              </p>
            </div>
            
            <Button
              onClick={handleSendCode}
              disabled={loading || !phoneNumber}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Send Verification Code
            </Button>
          </div>
        )}
        
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4 text-sm">
              <p className="text-gray-300">
                Verification code sent to: <strong>{phoneNumber}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="bg-gray-800 border-gray-700 text-center text-lg tracking-widest"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Verify Code
              </Button>
              
              <Button
                onClick={handleResendCode}
                disabled={loading || timeLeft > 0}
                variant="outline"
              >
                {timeLeft > 0 ? `Resend (${timeLeft}s)` : 'Resend'}
              </Button>
            </div>
            
            <Button
              onClick={() => setStep('input')}
              variant="ghost"
              className="w-full"
            >
              Change Number
            </Button>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-green-400">Verified</p>
                  <p className="text-sm text-gray-300">
                    {formatPhoneDisplay(phoneNumber)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Your phone number helps secure your account and can be used for 
                important notifications about your account security.
              </p>
            </div>
            
            <Button
              onClick={handleRemovePhone}
              disabled={loading}
              variant="outline"
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Remove Phone Number
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}