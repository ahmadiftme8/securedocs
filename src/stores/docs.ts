// src/stores/docs.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uploadFileToBackend, deleteFileFromBackend, downloadFileFromBackend } from '@/api/fileApi'

export interface Document {
  id: number
  name: string
  uploadedBy: string
  createdAt: string
  size: number
  type: string
  url?: string
  status?: 'uploading' | 'completed' | 'failed'
  uploadProgress?: number
  thumbnail?: string
  checksum?: string
}

export interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

export const useDocsStore = defineStore('docs', () => {
  const docs = ref<Document[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgresses = ref<Map<string, UploadProgress>>(new Map())

  // File validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/gif'
  ]

  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'gif']

  // Initialize with sample data for development
  function initializeSampleData() {
    docs.value = [
      {
        id: 1,
        name: 'Project Overview.pdf',
        uploadedBy: 'admin@securedocs.com',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        size: 2300000,
        type: 'application/pdf',
        status: 'completed'
      },
      {
        id: 2,
        name: 'Budget Report.xlsx',
        uploadedBy: 'user@securedocs.com',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        size: 1500000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        status: 'completed'
      },
      {
        id: 3,
        name: 'Meeting Notes.docx',
        uploadedBy: 'admin@securedocs.com',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        size: 890000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        status: 'completed'
      }
    ]
  }

  // File validation
  function validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds 5MB limit. Current size: ${formatFileSize(file.size)}`
      }
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed`
      }
    }

    // Check file extension as backup
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `File extension "${extension}" is not allowed`
      }
    }

    return { isValid: true }
  }

  // Upload multiple files with progress tracking
  async function uploadFiles(files: File[], uploadedBy: string): Promise<void> {
    for (const file of files) {
      await uploadSingleFile(file, uploadedBy)
    }
  }

  // Upload single file with chunked upload support
  async function uploadSingleFile(file: File, uploadedBy: string): Promise<void> {
    const fileId = `${Date.now()}_${file.name}`

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      error.value = validation.error || 'File validation failed'
      throw new Error(validation.error)
    }

    try {
      // Initialize progress tracking
      uploadProgresses.value.set(fileId, {
        fileId,
        progress: 0,
        status: 'uploading'
      })

      // Create temporary document entry
      const tempDoc: Document = {
        id: Date.now(),
        name: file.name,
        uploadedBy,
        createdAt: new Date().toISOString(),
        size: file.size,
        type: file.type,
        status: 'uploading',
        uploadProgress: 0
      }

      docs.value.unshift(tempDoc)

      // Upload file to backend with progress tracking
      const result = await uploadFileToBackend(file, {
        onProgress: (progress: number) => {
          // Update progress
          const progressInfo = uploadProgresses.value.get(fileId)
          if (progressInfo) {
            progressInfo.progress = progress
            uploadProgresses.value.set(fileId, progressInfo)
          }

          // Update document progress
          const docIndex = docs.value.findIndex(doc => doc.id === tempDoc.id)
          if (docIndex !== -1) {
            docs.value[docIndex].uploadProgress = progress
          }
        },
        metadata: {
          uploadedBy,
          originalName: file.name,
          checksum: await calculateFileChecksum(file)
        }
      })

      // Update document with backend response
      const docIndex = docs.value.findIndex(doc => doc.id === tempDoc.id)
      if (docIndex !== -1) {
        docs.value[docIndex] = {
          ...docs.value[docIndex],
          id: result.id,
          url: result.url,
          status: 'completed',
          uploadProgress: 100,
          checksum: result.checksum,
          thumbnail: result.thumbnail
        }
      }

      // Mark upload as completed
      uploadProgresses.value.set(fileId, {
        fileId,
        progress: 100,
        status: 'completed'
      })

    } catch (err) {
      // Handle upload failure
      const progressInfo = uploadProgresses.value.get(fileId)
      if (progressInfo) {
        progressInfo.status = 'failed'
        progressInfo.error = err instanceof Error ? err.message : 'Upload failed'
        uploadProgresses.value.set(fileId, progressInfo)
      }

      // Update document status
      const docIndex = docs.value.findIndex(doc => doc.id === tempDoc.id)
      if (docIndex !== -1) {
        docs.value[docIndex].status = 'failed'
      }

      error.value = err instanceof Error ? err.message : 'Upload failed'
      throw err
    }
  }

  // Calculate file checksum for integrity verification
  async function calculateFileChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Delete document from backend and local state
  async function deleteDoc(id: number): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      const doc = docs.value.find(d => d.id === id)
      if (!doc) {
        throw new Error('Document not found')
      }

      // Delete from backend
      await deleteFileFromBackend(id)

      // Remove from local state
      const index = docs.value.findIndex(d => d.id === id)
      if (index !== -1) {
        docs.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete document'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Download document with progress tracking
  async function downloadDoc(id: number): Promise<void> {
    try {
      const doc = docs.value.find(d => d.id === id)
      if (!doc) {
        throw new Error('Document not found')
      }

      await downloadFileFromBackend(id, doc.name)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to download document'
      throw err
    }
  }

  // Cancel upload
  function cancelUpload(fileId: string): void {
    const progressInfo = uploadProgresses.value.get(fileId)
    if (progressInfo && progressInfo.status === 'uploading') {
      progressInfo.status = 'cancelled'
      uploadProgresses.value.set(fileId, progressInfo)
    }
  }

  // Clear upload progress
  function clearUploadProgress(fileId: string): void {
    uploadProgresses.value.delete(fileId)
  }

  // Get document by ID
  function getDocById(id: number): Document | undefined {
    return docs.value.find(doc => doc.id === id)
  }

  // Get documents by user
  function getDocsByUser(userEmail: string): Document[] {
    return docs.value.filter(doc => doc.uploadedBy === userEmail)
  }

  // Search documents
  function searchDocs(query: string): Document[] {
    const lowercaseQuery = query.toLowerCase()
    return docs.value.filter(
      doc =>
        doc.name.toLowerCase().includes(lowercaseQuery) ||
        doc.uploadedBy.toLowerCase().includes(lowercaseQuery)
    )
  }

  // Force reload data from backend
  async function forceReload(): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      // In production, this would fetch from your backend API
      // const response = await fetchDocumentsFromBackend()
      // docs.value = response.data

      // For now, use sample data if empty
      if (docs.value.length === 0) {
        initializeSampleData()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reload documents'
    } finally {
      isLoading.value = false
    }
  }

  // Clear all documents
  function clearDocs(): void {
    docs.value = []
    uploadProgresses.value.clear()
  }

  // Helper function to format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Helper function to get file icon
  function getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      txt: '📄',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️'
    }
    return iconMap[extension || ''] || '📄'
  }

  return {
    // State
    docs,
    isLoading,
    error,
    uploadProgresses,

    // Constants
    MAX_FILE_SIZE,
    ALLOWED_TYPES,
    ALLOWED_EXTENSIONS,

    // Actions
    validateFile,
    uploadFiles,
    uploadSingleFile,
    deleteDoc,
    downloadDoc,
    cancelUpload,
    clearUploadProgress,
    getDocById,
    getDocsByUser,
    searchDocs,
    forceReload,
    clearDocs,
    initializeSampleData,
    formatFileSize,
    getFileIcon,
    calculateFileChecksum
  }
})
