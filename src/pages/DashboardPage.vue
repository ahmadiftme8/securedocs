<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth' // ✅ new store
import { useDocsStore } from '@/stores/docs'

const auth = useAuthStore()
const docsStore = useDocsStore()
const router = useRouter()

onMounted(() => {
  docsStore.forceReload()
})

const role = computed(() => auth.user?.role || 'guest') // ✅ reads from authStore
const showOnlyMine = ref(false)
const searchQuery = ref('')
const newDocName = ref('')

const filteredDocs = computed(() => {
  const visibleDocs =
    showOnlyMine.value && role.value
      ? docsStore.docs.filter((doc) => doc.uploadedBy === role.value)
      : docsStore.docs

  return visibleDocs.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

function upload() {
  if (newDocName.value.trim()) {
    docsStore.uploadDoc(newDocName.value.trim(), role.value)
    newDocName.value = ''
  }
}

function deleteDoc(id: number) {
  docsStore.deleteDoc(id)
}

function logoutAndGoHome() {
  auth.logout() // ✅ clears auth.user
  router.push('/login')
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}
</script>
