'use client'

import { useState, useEffect } from 'react'
import { Plus, LayoutDashboard, Table, Kanban } from 'lucide-react'
import { JobApplication, ApplicationFormData, CV } from '@/types'
import ApplicationDashboard from './ApplicationDashboard'
import ApplicationForm from './ApplicationForm'
import ApplicationTable from './ApplicationTable'
import toast from 'react-hot-toast'

interface ApplicationManagerProps {
  userId: string
  userCVs: CV[]
}

type ViewMode = 'dashboard' | 'table' | 'kanban'

export default function ApplicationManager({ userId, userCVs }: ApplicationManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateApplication = () => {
    setEditingApplication(null)
    setShowForm(true)
  }

  const handleEditApplication = (application: JobApplication) => {
    setEditingApplication(application)
    setShowForm(true)
  }

  const handleSaveApplication = async (formData: ApplicationFormData) => {
    try {
      const url = editingApplication
        ? `/api/applications/${editingApplication.id}`
        : '/api/applications'

      const method = editingApplication ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          ...formData
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('Save successful:', result)

      setShowForm(false)
      setEditingApplication(null)
      setRefreshTrigger(prev => prev + 1)

    } catch (error: any) {
      console.error('Error saving application:', error)
      throw new Error(error.message || 'Failed to save application')
    }
  }

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lamaran ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}?userId=${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete application')
      }

      toast.success('Lamaran berhasil dihapus')
      setRefreshTrigger(prev => prev + 1)
      
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Gagal menghapus lamaran')
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingApplication(null)
  }

  const handleViewApplications = () => {
    setViewMode('table')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Lamaran Kerja</h1>
          <p className="text-gray-600">Kelola dan pantau semua lamaran kerja Anda</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table className="h-4 w-4 inline mr-2" />
              Tabel
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled
            >
              <Kanban className="h-4 w-4 inline mr-2" />
              Kanban
            </button>
          </div>

          {/* Add Application Button */}
          <button
            onClick={handleCreateApplication}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Lamaran</span>
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'dashboard' && (
        <ApplicationDashboard
          userId={userId}
          onCreateApplication={handleCreateApplication}
          onViewApplications={handleViewApplications}
        />
      )}

      {viewMode === 'table' && (
        <ApplicationTable
          userId={userId}
          onEditApplication={handleEditApplication}
          onDeleteApplication={handleDeleteApplication}
          refreshTrigger={refreshTrigger}
        />
      )}

      {viewMode === 'kanban' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Kanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Kanban Board</h3>
            <p className="text-gray-500">Fitur Kanban Board akan segera tersedia</p>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      <ApplicationForm
        userId={userId}
        application={editingApplication}
        userCVs={userCVs}
        onSave={handleSaveApplication}
        onCancel={handleCancelForm}
        isOpen={showForm}
      />
    </div>
  )
}
