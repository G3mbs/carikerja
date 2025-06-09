'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface CVUploadProps {
  userId: string
  onUploadSuccess?: (cv: any) => void
}

export default function CVUpload({ userId, onUploadSuccess }: CVUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      if (result.offline) {
        toast.success('CV berhasil diupload (Mode Offline)! Data akan disinkronkan saat database tersedia.')
      } else {
        toast.success('CV berhasil diupload!')
      }
      
      // Start analysis if not already analyzed
      if (!result.cv.analysis) {
        setAnalyzing(true)
        await analyzeCV(result.cv.id)
      }

      onUploadSuccess?.(result.cv)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload gagal')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }, [userId, onUploadSuccess])

  const analyzeCV = async (cvId: string) => {
    try {
      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cvId, userId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      toast.success('Analisis CV selesai!')
      return result.analysis

    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Analisis CV gagal')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading || analyzing
  })

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${(uploading || analyzing) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          ) : analyzing ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
              <span className="text-green-600">Menganalisis CV...</span>
            </div>
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {uploading ? 'Mengupload CV...' : 
               analyzing ? 'Menganalisis CV dengan AI...' :
               isDragActive ? 'Lepaskan file di sini' : 'Upload CV Anda'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop atau klik untuk memilih file
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Mendukung PDF, DOC, DOCX, TXT (maksimal 10MB)
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FileText className="h-4 w-4" />
          <span>Format yang didukung: PDF, DOC, DOCX, TXT</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Analisis otomatis dengan AI untuk ekstraksi data</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span>Data CV akan digunakan untuk pencarian kerja otomatis</span>
        </div>
      </div>
    </div>
  )
}
