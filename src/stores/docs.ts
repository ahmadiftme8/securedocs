// src/stores/docs.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Document {
  id: number
  name: string
  uploadedBy: string
  createdAt: string
  size?: number
  type?: string
  url?: string
}

export const useDocsStore = defineStore('docs', () => {
  const docs = ref<Document[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Initialize with some sample data
  function initializeSampleData() {
    docs.value = [
      {
        id: 1,
        name: 'Project Overview.pdf',
        uploadedBy: 'admin@securedocs.com',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        size: 2300000, // 2.3 MB
        type: 'application/pdf',
      },
      {
        id: 2,
        name: 'Budget Report.xlsx',
        uploadedBy: 'user@securedocs.com',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        size: 1500000, // 1.5 MB
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        id: 3,
        name: 'Meeting Notes.docx',
        uploadedBy: 'admin@securedocs.com',
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        size: 890000, // 890 KB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ]
  }

  // Upload a new document
  async function uploadDoc(name: string, uploadedBy: string, size?: number): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newDoc: Document = {
        id: Date.now(),
        name,
        uploadedBy,
        createdAt: new Date().toISOString(),
        size: size || Math.floor(Math.random() * 5000000) + 100000, // Random size if not provided
        type: getFileType(name),
      }

      docs.value.unshift(newDoc) // Add to beginning of array
    } catch (err) {
      error.value = 'Failed to upload document'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Delete a document
  async function deleteDoc(id: number): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const index = docs.value.findIndex((doc) => doc.id === id)
      if (index !== -1) {
        docs.value.splice(index, 1)
      }
    } catch (err) {
      error.value = 'Failed to delete document'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get document by ID
  function getDocById(id: number): Document | undefined {
    return docs.value.find((doc) => doc.id === id)
  }

  // Get documents by user
  function getDocsByUser(userEmail: string): Document[] {
    return docs.value.filter((doc) => doc.uploadedBy === userEmail)
  }

  // Search documents
  function searchDocs(query: string): Document[] {
    const lowercaseQuery = query.toLowerCase()
    return docs.value.filter(
      (doc) =>
        doc.name.toLowerCase().includes(lowercaseQuery) ||
        doc.uploadedBy.toLowerCase().includes(lowercaseQuery),
    )
  }

  // Force reload/refresh data
  function forceReload(): void {
    if (docs.value.length === 0) {
      initializeSampleData()
    }
  }

  // Clear all documents
  function clearDocs(): void {
    docs.value = []
  }

  // Helper function to determine file type from name
  function getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  return {
    // State
    docs,
    isLoading,
    error,

    // Actions
    uploadDoc,
    deleteDoc,
    getDocById,
    getDocsByUser,
    searchDocs,
    forceReload,
    clearDocs,
    initializeSampleData,
  }
})
