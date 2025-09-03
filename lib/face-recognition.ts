// Face recognition utility functions

export interface FaceRecognitionConfig {
  confidenceThreshold: number
  maxRetries: number
  processingTimeout: number
}

export const defaultConfig: FaceRecognitionConfig = {
  confidenceThreshold: 0.8,
  maxRetries: 3,
  processingTimeout: 10000,
}

export interface AttendanceRecord {
  userId: string
  timestamp: Date
  confidence: number
  location?: string
  deviceId?: string
}

export class FaceRecognitionService {
  private config: FaceRecognitionConfig

  constructor(config: FaceRecognitionConfig = defaultConfig) {
    this.config = config
  }

  async processImage(imageBlob: Blob): Promise<{
    success: boolean
    userId?: string
    confidence?: number
    message: string
  }> {
    try {
      const formData = new FormData()
      formData.append("image", imageBlob)

      const response = await fetch("/api/face-recognition", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Face recognition processing error:", error)
      return {
        success: false,
        message: "Failed to process image. Please try again.",
      }
    }
  }

  async recordAttendance(record: AttendanceRecord): Promise<boolean> {
    try {
      // In real implementation, this would save to database
      console.log("Recording attendance:", record)

      // Mock API call to save attendance
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(record),
      })

      return response.ok
    } catch (error) {
      console.error("Failed to record attendance:", error)
      return false
    }
  }

  validateImageQuality(imageBlob: Blob): Promise<{
    isValid: boolean
    issues: string[]
  }> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(imageBlob)

      img.onload = () => {
        const issues: string[] = []

        // Check image dimensions
        if (img.width < 300 || img.height < 300) {
          issues.push("Image resolution too low")
        }

        // Check file size
        if (imageBlob.size > 5 * 1024 * 1024) {
          issues.push("Image file too large")
        }

        if (imageBlob.size < 10 * 1024) {
          issues.push("Image file too small")
        }

        URL.revokeObjectURL(url)
        resolve({
          isValid: issues.length === 0,
          issues,
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({
          isValid: false,
          issues: ["Invalid image format"],
        })
      }

      img.src = url
    })
  }
}

export const faceRecognitionService = new FaceRecognitionService()
