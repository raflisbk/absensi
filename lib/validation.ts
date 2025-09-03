import { z } from 'zod'

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false)
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  studentId: z.string().min(3, 'Student/Staff ID must be at least 3 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']), // Added ADMIN to match database enum
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
})

// Face Recognition Schemas
export const faceEnrollmentSchema = z.object({
  faceDescriptors: z.array(z.number()).min(128, 'Invalid face descriptors'),
  qualityScore: z.number().min(0).max(1),
  confidenceThreshold: z.number().min(0).max(1).default(0.8)
})

export const faceRecognitionSchema = z.object({
  faceDescriptors: z.array(z.number()).min(128, 'Invalid face descriptors'),
  classId: z.string().cuid(),
  wifiSsid: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    browser: z.string()
  }).optional()
})

// Class Management Schemas
export const createClassSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  code: z.string().min(2, 'Class code must be at least 2 characters'),
  lecturerId: z.string().cuid(),
  locationId: z.string().cuid(),
  schedule: z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Invalid time format'),
    endTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Invalid time format'),
    recurring: z.boolean().default(true)
  }),
  duration: z.number().min(30, 'Duration must be at least 30 minutes'),
  capacity: z.number().min(1, 'Capacity must be at least 1')
})

export const updateClassSchema = createClassSchema.partial()

// Location Management Schemas
export const createLocationSchema = z.object({
  name: z.string().min(2, 'Location name must be at least 2 characters'),
  building: z.string().min(1, 'Building is required'),
  floor: z.string().min(1, 'Floor is required'),
  wifiSsid: z.string().min(1, 'WiFi SSID is required'),
  wifiSecurity: z.string().min(1, 'WiFi security type is required'),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1')
})

export const updateLocationSchema = createLocationSchema.partial()

// User Management Schemas
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional()
})

export const approveUserSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
  notes: z.string().optional()
})

// Document Verification Schemas
export const uploadDocumentSchema = z.object({
  documentType: z.enum(['STUDENT_ID', 'STAFF_ID', 'PASSPORT', 'NATIONAL_ID']),
  file: z.string().min(1, 'File is required') // Base64 or file path
})

// Attendance Schemas
export const createAttendanceSchema = z.object({
  userId: z.string().cuid(),
  classId: z.string().cuid(),
  method: z.enum(['FACE_RECOGNITION', 'QR_CODE', 'MANUAL']).default('FACE_RECOGNITION'),
  confidenceScore: z.number().min(0).max(1).optional(),
  wifiSsid: z.string().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional()
})

export const attendanceQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT']).optional(),
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default('10')
})

// Enrollment Schemas
export const enrollStudentSchema = z.object({
  userId: z.string().cuid(),
  classId: z.string().cuid()
})

export const updateEnrollmentSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED'])
})

// Profile Update Schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  avatar: z.string().url().optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
})

// Query Schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().min(1)),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().min(1).max(100)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type FaceEnrollmentInput = z.infer<typeof faceEnrollmentSchema>
export type FaceRecognitionInput = z.infer<typeof faceRecognitionSchema>
export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ApproveUserInput = z.infer<typeof approveUserSchema>
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>