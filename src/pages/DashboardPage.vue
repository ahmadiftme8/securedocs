<template>
  <div class="dashboard-page">
    <h1>Welcome to the Dashboard</h1>

    <input v-model="searchQuery" placeholder="Search documents..." class="search" />

    <p>
      You are logged in as: <strong>{{ role }}</strong>
    </p>

    <p v-if="role === 'admin'" class="info">You have admin access. You can delete documents.</p>
    <p v-else class="info">You have user access. You can upload, but not delete documents.</p>

    <div class="filters">
      <label>
        <input type="checkbox" v-model="showOnlyMine" />
        Show only my documents
      </label>
    </div>

    <div class="upload">
      <input v-model="newDocName" placeholder="Enter document name..." />
      <button @click="upload">Upload</button>
    </div>

    <ul class="doc-list">
      <li v-for="doc in docs" :key="doc.id" :class="{ mine: doc.uploadedBy === role }">
        {{ doc.name }} — uploaded by {{ doc.uploadedBy }} ({{ formatDate(doc.createdAt) }})
        <button v-if="role === 'admin'" @click="deleteDoc(doc.id)">Delete</button>
      </li>
    </ul>

    <button @click="logoutAndGoHome">Log out</button>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useDocsStore } from '@/stores/docs'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'

const showOnlyMine = ref(false)

const user = useUserStore()
const docsStore = useDocsStore()
const router = useRouter()
const docs = computed(() =>
  showOnlyMine.value && role.value
    ? docsStore.docs.filter((doc) => doc.uploadedBy === role.value)
    : docsStore.docs,
)
const role = computed(() => user.role)

const newDocName = ref('')

function upload() {
  if (newDocName.value.trim()) {
    docsStore.uploadDoc(newDocName.value.trim(), role.value || 'guest')
    newDocName.value = ''
  }
}

function deleteDoc(id: number) {
  docsStore.deleteDoc(id)
}

function logoutAndGoHome() {
  user.logout()
  router.push('/login')
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.dashboard-page {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
.upload {
  margin: 20px 0;
}
.doc-list {
  list-style: none;
  padding: 0;
}
.doc-list li {
  margin: 10px 0;
}

.mine {
  background-color: #e0f7fa;
}
</style>
