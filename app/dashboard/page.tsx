"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  TrendingUp,
  LogOut,
  Settings,
  Bell,
  Award,
  Zap,
} from "lucide-react"
import FaceRecognitionCamera from "@/components/face-recognition-camera"

// Mock data - in real app this would come from API
const mockUser = {
  name: "Ahmad Rizki",
  studentId: "2021001234",
  email: "ahmad.rizki@sekolah.ac.id",
  role: "student",
  avatar: "/placeholder.svg?height=100&width=100",
}

const mockAttendanceData = [
  { date: "2024-01-15", subject: "Algoritma & Pemrograman", status: "present", time: "08:00" },
  { date: "2024-01-15", subject: "Basis Data", status: "present", time: "10:00" },
  { date: "2024-01-14", subject: "Algoritma & Pemrograman", status: "absent", time: "-" },
  { date: "2024-01-14", subject: "Basis Data", status: "present", time: "10:00" },
  { date: "2024-01-13", subject: "Algoritma & Pemrograman", status: "present", time: "08:00" },
]

const mockStats = {
  totalClasses: 48,
  attended: 42,
  percentage: 87.5,
  thisWeek: 8,
  thisMonth: 32,
}

export default function UserDashboard() {
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [lastRecognitionResult, setLastRecognitionResult] = useState<{
    success: boolean
    timestamp: string
    userId?: string
  } | null>(null)

  const handleFaceRecognitionComplete = (result: { success: boolean; userId?: string; confidence?: number }) => {
    if (result.success) {
      setLastRecognitionResult({
        success: true,
        timestamp: new Date().toLocaleString("id-ID"),
        userId: result.userId,
      })
      console.log("Attendance recorded:", result)
    }
  }

  const handleFaceCheckIn = () => {
    setIsCheckingIn(true)
    setTimeout(() => {
      setIsCheckingIn(false)
      alert("Check-in berhasil!")
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 group">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-105">
                <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary font-semibold">
                  {mockUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                {mockUser.name}
              </h1>
              <p className="text-sm text-muted-foreground">{mockUser.studentId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-accent/10 hover:text-accent transition-all duration-200 hover:scale-105"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-105"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium group-hover:text-green-600 transition-colors duration-300">
                Kehadiran Hari Ini
              </CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full group-hover:bg-green-500/20 transition-colors duration-300">
                <CheckCircle className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground group-hover:text-green-600 transition-colors duration-300">
                2/3
              </div>
              <p className="text-xs text-muted-foreground">Mata kuliah dihadiri</p>
              <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-2/3 transition-all duration-500"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                Persentase Kehadiran
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {mockStats.percentage}%
              </div>
              <Progress value={mockStats.percentage} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">Target: 85%</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-colors duration-300">
                Minggu Ini
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors duration-300">
                <Calendar className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                {mockStats.thisWeek}
              </div>
              <p className="text-xs text-muted-foreground">Kelas dihadiri</p>
              <div className="flex items-center mt-2 space-x-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-yellow-600 font-medium">Streak 5 hari!</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-colors duration-300">
                Total Kelas
              </CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors duration-300">
                <User className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-foreground group-hover:text-purple-600 transition-colors duration-300">
                {mockStats.attended}/{mockStats.totalClasses}
              </div>
              <p className="text-xs text-muted-foreground">Semester ini</p>
              <div className="flex items-center mt-2 space-x-1">
                <Award className="h-3 w-3 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">Excellent!</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Face Recognition Check-in */}
        <div className="mb-8">
          <FaceRecognitionCamera onRecognitionComplete={handleFaceRecognitionComplete} />

          {lastRecognitionResult && (
            <Card className="mt-4 border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/10 rounded-full animate-pulse">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Absensi Berhasil Dicatat</p>
                      <p className="text-sm text-green-600 dark:text-green-500">{lastRecognitionResult.timestamp}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-bounce">
                    Hadir
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Attendance Details */}
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger
              value="recent"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Riwayat Terbaru
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Statistik
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Profil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <Card className="border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Riwayat Kehadiran</span>
                </CardTitle>
                <CardDescription>Daftar kehadiran Anda dalam 7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAttendanceData.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:bg-muted/20 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                            {record.subject}
                          </span>
                          <span className="text-sm text-muted-foreground">{record.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{record.time}</span>
                        </div>
                        <Badge
                          variant={record.status === "present" ? "default" : "destructive"}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          {record.status === "present" ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Hadir
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Tidak Hadir
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Kehadiran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Kelas</span>
                    <span className="font-semibold">{mockStats.totalClasses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Hadir</span>
                    <span className="font-semibold text-green-600">{mockStats.attended}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tidak Hadir</span>
                    <span className="font-semibold text-red-600">{mockStats.totalClasses - mockStats.attended}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Persentase</span>
                    <span className="font-bold text-lg">{mockStats.percentage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tren Kehadiran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Minggu Ini</span>
                        <span>{mockStats.thisWeek}/10</span>
                      </div>
                      <Progress value={(mockStats.thisWeek / 10) * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Bulan Ini</span>
                        <span>{mockStats.thisMonth}/40</span>
                      </div>
                      <Progress value={(mockStats.thisMonth / 40) * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>Detail informasi akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                    <AvatarFallback className="text-lg">
                      {mockUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{mockUser.name}</h3>
                    <p className="text-muted-foreground">{mockUser.email}</p>
                    <Badge variant="outline">{mockUser.role === "student" ? "Siswa" : "Pengajar"}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">NIM</label>
                    <p className="text-foreground">{mockUser.studentId}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{mockUser.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-foreground">{mockUser.role === "student" ? "Siswa" : "Pengajar"}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant="default">Aktif</Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
