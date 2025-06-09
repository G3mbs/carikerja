'use client'

import { useState, useEffect } from 'react'
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface JobTask {
  id: string
  type: 'job_search' | 'job_apply'
  status: 'pending' | 'running' | 'completed' | 'failed'
  platform: string
  progress?: number
  results?: any[]
  error?: string
  createdAt: string
  updatedAt: string
}

interface JobMonitoringProps {
  userId: string
}

export default function JobMonitoring({ userId }: JobMonitoringProps) {
  const [tasks, setTasks] = useState<JobTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchTasks()
    
    if (autoRefresh) {
      const interval = setInterval(fetchTasks, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [userId, autoRefresh])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/jobs/search?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading tasks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Job Search Monitoring</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          
          <button
            onClick={fetchTasks}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h3>
          <p className="text-gray-500">Start a job search to see monitoring data here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(task.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {task.type === 'job_search' ? 'Job Search' : 'Job Application'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Platform: <span className="font-medium">{task.platform}</span>
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      Started: {new Date(task.createdAt).toLocaleString('id-ID')}
                    </p>
                    
                    {task.updatedAt !== task.createdAt && (
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(task.updatedAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {task.results && task.results.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-green-600">
                        {task.results.length} jobs found
                      </span>
                    </div>
                  )}
                  
                  {task.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{task.progress}% complete</p>
                    </div>
                  )}
                </div>
              </div>
              
              {task.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {task.error}
                  </p>
                </div>
              )}
              
              {task.status === 'running' && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Task is running...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
