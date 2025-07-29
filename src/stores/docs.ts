import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Document {
  id: number
  name: string
  uploadedBy: string
  createdAt: string
}

export const useDocsStore = defineStore('docs', () => {
  const docs = ref<Document[]>([])

  // ✅ Load from localStorage when store is created
  const stored = localStorage.getItem('docs')
  if (stored) {
    try {
      docs.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse saved docs:', e)
    }
  }



  function forceReload() {
    const stored = localStorage.getItem('docs')
    if (stored) {
      try {
        docs.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse saved docs:', e)
      }
    }
  }

  function saveDocs() {
    localStorage.setItem('docs', JSON.stringify(docs.value))
  }

  function uploadDoc(name: string, uploadedBy: string) {
    const newDoc: Document = {
      id: Date.now(),
      name,
      uploadedBy,
      createdAt: new Date().toISOString(),
    }
    docs.value.push(newDoc)
    saveDocs()
  }







  function deleteDoc(id: number) {
    docs.value = docs.value.filter((doc) => doc.id !== id)
    saveDocs()
  }

  return { docs, uploadDoc, deleteDoc, forceReload }

})
