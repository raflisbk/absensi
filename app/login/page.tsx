"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement authentication logic
    console.log("Login attempt:", formData)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">EduAttend</span>
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Masuk
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
