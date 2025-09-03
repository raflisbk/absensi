"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Mail, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    // Jika ada token di URL, langsung verify
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/auth/register/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed')
      }

      setVerificationStatus('success')
      setMessage('Email berhasil diverifikasi! Anda akan dialihkan ke halaman login.')
      toast.success('Email berhasil diverifikasi!')
      
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error: any) {
      setVerificationStatus('error')
      setMessage(error.message || 'Terjadi kesalahan saat verifikasi email')
      toast.error(error.message || 'Verifikasi email gagal')
    } finally {
      setIsVerifying(false)
    }
  }

  const resendVerificationEmail = async () => {
    const email = sessionStorage.getItem('pendingVerificationEmail')
    
    if (!email) {
      toast.error('Email tidak ditemukan. Silakan daftar ulang.')
      router.push('/register')
      return
    }

    setIsResending(true)
    
    try {
      const response = await fetch('/api/auth/register/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      toast.success('Email verifikasi telah dikirim ulang!')
      
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim ulang email verifikasi')
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Memverifikasi Email</h3>
          <p className="text-muted-foreground">Mohon tunggu sebentar...</p>
        </div>
      )
    }

    if (verificationStatus === 'success') {
      return (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-green-600">Verifikasi Berhasil!</h3>
          <p className="text-muted-foreground mb-4">{message}</p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Mengalihkan ke halaman login...</p>
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          </div>
        </div>
      )
    }

    if (verificationStatus === 'error') {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Verifikasi Gagal</h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="space-y-3">
            <Button 
              onClick={resendVerificationEmail} 
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim ulang...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kirim Ulang Email Verifikasi
                </>
              )}
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/register">Daftar Ulang</Link>
            </Button>
          </div>
        </div>
      )
    }

    // Default pending state (no token in URL)
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Cek Email Anda</h3>
        <p className="text-muted-foreground mb-6">
          Kami telah mengirimkan link verifikasi ke email Anda. 
          Silakan buka email dan klik link untuk memverifikasi akun.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={resendVerificationEmail} 
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim ulang...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Kirim Ulang Email
              </>
            )}
          </Button>
          
          <div className="text-sm text-muted-foreground">
            <p>Tidak menerima email?</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Cek folder spam/junk</li>
              <li>Pastikan email yang dimasukkan benar</li>
              <li>Tunggu beberapa menit untuk email masuk</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">FaceAttend</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Verifikasi Email</h1>
          <p className="text-muted-foreground">
            Langkah terakhir untuk mengaktifkan akun Anda
          </p>
        </div>

        {/* Verification Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Email Verification</CardTitle>
            <CardDescription className="text-center">
              Verifikasi email diperlukan untuk melanjutkan registrasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sudah verifikasi?{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}