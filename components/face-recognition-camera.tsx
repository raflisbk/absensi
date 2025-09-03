"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, CheckCircle, XCircle, Loader2, Scan, Zap, Shield } from "lucide-react"

interface FaceRecognitionCameraProps {
  onRecognitionComplete?: (result: { success: boolean; userId?: string; confidence?: number }) => void
  className?: string
}

export default function FaceRecognitionCamera({ onRecognitionComplete, className }: FaceRecognitionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recognitionResult, setRecognitionResult] = useState<{
    success: boolean
    userId?: string
    confidence?: number
    message?: string
  } | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }

      setStream(mediaStream)
      setIsActive(true)
      setRecognitionResult(null)
    } catch (error) {
      console.error("Error accessing camera:", error)
      setRecognitionResult({
        success: false,
        message: "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.",
      })
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setIsProcessing(false)
  }, [stream])

  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsProcessing(true)

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob for processing
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        try {
          // Simulate face recognition API call
          await simulateFaceRecognition(blob)
        } catch (error) {
          console.error("Face recognition error:", error)
          setRecognitionResult({
            success: false,
            message: "Gagal memproses wajah. Silakan coba lagi.",
          })
          setIsProcessing(false)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [])

  const simulateFaceRecognition = async (imageBlob: Blob) => {
    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate recognition result (in real app, this would be an actual API call)
    const mockResults = [
      { success: true, userId: "2021001234", confidence: 0.95, message: "Wajah berhasil dikenali!" },
      { success: true, userId: "2021001235", confidence: 0.87, message: "Wajah berhasil dikenali!" },
      { success: false, confidence: 0.45, message: "Wajah tidak dikenali. Silakan coba lagi." },
    ]

    const result = mockResults[Math.floor(Math.random() * mockResults.length)]

    setRecognitionResult(result)
    setIsProcessing(false)

    if (onRecognitionComplete) {
      onRecognitionComplete(result)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <Card className={`${className} border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full animate-pulse">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Face Recognition Camera
          </span>
        </CardTitle>
        <CardDescription className="text-center max-w-md mx-auto">
          Posisikan wajah Anda di dalam frame dan klik tombol untuk memulai pengenalan wajah dengan teknologi AI canggih
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <div className="w-full max-w-md mx-auto bg-gradient-to-br from-muted to-muted/50 rounded-2xl overflow-hidden shadow-inner border border-border/50">
            {isActive ? (
              <div className="relative">
                <video ref={videoRef} className="w-full h-64 object-cover" autoPlay muted playsInline />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-full opacity-60 animate-pulse">
                    <div className="absolute inset-2 border border-accent rounded-full animate-ping"></div>
                  </div>
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm px-3 py-2 rounded-full text-center">
                      <p className="text-xs text-white font-medium flex items-center justify-center space-x-2">
                        <Scan className="h-3 w-3 animate-pulse" />
                        <span>Posisikan wajah di dalam lingkaran</span>
                      </p>
                    </div>
                  </div>
                  <div className="absolute top-16 left-16 w-8 h-8 border-l-2 border-t-2 border-primary animate-pulse"></div>
                  <div className="absolute top-16 right-16 w-8 h-8 border-r-2 border-t-2 border-primary animate-pulse"></div>
                  <div className="absolute bottom-16 left-16 w-8 h-8 border-l-2 border-b-2 border-primary animate-pulse"></div>
                  <div className="absolute bottom-16 right-16 w-8 h-8 border-r-2 border-b-2 border-primary animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5 rounded-full mx-auto w-fit">
                    <CameraOff className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Kamera tidak aktif</p>
                    <p className="text-xs text-muted-foreground/70">Klik tombol untuk mengaktifkan</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hidden canvas for image capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Recognition Result */}
        {recognitionResult && (
          <div className="space-y-3 animate-fade-in">
            <Badge
              variant={recognitionResult.success ? "default" : "destructive"}
              className={`w-full justify-center py-3 text-sm font-medium transition-all duration-300 ${
                recognitionResult.success
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 animate-pulse"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              }`}
            >
              {recognitionResult.success ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-bounce" />
                  <span>{recognitionResult.message}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>{recognitionResult.message}</span>
                </>
              )}
            </Badge>

            {recognitionResult.success && recognitionResult.confidence && (
              <div className="text-center space-y-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Tingkat kepercayaan: {Math.round(recognitionResult.confidence * 100)}%
                  </p>
                </div>
                {recognitionResult.userId && (
                  <p className="text-xs text-green-600 dark:text-green-500">User ID: {recognitionResult.userId}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex space-x-3">
          {!isActive ? (
            <Button
              onClick={startCamera}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Camera className="h-4 w-4 mr-2" />
              Aktifkan Kamera
            </Button>
          ) : (
            <>
              <Button
                onClick={captureAndRecognize}
                disabled={isProcessing}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    <span>Scan Wajah</span>
                  </>
                )}
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-300 hover:scale-105 bg-transparent"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>Panduan Penggunaan</span>
          </h4>
          <div className="text-xs text-muted-foreground space-y-1 ml-6">
            <p className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-primary rounded-full"></span>
              <span>Pastikan pencahayaan cukup terang dan merata</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-primary rounded-full"></span>
              <span>Posisikan wajah tepat di tengah frame lingkaran</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-primary rounded-full"></span>
              <span>Jaga jarak sekitar 50-70 cm dari kamera</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-primary rounded-full"></span>
              <span>Hindari menggunakan masker atau kacamata gelap</span>
            </p>
          </div>
        </div>
      </CardContent>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </Card>
  )
}
