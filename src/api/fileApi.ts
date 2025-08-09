// src/api/fileApi.ts - Simplified version for development
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export interface UploadOptions {
  onProgress?: (progress: number) => void
  metadata?: {
    uploadedBy: string
    originalName: string
    checksum?: string
    tags?: string[]
    description?: string
  }
  chunkSize?: number
}

export interface UploadResponse {
  id: number
  url: string
  checksum: string
  thumbnail?: string
  metadata: any
}

// Get auth token from localStorage (adjust based on your auth implementation)
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
}

// Create axios instance with auth headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
})

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors gracefully
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('Backend not available, using mock data')
      return Promise.resolve({ data: { id: Date.now(), url: '#', checksum: 'mock' } })
    }

    if (error.response?.status === 401) {
      // Handle token expiry - redirect to login or refresh token
      console.warn('Authentication required')
    }
    return Promise.reject(error)
  }
)

/**
 * Upload a single file to the backend
 * Falls back to mock implementation if backend is not available
 */
export async function uploadFileToBackend(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  const { onProgress, metadata } = options

  try {
    // Simulate progress for demo
    if (onProgress) {
      const progressSteps = [0, 25, 50, 75, 100]
      for (const progress of progressSteps) {
        setTimeout(() => onProgress(progress), progress * 10)
      }
    }

    // Try to upload to backend
    const formData = new FormData()
    formData.append('file', file)

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })

    return response.data
  } catch (error) {
    console.warn('Using mock upload response:', error.message)

    // Mock response for development
    return {
      id: Date.now(),
      url: '#',
      checksum: await generateMockChecksum(file),
      metadata: metadata || {}
    }
  }
}

/**
 * Generate mock checksum for development
 */
async function generateMockChecksum(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    // Fallback for browsers that don't support crypto.subtle
    return 'mock-checksum-' + Date.now()
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileOptions = {
      ...options,
      onProgress: (progress: number) => {
        // Calculate overall progress across all files
        const overallProgress = ((i * 100) + progress) / files.length
        options.onProgress?.(overallProgress)
      }
    }

    try {
      const result = await uploadFileToBackend(file, fileOptions)
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      // Continue with other files even if one fails
    }
  }

  return results
}

/**
 * Delete file from backend
 */
export async function deleteFileFromBackend(fileId: number): Promise<void> {
  try {
    await apiClient.delete(`/files/${fileId}`)
  } catch (error) {
    console.warn('Mock delete operation for fileId:', fileId)
    // Mock success for development
  }
}

/**
 * Download file from backend
 */
export async function downloadFileFromBackend(
  fileId: number,
  fileName: string
): Promise<void> {
  try {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.warn('Mock download for:', fileName)
    // Mock download notification
    alert(`Mock download: ${fileName}`)
  }
}

/**
 * Get file preview/thumbnail
 */
export async function getFilePreview(fileId: number): Promise<string> {
  try {
    const response = await apiClient.get(`/files/${fileId}/preview`)
    return response.data.previewUrl
  } catch (error) {
    console.warn('Mock preview for fileId:', fileId)
    return '/mock-preview.jpg'
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(fileId: number): Promise<any> {
  try {
    const response = await apiClient.get(`/files/${fileId}/metadata`)
    return response.data
  } catch (error) {
    console.warn('Mock metadata for fileId:', fileId)
    return { id: fileId, metadata: 'mock' }
  }
}

/**
 * Search files
 */
export async function searchFiles(query: string, filters?: {
  type?: string
  size?: { min?: number; max?: number }
  dateRange?: { start?: string; end?: string }
}): Promise<any[]> {
  try {
    const response = await apiClient.get('/files/search', {
      params: { query, ...filters }
    })
    return response.data.files
  } catch (error) {
    console.warn('Mock search results for:', query)
    return []
  }
}

/**
 * Get upload limits and allowed types from backend
 */
export async function getUploadConfig(): Promise<{
  maxFileSize: number
  allowedTypes: string[]
  maxFilesPerUpload: number
}> {
  try {
    const response = await apiClient.get('/files/config')
    return response.data
  } catch (error) {
    console.warn('Using default upload config')
    // Return default config if backend is not available
    return {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/gif'
      ],
      maxFilesPerUpload: 10
    }
  }
}

/**
 * Cancel ongoing upload
 */
export function cancelUpload(uploadId: string): Promise<void> {
  return apiClient.post(`/files/upload/${uploadId}/cancel`).catch(() => {
    console.warn('Mock cancel for uploadId:', uploadId)
  })
}
