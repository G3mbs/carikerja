'use client'

import { useState, useEffect } from 'react'
import { 
  ExternalLink, 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Star,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react'
import { LinkedInJobData } from '@/types/linkedin'
import toast from 'react-hot-toast'

interface LinkedInJobResultsProps {
  sessionId: string
  userId: string
}

export default function LinkedInJobResults({ sessionId, userId }: LinkedInJobResultsProps) {
  const [jobs, setJobs] = useState<LinkedInJobData[]>([])
  const [filteredJobs, setFilteredJobs] = useState<LinkedInJobData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'match_score' | 'posted_time' | 'company_name'>('match_score')
  const [filterBy, setFilterBy] = useState<'all' | 'easy_apply' | 'high_match'>('all')

  useEffect(() => {
    fetchJobs()
  }, [sessionId, userId])

  useEffect(() => {
    filterAndSortJobs()
  }, [jobs, searchTerm, sortBy, filterBy])

  const fetchJobs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/linkedin/scrape?sessionId=${sessionId}&userId=${userId}`)
      const result = await response.json()

      if (result.success && result.jobs) {
        setJobs(result.jobs)
      } else {
        throw new Error(result.error || 'Failed to fetch jobs')
      }
    } catch (error) {
      console.error('Error fetching LinkedIn jobs:', error)
      toast.error('Failed to load job results')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortJobs = () => {
    let filtered = [...jobs]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    switch (filterBy) {
      case 'easy_apply':
        filtered = filtered.filter(job => job.easyApply)
        break
      case 'high_match':
        filtered = filtered.filter(job => (job.matchScore || 0) >= 70)
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'match_score':
          return (b.matchScore || 0) - (a.matchScore || 0)
        case 'posted_time':
          return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime()
        case 'company_name':
          return a.companyName.localeCompare(b.companyName)
        default:
          return 0
      }
    })

    setFilteredJobs(filtered)
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatPostedTime = (timeStr: string) => {
    // LinkedIn time formats: "1 day ago", "2 weeks ago", etc.
    return timeStr || 'Recently'
  }

  const updateApplicationStatus = async (jobId: string, status: string) => {
    try {
      const response = await fetch('/api/linkedin/jobs/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          userId,
          applicationStatus: status
        })
      })

      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, applicationStatus: status } : job
        ))
        toast.success(`Application status updated to ${status}`)
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading job results...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">LinkedIn Job Results</h3>
          <p className="text-sm text-gray-600">
            Found {jobs.length} jobs • Showing {filteredJobs.length} after filters
          </p>
        </div>
        
        <button
          onClick={fetchJobs}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Download className="h-4 w-4" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs, companies, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="match_score">Sort by Match Score</option>
          <option value="posted_time">Sort by Posted Time</option>
          <option value="company_name">Sort by Company</option>
        </select>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Jobs</option>
          <option value="easy_apply">Easy Apply Only</option>
          <option value="high_match">High Match (70%+)</option>
        </select>
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
          <p className="text-gray-500">
            {jobs.length === 0 
              ? 'No jobs were scraped in this session.' 
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    {job.companyLogoUrl && (
                      <img
                        src={job.companyLogoUrl}
                        alt={`${job.companyName} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {job.jobTitle}
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Building className="h-4 w-4" />
                          <span>{job.companyName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatPostedTime(job.postedTime)}</span>
                        </div>
                      </div>

                      {job.salaryRange && (
                        <div className="flex items-center space-x-1 text-sm text-green-600 mb-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Score */}
                {job.matchScore && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(job.matchScore)}`}>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>{job.matchScore}% match</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Easy Apply Badge */}
                  {job.easyApply && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      Easy Apply
                    </span>
                  )}

                  {/* Additional Insights */}
                  {job.additionalInsights && job.additionalInsights.length > 0 && (
                    <div className="flex space-x-1">
                      {job.additionalInsights.map((insight, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {insight}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Application Status */}
                  <select
                    value={job.applicationStatus || 'not_applied'}
                    onChange={(e) => updateApplicationStatus(job.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="not_applied">Not Applied</option>
                    <option value="applied">Applied</option>
                    <option value="in_review">In Review</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="offer">Offer</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <a
                    href={job.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
