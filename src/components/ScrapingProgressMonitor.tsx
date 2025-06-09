'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Download,
  ExternalLink,
  Pause,
  Play,
  Square
} from 'lucide-react'
import { LinkedInScrapingSession } from '@/types/linkedin'

interface ScrapingProgressMonitorProps {
  session: LinkedInScrapingSession
  onExportToSheets?: () => void
}

export default function ScrapingProgressMonitor({ 
  session, 
  onExportToSheets 
}: ScrapingProgressMonitorProps) {
  const [timeElapsed, setTimeElapsed] = useState<string>('0s')

  useEffect(() => {
    if (session.progress?.startTime) {
      const interval = setInterval(() => {
        const start = new Date(session.progress.startTime)
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
        
        const hours = Math.floor(elapsed / 3600)
        const minutes = Math.floor((elapsed % 3600) / 60)
        const seconds = elapsed % 60
        
        if (hours > 0) {
          setTimeElapsed(`${hours}h ${minutes}m ${seconds}s`)
        } else if (minutes > 0) {
          setTimeElapsed(`${minutes}m ${seconds}s`)
        } else {
          setTimeElapsed(`${seconds}s`)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [session.progress?.startTime])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const calculateProgress = () => {
    if (!session.progress) return 0
    
    const { currentPage, totalPages, jobsProcessed } = session.progress
    
    if (totalPages > 0) {
      return Math.round((currentPage / totalPages) * 100)
    }
    
    return 0
  }

  const estimateTimeRemaining = () => {
    if (!session.progress?.startTime || !session.progress.currentPage || !session.progress.totalPages) {
      return null
    }

    const start = new Date(session.progress.startTime)
    const now = new Date()
    const elapsed = (now.getTime() - start.getTime()) / 1000 // seconds
    
    const pagesCompleted = session.progress.currentPage
    const totalPages = session.progress.totalPages
    
    if (pagesCompleted === 0) return null
    
    const avgTimePerPage = elapsed / pagesCompleted
    const remainingPages = totalPages - pagesCompleted
    const estimatedSeconds = Math.round(avgTimePerPage * remainingPages)
    
    const hours = Math.floor(estimatedSeconds / 3600)
    const minutes = Math.floor((estimatedSeconds % 3600) / 60)
    const seconds = estimatedSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const progress = calculateProgress()
  const estimatedTime = estimateTimeRemaining()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon(session.status)}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              LinkedIn Scraping Progress
            </h3>
            <p className="text-sm text-gray-600">
              Session: {session.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(session.status)}`}>
          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
        </div>
      </div>

      {/* Progress Bar */}
      {session.progress && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {session.progress.message || 'Processing...'}
            </span>
            <span className="text-sm text-gray-500">
              {progress}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {session.progress?.currentPage || 0}
          </div>
          <div className="text-sm text-blue-800">Current Page</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {session.progress?.jobsFound || 0}
          </div>
          <div className="text-sm text-green-800">Jobs Found</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {timeElapsed}
          </div>
          <div className="text-sm text-purple-800">Time Elapsed</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {estimatedTime || '--'}
          </div>
          <div className="text-sm text-orange-800">Est. Remaining</div>
        </div>
      </div>

      {/* Detailed Progress */}
      {session.progress && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Progress Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Pages:</span>
              <span className="font-medium">{session.progress.totalPages || 'Unknown'}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs Processed:</span>
              <span className="font-medium">{session.progress.jobsProcessed || 0}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{session.progress.status}</span>
            </div>
            
            {session.progress.errors && session.progress.errors.length > 0 && (
              <div className="mt-3">
                <span className="text-gray-600">Recent Errors:</span>
                <div className="mt-1 space-y-1">
                  {session.progress.errors.slice(-3).map((error, index) => (
                    <div key={index} className="text-red-600 text-xs bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {session.status === 'completed' && (
        <div className="flex flex-col sm:flex-row gap-3">
          {session.googleSheetsUrl ? (
            <a
              href={session.googleSheetsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View Google Sheets</span>
            </a>
          ) : (
            onExportToSheets && (
              <button
                onClick={onExportToSheets}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export to Google Sheets</span>
              </button>
            )
          )}
          
          <div className="text-sm text-gray-600 flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            Scraping completed successfully! Found {session.totalJobsFound} jobs.
          </div>
        </div>
      )}

      {/* Error Message */}
      {session.status === 'failed' && session.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Scraping Failed</h4>
              <p className="text-sm text-red-700 mt-1">{session.errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
