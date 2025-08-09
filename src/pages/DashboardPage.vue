<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1>SecureDocs Dashboard</h1>
        <div class="header-actions">
          <span class="user-info">
            Welcome, {{ user?.name || user?.email }}
            <span class="user-role" :class="user?.role">{{ user?.role }}</span>
          </span>
          <button @click="handleLogout" class="logout-button">Logout</button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="dashboard-nav" v-if="user">
      <router-link to="/dashboard" class="nav-link" active-class="active"> Dashboard </router-link>
      <router-link to="/profile" class="nav-link" active-class="active"> Profile </router-link>
      <router-link v-if="hasRole('admin')" to="/admin" class="nav-link" active-class="active">
        Admin Panel
      </router-link>
    </nav>

    <!-- Main Content -->
    <main class="dashboard-main">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📄</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalDocs }}</div>
            <div class="stat-label">Total Documents</div>
          </div>
        </div>

        <div class="stat-card" v-if="hasRole('user')">
          <div class="stat-icon">👤</div>
          <div class="stat-content">
            <div class="stat-number">{{ userDocs }}</div>
            <div class="stat-label">My Documents</div>
          </div>
        </div>

        <div class="stat-card" v-if="hasRole('admin')">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalUsers }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ recentActivity }}</div>
            <div class="stat-label">Recent Activity</div>
          </div>
        </div>
      </div>

      <!-- Document Management -->
      <div class="documents-section">
        <div class="section-header">
          <h2>Document Management</h2>
          <div class="section-actions">
            <button @click="showUploadModal = true" class="primary-button">
              <span class="button-icon">📤</span>
              Upload Documents
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters">
          <div class="filter-group">
            <input v-model="searchQuery" placeholder="Search documents..." class="search-input" />
          </div>

          <div class="filter-group" v-if="hasRole('admin')">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showOnlyMine" />
              Show only my documents
            </label>
          </div>

          <div class="filter-group">
            <select v-model="sortBy" class="sort-select">
              <option value="createdAt">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="uploadedBy">Sort by Owner</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>

        <!-- Documents Table -->
        <div class="documents-table-container">
          <table class="documents-table" v-if="filteredDocs.length > 0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Created</th>
                <th>Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in filteredDocs" :key="doc.id" :class="{ uploading: doc.status === 'uploading' }">
                <td class="doc-name">
                  <div class="doc-icon">{{ docsStore.getFileIcon(doc.name) }}</div>
                  <div class="doc-info">
                    <div class="doc-title">{{ doc.name }}</div>
                    <div v-if="doc.status === 'uploading'" class="upload-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: `${doc.uploadProgress || 0}%` }"></div>
                      </div>
                      <span class="progress-text">{{ doc.uploadProgress || 0 }}%</span>
                    </div>
                  </div>
                </td>
                <td>{{ doc.uploadedBy }}</td>
                <td>{{ formatDate(doc.createdAt) }}</td>
                <td>{{ docsStore.formatFileSize(doc.size) }}</td>
                <td>
                  <span class="status-badge" :class="doc.status">
                    {{ getStatusText(doc.status) }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="doc.status === 'completed'"
                      @click="downloadDoc(doc)"
                      class="action-button download"
                      title="Download"
                    >
                      ⬇️
                    </button>
                    <button
                      v-if="doc.status === 'uploading'"
                      @click="cancelUpload(doc)"
                      class="action-button cancel"
                      title="Cancel Upload"
                    >
                      ❌
                    </button>
                    <button
                      v-if="canDeleteDoc(doc)"
                      @click="deleteDoc(doc.id)"
                      class="action-button delete"
                      title="Delete"
                      :disabled="doc.status === 'uploading'"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No documents found</h3>
            <p>
              {{
                searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'Upload your first document to get started.'
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Activity (Admin only) -->
      <div v-if="hasRole('admin')" class="activity-section">
        <div class="section-header">
          <h2>Recent Activity</h2>
        </div>
        <div class="activity-feed">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="activity-content">
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatDate(activity.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Enhanced Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content upload-modal" @click.stop>
        <div class="modal-header">
          <h3>Upload Documents</h3>
          <button @click="closeUploadModal" class="close-button">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Upload Zone -->
          <div
            class="upload-area"
            :class="{
              'drag-over': isDragOver,
              'has-files': selectedFiles.length > 0
            }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @click="triggerFileSelect"
          >
            <input
              ref="fileInput"
              type="file"
              multiple
              @change="handleFileSelect"
              :accept="allowedFileTypes"
              hidden
            />

            <div v-if="selectedFiles.length === 0" class="upload-zone">
              <div class="upload-icon">📁</div>
              <h4>Drag & Drop Files Here</h4>
              <p>or <span class="link-text">click to browse</span></p>
              <div class="upload-info">
                <small>
                  Supported: {{ allowedExtensions.join(', ').toUpperCase() }}<br>
                  Max size: {{ formatFileSize(maxFileSize) }} per file
                </small>
              </div>
            </div>

            <!-- File Preview List -->
            <div v-else class="file-preview-list">
              <div class="file-preview-header">
                <h4>Selected Files ({{ selectedFiles.length }})</h4>
                <button @click="clearSelectedFiles" class="clear-button">Clear All</button>
              </div>

              <div class="file-items">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="`${file.name}-${index}`"
                  class="file-item"
                  :class="{
                    'invalid': fileValidationErrors[index],
                    'uploading': uploadingFiles.has(file.name)
                  }"
                >
                  <div class="file-icon">{{ getFileIconByType(file.type) }}</div>

                  <div class="file-details">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-meta">
                      {{ formatFileSize(file.size) }} • {{ file.type.split('/')[1].toUpperCase() }}
                    </div>

                    <!-- Validation Error -->
                    <div v-if="fileValidationErrors[index]" class="file-error">
                      {{ fileValidationErrors[index] }}
                    </div>

                    <!-- Upload Progress -->
                    <div v-if="uploadingFiles.has(file.name)" class="file-progress">
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          :style="{ width: `${getFileUploadProgress(file.name)}%` }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ getFileUploadProgress(file.name) }}%</span>
                    </div>
                  </div>

                  <button
                    v-if="!uploadingFiles.has(file.name)"
                    @click="removeFile(index)"
                    class="remove-file-button"
                    title="Remove file"
                  >
                    ❌
                  </button>

                  <div v-else class="upload-status">
                    <div class="spinner"></div>
                  </div>
                </div>
              </div>

              <!-- Add More Files Button -->
              <button @click="triggerFileSelect" class="add-more-button">
                <span class="button-icon">➕</span>
                Add More Files
              </button>
            </div>
          </div>

          <!-- Upload Options -->
          <div v-if="selectedFiles.length > 0" class="upload-options">
            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="generateThumbnails" />
                Generate thumbnails for images
              </label>
            </div>

            <div class="option-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="extractMetadata" />
                Extract file metadata
              </label>
            </div>
          </div>

          <!-- Upload Summary -->
          <div v-if="selectedFiles.length > 0" class="upload-summary">
            <div class="summary-item">
              <strong>Files:</strong> {{ validFiles.length }} valid, {{ invalidFiles.length }} invalid
            </div>
            <div class="summary-item">
              <strong>Total size:</strong> {{ formatFileSize(totalSelectedSize) }}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeUploadModal" class="secondary-button">Cancel</button>
          <button
            @click="startUpload"
            :disabled="!canUpload"
            class="primary-button"
            :class="{ uploading: isUploading }"
          >
            <span v-if="isUploading" class="button-spinner"></span>
            {{ getUploadButtonText }}
          </button>
        </div>
      </div>
    </div>

    <!-- Global Upload Progress Overlay -->
    <div v-if="showGlobalProgress" class="upload-progress-overlay">
      <div class="progress-card">
        <div class="progress-header">
          <h4>Uploading Files...</h4>
          <button @click="cancelAllUploads" class="cancel-all-button">Cancel All</button>
        </div>

        <div class="global-progress">
          <div class="progress-bar large">
            <div class="progress-fill" :style="{ width: `${globalUploadProgress}%` }"></div>
          </div>
          <div class="progress-info">
            <span>{{ completedUploads }} of {{ totalUploads }} files completed</span>
            <span>{{ globalUploadProgress }}%</span>
          </div>
        </div>

        <div class="current-file">
          <small>Currently uploading: {{ currentUploadFile }}</small>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div class="notifications">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button @click="dismissNotification(notification.id)" class="notification-close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useDocsStore } from '@/stores/docs'

const { user, logout, hasRole } = useAuth()
const docsStore = useDocsStore()

// Reactive data
const searchQuery = ref('')
const showOnlyMine = ref(false)
const sortBy = ref('createdAt')
const showUploadModal = ref(false)
const selectedFiles = ref<File[]>([])
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadingFiles = ref(new Set<string>())
const fileValidationErrors = ref<Record<number, string>>({})
const generateThumbnails = ref(true)
const extractMetadata = ref(true)

// Global upload progress
const showGlobalProgress = ref(false)
const globalUploadProgress = ref(0)
const completedUploads = ref(0)
const totalUploads = ref(0)
const currentUploadFile = ref('')

// Notifications
const notifications = ref<Array<{
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timeout?: number
}>>([])

// File constraints
const maxFileSize = computed(() => docsStore.MAX_FILE_SIZE)
const allowedFileTypes = computed(() => docsStore.ALLOWED_TYPES.join(','))
const allowedExtensions = computed(() => docsStore.ALLOWED_EXTENSIONS)

// Computed properties
const filteredDocs = computed(() => {
  let docs = docsStore.docs

  if (showOnlyMine.value && user.value) {
    docs = docs.filter(
      (doc) => doc.uploadedBy === user.value?.email || doc.uploadedBy === user.value?.role,
    )
  }

  if (searchQuery.value) {
    docs = docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  return docs.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'uploadedBy':
        return a.uploadedBy.localeCompare(b.uploadedBy)
      case 'size':
        return b.size - a.size
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })
})

const totalDocs = computed(() => docsStore.docs.length)
const userDocs = computed(() => {
  if (!user.value) return 0
  return docsStore.docs.filter(
    (doc) => doc.uploadedBy === user.value?.email || doc.uploadedBy === user.value?.role,
  ).length
})
const totalUsers = computed(() => 5)
const recentActivity = computed(() => 12)

const recentActivities = computed(() => [
  {
    id: 1,
    type: 'upload',
    description: 'John Doe uploaded "Project Plan.pdf"',
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'delete',
    description: 'Jane Smith deleted "Old Report.docx"',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    type: 'download',
    description: 'Mike Johnson downloaded "Budget.xlsx"',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
])

// File validation and upload computed properties
const validFiles = computed(() => {
  return selectedFiles.value.filter((_, index) => !fileValidationErrors.value[index])
})

const invalidFiles = computed(() => {
  return selectedFiles.value.filter((_, index) => fileValidationErrors.value[index])
})

const totalSelectedSize = computed(() => {
  return validFiles.value.reduce((total, file) => total + file.size, 0)
})

const canUpload = computed(() => {
  return validFiles.value.length > 0 && !isUploading.value
})

const getUploadButtonText = computed(() => {
  if (isUploading.value) return 'Uploading...'
  if (validFiles.value.length === 0) return 'No valid files'
  return `Upload ${validFiles.value.length} file${validFiles.value.length === 1 ? '' : 's'}`
})

// Watch for file validation
watch(selectedFiles, () => {
  validateSelectedFiles()
}, { deep: true })

// Methods
function validateSelectedFiles() {
  fileValidationErrors.value = {}

  selectedFiles.value.forEach((file, index) => {
    const validation = docsStore.validateFile(file)
    if (!validation.isValid) {
      fileValidationErrors.value[index] = validation.error || 'Invalid file'
    }
  })
}

function canDeleteDoc(doc: any): boolean {
  if (!user.value) return false
  return (
    hasRole('admin') || doc.uploadedBy === user.value.email || doc.uploadedBy === user.value.role
  )
}

// File selection and drag & drop
function triggerFileSelect() {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  fileInput?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

function addFiles(newFiles: File[]) {
  // Filter out duplicates
  const existingNames = selectedFiles.value.map(f => f.name)
  const uniqueFiles = newFiles.filter(file => !existingNames.includes(file.name))

  selectedFiles.value.push(...uniqueFiles)

  if (uniqueFiles.length !== newFiles.length) {
    showNotification('warning', 'Duplicate Files', 'Some files were already selected and skipped.')
  }
}

function removeFile(index: number) {
  selectedFiles.value.splice(index, 1)
  delete fileValidationErrors.value[index]
}

function clearSelectedFiles() {
  selectedFiles.value = []
  fileValidationErrors.value = {}
}

// Upload functionality
async function startUpload() {
  if (!user.value || validFiles.value.length === 0) return

  isUploading.value = true
  showGlobalProgress.value = true
  totalUploads.value = validFiles.value.length
  completedUploads.value = 0
  globalUploadProgress.value = 0

  try {
    for (let i = 0; i < validFiles.value.length; i++) {
      const file = validFiles.value[i]
      currentUploadFile.value = file.name
      uploadingFiles.value.add(file.name)

      await docsStore.uploadSingleFile(file, user.value.email || user.value.id)

      uploadingFiles.value.delete(file.name)
      completedUploads.value++
      globalUploadProgress.value = Math.round((completedUploads.value / totalUploads.value) * 100)
    }

    showNotification('success', 'Upload Complete', `Successfully uploaded ${validFiles.value.length} file(s).`)
    closeUploadModal()
  } catch (error) {
    console.error('Upload failed:', error)
    showNotification('error', 'Upload Failed', error instanceof Error ? error.message : 'Unknown error occurred')
  } finally {
    isUploading.value = false
    showGlobalProgress.value = false
    uploadingFiles.value.clear()
  }
}

function cancelUpload(doc: any) {
  // Implementation for canceling individual upload
  uploadingFiles.value.delete(doc.name)
}

function cancelAllUploads() {
  uploadingFiles.value.clear()
  isUploading.value = false
  showGlobalProgress.value = false
  showNotification('info', 'Upload Cancelled', 'All uploads have been cancelled.')
}

function getFileUploadProgress(fileName: string): number {
  // Get progress from store's upload progresses
  for (const [, progress] of docsStore.uploadProgresses) {
    if (progress.fileId.includes(fileName)) {
      return progress.progress
    }
  }
  return 0
}

// Modal management
function closeUploadModal() {
  if (isUploading.value) {
    if (confirm('Upload in progress. Are you sure you want to close?')) {
      cancelAllUploads()
      showUploadModal.value = false
      clearSelectedFiles()
    }
  } else {
    showUploadModal.value = false
    clearSelectedFiles()
  }
}

// Document actions
async function downloadDoc(doc: any) {
  try {
    await docsStore.downloadDoc(doc.id)
    showNotification('success', 'Download Started', `Downloading ${doc.name}`)
  } catch (error) {
    showNotification('error', 'Download Failed', 'Failed to download the document')
  }
}

async function deleteDoc(id: number) {
  if (confirm('Are you sure you want to delete this document?')) {
    try {
      await docsStore.deleteDoc(id)
      showNotification('success', 'Document Deleted', 'Document was successfully deleted')
    } catch (error) {
      showNotification('error', 'Delete Failed', 'Failed to delete the document')
    }
  }
}

async function handleLogout() {
  await logout()
}

// Utility functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number): string {
  return docsStore.formatFileSize(bytes)
}

function getFileIconByType(type: string): string {
  const iconMap: Record<string, string> = {
    'application/pdf': '📄',
    'application/msword': '📝',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.ms-excel': '📊',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'text/plain': '📄',
    'image/png': '🖼️',
    'image/jpeg': '🖼️',
    'image/gif': '🖼️'
  }
  return iconMap[type] || '📄'
}

function getStatusText(status?: string): string {
  switch (status) {
    case 'uploading': return 'Uploading'
    case 'failed': return 'Failed'
    case 'completed': return 'Completed'
    default: return 'Ready'
  }
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'upload': return '⬆️'
    case 'delete': return '🗑️'
    case 'download': return '⬇️'
    default: return '📝'
  }
}

// Notification system
function showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, timeout = 5000) {
  const id = Date.now().toString()
  notifications.value.push({ id, type, title, message, timeout })

  if (timeout > 0) {
    setTimeout(() => dismissNotification(id), timeout)
  }
}

