'use client'

import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import CVUpload from '@/components/CVUpload'
import JobSearch from '@/components/JobSearch'
import DemoMode from '@/components/DemoMode'
import DemoJobSearch from '@/components/DemoJobSearch'
import JobSearchDebug from '@/components/JobSearchDebug'
import LinkedInScrapingInterface from '@/components/LinkedInScrapingInterface'
import ApplicationManager from '@/components/applications/ApplicationManager'
import { FileText, Search, BarChart3, Download, User, Briefcase, AlertTriangle, Globe } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload')
  const [userId] = useState('demo-user-' + Date.now()) // In real app, get from auth
  const [userCVs, setUserCVs] = useState<any[]>([])
  const [selectedCV, setSelectedCV] = useState<any>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDemoData, setShowDemoData] = useState(false)

  useEffect(() => {
    checkDatabaseConnection()
  }, [])

  const checkDatabaseConnection = async () => {
    try {
      const response = await fetch(`/api/cv/upload?userId=${userId}`)
      if (response.status === 503) {
        setIsDemoMode(true)
      } else {
        fetchUserCVs()
      }
    } catch (error) {
      setIsDemoMode(true)
    }
  }

  const fetchUserCVs = async () => {
    try {
      const response = await fetch(`/api/cv/upload?userId=${userId}`)
      const result = await response.json()

      if (result.success) {
        setUserCVs(result.cvs)
        if (result.cvs.length > 0 && !selectedCV) {
          setSelectedCV(result.cvs[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch CVs:', error)
    }
  }

  const handleCVUploadSuccess = (cv: any) => {
    setUserCVs(prev => [cv, ...prev])
    setSelectedCV(cv)
    setActiveTab('search') // Auto switch to search tab
  }

  const handleContinueDemo = () => {
    setShowDemoData(true)
    // Load demo data
    const demoCV = {
      id: 'demo-cv-1',
      originalName: 'CV_Demo_User.pdf',
      uploadedAt: new Date().toISOString(),
      analysis: {
        informasi_pribadi: {
          nama_lengkap: 'Demo User',
          email: 'demo@example.com',
          nomor_telepon: '+62 812-3456-7890',
          lokasi: 'Jakarta Selatan, DKI Jakarta',
          url_linkedin: 'https://linkedin.com/in/demouser',
          url_portfolio_github: 'https://github.com/demouser'
        },
        ringkasan_analisis: {
          profil_singkat_kandidat: 'Frontend Developer dengan 2 tahun pengalaman dalam React dan JavaScript. Memiliki track record yang baik dalam meningkatkan performa aplikasi dan bekerja dalam tim.',
          tingkat_pengalaman: 'Junior',
          justifikasi_tingkat_pengalaman: 'Total 2 tahun pengalaman relevan di bidang Frontend Development dengan fokus pada React ecosystem.',
          estimasi_gaji_bulanan_rupiah: {
            rentang_bawah: 8000000,
            rentang_atas: 15000000,
            justifikasi_estimasi: 'Berdasarkan pengalaman 2 tahun di bidang Frontend Development dan keahlian React yang solid, sesuai dengan standar pasar Jakarta untuk Junior Developer.'
          },
          potensi_kecocokan_posisi: ['Frontend Developer', 'React Developer', 'JavaScript Developer', 'Full Stack Developer'],
          catatan_untuk_perekrut: 'Kandidat menunjukkan pertumbuhan yang konsisten dengan pencapaian terukur. Memiliki kemampuan teknis yang solid dan pengalaman kerja tim yang baik.'
        },
        ringkasan_profil_cv: 'Passionate Frontend Developer dengan pengalaman 2 tahun dalam mengembangkan aplikasi web modern menggunakan React dan JavaScript.',
        pengalaman_kerja: [
          {
            posisi: 'Frontend Developer',
            perusahaan: 'Tech Startup Indonesia',
            lokasi: 'Jakarta',
            tanggal_mulai: '2022-06',
            tanggal_selesai: 'Sekarang',
            durasi: '2 tahun 6 bulan',
            deskripsi_tugas: ['Mengembangkan aplikasi web menggunakan React', 'Kolaborasi dengan tim backend untuk integrasi API'],
            pencapaian_kunci: ['Meningkatkan performa aplikasi 40%', 'Memimpin tim 3 developer junior']
          }
        ],
        pendidikan: [
          {
            institusi: 'Universitas Indonesia',
            gelar: 'Sarjana Teknik Informatika',
            bidang_studi: 'Teknik Informatika',
            tahun_lulus: 2022,
            nilai_ipk: 3.7
          }
        ],
        keahlian: {
          keahlian_teknis: ['JavaScript', 'React', 'Node.js', 'Python', 'HTML/CSS', 'TypeScript'],
          soft_skills: ['Komunikasi', 'Teamwork', 'Problem Solving', 'Adaptabilitas'],
          tools_platform: ['Git', 'Docker', 'AWS', 'MongoDB', 'Jira', 'Figma'],
          bahasa_pemrograman: ['JavaScript', 'Python', 'TypeScript', 'SQL']
        },
        proyek: [
          {
            nama_proyek: 'E-commerce Dashboard',
            deskripsi: 'Dashboard admin untuk platform e-commerce dengan fitur real-time analytics',
            teknologi_yang_digunakan: ['React', 'Node.js', 'MongoDB', 'Socket.io'],
            url_proyek: 'https://github.com/demouser/ecommerce-dashboard'
          }
        ],
        sertifikasi_dan_pelatihan: [
          {
            nama_sertifikasi: 'React Developer Certification',
            penerbit: 'Meta',
            tahun: 2023
          }
        ],
        bahasa: [
          {
            nama_bahasa: 'Bahasa Indonesia',
            tingkat_kemahiran: 'Native'
          },
          {
            nama_bahasa: 'English',
            tingkat_kemahiran: 'Professional Working Proficiency'
          }
        ]
      }
    }
    setUserCVs([demoCV])
    setSelectedCV(demoCV)
  }

  // Show demo mode if database is not configured
  if (isDemoMode && !showDemoData) {
    return <DemoMode onContinueDemo={handleContinueDemo} />
  }

  const tabs = [
    { id: 'upload', name: 'Upload CV', icon: FileText },
    { id: 'search', name: 'Cari Kerja', icon: Search },
    { id: 'linkedin', name: 'LinkedIn Scraper', icon: Globe },
    { id: 'research', name: 'Riset Pasar', icon: BarChart3 },
    { id: 'applications', name: 'Aplikasi', icon: Briefcase },
    { id: 'export', name: 'Export Data', icon: Download }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Demo Mode Banner */}
      {isDemoMode && showDemoData && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-2 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span>Mode Demo - Data tidak akan tersimpan. Setup database untuk fitur lengkap.</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CariKerja</h1>
                <p className="text-sm text-gray-500">Automation Pencarian Kerja dengan AI</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{isDemoMode ? 'Demo User' : 'Demo User'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CV Selection */}
        {userCVs.length > 0 && activeTab !== 'upload' && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              CV Aktif
            </label>
            <select
              value={selectedCV?.id || ''}
              onChange={(e) => {
                const cv = userCVs.find(cv => cv.id === e.target.value)
                setSelectedCV(cv)
              }}
              className="w-full max-w-md px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              {userCVs.map(cv => (
                <option key={cv.id} value={cv.id} className="text-gray-900">
                  {cv.originalName} ({new Date(cv.uploadedAt).toLocaleDateString('id-ID')})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'upload' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Upload CV Anda
                </h2>
                <p className="text-gray-600">
                  Upload CV untuk analisis otomatis dan pencarian kerja yang dipersonalisasi
                </p>
              </div>

              {isDemoMode ? (
                <div className="text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">Mode Demo - Upload CV</h3>
                    <p className="text-blue-700 mb-4">
                      Dalam mode demo, fitur upload CV tidak tersedia. Data CV demo sudah disiapkan untuk Anda.
                    </p>
                    <div className="bg-white border rounded-lg p-4 text-left">
                      <h4 className="font-medium text-gray-900 mb-2">CV Demo yang Tersedia:</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• <strong>Nama:</strong> Demo User</p>
                        <p>• <strong>Posisi:</strong> Frontend/Full Stack Developer</p>
                        <p>• <strong>Keahlian:</strong> JavaScript, React, Node.js, Python</p>
                        <p>• <strong>Pengalaman:</strong> Junior Level (2-3 tahun)</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <CVUpload
                  userId={userId}
                  onUploadSuccess={handleCVUploadSuccess}
                />
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Pencarian Kerja Otomatis
                </h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                  Cari lowongan kerja di berbagai platform secara otomatis berdasarkan CV Anda
                </p>
              </div>

              {selectedCV ? (
                isDemoMode ? (
                  <DemoJobSearch cvAnalysis={selectedCV.analysis} />
                ) : (
                  <JobSearch
                    userId={userId}
                    cvAnalysis={selectedCV.analysis}
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum Ada CV
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Upload CV terlebih dahulu untuk memulai pencarian kerja
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Upload CV
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  LinkedIn Job Scraper
                </h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
                  Scraping otomatis lowongan kerja dari LinkedIn dengan data lengkap dan export ke Google Sheets
                </p>
              </div>

              {selectedCV ? (
                isDemoMode ? (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold mb-4">Demo - LinkedIn Scraper</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        <strong>Mode Demo:</strong> LinkedIn scraping memerlukan konfigurasi Browser Use API dan Google Sheets.
                        Setup database untuk mengaktifkan fitur ini.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-3">Fitur LinkedIn Scraper</h4>
                        <ul className="text-sm space-y-1 text-green-800">
                          <li>• Scraping otomatis dari LinkedIn Jobs</li>
                          <li>• Data lengkap: logo, gaji, status aplikasi</li>
                          <li>• Anti-blocking system</li>
                          <li>• Export ke Google Sheets</li>
                          <li>• Real-time progress monitoring</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <h4 className="font-medium text-purple-900 mb-3">Data yang Dikumpulkan</h4>
                        <ul className="text-sm space-y-1 text-purple-800">
                          <li>• Job title & company name</li>
                          <li>• Location & salary range</li>
                          <li>• Posted time & application status</li>
                          <li>• Easy Apply status</li>
                          <li>• Match score berdasarkan CV</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <LinkedInScrapingInterface
                    userId={userId}
                    cvAnalysis={selectedCV.analysis}
                  />
                )
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum Ada CV
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Upload CV terlebih dahulu untuk memulai LinkedIn scraping
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Upload CV
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'research' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Riset Pasar Kerja
                </h2>
                <p className="text-gray-600">
                  Analisis mendalam tentang tren pasar kerja dan benchmark gaji
                </p>
              </div>

              {isDemoMode ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Demo - Riset Pasar Frontend Developer</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-3">Benchmark Gaji</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Fresh Graduate:</span>
                          <span className="font-medium">Rp 6-10 juta</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Junior (1-3 tahun):</span>
                          <span className="font-medium">Rp 8-15 juta</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Senior (3+ tahun):</span>
                          <span className="font-medium">Rp 15-25 juta</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-3">Skills Demand</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>React.js:</span>
                          <span className="text-green-600 font-medium">High</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TypeScript:</span>
                          <span className="text-green-600 font-medium">High</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next.js:</span>
                          <span className="text-yellow-600 font-medium">Medium</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-3">Top Employers</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Gojek</li>
                        <li>• Tokopedia</li>
                        <li>• Shopee</li>
                        <li>• Traveloka</li>
                        <li>• Bukalapak</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-medium text-orange-900 mb-3">Career Path</h4>
                      <div className="text-sm space-y-1">
                        <div>Junior → Senior: 2-3 tahun</div>
                        <div>Senior → Lead: 3-5 tahun</div>
                        <div>Lead → Manager: 2-4 tahun</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Riset Pasar Kerja
                  </h3>
                  <p className="text-gray-500">
                    Fitur riset pasar kerja akan segera tersedia
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Riwayat Aplikasi
                </h2>
                <p className="text-gray-600">
                  Tracking status aplikasi kerja Anda
                </p>
              </div>

              {isDemoMode ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Demo - Riwayat Aplikasi</h3>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Frontend Developer - TechStart Indonesia</h4>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Applied</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Applied via JobStreet</p>
                      <p className="text-xs text-gray-400">Applied: 15 Jan 2024</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">React Developer - E-commerce Giant</h4>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">In Review</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Applied via LinkedIn</p>
                      <p className="text-xs text-gray-400">Applied: 14 Jan 2024</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Full Stack Developer - Digital Solutions</h4>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Interview</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">Applied via Glints</p>
                      <p className="text-xs text-gray-400">Applied: 13 Jan 2024</p>
                    </div>
                  </div>
                </div>
              ) : (
                <ApplicationManager
                  userId={userId}
                  userCVs={userCVs}
                />
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Export Data
                </h2>
                <p className="text-gray-600">
                  Export data ke Excel atau Google Sheets
                </p>
              </div>

              {isDemoMode ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Demo - Export Options</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Export Job Results</h4>
                      <p className="text-sm text-gray-500">Download hasil pencarian kerja ke Excel</p>
                    </button>

                    <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Export Applications</h4>
                      <p className="text-sm text-gray-500">Download riwayat aplikasi ke Excel</p>
                    </button>

                    <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Export Market Research</h4>
                      <p className="text-sm text-gray-500">Download riset pasar ke Excel</p>
                    </button>

                    <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium text-gray-900 mb-1">Export CV Analysis</h4>
                      <p className="text-sm text-gray-500">Download analisis CV ke Excel</p>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Mode Demo:</strong> Export fitur tidak tersedia. Setup database untuk mengaktifkan export data.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Export Data
                  </h3>
                  <p className="text-gray-500">
                    Fitur export ke Excel/Google Sheets akan segera tersedia
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Debug Component - Only show in non-demo mode */}
      {!isDemoMode && (
        <JobSearchDebug userId={userId} />
      )}
    </div>
  )
}
