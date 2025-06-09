'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, Calendar, DollarSign, MapPin, Building } from 'lucide-react'
import { ApplicationFormData, ApplicationStatus, EmploymentType, WorkArrangement, CV, CVAnalysis } from '@/types'
import toast from 'react-hot-toast'

interface ApplicationFormProps {
  userId: string
  application?: any // For editing existing application
  userCVs: CV[]
  onSave: (data: ApplicationFormData) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export default function ApplicationForm({
  userId,
  application,
  userCVs,
  onSave,
  onCancel,
  isOpen
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationFormData>({
    companyName: '',
    positionTitle: '',
    jobUrl: '',
    applicationDate: new Date().toISOString().split('T')[0],
    status: 'wishlist',
    location: '',
    salaryOffered: undefined,
    salaryCurrency: 'IDR',
    employmentType: undefined,
    workArrangement: undefined,
    hrContact: '',
    hrEmail: '',
    hrPhone: '',
    applicationMethod: '',
    referralSource: '',
    notes: ''
  })
  
  const [selectedCvId, setSelectedCvId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAutoFill, setShowAutoFill] = useState(false)

  useEffect(() => {
    if (application) {
      // Populate form with existing application data
      setFormData({
        companyName: application.company_name || '',
        positionTitle: application.position_title || '',
        jobUrl: application.job_url || '',
        applicationDate: application.application_date || new Date().toISOString().split('T')[0],
        status: application.status || 'wishlist',
        location: application.location || '',
        salaryOffered: application.salary_offered || undefined,
        salaryCurrency: application.salary_currency || 'IDR',
        employmentType: application.employment_type || undefined,
        workArrangement: application.work_arrangement || undefined,
        hrContact: application.hr_contact || '',
        hrEmail: application.hr_email || '',
        hrPhone: application.hr_phone || '',
        applicationMethod: application.application_method || '',
        referralSource: application.referral_source || '',
        notes: application.notes || ''
      })
      setSelectedCvId(application.cv_id || '')
    } else {
      // Reset form for new application
      setFormData({
        companyName: '',
        positionTitle: '',
        jobUrl: '',
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'wishlist',
        location: '',
        salaryOffered: undefined,
        salaryCurrency: 'IDR',
        employmentType: undefined,
        workArrangement: undefined,
        hrContact: '',
        hrEmail: '',
        hrPhone: '',
        applicationMethod: '',
        referralSource: '',
        notes: ''
      })
      setSelectedCvId('')
    }
  }, [application])

  const handleAutoFill = () => {
    const selectedCV = userCVs.find(cv => cv.id === selectedCvId)
    if (!selectedCV?.analysis) {
      toast.error('CV yang dipilih belum memiliki analisis')
      return
    }

    const analysis = selectedCV.analysis as CVAnalysis
    
    // Auto-fill location from CV
    if (analysis.informasi_pribadi?.lokasi && !formData.location) {
      setFormData(prev => ({
        ...prev,
        location: analysis.informasi_pribadi.lokasi || ''
      }))
    }

    // Auto-fill position suggestions from CV analysis
    if (analysis.ringkasan_analisis?.potensi_kecocokan_posisi?.length > 0 && !formData.positionTitle) {
      setFormData(prev => ({
        ...prev,
        positionTitle: analysis.ringkasan_analisis.potensi_kecocokan_posisi[0]
      }))
    }

    // Auto-fill salary expectation
    if (analysis.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah && !formData.salaryOffered) {
      const salaryEstimate = analysis.ringkasan_analisis.estimasi_gaji_bulanan_rupiah
      if (salaryEstimate.rentang_bawah) {
        setFormData(prev => ({
          ...prev,
          salaryOffered: salaryEstimate.rentang_bawah
        }))
      }
    }

    toast.success('Form berhasil diisi otomatis dari analisis CV')
    setShowAutoFill(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.positionTitle) {
      toast.error('Nama perusahaan dan posisi wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      toast.success(application ? 'Lamaran berhasil diperbarui' : 'Lamaran berhasil ditambahkan')
    } catch (error: any) {
      console.error('Form submission error:', error)
      const errorMessage = error?.message || 'Gagal menyimpan lamaran'
      toast.error(`Gagal menyimpan lamaran: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {application ? 'Edit Lamaran' : 'Tambah Lamaran Baru'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* CV Selection */}
          {userCVs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CV yang Digunakan
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih CV (opsional)</option>
                  {userCVs.map(cv => (
                    <option key={cv.id} value={cv.id}>
                      {cv.originalName}
                    </option>
                  ))}
                </select>
                {selectedCvId && (
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Auto-Fill
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Perusahaan *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: PT. Teknologi Indonesia"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posisi *
              </label>
              <input
                type="text"
                required
                value={formData.positionTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, positionTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Lowongan
            </label>
            <input
              type="url"
              value={formData.jobUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, jobUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Melamar
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.applicationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationDate: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ApplicationStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="wishlist">Wishlist</option>
                <option value="applied">Dilamar</option>
                <option value="assessment">Assessment</option>
                <option value="interview">Interview</option>
                <option value="offer">Penawaran</option>
                <option value="rejected">Ditolak</option>
                <option value="hired">Diterima</option>
                <option value="withdrawn">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: Jakarta, Indonesia"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gaji Ditawarkan
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.salaryOffered || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    salaryOffered: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: 8000000"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Catatan tambahan tentang lamaran ini..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{application ? 'Perbarui' : 'Simpan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