function dismissNotification(id: string) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

onMounted(() => {
  docsStore.forceReload()
})
</script>

<style scoped>
/* Enhanced Styles for File Upload Dashboard */

.dashboard {
  position: relative;
  width: 100%;
  max-width: none;
  min-height: 100vh;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

.dashboard-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 0 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  width: 100%;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
  color: #343a40;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  color: #6c757d;
  font-size: 14px;
}

.user-role {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.user-role.admin {
  background-color: #fff2cc;
  color: #8a6914;
}

.user-role.user {
  background-color: #d1ecf1;
  color: #0c5460;
}

.logout-button {
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: #c82333;
}

.dashboard-nav {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 0 24px;
  display: flex;
  gap: 32px;
  width: 100%;
  margin: 0 auto;
}

.nav-link {
  padding: 16px 0;
  color: #6c757d;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: #495057;
  border-bottom-color: #007bff;
}

.dashboard-main {
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #343a40;
  margin-bottom: 4px;
}

.stat-label {
  color: #6c757d;
  font-size: 14px;
}

/* Document Management Section */
.documents-section,
.activity-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  color: #343a40;
  font-size: 20px;
  font-weight: 600;
}

/* Button Styles */
.primary-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-button.uploading {
  background-color: #6c757d;
}

.secondary-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: #545b62;
}

