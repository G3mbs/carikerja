'use client'

import { useState, useEffect } from 'react'
import { Globe, Play, Pause, Square, Download, ExternalLink, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { LinkedInSearchParams, LinkedInScrapingSession } from '@/types/linkedin'
import { CVAnalysis } from '@/types'
import ScrapingProgressMonitor from './ScrapingProgressMonitor'
import LinkedInJobResults from './LinkedInJobResults'

interface LinkedInScrapingInterfaceProps {
  userId: string
  cvAnalysis?: CVAnalysis
}

export default function LinkedInScrapingInterface({ userId, cvAnalysis }: LinkedInScrapingInterfaceProps) {
  const [searchParams, setSearchParams] = useState<LinkedInSearchParams>({
    keywords: cvAnalysis?.ringkasan_analisis?.potensi_kecocokan_posisi || [],
    location: ['Jakarta, Indonesia'],
    experienceLevel: cvAnalysis?.ringkasan_analisis?.tingkat_pengalaman?.toLowerCase().replace(' ', '_') || 'entry',
    jobType: ['full-time'],
    datePosted: 'past-month',
    easyApply: true,
    remoteWork: false
  })

  const [currentSession, setCurrentSession] = useState<LinkedInScrapingSession | null>(null)
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  const [sessions, setSessions] = useState<LinkedInScrapingSession[]>([])
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  // Load existing sessions on component mount
  useEffect(() => {
    loadSessions()
  }, [userId])

  // Poll for session updates when scraping is active
  useEffect(() => {
    if (isScrapingActive && currentSession) {
      const interval = setInterval(() => {
        checkSessionStatus(currentSession.id)
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isScrapingActive, currentSession])

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/linkedin/scrape?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setSessions(result.sessions || [])
        
        // Check if there's an active session
        const activeSession = result.sessions?.find((s: LinkedInScrapingSession) => 
          ['pending', 'running'].includes(s.status)
        )
        
        if (activeSession) {
          setCurrentSession(activeSession)
          setIsScrapingActive(true)
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const checkSessionStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/linkedin/status?sessionId=${sessionId}&userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setCurrentSession(result.session)
        
        // Stop polling if session is completed or failed
        if (['completed', 'failed'].includes(result.session.status)) {
          setIsScrapingActive(false)
          loadSessions() // Refresh sessions list
          
          if (result.session.status === 'completed') {
            toast.success(`LinkedIn scraping completed! Found ${result.session.totalJobsFound} jobs`)
          } else {
            toast.error(`LinkedIn scraping failed: ${result.session.errorMessage}`)
          }
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error)
    }
  }

  const startScraping = async () => {
    if (searchParams.keywords.length === 0) {
      toast.error('Please add at least one keyword')
      return
    }

    if (searchParams.location.length === 0) {
      toast.error('Please specify at least one location')
      return
    }

    try {
      setIsScrapingActive(true)
      
      const response = await fetch('/api/linkedin/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchParams,
          userId,
          cvAnalysis,
          exportToSheets: true
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('LinkedIn scraping started!')
        
        // Create a temporary session object for immediate UI feedback
        const tempSession: LinkedInScrapingSession = {
          id: `temp_${Date.now()}`,
          userId,
          cvId: '',
          searchParams,
          status: 'pending',
          progress: {
            currentPage: 0,
            totalPages: 0,
            jobsFound: 0,
            jobsProcessed: 0,
            status: 'initializing',
            message: 'Starting LinkedIn scraping...',
            startTime: new Date().toISOString(),
            errors: []
          },
          totalJobsFound: 0,
          retryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        setCurrentSession(tempSession)
        
        // Refresh sessions after a short delay to get the real session
        setTimeout(loadSessions, 2000)
        
      } else {
        throw new Error(result.error || 'Failed to start scraping')
      }
    } catch (error) {
      console.error('Error starting scraping:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start scraping')
      setIsScrapingActive(false)
    }
  }

  const pauseResumeSession = async (action: 'pause' | 'resume') => {
    if (!currentSession) return

    try {
      const response = await fetch('/api/linkedin/scrape', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          userId,
          action
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Session ${action}d successfully`)
        checkSessionStatus(currentSession.id)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error)
      toast.error(`Failed to ${action} session`)
    }
  }

  const cancelSession = async () => {
    if (!currentSession) return

    try {
      const response = await fetch('/api/linkedin/scrape', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          userId,
          action: 'cancel'
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Session cancelled')
        setIsScrapingActive(false)
        setCurrentSession(null)
        loadSessions()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast.error('Failed to cancel session')
    }
  }

  const exportToGoogleSheets = async (sessionId: string) => {
    try {
      const response = await fetch('/api/linkedin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          userId
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Exported to Google Sheets!')
        window.open(result.url, '_blank')
        loadSessions() // Refresh to show updated Google Sheets URL
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error)
      toast.error('Failed to export to Google Sheets')
    }
  }

  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !searchParams.keywords.includes(keyword.trim())) {
      setSearchParams(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }))
    }
  }

  const removeKeyword = (index: number) => {
    setSearchParams(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const addLocation = (location: string) => {
    if (location.trim() && !searchParams.location.includes(location.trim())) {
      setSearchParams(prev => ({
        ...prev,
        location: [...prev.location, location.trim()]
      }))
    }
  }

  const removeLocation = (index: number) => {
    setSearchParams(prev => ({
      ...prev,
      location: prev.location.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">LinkedIn Job Scraper</h2>
            <p className="text-gray-600">Automated job search and data extraction from LinkedIn</p>
          </div>
        </div>

        {cvAnalysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>CV Analysis Detected:</strong> Search parameters have been automatically configured based on your CV analysis.
              You can modify them below if needed.
            </p>
          </div>
        )}
      </div>

      {/* Search Parameters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Search Parameters</h3>
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm">Advanced Settings</span>
          </button>
        </div>

        {/* Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Job Keywords
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {searchParams.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium flex items-center border border-blue-200"
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(index)}
                  className="ml-2 text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add keyword and press Enter"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addKeyword(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />
        </div>

        {/* Locations */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Locations
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {searchParams.location.map((location, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium flex items-center border border-green-200"
              >
                {location}
                <button
                  onClick={() => removeLocation(index)}
                  className="ml-2 text-green-600 hover:text-green-800 font-bold text-lg leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add location and press Enter"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addLocation(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />
        </div>

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Experience Level
                </label>
                <select
                  value={searchParams.experienceLevel || 'entry'}
                  onChange={(e) => setSearchParams(prev => ({
                    ...prev,
                    experienceLevel: e.target.value
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="internship">Internship</option>
                  <option value="entry">Entry Level</option>
                  <option value="associate">Associate</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="director">Director</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Job Type
                </label>
                <div className="space-y-2">
                  {['full-time', 'part-time', 'contract', 'temporary', 'volunteer', 'internship'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={searchParams.jobType?.includes(type) || false}
                        onChange={(e) => {
                          const currentTypes = searchParams.jobType || []
                          if (e.target.checked) {
                            setSearchParams(prev => ({
                              ...prev,
                              jobType: [...currentTypes, type]
                            }))
                          } else {
                            setSearchParams(prev => ({
                              ...prev,
                              jobType: currentTypes.filter(t => t !== type)
                            }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{type.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Posted */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Date Posted
                </label>
                <select
                  value={searchParams.datePosted || 'past-month'}
                  onChange={(e) => setSearchParams(prev => ({
                    ...prev,
                    datePosted: e.target.value
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="past-24h">Past 24 hours</option>
                  <option value="past-week">Past week</option>
                  <option value="past-month">Past month</option>
                  <option value="any-time">Any time</option>
                </select>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Filters
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={searchParams.easyApply || false}
                      onChange={(e) => setSearchParams(prev => ({
                        ...prev,
                        easyApply: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Easy Apply only</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={searchParams.remoteWork || false}
                      onChange={(e) => setSearchParams(prev => ({
                        ...prev,
                        remoteWork: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remote work</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={startScraping}
            disabled={isScrapingActive || searchParams.keywords.length === 0}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-5 w-5" />
            <span>{isScrapingActive ? 'Scraping in Progress...' : 'Start LinkedIn Scraping'}</span>
          </button>

          {currentSession && ['running', 'paused'].includes(currentSession.status) && (
            <div className="flex space-x-2">
              <button
                onClick={() => pauseResumeSession(currentSession.status === 'running' ? 'pause' : 'resume')}
                className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {currentSession.status === 'running' ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <button
                onClick={cancelSession}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Current Session Progress */}
      {currentSession && (
        <ScrapingProgressMonitor
          session={currentSession}
          onExportToSheets={() => exportToGoogleSheets(currentSession.id)}
        />
      )}

      {/* Previous Sessions */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Previous Sessions</h3>

          <div className="space-y-4">
            {sessions.filter(s => s.id !== currentSession?.id).map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Session {session.id.substring(0, 8)}...
                    </h4>
                    <p className="text-sm text-gray-600">
                      Keywords: {session.searchParams.keywords.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'failed' ? 'bg-red-100 text-red-800' :
                      session.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>

                    {session.status === 'completed' && session.totalJobsFound > 0 && (
                      <span className="text-sm text-green-600 font-medium">
                        {session.totalJobsFound} jobs
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {session.googleSheetsUrl && (
                      <a
                        href={session.googleSheetsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Sheets</span>
                      </a>
                    )}

                    {session.status === 'completed' && !session.googleSheetsUrl && (
                      <button
                        onClick={() => exportToGoogleSheets(session.id)}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export to Sheets</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LinkedIn Job Results */}
      {currentSession && currentSession.status === 'completed' && (
        <LinkedInJobResults sessionId={currentSession.id} userId={userId} />
      )}
    </div>
  )
}
