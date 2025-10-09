<template>
  <div class="fylor-dashboard">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1 class="logo">Fylor</h1>
        <button class="profile-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" fill="white"/>
            <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z" fill="white"/>
          </svg>
        </button>
      </div>

      <!-- Welcome Section -->
      <div class="welcome-section">
        <p class="welcome-text">WelCom to Your Dashboard</p>
        <h2 class="user-name">{{ userName }}</h2>
      </div>

      <!-- Upload Area -->
      <div
        class="upload-area"
        :class="{ 'drag-over': isDragging }"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <p class="upload-title">Drag & Drop Files Here</p>
        <button class="upload-button" @click="triggerFileInput">
          <span class="upload-button-icon">+</span>
          Upload New Document
        </button>
        <input
          ref="fileInput"
          type="file"
          class="file-input"
          multiple
          @change="handleFileSelect"
        />
        <p class="file-types">excel, docx, text, csv, pdf, etc</p>
      </div>

      <!-- Recent Docs Section -->
      <div class="recent-docs-section">
        <h3 class="section-title">Your Recent  Docs:</h3>

        <!-- Filters -->
        <div class="filters">
          <!-- Search -->
          <div class="search-wrapper">
            <svg
              class="search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="11" cy="11" r="8" stroke="#B99D6E" stroke-width="2"/>
              <path d="M21 21L16.65 16.65" stroke="#B99D6E" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search in Documents..."
            />
          </div>

          <!-- Sort -->
          <select v-model="sortBy" class="sort-select">
            <option value="date">Sort by...</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>

          <!-- Checkbox -->
          <label class="checkbox-label">
            <input
              v-model="showOnlyMyDocs"
              type="checkbox"
              class="checkbox-input"
            />
            Show only my documents
          </label>
        </div>

        <!-- Documents Grid -->
        <div class="documents-grid">
          <div
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="document-card"
          >
            <!-- File Icon -->
            <div class="file-icon-wrapper" v-html="getFileIcon(doc.name)"></div>

            <!-- File Name -->
            <h4 class="file-name">{{ doc.name }}</h4>

            <!-- File Meta -->
            <div class="file-meta">
              <div>{{ formatDate(doc.createdAt) }}</div>
              <div>Size: {{ docsStore.formatFileSize(doc.size) }}</div>
            </div>

            <!-- Maximize Button -->
            <button class="maximize-button" @click="maximizeDocument(doc)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H21V9" stroke="#96362D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 21H3V15" stroke="#96362D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 3L15 9M9 15L3 21" stroke="#96362D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Show More Button -->
        <div class="show-more-wrapper">
          <button class="show-more-button" @click="showMore">
            Show More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDocsStore } from '@/stores/docs'
import { useAuth } from '@/composables/useAuth'

// Auth integration
const { user, logout, hasRole } = useAuth()
const authStore = useAuthStore()
const docsStore = useDocsStore()
const router = useRouter()

// Data
const userName = computed(() => user.value?.name || user.value?.email || 'User')
const isDragging = ref(false)
const searchQuery = ref('')
const sortBy = ref('date')
const showOnlyMyDocs = ref(false)
const fileInput = ref(null)

// Get documents from your store
const documents = computed(() => docsStore.docs)

// Computed
const filteredDocuments = computed(() => {
  let docs = documents.value

  // Filter by ownership if checked
  if (showOnlyMyDocs.value && user.value) {
    docs = docs.filter(
      doc => doc.uploadedBy === user.value?.email || doc.uploadedBy === user.value?.role
    )
  }

  // Filter by search query
  if (searchQuery.value) {
    docs = docs.filter(doc =>
      doc.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // Sort documents
  return docs.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.size - a.size
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
})

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const handleDragEnter = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  await uploadFiles(files)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files)
  await uploadFiles(files)
}

