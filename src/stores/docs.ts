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

  function uploadDoc(name: string, uploadedBy: string) {
    const newDoc: Document = {
      id: Date.now(),
      name,
      uploadedBy,
      createdAt: new Date().toISOString(),
    }
    docs.value.push(newDoc)
  }

  function deleteDoc(id: number) {
    docs.value = docs.value.filter((doc) => doc.id !== id)
  }

  return { docs, uploadDoc, deleteDoc }
})
