'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'

interface JobSearchDebugProps {
  userId: string
}

interface SearchTask {
  id: string
  task_id: string
  request_id: string
  search_params: any
  platforms: string[]
  status: string
  created_at: string
  updated_at: string
}

export default function JobSearchDebug({ userId }: JobSearchDebugProps) {
  const [tasks, setTasks] = useState<SearchTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) {
      fetchTasks()
      const interval = setInterval(fetchTasks, 5000)
      return () => clearInterval(interval)
    }
  }, [userId, isVisible])

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/jobs/search?userId=${userId}&debug=true`)
      const data = await response.json()
      
      if (data.success && data.tasks) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch debug tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
      case 'running':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Debug Tasks
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-semibold text-sm">Job Search Tasks Debug</h3>
        <div className="flex space-x-2">
          <button
            onClick={fetchTasks}
            className="text-gray-300 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">No tasks found</div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <span className="text-xs font-mono text-gray-600">
                      {task.task_id.substring(0, 8)}...
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <strong>Request ID:</strong> {task.request_id || 'N/A'}
                  </div>
                  <div>
                    <strong>Platforms:</strong> {task.platforms.join(', ')}
                  </div>
                  <div>
                    <strong>Keywords:</strong> {task.search_params.keywords?.join(', ') || 'N/A'}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(task.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
