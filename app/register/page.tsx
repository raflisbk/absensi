"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Shield, User, Mail, GraduationCap, Phone, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function RegisterStep1Page() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  })
  
  const router = useRouter()

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Nama lengkap harus diisi")
      return false
    }
    
    if (!formData.email.trim()) {
      toast.error("Email harus diisi")
      return false
    }
    
    if (!formData.email.includes("@")) {
      toast.error("Format email tidak valid")
      return false
    }
    
    if (!formData.studentId.trim()) {
      toast.error("NIM/NIP harus diisi")
      return false
    }
    
    if (!formData.phone.trim()) {
      toast.error("Nomor telepon harus diisi")
      return false
    }
    
    if (!formData.role) {
      toast.error("Role harus dipilih")
      return false
    }
    
    if (formData.password.length < 8) {
      toast.error("Password minimal 8 karakter")
      return false
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
    if (!passwordRegex.test(formData.password)) {
      toast.error("Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka")
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok")
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
      const response = await fetch('/api/auth/register/step-1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          studentId: formData.studentId,
          phone: formData.phone,
          role: formData.role as 'STUDENT' | 'LECTURER',
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Registration Step 1 error:', data)
        
        if (data.fieldErrors) {
          const errors = Object.entries(data.fieldErrors).map(([field, messages]: [string, any]) => 
            `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          ).join('\n')
          throw new Error(`Validation failed:\n${errors}`)
        }
        
        throw new Error(data.error || 'Registration step 1 failed')
      }

      toast.success('Step 1 berhasil! Melanjutkan ke verifikasi dokumen...')
      
      // Store user ID for next steps
      sessionStorage.setItem('registrationUserId', data.user.id)
      sessionStorage.setItem('registrationEmail', data.user.email)
      
      // Redirect to step 2
      router.push('/register/step-2')
      
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat registrasi')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Registrasi Akun</h1>
          <p className="text-muted-foreground">Step 1 dari 4: Informasi Dasar</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={25} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span className="font-medium text-primary">Informasi Dasar</span>
            <span>Dokumen</span>
            <span>Foto Wajah</span>
            <span>Verifikasi</span>
          </div>
        </div>

        {/* Registration Form Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Lengkapi informasi pribadi Anda untuk membuat akun</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@sekolah.ac.id"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">NIM/NIP</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Masukkan NIM atau NIP"
                    className="pl-10"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Status</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status Anda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Siswa/Mahasiswa</SelectItem>
                    <SelectItem value="LECTURER">Pengajar/Dosen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 karakter (huruf besar, kecil, angka)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Lanjutkan ke Step 2"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-accent hover:underline font-medium">
                  Masuk di sini
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
              <h3 className="font-medium text-foreground mb-1">Privasi & Keamanan</h3>
              <p className="text-sm text-muted-foreground">
                Data pribadi dan biometrik Anda akan dienkripsi dan disimpan sesuai standar keamanan tinggi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}