const uploadFiles = async (files) => {
  if (!user.value || files.length === 0) return

  try {
    for (const file of files) {
      // Validate file
      const validation = docsStore.validateFile(file)
      if (!validation.isValid) {
        alert(`${file.name}: ${validation.error}`)
        continue
      }

      // Upload file
      await docsStore.uploadSingleFile(file, user.value.email || user.value.id)
    }

    alert(`Successfully uploaded ${files.length} file(s)`)
  } catch (error) {
    console.error('Upload failed:', error)
    alert('Upload failed: ' + error.message)
  }
}

const showMore = () => {
  console.log('Show more clicked')
  // Implement pagination or load more documents
}

const maximizeDocument = async (doc) => {
  console.log('Maximize document:', doc)
  // Implement maximize/view details functionality, e.g., open modal or navigate to detail page
  alert(`Opening detailed view for "${doc.name}"`)
}

const getFileIcon = (docName) => {
  const extension = docName.split('.').pop()?.toLowerCase() || '';

  const icons = {
    doc: `<svg width="43" height="43" viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0_word" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="43" height="43">
        <path d="M38.0625 1.625H4.9375C3.10806 1.625 1.625 3.10806 1.625 4.9375V38.0625C1.625 39.8919 3.10806 41.375 4.9375 41.375H38.0625C39.8919 41.375 41.375 39.8919 41.375 38.0625V4.9375C41.375 3.10806 39.8919 1.625 38.0625 1.625Z" fill="white" stroke="white" stroke-width="2"/>
        <path d="M10.4583 12.6666L14.8749 30.3333L21.4999 15.9791L28.1249 30.3333L32.5416 12.6666" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </mask>
      <g mask="url(#mask0_word)">
        <path d="M-5 -5H48V48H-5V-5Z" fill="#5E777A"/>
      </g>
    </svg>`,
    docx: `<svg width="43" height="43" viewBox="0 0 43 43" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0_word" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="43" height="43">
        <path d="M38.0625 1.625H4.9375C3.10806 1.625 1.625 3.10806 1.625 4.9375V38.0625C1.625 39.8919 3.10806 41.375 4.9375 41.375H38.0625C39.8919 41.375 41.375 39.8919 41.375 38.0625V4.9375C41.375 3.10806 39.8919 1.625 38.0625 1.625Z" fill="white" stroke="white" stroke-width="2"/>
        <path d="M10.4583 12.6666L14.8749 30.3333L21.4999 15.9791L28.1249 30.3333L32.5416 12.6666" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </mask>
      <g mask="url(#mask0_word)">
        <path d="M-5 -5H48V48H-5V-5Z" fill="#5E777A"/>
      </g>
    </svg>`,
    pdf: `<svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0.933105 4.4C0.933105 3.23305 1.39668 2.11389 2.22184 1.28873C3.047 0.46357 4.16615 0 5.33311 0L29.407 0L39.0664 9.65947V39.6C39.0664 40.767 38.6029 41.8861 37.7777 42.7113C36.9525 43.5364 35.8334 44 34.6664 44H5.33311C4.16615 44 3.047 43.5364 2.22184 42.7113C1.39668 41.8861 0.933105 40.767 0.933105 39.6V4.4ZM8.26644 17.6H3.86644V32.2667H6.79977V26.4H8.26644C9.43339 26.4 10.5525 25.9364 11.3777 25.1113C12.2029 24.2861 12.6664 23.167 12.6664 22C12.6664 20.833 12.2029 19.7139 11.3777 18.8887C10.5525 18.0636 9.43339 17.6 8.26644 17.6ZM19.9998 17.6H15.5998V32.2667H19.9998C21.1667 32.2667 22.2859 31.8031 23.111 30.9779C23.9362 30.1528 24.3998 29.0336 24.3998 27.8667V22C24.3998 20.833 23.9362 19.7139 23.111 18.8887C22.2859 18.0636 21.1667 17.6 19.9998 17.6ZM27.3331 32.2667V17.6H36.1331V20.5333H30.2664V23.4667H33.1998V26.4H30.2664V32.2667H27.3331Z" fill="#96362D"/>
    </svg>`,
    xls: `<svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.1666 0.166626H4.49992C3.39485 0.166626 2.33504 0.605613 1.55364 1.38701C0.772239 2.16842 0.333252 3.22822 0.333252 4.33329V37.6666C0.333252 38.7717 0.772239 39.8315 1.55364 40.6129C2.33504 41.3943 3.39485 41.8333 4.49992 41.8333H29.4999C30.605 41.8333 31.6648 41.3943 32.4462 40.6129C33.2276 39.8315 33.6666 38.7717 33.6666 37.6666V12.6666L21.1666 0.166626ZM24.9166 37.6666H21.1666L16.9999 30.5833L12.8333 37.6666H9.08325L15.1249 28.2916L9.08325 18.9166H12.8333L16.9999 26L21.1666 18.9166H24.9166L18.8749 28.2916L24.9166 37.6666ZM19.0833 14.75V3.29163L30.5416 14.75H19.0833Z" fill="#557842"/>
    </svg>`,
    xlsx: `<svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21.1666 0.166626H4.49992C3.39485 0.166626 2.33504 0.605613 1.55364 1.38701C0.772239 2.16842 0.333252 3.22822 0.333252 4.33329V37.6666C0.333252 38.7717 0.772239 39.8315 1.55364 40.6129C2.33504 41.3943 3.39485 41.8333 4.49992 41.8333H29.4999C30.605 41.8333 31.6648 41.3943 32.4462 40.6129C33.2276 39.8315 33.6666 38.7717 33.6666 37.6666V12.6666L21.1666 0.166626ZM24.9166 37.6666H21.1666L16.9999 30.5833L12.8333 37.6666H9.08325L15.1249 28.2916L9.08325 18.9166H12.8333L16.9999 26L21.1666 18.9166H24.9166L18.8749 28.2916L24.9166 37.6666ZM19.0833 14.75V3.29163L30.5416 14.75H19.0833Z" fill="#557842"/>
    </svg>`,
    csv: `<svg width="48" height="38" viewBox="0 0 48 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.4165 26H16.4165V22.5H10.5832V15.5H16.4165V12H9.4165C8.75539 12 8.20161 12.224 7.75517 12.672C7.30873 13.12 7.08473 13.6738 7.08317 14.3334V23.6667C7.08317 24.3278 7.30717 24.8824 7.75517 25.3304C8.20317 25.7784 8.75695 26.0016 9.4165 26ZM18.5165 26H25.5165C26.1776 26 26.7322 25.776 27.1802 25.328C27.6282 24.88 27.8514 24.3263 27.8498 23.6667V20.1667C27.8498 19.5056 27.6258 18.8927 27.1778 18.328C26.7298 17.7634 26.1761 17.4818 25.5165 17.4834H22.0165V15.5H27.8498V12H20.8498C20.1887 12 19.6349 12.224 19.1885 12.672C18.7421 13.12 18.5181 13.6738 18.5165 14.3334V17.8334C18.5165 18.4945 18.7405 19.0879 19.1885 19.6137C19.6365 20.1395 20.1903 20.4016 20.8498 20.4H24.3498V22.5H18.5165V26ZM33.9165 26H37.4165L41.4998 12H37.9998L35.6665 20.05L33.3332 12H29.8332L33.9165 26ZM5.33317 37.6667C4.04984 37.6667 2.95162 37.2102 2.0385 36.297C1.12539 35.3839 0.668059 34.2849 0.666504 33V5.00004C0.666504 3.71671 1.12384 2.61848 2.0385 1.70537C2.95317 0.792262 4.05139 0.33493 5.33317 0.333374H42.6665C43.9498 0.333374 45.0488 0.790707 45.9635 1.70537C46.8782 2.62004 47.3347 3.71826 47.3332 5.00004V33C47.3332 34.2834 46.8766 35.3824 45.9635 36.297C45.0504 37.2117 43.9514 37.6683 42.6665 37.6667H5.33317Z" fill="#5073A8"/>
    </svg>`,
    txt: `<svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.1875 0.75C6.94974 0.75 4.80362 1.63895 3.22129 3.22129C1.63895 4.80362 0.75 6.94974 0.75 9.1875V32.8125C0.75 35.0503 1.63895 37.1964 3.22129 38.7787C4.80362 40.3611 6.94974 41.25 9.1875 41.25H32.8125C35.0503 41.25 37.1964 40.3611 38.7787 38.7787C40.3611 37.1964 41.25 35.0503 41.25 32.8125V9.1875C41.25 6.94974 40.3611 4.80362 38.7787 3.22129C37.1964 1.63895 35.0503 0.75 32.8125 0.75H9.1875ZM12.5625 10.875H29.4375C29.8851 10.875 30.3143 11.0528 30.6307 11.3693C30.9472 11.6857 31.125 12.1149 31.125 12.5625C31.125 13.0101 30.9472 13.4393 30.6307 13.7557C30.3143 14.0722 29.8851 14.25 29.4375 14.25H12.5625C12.1149 14.25 11.6857 14.0722 11.3693 13.7557C11.0528 13.4393 10.875 13.0101 10.875 12.5625C10.875 12.1149 11.0528 11.6857 11.3693 11.3693C11.6857 11.0528 12.1149 10.875 12.5625 10.875ZM12.5625 19.3125H22.6875C23.1351 19.3125 23.5643 19.4903 23.8807 19.8068C24.1972 20.1232 24.375 20.5524 24.375 21C24.375 21.4476 24.1972 21.8768 23.8807 22.1932C23.5643 22.5097 23.1351 22.6875 22.6875 22.6875H12.5625C12.1149 22.6875 11.6857 22.5097 11.3693 22.1932C11.0528 21.8768 10.875 21.4476 10.875 21C10.875 20.5524 11.0528 20.1232 11.3693 19.8068C11.6857 19.4903 12.1149 19.3125 12.5625 19.3125ZM12.5625 27.75H29.4375C29.8851 27.75 30.3143 27.9278 30.6307 28.2443C30.9472 28.5607 31.125 28.9899 31.125 29.4375C31.125 29.8851 30.9472 30.3143 30.6307 30.6307C30.3143 30.9472 29.8851 31.125 29.4375 31.125H12.5625C12.1149 31.125 11.6857 30.9472 11.3693 30.6307C11.0528 30.3143 10.875 29.8851 10.875 29.4375C10.875 28.9899 11.0528 28.5607 11.3693 28.2443C11.6857 27.9278 12.1149 27.75 12.5625 27.75Z" fill="#B99D6E"/>
    </svg>`,
    image: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="4" fill="#5E777A"/>
      <circle cx="12" cy="12" r="2" fill="white"/>
      <path d="M8 28L20 16L32 28H8Z" fill="white"/>
    </svg>`
  }

  let iconType = '';
  if (['doc', 'docx'].includes(extension)) iconType = 'doc';
  else if (extension === 'pdf') iconType = 'pdf';
  else if (['xls', 'xlsx'].includes(extension)) iconType = 'xls';
  else if (extension === 'csv') iconType = 'csv';
  else if (['txt'].includes(extension)) iconType = 'txt';
  else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) iconType = 'image';

  return icons[iconType] || icons.txt;
}

// Auth check on mount
onMounted(async () => {
  await docsStore.forceReload()

  // Check authentication
  if (!authStore.isAuthenticated) {
    const hasToken = localStorage.getItem('access_token')
    if (!hasToken) {
      router.push({ name: 'Login', query: { redirect: '/dashboard' } })
    }
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Jersey+10&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

.fylor-dashboard {
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(180deg, #F4E6CF 0%, #FBEED8 100%);
  min-height: 100vh;
  padding: 40px 20px;
}

.container {
  max-width: 1265px;
  margin: 0 auto;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.logo {
  font-family: 'Jersey 10', sans-serif;
  font-size: 48px;
  color: #96362D;
  font-weight: 400;
  margin: 0;
}

.profile-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #96362D;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.profile-button:hover {
  transform: scale(1.05);
}

/* Welcome Section */
.welcome-section {
  text-align: center;
  margin-bottom: 50px;
}

.welcome-text {
  font-size: 24px;
  color: #5E777A;
  margin: 0 0 10px 0;
  font-weight: 400;
}

.user-name {
  font-size: 40px;
  color: #5E777A;
  margin: 0;
  font-weight: 600;
}

/* Upload Area */
.upload-area {
  border: 3px dashed #B99D6E;
  border-radius: 20px;
  padding: 60px 40px;
  text-align: center;
  margin-bottom: 60px;
  transition: all 0.3s ease;
}

.upload-area.drag-over {
  border-color: #96362D;
  background-color: rgba(150, 54, 45, 0.05);
}

.upload-title {
  font-size: 24px;
  color: #96362D;
  margin: 0 0 20px 0;
  font-weight: 500;
}

.upload-button {
  background: linear-gradient(135deg, #96362D 0%, #EA5039 100%);
  border: none;
  border-radius: 30px;
  padding: 15px 40px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.2s ease;
  font-family: 'Poppins', sans-serif;
}

.upload-button:hover {
  transform: translateY(-2px);
}

.upload-button-icon {
  font-size: 24px;
}

.file-types {
  font-size: 14px;
  color: #5E777A;
  margin: 15px 0 0 0;
  font-weight: 400;
}

.file-input {
  display: none;
}

/* Recent Docs Section */
.recent-docs-section {
  background-color: #FBEED8;
  border-radius: 30px;
  padding: 40px;
}

.section-title {
  font-size: 32px;
  color: #5E777A;
  text-align: center;
  margin: 0 0 40px 0;
  font-weight: 600;
}

/* Filters */
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 45px;
  border: 2px solid #B99D6E;
  border-radius: 25px;
  font-size: 14px;
  background-color: transparent;
  color: #5E777A;
  outline: none;
  font-family: 'Poppins', sans-serif;
}

.search-input::placeholder {
  color: #B99D6E;
}

.sort-select {
  padding: 12px 40px 12px 20px;
  border: 2px solid #B99D6E;
  border-radius: 25px;
  font-size: 14px;
  background-color: transparent;
  color: #5E777A;
  cursor: pointer;
  outline: none;
  font-family: 'Poppins', sans-serif;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23B99D6E' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 15px center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border: 2px solid #B99D6E;
  border-radius: 25px;
  font-size: 14px;
  color: #5E777A;
  cursor: pointer;
  background-color: transparent;
  font-family: 'Poppins', sans-serif;
  user-select: none;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Documents Grid */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 216px);
  gap: 50px;
  justify-content: center;
  margin-bottom: 40px;
}

.document-card {
  width: 216px;
  height: 150px;
  background-color: white;
  border-radius: 15px;
  padding: 40px 20px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.document-card:hover {
  transform: translateY(-5px);
}

.file-icon-wrapper {
  position: absolute;
  top: -25px;
  left: 20px;
  z-index: 1;
}

.file-name {
  font-size: 16px;
  color: #5E777A;
  margin: 0 0 5px 0;
  font-weight: 600;
  text-align: center;
}

.file-meta {
  font-size: 12px;
  color: #5E777A;
  text-align: center;
  margin-bottom: 10px;
}

.maximize-button {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  transition: transform 0.2s ease;
}

.maximize-button:hover {
  transform: scale(1.1);
}

/* Show More Button */
.show-more-wrapper {
  display: flex;
  justify-content: center;
}

.show-more-button {
  background: linear-gradient(135deg, #5E777A 0%, #394960 100%);
  border: none;
  border-radius: 30px;
  padding: 15px 60px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-family: 'Poppins', sans-serif;
}

.show-more-button:hover {
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 20px;
  }

  .logo {
    font-size: 36px;
  }

  .welcome-text {
    font-size: 20px;
  }

  .user-name {
    font-size: 32px;
  }

  .upload-area {
    padding: 40px 20px;
  }

  .upload-title {
    font-size: 20px;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .documents-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .document-card {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }

  .recent-docs-section {
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .fylor-dashboard {
    padding: 20px 10px;
  }

  .upload-button {
    padding: 12px 30px;
    font-size: 16px;
  }

  .section-title {
    font-size: 26px;
  }
}
</style>
