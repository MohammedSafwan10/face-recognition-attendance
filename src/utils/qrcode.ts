import QRCode from 'qrcode'

export interface QRSessionData {
  session_id: string
  expires_at: string
  class_id: string
  subject_id: string
}

// Generate QR code as data URL
export async function generateQRCode(data: QRSessionData): Promise<string> {
  try {
    const qrData = JSON.stringify(data)
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Generate QR code as canvas element
export async function generateQRCodeCanvas(
  data: QRSessionData,
  canvas: HTMLCanvasElement
): Promise<void> {
  try {
    const qrData = JSON.stringify(data)
    
    await QRCode.toCanvas(canvas, qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
  } catch (error) {
    console.error('Error generating QR code on canvas:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Parse QR code data
export function parseQRData(qrString: string): QRSessionData | null {
  try {
    const data = JSON.parse(qrString) as QRSessionData
    
    // Validate required fields
    if (
      !data.session_id ||
      !data.expires_at ||
      !data.class_id ||
      !data.subject_id
    ) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error parsing QR data:', error)
    return null
  }
}

// Check if QR session is expired
export function isQRSessionExpired(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime()
  const currentTime = new Date().getTime()
  return currentTime > expiryTime
}

// Validate QR session data
export function validateQRSession(data: QRSessionData): {
  valid: boolean
  error?: string
} {
  if (isQRSessionExpired(data.expires_at)) {
    return {
      valid: false,
      error: 'This QR code has expired. Please ask your teacher for a new one.',
    }
  }
  
  return { valid: true }
}
