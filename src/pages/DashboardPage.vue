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
            <button @click="showUploadModal = true" class="primary-button">Upload Document</button>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in filteredDocs" :key="doc.id">
                <td class="doc-name">
                  <div class="doc-icon">📄</div>
                  {{ doc.name }}
                </td>
                <td>{{ doc.uploadedBy }}</td>
                <td>{{ formatDate(doc.createdAt) }}</td>
                <td>{{ doc.size || '2.3 MB' }}</td>
                <td>
                  <div class="action-buttons">
                    <button @click="downloadDoc(doc)" class="action-button download">
                      Download
                    </button>
                    <button
                      v-if="canDeleteDoc(doc)"
                      @click="deleteDoc(doc.id)"
                      class="action-button delete"
                    >
                      Delete
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

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="showUploadModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Upload Document</h3>
          <button @click="showUploadModal = false" class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="upload-area">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
              hidden
            />
            <div class="upload-zone" @click="$refs.fileInput.click()">
              <div class="upload-icon">📁</div>
              <p>Click to select a file or drag and drop</p>
              <small>Supported: PDF, DOC, DOCX, TXT, XLS, XLSX</small>
            </div>
          </div>
          <div v-if="selectedFile" class="selected-file">
            <strong>Selected:</strong> {{ selectedFile.name }} ({{
              formatFileSize(selectedFile.size)
            }})
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUploadModal = false" class="secondary-button">Cancel</button>
          <button
            @click="uploadDocument"
            :disabled="!selectedFile || isUploading"
            class="primary-button"
          >
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useDocsStore } from '@/stores/docs'

const { user, logout, hasRole } = useAuth()
const docsStore = useDocsStore()

// Reactive data
const searchQuery = ref('')
const showOnlyMine = ref(false)
const sortBy = ref('createdAt')
const showUploadModal = ref(false)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)

// Computed properties
const filteredDocs = computed(() => {
  let docs = docsStore.docs

  // Filter by ownership if needed
  if (showOnlyMine.value && user.value) {
    docs = docs.filter(
      (doc) => doc.uploadedBy === user.value?.email || doc.uploadedBy === user.value?.role,
    )
  }

  // Filter by search query
  if (searchQuery.value) {
    docs = docs.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  // Sort documents
  return docs.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'uploadedBy':
        return a.uploadedBy.localeCompare(b.uploadedBy)
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
const totalUsers = computed(() => 5) // Mock data
const recentActivity = computed(() => 12) // Mock data

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

// Methods
function canDeleteDoc(doc: any): boolean {
  if (!user.value) return false
  // Admins can delete any document, users can only delete their own
  return (
    hasRole('admin') || doc.uploadedBy === user.value.email || doc.uploadedBy === user.value.role
  )
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

async function uploadDocument() {
  if (!selectedFile.value || !user.value) return

  isUploading.value = true
  try {
    await docsStore.uploadDoc(
      selectedFile.value.name,
      user.value.email || user.value.role,
      selectedFile.value.size,
    )
    showUploadModal.value = false
    selectedFile.value = null
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    isUploading.value = false
  }
}

function downloadDoc(doc: any) {
  // Mock download functionality
  console.log('Downloading:', doc.name)
  // In a real app, this would trigger a file download
}

function deleteDoc(id: number) {
  if (confirm('Are you sure you want to delete this document?')) {
    docsStore.deleteDoc(id)
  }
}

async function handleLogout() {
  await logout()
}

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
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getActivityIcon(type: string): string {
  switch (type) {
    case 'upload':
      return '⬆️'
    case 'delete':
      return '🗑️'
    case 'download':
      return '⬇️'
    default:
      return '📝'
  }
}

onMounted(() => {
  docsStore.forceReload()
})
</script>

<style scoped>
.dashboard {
  position: relative; /* Ensure normal flow */
  width: 100%; /* Use full width of parent */
  max-width: none; /* Remove any max-width restrictions */
  min-height: 100vh;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

:deep(.dashboard) {
  width: 100%;
  max-width: 100vw;
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

.primary-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.primary-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.doc-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-icon {
  font-size: 18px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
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

.action-button.delete:hover {
  background-color: #c82333;
}

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

/* Modal Styles */
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
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
}

.modal-body {
  padding: 24px;
}

.upload-zone {
  border: 2px dashed #ced4da;
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-zone:hover {
  border-color: #007bff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.upload-zone p {
  margin: 0 0 8px;
  color: #495057;
}

.upload-zone small {
  color: #6c757d;
}

.selected-file {
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
}

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
}
</style>
