"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  
  const router = useRouter()

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error("Email harus diisi")
      return false
    }
    
    if (!formData.email.includes("@")) {
      toast.error("Format email tidak valid")
      return false
    }
    
    if (!formData.password.trim()) {
      toast.error("Password harus diisi")
      return false
    }
    
    if (formData.password.length < 6) {
      toast.error("Password minimal 6 karakter")
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Enhanced error handling
        console.error('Login error:', data)
        throw new Error(data.error || 'Login failed')
      }

      toast.success('Login berhasil!')
      
      // Store authentication token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token)
      }
      
      // Redirect based on user role
      const redirectPath = data.user?.role === 'ADMIN' ? '/admin' : 
                          data.user?.role === 'LECTURER' ? '/lecturer' : '/student'
      
      router.push(redirectPath)
      
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">FaceAttend</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Masuk ke Akun</h1>
          <p className="text-muted-foreground">Masukkan kredensial Anda untuk mengakses sistem absensi</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Gunakan email dan password yang telah terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@sekolah.ac.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link href="/register" className="text-accent hover:underline font-medium">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-foreground mb-1">Keamanan Data</h3>
              <p className="text-sm text-muted-foreground">
                Sistem kami menggunakan enkripsi tingkat tinggi untuk melindungi data pribadi dan biometrik Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}