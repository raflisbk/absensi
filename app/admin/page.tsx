"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  GraduationCap,
  UserCheck,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Shield,
  BarChart3,
  AlertTriangle,
} from "lucide-react"

// Mock data for admin dashboard
const mockStats = {
  totalUsers: 1247,
  totalStudents: 1089,
  totalFaculty: 158,
  todayAttendance: 892,
  attendanceRate: 71.5,
  activeClasses: 24,
}

const mockUsers = [
  {
    id: 1,
    name: "Ahmad Rizki",
    email: "ahmad.rizki@sekolah.ac.id",
    role: "student",
    studentId: "2021001234",
    status: "active",
    lastLogin: "2024-01-15 08:30",
    attendanceRate: 87.5,
  },
  {
    id: 2,
    name: "Dr. Sarah Wijaya",
    email: "sarah.wijaya@sekolah.ac.id",
    role: "lecturer",
    studentId: "DOC001",
    status: "active",
    lastLogin: "2024-01-15 07:45",
    attendanceRate: 95.2,
  },
  {
    id: 3,
    name: "Budi Santoso",
    email: "budi.santoso@sekolah.ac.id",
    role: "student",
    studentId: "2021001235",
    status: "inactive",
    lastLogin: "2024-01-10 14:20",
    attendanceRate: 45.8,
  },
]

const mockAttendanceReports = [
  {
    class: "Algoritma & Pemrograman",
    instructor: "Dr. Sarah Wijaya",
    date: "2024-01-15",
    totalStudents: 45,
    present: 38,
    absent: 7,
    rate: 84.4,
  },
  {
    class: "Basis Data",
    instructor: "Prof. Ahmad Rahman",
    date: "2024-01-15",
    totalStudents: 42,
    present: 35,
    absent: 7,
    rate: 83.3,
  },
  {
    class: "Jaringan Komputer",
    instructor: "Dr. Lisa Permata",
    date: "2024-01-15",
    totalStudents: 38,
    present: 25,
    absent: 13,
    rate: 65.8,
  },
]

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Sistem Manajemen Absensi Institusi Pendidikan</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah User
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">+12 dari bulan lalu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
              <UserCheck className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.todayAttendance}</div>
              <Progress value={mockStats.attendanceRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{mockStats.attendanceRate}% dari total pengguna</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kelas Aktif</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.activeClasses}</div>
              <p className="text-xs text-muted-foreground">Sedang berlangsung</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Kehadiran</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">78.2%</div>
              <p className="text-xs text-muted-foreground">+2.1% dari minggu lalu</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Manajemen User</TabsTrigger>
            <TabsTrigger value="attendance">Laporan Absensi</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Pengguna</CardTitle>
                  <CardDescription>Breakdown pengguna berdasarkan role</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-blue-500" />
                      <span>Siswa</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{mockStats.totalStudents}</div>
                      <div className="text-sm text-muted-foreground">87.3%</div>
                    </div>
                  </div>
                  <Progress value={87.3} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>Pengajar</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{mockStats.totalFaculty}</div>
                      <div className="text-sm text-muted-foreground">12.7%</div>
                    </div>
                  </div>
                  <Progress value={12.7} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aktivitas Terbaru</CardTitle>
                  <CardDescription>Log aktivitas sistem dalam 24 jam terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Ahmad Rizki melakukan check-in</p>
                        <p className="text-xs text-muted-foreground">2 menit yang lalu</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">User baru terdaftar: Sarah Dewi</p>
                        <p className="text-xs text-muted-foreground">15 menit yang lalu</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Kelas Algoritma dimulai</p>
                        <p className="text-xs text-muted-foreground">30 menit yang lalu</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Deteksi anomali: Tingkat absensi rendah</p>
                        <p className="text-xs text-muted-foreground">1 jam yang lalu</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Kelola akun siswa, pengajar, dan administrator</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama, email, atau NIM..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Role</SelectItem>
                      <SelectItem value="student">Siswa</SelectItem>
                      <SelectItem value="lecturer">Pengajar</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                {/* Users Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>NIM/NIP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kehadiran</TableHead>
                      <TableHead>Login Terakhir</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "lecturer" ? "default" : "secondary"}>
                            {user.role === "student" ? "Siswa" : user.role === "lecturer" ? "Pengajar" : "Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.studentId}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "destructive"}>
                            {user.status === "active" ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={user.attendanceRate} className="w-16" />
                            <span className="text-sm">{user.attendanceRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Laporan Kehadiran</CardTitle>
                <CardDescription>Monitor kehadiran per kelas dan mata kuliah</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Pengajar</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Total Siswa</TableHead>
                      <TableHead>Hadir</TableHead>
                      <TableHead>Tidak Hadir</TableHead>
                      <TableHead>Tingkat Kehadiran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAttendanceReports.map((report, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{report.class}</TableCell>
                        <TableCell>{report.instructor}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.totalStudents}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{report.present}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{report.absent}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={report.rate} className="w-16" />
                            <span className="text-sm font-medium">{report.rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Tren Kehadiran Mingguan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">Chart akan ditampilkan di sini</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Alert & Notifikasi</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Kehadiran Rendah</p>
                        <p className="text-xs text-yellow-700">
                          Kelas Jaringan Komputer memiliki tingkat kehadiran di bawah 70%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Sistem Error</p>
                        <p className="text-xs text-red-700">3 kegagalan face recognition dalam 1 jam terakhir</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Sistem</CardTitle>
                  <CardDescription>Konfigurasi umum sistem absensi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendance-threshold">Batas Waktu Absensi (menit)</Label>
                    <Input id="attendance-threshold" type="number" defaultValue="15" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="face-confidence">Tingkat Kepercayaan Face Recognition (%)</Label>
                    <Input id="face-confidence" type="number" defaultValue="85" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Frekuensi Backup Data</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Setiap Jam</SelectItem>
                        <SelectItem value="daily">Harian</SelectItem>
                        <SelectItem value="weekly">Mingguan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>Simpan Pengaturan</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keamanan</CardTitle>
                  <CardDescription>Pengaturan keamanan dan privasi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (menit)</Label>
                    <Input id="session-timeout" type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">Maksimal Percobaan Login</Label>
                    <Input id="max-login-attempts" type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data-retention">Retensi Data (hari)</Label>
                    <Input id="data-retention" type="number" defaultValue="365" />
                  </div>
                  <Button variant="outline">Update Keamanan</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
