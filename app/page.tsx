"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Clock, ArrowRight, Camera } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 group">
            <div className="relative">
              <Camera className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              FaceAttend
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="outline"
                className="hover:bg-primary/5 transition-all duration-200 hover:scale-105 bg-transparent"
              >
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                Daftar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Education Background */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=800&width=1200')`,
          }}
        ></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Camera className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Teknologi Pengenalan Wajah</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in-up">
            Absensi{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Berbasis Wajah
            </span>{" "}
            Terdepan
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-in-up delay-200 max-w-3xl mx-auto">
            Solusi absensi modern menggunakan teknologi AI untuk mengenali wajah dengan akurasi tinggi. Cepat, aman, dan
            mudah digunakan untuk semua institusi pendidikan.
          </p>
          <div className="flex items-center justify-center space-x-4 animate-fade-in-up delay-300">
            <Link href="/register">
              <Button
                size="lg"
                className="px-8 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
              >
                Coba Sekarang
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 bg-transparent hover:bg-primary/5 transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
              >
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section with Education Images */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/20 to-background relative">
        <div
          className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=600&width=1200')`,
          }}
        ></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Fitur Utama</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Teknologi pengenalan wajah yang dirancang khusus untuk absensi pendidikan
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <CardHeader className="text-center relative z-10">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full w-fit group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full animate-ping opacity-0 group-hover:opacity-75"></div>
                  <Camera className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 relative z-10" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors duration-300 text-lg font-semibold">
                  Deteksi Wajah Cepat
                </CardTitle>
                <CardDescription className="leading-relaxed text-sm">
                  Pengenalan wajah dalam hitungan detik dengan akurasi tinggi. Tidak perlu kartu atau kode, cukup
                  hadapkan wajah ke kamera.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <CardHeader className="text-center relative z-10">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full w-fit group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full animate-ping opacity-0 group-hover:opacity-75"></div>
                  <Clock className="h-8 w-8 text-accent group-hover:text-primary transition-colors duration-300 relative z-10" />
                </div>
                <CardTitle className="group-hover:text-accent transition-colors duration-300 text-lg font-semibold">
                  Laporan Real-time
                </CardTitle>
                <CardDescription className="leading-relaxed text-sm">
                  Data kehadiran tersimpan otomatis dan dapat dilihat langsung. Laporan harian, mingguan, dan bulanan
                  tersedia.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
              <CardHeader className="text-center relative z-10">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full w-fit group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full animate-ping opacity-0 group-hover:opacity-75"></div>
                  <Shield className="h-8 w-8 text-primary group-hover:text-accent transition-colors duration-300 relative z-10" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors duration-300 text-lg font-semibold">
                  Data Aman
                </CardTitle>
                <CardDescription className="leading-relaxed text-sm">
                  Data wajah dienkripsi dan disimpan dengan standar keamanan tinggi. Privasi terjamin dengan teknologi
                  terdepan.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 relative">
        <div
          className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=600&width=1200')`,
          }}
        ></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Cara Kerja</h3>
            <p className="text-muted-foreground">Proses absensi yang mudah dalam 3 langkah</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Buka Kamera</h4>
              <p className="text-muted-foreground text-sm">
                Akses sistem dan aktifkan kamera untuk memulai proses absensi
              </p>
            </div>
            <div className="text-center group">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Hadapkan Wajah</h4>
              <p className="text-muted-foreground text-sm">
                Posisikan wajah di depan kamera untuk proses pengenalan otomatis
              </p>
            </div>
            <div className="text-center group">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Selesai</h4>
              <p className="text-muted-foreground text-sm">Absensi tercatat otomatis dan data tersimpan dalam sistem</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-accent/5 relative">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder.svg?height=400&width=1200')`,
          }}
        ></div>
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Siap Menggunakan Absensi Wajah?</h3>
          <p className="text-muted-foreground mb-8 text-lg">
            Bergabunglah dengan ribuan institusi pendidikan yang sudah menggunakan teknologi absensi wajah
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="px-12 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              Mulai Gratis Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-card to-card/50 border-t border-border py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6 group">
            <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full group-hover:scale-110 transition-transform duration-300 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <Camera className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-300 relative z-10" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              FaceAttend
            </span>
          </div>
          <p className="text-muted-foreground mb-4">
            © 2024 FaceAttend. Sistem absensi berbasis wajah untuk institusi pendidikan.
          </p>
          <p className="text-sm text-muted-foreground/70">Powered by AI Face Recognition Technology</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
