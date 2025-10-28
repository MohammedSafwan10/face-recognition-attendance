import { useEffect, useRef, useState } from 'react'
import * as faceapi from '../../lib/faceapi'

interface FaceCaptureProps {
  onCapture: (descriptor: Float32Array, imageData: string) => void
  onError?: (error: string) => void
  autoCapture?: boolean
  captureDelay?: number
}

export default function FaceCapture({
  onCapture,
  onError,
  autoCapture = false,
  captureDelay = 3000,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetecting, setIsDetecting] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)

  // Initialize webcam and models
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        // Load face-api models
        await faceapi.loadModels()

        // Get webcam access
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        })

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop())
          return
        }

        setStream(mediaStream)

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            setIsLoading(false)
            
            if (autoCapture) {
              startAutoCapture()
            }
          }
        }
      } catch (error) {
        console.error('Error initializing face capture:', error)
        onError?.(
          error instanceof Error
            ? error.message
            : 'Failed to access camera. Please allow camera permissions.'
        )
        setIsLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Auto capture with countdown
  const startAutoCapture = () => {
    const delay = captureDelay / 1000
    setCountdown(delay)

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          handleCapture()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  // Detect face continuously for visual feedback
  useEffect(() => {
    if (isLoading || !videoRef.current || !canvasRef.current) return

    let animationFrame: number
    let isRunning = true

    async function detectFace() {
      if (!isRunning || !videoRef.current || !canvasRef.current) return

      try {
        const detection = await faceapi.detectSingleFaceFromVideo(videoRef.current)

        if (detection && canvasRef.current) {
          setFaceDetected(true)
          
          // Draw detection box
          const canvas = canvasRef.current
          canvas.width = videoRef.current!.videoWidth
          canvas.height = videoRef.current!.videoHeight
          
          faceapi.clearCanvas(canvas)
          faceapi.drawDetection(canvas, detection.detection, {
            label: 'Face Detected ✓',
            color: '#4ade80',
          })
        } else {
          setFaceDetected(false)
          if (canvasRef.current) {
            faceapi.clearCanvas(canvasRef.current)
          }
        }
      } catch (error) {
        console.error('Error detecting face:', error)
      }

      animationFrame = requestAnimationFrame(detectFace)
    }

    detectFace()

    return () => {
      isRunning = false
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isLoading])

  // Manual capture
  const handleCapture = async () => {
    if (!videoRef.current || isDetecting) return

    setIsDetecting(true)

    try {
      const detection = await faceapi.detectSingleFaceFromVideo(videoRef.current)

      if (!detection) {
        onError?.('No face detected. Please ensure your face is clearly visible.')
        setIsDetecting(false)
        return
      }

      // Capture image from video
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
      }
      const imageData = canvas.toDataURL('image/jpeg', 0.95)

      // Return descriptor and image
      onCapture(detection.descriptor, imageData)
    } catch (error) {
      console.error('Error capturing face:', error)
      onError?.('Failed to capture face. Please try again.')
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <div className="relative">
      <div className="relative rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Initializing camera...</p>
            </div>
          </div>
        )}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-4">
                {countdown}
              </div>
              <p className="text-white text-xl">Position your face in frame</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="absolute top-4 right-4">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                faceDetected
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {faceDetected ? '✓ Face Detected' : '⚠ No Face'}
            </div>
          </div>
        )}
      </div>

      {!autoCapture && (
        <button
          onClick={handleCapture}
          disabled={isLoading || isDetecting || !faceDetected}
          className="btn-primary w-full mt-4"
        >
          {isDetecting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Capturing...
            </span>
          ) : (
            'Capture Face'
          )}
        </button>
      )}
    </div>
  )
}
