import * as faceapi from 'face-api.js'

let modelsLoaded = false

// Load all required models for face recognition
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return

  const MODEL_URL = '/models'
  
  try {
    console.log('Loading face-api.js models...')
    
    // Load models in parallel for better performance
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])
    
    modelsLoaded = true
    console.log('Face-api.js models loaded successfully')
  } catch (error) {
    console.error('Error loading face-api.js models:', error)
    throw new Error('Failed to load face recognition models. Please ensure models are in /public/models directory.')
  }
}

// Check if models are loaded
export function areModelsLoaded(): boolean {
  return modelsLoaded
}

// Detect single face and extract descriptor from video element
export async function detectSingleFaceFromVideo(
  video: HTMLVideoElement
): Promise<{ descriptor: Float32Array; detection: faceapi.FaceDetection } | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    return {
      descriptor: detection.descriptor,
      detection: detection.detection,
    }
  } catch (error) {
    console.error('Error detecting face from video:', error)
    return null
  }
}

// Detect single face and extract descriptor from image element
export async function detectSingleFaceFromImage(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<{ descriptor: Float32Array; detection: faceapi.FaceDetection } | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      return null
    }

    return {
      descriptor: detection.descriptor,
      detection: detection.detection,
    }
  } catch (error) {
    console.error('Error detecting face from image:', error)
    return null
  }
}

// Compare two face descriptors and return similarity distance
export function compareFaceDescriptors(
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number {
  const desc1 = Array.isArray(descriptor1) ? new Float32Array(descriptor1) : descriptor1
  const desc2 = Array.isArray(descriptor2) ? new Float32Array(descriptor2) : descriptor2
  
  return faceapi.euclideanDistance(desc1, desc2)
}

// Create face matcher for multiple reference faces
export function createFaceMatcher(
  labeledDescriptors: { label: string; descriptors: Float32Array[] }[],
  threshold: number = 0.6
): faceapi.FaceMatcher {
  const labeledFaceDescriptors = labeledDescriptors.map(
    ({ label, descriptors }) =>
      new faceapi.LabeledFaceDescriptors(label, descriptors)
  )
  
  return new faceapi.FaceMatcher(labeledFaceDescriptors, threshold)
}

// Find best match from multiple reference faces
export function findBestMatch(
  queryDescriptor: Float32Array,
  referenceFaces: { id: string; name: string; descriptor: number[] }[]
): { id: string; name: string; distance: number } | null {
  if (referenceFaces.length === 0) return null

  let bestMatch: { id: string; name: string; distance: number } | null = null
  let minDistance = Infinity

  for (const face of referenceFaces) {
    const distance = compareFaceDescriptors(queryDescriptor, face.descriptor)
    
    if (distance < minDistance) {
      minDistance = distance
      bestMatch = {
        id: face.id,
        name: face.name,
        distance,
      }
    }
  }

  // Return match only if distance is below threshold (0.6 = 60% similarity)
  if (bestMatch && bestMatch.distance < 0.6) {
    return bestMatch
  }

  return null
}

// Draw detection box on canvas
export function drawDetection(
  canvas: HTMLCanvasElement,
  detection: faceapi.FaceDetection,
  options?: { label?: string; color?: string }
): void {
  const displaySize = {
    width: canvas.width,
    height: canvas.height,
  }
  
  faceapi.matchDimensions(canvas, displaySize)
  
  const resizedDetection = faceapi.resizeResults(detection, displaySize)
  
  const drawBox = new faceapi.draw.DrawBox(resizedDetection.box, {
    label: options?.label,
    lineWidth: 2,
    boxColor: options?.color || '#667eea',
  })
  
  drawBox.draw(canvas)
}

// Clear canvas
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// Convert descriptor to array for database storage
export function descriptorToArray(descriptor: Float32Array): number[] {
  return Array.from(descriptor)
}

// Convert array back to descriptor
export function arrayToDescriptor(array: number[]): Float32Array {
  return new Float32Array(array)
}
