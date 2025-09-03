import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

// API Client
class ApiClient {
  private baseURL = '/api'

  async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const { token } = useAuthStore.getState()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred')
    }

    return data
  }

  async get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { method: 'GET', ...options })
  }

  async post(endpoint: string, body?: any, options?: RequestInit) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    })
  }

  async put(endpoint: string, body?: any, options?: RequestInit) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    })
  }

  async delete(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { method: 'DELETE', ...options })
  }
}

const apiClient = new ApiClient()

// Auth Hooks
export const useLogin = () => {
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    onSuccess: (data) => {
      login(data.data.user, data.data.token)
      toast.success('Login successful!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: any) =>
      apiClient.post('/auth/register', userData),
    onSuccess: () => {
      toast.success('Registration successful! Please check your email.')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useLogout = () => {
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      logout()
      toast.success('Logged out successfully')
    },
    onError: (error: Error) => {
      logout() // Logout anyway
      toast.error(error.message)
    }
  })
}

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (data: { token: string }) =>
      apiClient.post('/auth/verify-email', data),
    onSuccess: () => {
      toast.success('Email verified successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: { email: string }) =>
      apiClient.post('/auth/forgot-password', data),
    onSuccess: () => {
      toast.success('Password reset link sent to your email')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      apiClient.post('/auth/reset-password', data),
    onSuccess: () => {
      toast.success('Password reset successfully! Please login.')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Face Recognition Hooks
export const useFaceEnrollment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/face/enrollment', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-profile'] })
      toast.success('Face enrollment completed successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useFaceRecognition = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/face/recognition', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(data.message)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useFaceProfile = () => {
  return useQuery({
    queryKey: ['face-profile'],
    queryFn: () => apiClient.get('/face/enrollment'),
    retry: false
  })
}

// Attendance Hooks
export const useAttendance = (params?: any) => {
  const searchParams = new URLSearchParams(params).toString()
  
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => apiClient.get(`/attendance?${searchParams}`),
    staleTime: 30000 // 30 seconds
  })
}

export const useCreateAttendance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/attendance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance recorded successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Classes Hooks
export const useClasses = (params?: any) => {
  const searchParams = new URLSearchParams(params).toString()
  
  return useQuery({
    queryKey: ['classes', params],
    queryFn: () => apiClient.get(`/classes?${searchParams}`),
    staleTime: 60000 // 1 minute
  })
}

export const useClass = (id: string) => {
  return useQuery({
    queryKey: ['class', id],
    queryFn: () => apiClient.get(`/classes/${id}`),
    enabled: !!id
  })
}

export const useCreateClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useUpdateClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      apiClient.put(`/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useDeleteClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Users Hooks (Admin)
export const useUsers = (params?: any) => {
  const searchParams = new URLSearchParams(params).toString()
  
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.get(`/users?${searchParams}`),
    staleTime: 60000 // 1 minute
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.put('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(`/users?userId=${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Admin Approval Hooks
export const usePendingApprovals = (params?: any) => {
  return useQuery({
    queryKey: ['pending-approvals', params],
    queryFn: () => apiClient.get(`/admin/approve-user?${new URLSearchParams(params).toString()}`),
    staleTime: 30000 // 30 seconds
  })
}

export const useApproveUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { userId: string; status: string; reason?: string; notes?: string }) =>
      apiClient.post('/admin/approve-user', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      const action = variables.status === 'APPROVED' ? 'approved' : 'rejected'
      toast.success(`User ${action} successfully!`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

// Profile Hooks
export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.put('/profile', data),
    onSuccess: (data) => {
      updateUser(data.data)
      toast.success('Profile updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.put('/profile/password', data),
    onSuccess: () => {
      toast.success('Password changed successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}