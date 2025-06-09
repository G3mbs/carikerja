'use client'

import { useState, useEffect } from 'react'
import { 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users,
  Plus,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react'
import { ApplicationStats, ApplicationTrend, ApplicationActivity } from '@/types'
import toast from 'react-hot-toast'

interface ApplicationDashboardProps {
  userId: string
  onCreateApplication: () => void
  onViewApplications: () => void
}

export default function ApplicationDashboard({ 
  userId, 
  onCreateApplication, 
  onViewApplications 
}: ApplicationDashboardProps) {
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [trends, setTrends] = useState<ApplicationTrend[]>([])
  const [recentActivities, setRecentActivities] = useState<ApplicationActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      // Fetch stats and trends
      const statsResponse = await fetch(`/api/applications/stats?userId=${userId}`)
      if (statsResponse.ok) {
        const { stats: statsData, trends: trendsData } = await statsResponse.json()
        setStats(statsData)
        setTrends(trendsData)
      }

      // Fetch recent activities
      const activitiesResponse = await fetch('/api/applications/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit: 5 })
      })
      if (activitiesResponse.ok) {
        const { activities } = await activitiesResponse.json()
        setRecentActivities(activities)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      wishlist: 'bg-gray-100 text-gray-800',
      applied: 'bg-blue-100 text-blue-800',
      assessment: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-emerald-100 text-emerald-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      wishlist: 'Wishlist',
      applied: 'Dilamar',
      assessment: 'Assessment',
      interview: 'Interview',
      offer: 'Penawaran',
      rejected: 'Ditolak',
      hired: 'Diterima',
      withdrawn: 'Dibatalkan'
    }
    return labels[status as keyof typeof labels] || status
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Lamaran Kerja</h1>
          <p className="text-gray-600">Kelola dan pantau progress lamaran kerja Anda</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onViewApplications}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>Lihat Semua</span>
          </button>
          <button
            onClick={onCreateApplication}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Lamaran</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Lamaran</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interview Mendatang</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.upcomingInterviews || 0}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Penawaran Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingOffers || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata Respon</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.averageResponseTime || 0} hari
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribusi Status</h3>
          <div className="space-y-3">
            {stats && Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-1 rounded-full">
                    <Briefcase className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Belum ada aktivitas terbaru
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
