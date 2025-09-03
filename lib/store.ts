import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Auth Store
interface User {
  id: string
  name: string
  email: string
  role: string
  studentId: string
  status: string
  faceEnrollmentStatus: string
  emailVerified: boolean
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),
      
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
      
      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...updates } })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Face Recognition Store
interface FaceRecognitionState {
  isProcessing: boolean
  lastResult: any | null
  cameraActive: boolean
  qualityMetrics: {
    faceDetected: boolean
    faceSize: number
    brightness: number
    blur: number
    angle: number
  } | null
  setProcessing: (processing: boolean) => void
  setResult: (result: any) => void
  setCameraActive: (active: boolean) => void
  setQualityMetrics: (metrics: any) => void
  reset: () => void
}

export const useFaceRecognitionStore = create<FaceRecognitionState>((set) => ({
  isProcessing: false,
  lastResult: null,
  cameraActive: false,
  qualityMetrics: null,
  
  setProcessing: (processing) => set({ isProcessing: processing }),
  setResult: (result) => set({ lastResult: result }),
  setCameraActive: (active) => set({ cameraActive: active }),
  setQualityMetrics: (metrics) => set({ qualityMetrics: metrics }),
  
  reset: () => set({
    isProcessing: false,
    lastResult: null,
    cameraActive: false,
    qualityMetrics: null
  })
}))

// App State Store
interface AppState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    timestamp: Date
    read: boolean
  }>
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
          },
          ...state.notifications
        ].slice(0, 50) // Keep only last 50 notifications
      })),
      
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      })),
      
      clearNotifications: () => set({ notifications: [] })
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme
      })
    }
  )
)

// Registration Store
interface RegistrationState {
  currentStep: number
  stepData: {
    basicInfo?: any
    documentVerification?: any
    faceEnrollment?: any
    emailVerification?: any
    phoneVerification?: any
  }
  completedSteps: string[]
  setCurrentStep: (step: number) => void
  setStepData: (step: string, data: any) => void
  markStepCompleted: (step: string) => void
  reset: () => void
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  currentStep: 1,
  stepData: {},
  completedSteps: [],
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setStepData: (step, data) => set((state) => ({
    stepData: {
      ...state.stepData,
      [step]: data
    }
  })),
  
  markStepCompleted: (step) => set((state) => ({
    completedSteps: [...state.completedSteps.filter(s => s !== step), step]
  })),
  
  reset: () => set({
    currentStep: 1,
    stepData: {},
    completedSteps: []
  })
}))

// Attendance Store
interface AttendanceState {
  todayAttendance: any[]
  attendanceHistory: any[]
  stats: {
    totalClasses: number
    attended: number
    percentage: number
    thisWeek: number
    thisMonth: number
  } | null
  setTodayAttendance: (attendance: any[]) => void
  setAttendanceHistory: (history: any[]) => void
  setStats: (stats: any) => void
  addAttendance: (attendance: any) => void
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  todayAttendance: [],
  attendanceHistory: [],
  stats: null,
  
  setTodayAttendance: (attendance) => set({ todayAttendance: attendance }),
  setAttendanceHistory: (history) => set({ attendanceHistory: history }),
  setStats: (stats) => set({ stats }),
  
  addAttendance: (attendance) => set((state) => ({
    todayAttendance: [attendance, ...state.todayAttendance],
    attendanceHistory: [attendance, ...state.attendanceHistory]
  }))
}))

// Classes Store
interface ClassesState {
  classes: any[]
  currentClass: any | null
  enrollment: any[]
  setClasses: (classes: any[]) => void
  setCurrentClass: (classData: any) => void
  setEnrollment: (enrollment: any[]) => void
  addClass: (classData: any) => void
  updateClass: (id: string, updates: any) => void
  removeClass: (id: string) => void
}

export const useClassesStore = create<ClassesState>((set) => ({
  classes: [],
  currentClass: null,
  enrollment: [],
  
  setClasses: (classes) => set({ classes }),
  setCurrentClass: (classData) => set({ currentClass: classData }),
  setEnrollment: (enrollment) => set({ enrollment }),
  
  addClass: (classData) => set((state) => ({
    classes: [classData, ...state.classes]
  })),
  
  updateClass: (id, updates) => set((state) => ({
    classes: state.classes.map(c => c.id === id ? { ...c, ...updates } : c),
    currentClass: state.currentClass?.id === id 
      ? { ...state.currentClass, ...updates } 
      : state.currentClass
  })),
  
  removeClass: (id) => set((state) => ({
    classes: state.classes.filter(c => c.id !== id),
    currentClass: state.currentClass?.id === id ? null : state.currentClass
  }))
}))