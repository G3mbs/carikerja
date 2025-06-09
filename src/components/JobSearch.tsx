'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, DollarSign, Building, Loader2, Play, Pause, Sparkles, RefreshCw, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { JobSearchParams, JobResult, CVAnalysis, StructuredKeywords } from '@/types'
import {
  autoFillJobSearchParams,
  getAutoFillIndicators,
  getAutoFillTooltip,
  validateAutoFilledParams,
  formatSalaryRange,
  getExperienceLevelDisplayName,
  type AutoFillResult
} from '@/lib/auto-fill-utils'
import AutoFillIndicator, { AutoFillSummary, FieldLabel } from '@/components/AutoFillIndicator'

interface JobSearchProps {
  userId: string
  cvAnalysis?: CVAnalysis
}

export default function JobSearch({ userId, cvAnalysis }: JobSearchProps) {
  // Auto-fill initial parameters from CV analysis
  const autoFillResult = autoFillJobSearchParams(cvAnalysis)
  const autoFillIndicators = getAutoFillIndicators(cvAnalysis)

  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    keywords: autoFillResult.keywords,
    location: autoFillResult.location,
    salaryRange: autoFillResult.salaryRange,
    experienceLevel: autoFillResult.experienceLevel,
    companyType: [],
    industry: []
  })

  const [isAutoFilled, setIsAutoFilled] = useState(autoFillResult.isAutoFilled)
  const [autoFilledFields, setAutoFilledFields] = useState(autoFillResult.autoFilledFields)
  const [autoFillSource, setAutoFillSource] = useState(autoFillResult.source)

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'JobStreet', 'LinkedIn', 'Glints'
  ])

  const [isSearching, setIsSearching] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<JobResult[]>([])
  const [searchStatus, setSearchStatus] = useState<string>('')
  const [lastSearchParams, setLastSearchParams] = useState<string | null>(null)
  const [searchRequestId, setSearchRequestId] = useState<string | null>(null)
  const [enhancedKeywords, setEnhancedKeywords] = useState<StructuredKeywords | null>(null)
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false)

  // Effect untuk menampilkan notifikasi auto-fill
  useEffect(() => {
    if (isAutoFilled && autoFilledFields.length > 0) {
      const fieldNames = autoFilledFields.map(field => {
        const names = {
          keywords: 'kata kunci',
          location: 'lokasi',
          salaryRange: 'rentang gaji',
          experienceLevel: 'level pengalaman'
        }
        return names[field as keyof typeof names] || field
      }).join(', ')

      toast.success(
        `Parameter pencarian telah diisi berdasarkan analisis CV: ${fieldNames}`,
        { duration: 4000 }
      )
    }
  }, []) // Only run once on mount

  const platforms = [
    { id: 'JobStreet', name: 'JobStreet Indonesia', description: 'Platform lowongan kerja terbesar di Indonesia' },
    { id: 'LinkedIn', name: 'LinkedIn Jobs', description: 'Jaringan profesional global' },
    { id: 'Glints', name: 'Glints', description: 'Platform untuk tech dan startup jobs' },
    { id: 'Kalibrr', name: 'Kalibrr', description: 'Platform rekrutmen modern' },
    { id: 'Indeed', name: 'Indeed Indonesia', description: 'Mesin pencari kerja global' }
  ]

  const experienceLevels = [
    { value: 'fresh_graduate', label: 'Fresh Graduate' },
    { value: 'junior', label: 'Junior (1-3 tahun)' },
    { value: 'menengah', label: 'Menengah (3-7 tahun)' },
    { value: 'senior', label: 'Senior (7+ tahun)' },
    { value: 'ahli', label: 'Ahli (Expert)' },
    { value: 'any', label: 'Semua Level' }
  ]

  const startJobSearch = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Pilih minimal satu platform pencarian')
      return
    }

    if (searchParams.keywords.length === 0) {
      toast.error('Masukkan minimal satu kata kunci')
      return
    }

    // Prevent duplicate requests
    if (isSearching) {
      console.log('Search already in progress, ignoring duplicate request')
      return
    }

    // Create unique request ID and parameter hash
    const requestId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const paramsHash = JSON.stringify({
      searchParams,
      platforms: selectedPlatforms,
      userId
    })

    // Check if this is a duplicate request
    if (lastSearchParams === paramsHash && searchRequestId) {
      console.log('Duplicate search parameters detected, ignoring request')
      toast('Pencarian dengan parameter yang sama sedang berjalan', {
        icon: '⚠️',
        duration: 3000,
      })
      return
    }

    setIsSearching(true)
    setSearchRequestId(requestId)
    setLastSearchParams(paramsHash)
    setSearchStatus('Memulai pencarian kerja...')

    console.log('Starting job search with request ID:', requestId)
    console.log('Search parameters:', searchParams)
    console.log('Selected platforms:', selectedPlatforms)

    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId
        },
        body: JSON.stringify({
          searchParams,
          platforms: selectedPlatforms,
          userId,
          requestId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Search failed')
      }

      console.log('Search task created:', result.taskId)
      setCurrentTaskId(result.taskId)
      setSearchStatus('Pencarian dimulai, memantau progress...')

      // Start polling for results
      pollSearchResults(result.taskId)

      toast.success('Pencarian kerja dimulai!')

    } catch (error) {
      console.error('Search error:', error)
      toast.error(error instanceof Error ? error.message : 'Pencarian gagal')
      setIsSearching(false)
      setSearchRequestId(null)
      setLastSearchParams(null)
    }
  }

  const pollSearchResults = async (taskId: string) => {
    console.log('Starting polling for task:', taskId)

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/search?userId=${userId}&taskId=${taskId}`)
        const result = await response.json()

        if (result.success) {
          console.log('Poll result:', result.task.status)
          setSearchStatus(`Status: ${result.task.status}`)

          if (result.task.status === 'completed') {
            setSearchResults(result.results || [])
            setIsSearching(false)
            setSearchRequestId(null)
            setSearchStatus('Pencarian selesai!')
            clearInterval(pollInterval)
            console.log('Search completed, found jobs:', result.results?.length || 0)
            toast.success(`Ditemukan ${result.results?.length || 0} lowongan kerja!`)
          } else if (result.task.status === 'failed') {
            setIsSearching(false)
            setSearchRequestId(null)
            setSearchStatus('Pencarian gagal')
            clearInterval(pollInterval)
            console.error('Search failed:', result.task.error)
            toast.error('Pencarian gagal: ' + (result.task.error || 'Unknown error'))
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) // Poll every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      if (isSearching) {
        setIsSearching(false)
        setSearchRequestId(null)
        setSearchStatus('Timeout - pencarian dihentikan')
        console.log('Search timeout for task:', taskId)
      }
    }, 600000)
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

  const generateEnhancedKeywords = async () => {
    if (!cvAnalysis) {
      toast.error('CV analysis diperlukan untuk generate keywords')
      return
    }

    setIsGeneratingKeywords(true)
    try {
      const response = await fetch('/api/enhanced-prompting/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          demo_type: 'keywords_generation',
          cv_content: 'Using existing CV analysis'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate enhanced keywords')
      }

      const result = await response.json()
      if (result.success && result.result) {
        setEnhancedKeywords(result.result)
        toast.success('Enhanced keywords berhasil digenerate!')
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Enhanced keywords generation error:', error)
      toast.error('Gagal generate enhanced keywords')
    } finally {
      setIsGeneratingKeywords(false)
    }
  }

  const applyEnhancedKeywords = (category: keyof StructuredKeywords) => {
    if (!enhancedKeywords) return

    const newKeywords = enhancedKeywords[category]
    setSearchParams(prev => ({
      ...prev,
      keywords: [...new Set([...prev.keywords, ...newKeywords])] // Remove duplicates
    }))

    // Update auto-fill status if keywords were manually modified
    if (!autoFilledFields.includes('keywords')) {
      setAutoFilledFields(prev => [...prev, 'keywords'])
      setIsAutoFilled(true)
    }

    toast.success(`${newKeywords.length} keywords dari kategori ${category} ditambahkan!`)
  }

  const resetToDefaults = () => {
    const defaultParams = {
      keywords: [],
      location: ['Jakarta'],
      salaryRange: { min: 8000000, max: 20000000 },
      experienceLevel: 'any',
      companyType: [],
      industry: []
    }

    setSearchParams(defaultParams)
    setIsAutoFilled(false)
    setAutoFilledFields([])
    setAutoFillSource('default')
    setEnhancedKeywords(null)

    toast.success('Parameter pencarian direset ke nilai default')
  }

  const reapplyAutoFill = () => {
    const newAutoFillResult = autoFillJobSearchParams(cvAnalysis)

    setSearchParams(prev => ({
      ...prev,
      keywords: newAutoFillResult.keywords,
      location: newAutoFillResult.location,
      salaryRange: newAutoFillResult.salaryRange,
      experienceLevel: newAutoFillResult.experienceLevel
    }))

    setIsAutoFilled(newAutoFillResult.isAutoFilled)
    setAutoFilledFields(newAutoFillResult.autoFilledFields)
    setAutoFillSource(newAutoFillResult.source)

    if (newAutoFillResult.isAutoFilled) {
      toast.success('Parameter pencarian diisi ulang berdasarkan CV')
    } else {
      toast('Tidak ada data CV untuk auto-fill', {
        icon: 'ℹ️',
        duration: 3000,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Parameters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Parameter Pencarian Kerja</h3>
          <div className="flex items-center space-x-2">
            {cvAnalysis && (
              <button
                onClick={reapplyAutoFill}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Isi ulang berdasarkan CV"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Auto-Fill
              </button>
            )}
            <button
              onClick={resetToDefaults}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Reset ke nilai default"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>

        {/* Auto-Fill Summary */}
        <AutoFillSummary
          isAutoFilled={isAutoFilled}
          autoFilledFields={autoFilledFields}
          source={autoFillSource}
          onReset={resetToDefaults}
        />

        {/* Keywords */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <label className="block text-sm font-semibold text-gray-800">
                Kata Kunci Pencarian
              </label>
              <AutoFillIndicator
                isAutoFilled={autoFillIndicators.keywords}
                field="keywords"
                tooltip={getAutoFillTooltip('keywords', cvAnalysis)}
              />
            </div>
            {cvAnalysis && (
              <button
                onClick={generateEnhancedKeywords}
                disabled={isGeneratingKeywords}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all
                  ${isGeneratingKeywords
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md'
                  }
                `}
              >
                {isGeneratingKeywords ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Enhanced Keywords</span>
                  </>
                )}
              </button>
            )}
          </div>

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
            placeholder="Tambah kata kunci dan tekan Enter"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addKeyword(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />

          {/* Enhanced Keywords Display */}
          {enhancedKeywords && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Enhanced Keywords (AI Generated)
              </h4>

              <div className="space-y-3">
                {Object.entries(enhancedKeywords).map(([category, keywords]) => (
                  <div key={category} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded min-w-max">
                      {category.replace(/_/g, ' ')}:
                    </span>
                    {keywords.map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => addKeyword(keyword)}
                        className="text-xs bg-white text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100 transition-colors"
                        title="Klik untuk menambahkan"
                      >
                        + {keyword}
                      </button>
                    ))}
                    <button
                      onClick={() => applyEnhancedKeywords(category as keyof StructuredKeywords)}
                      className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors ml-2"
                    >
                      Add All
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="mb-6">
          <FieldLabel
            label="Lokasi"
            isAutoFilled={autoFillIndicators.location}
            field="location"
            tooltip={getAutoFillTooltip('location', cvAnalysis)}
            required
          />
          <input
            type="text"
            value={searchParams.location.join(', ')}
            onChange={(e) => setSearchParams(prev => ({
              ...prev,
              location: e.target.value.split(',').map(l => l.trim())
            }))}
            className={`
              w-full px-4 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 transition-colors
              ${autoFillIndicators.location
                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }
            `}
            placeholder="Jakarta, Bandung, Remote"
          />
        </div>

        {/* Salary Range */}
        <div className="mb-6">
          <FieldLabel
            label="Rentang Gaji (Rupiah)"
            isAutoFilled={autoFillIndicators.salaryRange}
            field="salaryRange"
            tooltip={getAutoFillTooltip('salaryRange', cvAnalysis)}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={searchParams.salaryRange.min}
              onChange={(e) => setSearchParams(prev => ({
                ...prev,
                salaryRange: { ...prev.salaryRange, min: parseInt(e.target.value) || 0 }
              }))}
              className={`
                px-4 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 transition-colors
                ${autoFillIndicators.salaryRange
                  ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }
              `}
              placeholder="Gaji minimum"
            />
            <input
              type="number"
              value={searchParams.salaryRange.max}
              onChange={(e) => setSearchParams(prev => ({
                ...prev,
                salaryRange: { ...prev.salaryRange, max: parseInt(e.target.value) || 0 }
              }))}
              className={`
                px-4 py-3 border-2 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 transition-colors
                ${autoFillIndicators.salaryRange
                  ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }
              `}
              placeholder="Gaji maksimum"
            />
          </div>
          {autoFillIndicators.salaryRange && (
            <p className="text-sm text-green-700 mt-2">
              💰 {formatSalaryRange(searchParams.salaryRange.min, searchParams.salaryRange.max)}
            </p>
          )}
        </div>

        {/* Experience Level */}
        <div className="mb-6">
          <FieldLabel
            label="Level Pengalaman"
            isAutoFilled={autoFillIndicators.experienceLevel}
            field="experienceLevel"
            tooltip={getAutoFillTooltip('experienceLevel', cvAnalysis)}
            required
          />
          <select
            value={searchParams.experienceLevel}
            onChange={(e) => setSearchParams(prev => ({
              ...prev,
              experienceLevel: e.target.value
            }))}
            className={`
              w-full px-4 py-3 border-2 rounded-lg text-gray-900 bg-white focus:ring-2 transition-colors
              ${autoFillIndicators.experienceLevel
                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }
            `}
          >
            {experienceLevels.map(level => (
              <option key={level.value} value={level.value} className="text-gray-900">
                {level.label}
              </option>
            ))}
          </select>
          {autoFillIndicators.experienceLevel && (
            <p className="text-sm text-green-700 mt-2">
              👔 {getExperienceLevelDisplayName(searchParams.experienceLevel)}
            </p>
          )}
        </div>
      </div>

      {/* Platform Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Pilih Platform Pencarian</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map(platform => (
            <label key={platform.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPlatforms(prev => [...prev, platform.id])
                  } else {
                    setSelectedPlatforms(prev => prev.filter(p => p !== platform.id))
                  }
                }}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="font-semibold text-gray-900">{platform.name}</div>
                <div className="text-sm text-gray-600 mt-1">{platform.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Search Button */}
      <div className="text-center">
        <button
          onClick={startJobSearch}
          disabled={isSearching}
          className={`
            px-8 py-4 rounded-lg font-semibold flex items-center space-x-3 mx-auto text-lg transition-all duration-200 shadow-lg
            ${isSearching
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl transform hover:scale-105'
            }
          `}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Mencari...</span>
            </>
          ) : (
            <>
              <Search className="h-6 w-6" />
              <span>Mulai Pencarian Kerja</span>
            </>
          )}
        </button>

        {searchStatus && (
          <p className="mt-4 text-base font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-lg inline-block">{searchStatus}</p>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Hasil Pencarian ({searchResults.length} lowongan)
          </h3>
          <div className="space-y-4">
            {searchResults.map((job, index) => (
              <div key={job.id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-lg text-gray-900">{job.title}</h4>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {job.platform}
                  </span>
                </div>
                <p className="text-gray-700 font-medium mb-3">{job.company} • {job.location}</p>
                {job.salary && (
                  <p className="text-green-700 font-semibold mb-3 text-lg">{job.salary}</p>
                )}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">
                    {new Date(job.postedDate).toLocaleDateString('id-ID')}
                  </span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Lihat Detail
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