.button-icon {
  font-size: 16px;
}

.button-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Filters */
.filters {
  display: flex;
  gap: 16px;
  padding: 0 24px 24px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  width: 250px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
}

/* Documents Table */
.documents-table-container {
  padding: 0 24px 24px;
}

.documents-table {
  width: 100%;
  border-collapse: collapse;
}

.documents-table th,
.documents-table td {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
}

.documents-table th {
  color: #495057;
  font-weight: 600;
  font-size: 14px;
  background-color: #f8f9fa;
}

.documents-table td {
  color: #343a40;
  font-size: 14px;
}

.documents-table tr.uploading {
  background-color: #f8f9fa;
}

.doc-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-icon {
  font-size: 18px;
  min-width: 20px;
}

.doc-info {
  flex: 1;
}

.doc-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar.large {
  height: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
  border-radius: inherit;
}

.progress-text {
  font-size: 12px;
  color: #6c757d;
  min-width: 35px;
}

/* Status Badge */
.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.uploading {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.completed {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.failed {
  background-color: #f8d7da;
  color: #721c24;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button.download {
  background-color: #28a745;
  color: white;
}

.action-button.download:hover {
  background-color: #218838;
}

.action-button.delete {
  background-color: #dc3545;
  color: white;
}

.action-button.delete:hover:not(:disabled) {
  background-color: #c82333;
}

.action-button.cancel {
  background-color: #ffc107;
  color: #212529;
}

.action-button.cancel:hover {
  background-color: #e0a800;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6c757d;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #495057;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Activity Feed */
.activity-feed {
  padding: 0 24px 24px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f8f9fa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background-color: #f8f9fa;
}

.activity-description {
  color: #343a40;
  font-size: 14px;
}

.activity-time {
  color: #6c757d;
  font-size: 12px;
  margin-top: 2px;
}

/* Enhanced Upload Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.upload-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #343a40;
  font-size: 18px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #dc3545;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
}

/* Enhanced Upload Area */
.upload-area {
  border: 2px dashed #ced4da;
  border-radius: 12px;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  overflow: hidden;
}

.upload-area.drag-over {
  border-color: #007bff;
  background-color: #f0f8ff;
  transform: scale(1.02);
}

.upload-area.has-files {
  border-style: solid;
  border-color: #28a745;
}

.upload-zone {
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-zone:hover {
  background-color: #f8f9fa;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.upload-zone h4 {
  margin: 0 0 8px;
  color: #495057;
  font-size: 18px;
}

.upload-zone p {
  margin: 0 0 16px;
  color: #6c757d;
}

.link-text {
  color: #007bff;
  text-decoration: underline;
}

.upload-info {
  margin-top: 16px;
}

.upload-info small {
  color: #6c757d;
  line-height: 1.4;
}

/* File Preview List */
.file-preview-list {
  padding: 20px;
}

.file-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.file-preview-header h4 {
  margin: 0;
  color: #343a40;
}

.clear-button {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover {
  background-color: #dc3545;
  color: white;
}

.file-items {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.file-item:hover {
  background-color: #f8f9fa;
}

.file-item.invalid {
  border-color: #dc3545;
  background-color: #fdf2f2;
}

.file-item.uploading {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.file-icon {
  font-size: 24px;
  min-width: 30px;
  text-align: center;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #343a40;
  margin-bottom: 4px;
  word-break: break-word;
}

.file-meta {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.file-error {
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
}

.file-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.file-progress .progress-bar {
  height: 4px;
}

.remove-file-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 12px;
}

.remove-file-button:hover {
  background-color: #f8d7da;
}

.upload-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e9ecef;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.add-more-button {
  width: 100%;
  padding: 12px;
  border: 1px dashed #007bff;
  background: none;
  color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.add-more-button:hover {
  background-color: #f0f8ff;
  border-style: solid;
}

/* Upload Options */
.upload-options {
  margin: 20px 0;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.option-group {
  margin-bottom: 12px;
}

.option-group:last-child {
  margin-bottom: 0;
}

/* Upload Summary */
.upload-summary {
  padding: 16px;
  background-color: #e7f3ff;
  border: 1px solid #b8daff;
  border-radius: 8px;
  margin-top: 16px;
}

.summary-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #495057;
}

.summary-item:last-child {
  margin-bottom: 0;
}

/* Global Upload Progress Overlay */
.upload-progress-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1001;
  animation: slideInUp 0.3s ease;
}

.progress-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 20px;
  min-width: 300px;
  border: 1px solid #e9ecef;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-header h4 {
  margin: 0;
  color: #343a40;
  font-size: 16px;
}

.cancel-all-button {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-all-button:hover {
  background-color: #dc3545;
  color: white;
}

.global-progress {
  margin-bottom: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
}

.current-file {
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

/* Notifications */
.notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-left: 4px solid;
  animation: slideInRight 0.3s ease;
}

.notification.success {
  border-left-color: #28a745;
}

.notification.error {
  border-left-color: #dc3545;
}

.notification.warning {
  border-left-color: #ffc107;
}

.notification.info {
  border-left-color: #007bff;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #343a40;
  margin-bottom: 4px;
  font-size: 14px;
}

.notification-message {
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-close:hover {
  color: #343a40;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 16px 0;
    gap: 12px;
  }

  .dashboard-nav {
    flex-wrap: wrap;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .documents-table-container {
    overflow-x: auto;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .upload-modal {
    max-width: none;
  }

  .notifications {
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .upload-progress-overlay {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }

  .progress-card {
    min-width: auto;
  }

  .file-items {
    max-height: 200px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .dashboard-main {
    padding: 16px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .upload-zone {
    padding: 32px 16px;
  }

  .upload-icon {
    font-size: 36px;
  }

  .upload-zone h4 {
    font-size: 16px;
  }
}
</style>
