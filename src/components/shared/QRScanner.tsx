import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import type { QRSessionData } from '../../utils/qrcode'
import { parseQRData, validateQRSession } from '../../utils/qrcode'

interface QRScannerProps {
  onScan: (data: QRSessionData) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const scannerId = 'qr-reader'
    const html5QrCode = new Html5Qrcode(scannerId)
    scannerRef.current = html5QrCode

    // Start camera
    html5QrCode.start(
      { facingMode: "environment" }, // Use back camera on mobile
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Make QR box responsive - 70% of smaller dimension
          const minDimension = Math.min(viewfinderWidth, viewfinderHeight)
          const boxSize = Math.floor(minDimension * 0.7)
          return {
            width: boxSize,
            height: boxSize
          }
        },
        aspectRatio: 1.0
      },
      (decodedText) => {
        setIsScanning(true)
        
        // Parse QR code data
        const parsedData = parseQRData(decodedText)
        
        if (!parsedData) {
          setError('Invalid QR code. Please scan a valid attendance QR code.')
          onError?.('Invalid QR code. Please scan a valid attendance QR code.')
          setIsScanning(false)
          return
        }

        // Validate session
        const validation = validateQRSession(parsedData)
        
        if (!validation.valid) {
          setError(validation.error || 'Invalid QR code session')
          onError?.(validation.error || 'Invalid QR code session')
          setIsScanning(false)
          return
        }

        // Stop scanner and return data
        html5QrCode.stop().then(() => {
          onScan(parsedData)
        }).catch(console.error)
      },
      () => {
        // Silent - scanning in progress
      }
    ).then(() => {
      setCameraStarted(true)
    }).catch((err) => {
      setError('Failed to start camera. Please allow camera permissions.')
      onError?.('Failed to start camera. Please allow camera permissions.')
      console.error('Camera start error:', err)
    })

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error)
      }
    }
  }, [])

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          📱 Scan QR Code
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {!cameraStarted && !error && 'Starting camera...'}
          {cameraStarted && !isScanning && 'Point camera at QR code'}
          {isScanning && 'Processing...'}
          {error && error}
        </p>
      </div>

      <div id="qr-reader" className="rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 w-full max-w-md mx-auto" style={{ minHeight: '400px' }}></div>
      
      {cameraStarted && !isScanning && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Hold phone steady</li>
                <li>Keep QR code in the square box</li>
                <li>Make sure there's good lighting</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-center font-semibold">
            ✅ QR Code Scanned! Processing...
          </p>
        </div>
      )}
    </div>
  )
}
