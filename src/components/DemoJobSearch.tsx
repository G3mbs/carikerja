'use client'

import { useState } from 'react'
import { Search, MapPin, DollarSign, Building, Loader2, Play, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

interface DemoJobSearchProps {
  cvAnalysis?: any
}

export default function DemoJobSearch({ cvAnalysis }: DemoJobSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchStatus, setSearchStatus] = useState('')

  const demoJobs = [
    {
      id: 'demo-1',
      title: 'Frontend Developer',
      company: 'TechStart Indonesia',
      location: 'Jakarta Selatan',
      salary: 'Rp 10.000.000 - Rp 15.000.000',
      description: 'Kami mencari Frontend Developer yang berpengalaman dengan React.js untuk bergabung dengan tim development kami. Kandidat ideal memiliki pengalaman minimal 2 tahun dalam pengembangan web modern.',
      requirements: ['React.js', 'JavaScript ES6+', 'HTML/CSS', 'Git'],
      benefits: ['Asuransi kesehatan', 'Flexible working hours', 'Learning budget'],
      url: 'https://example.com/job/frontend-developer',
      platform: 'JobStreet',
      postedDate: '2024-01-15',
      matchScore: 85
    },
    {
      id: 'demo-2',
      title: 'Full Stack Developer',
      company: 'Digital Solutions Co',
      location: 'Jakarta Pusat',
      salary: 'Rp 12.000.000 - Rp 18.000.000',
      description: 'Bergabunglah dengan tim kami sebagai Full Stack Developer. Anda akan bertanggung jawab mengembangkan aplikasi web end-to-end menggunakan teknologi modern.',
      requirements: ['React.js', 'Node.js', 'MongoDB', 'Express.js'],
      benefits: ['Remote work option', 'Health insurance', 'Annual bonus'],
      url: 'https://example.com/job/fullstack-developer',
      platform: 'Glints',
      postedDate: '2024-01-14',
      matchScore: 92
    },
    {
      id: 'demo-3',
      title: 'JavaScript Developer',
      company: 'Startup Inovasi',
      location: 'Remote',
      salary: 'Rp 8.000.000 - Rp 12.000.000',
      description: 'Posisi remote untuk JavaScript Developer yang passionate dalam mengembangkan aplikasi web yang inovatif. Kesempatan untuk belajar dan berkembang bersama tim yang dinamis.',
      requirements: ['JavaScript', 'React', 'TypeScript', 'REST API'],
      benefits: ['100% Remote', 'Flexible schedule', 'Stock options'],
      url: 'https://example.com/job/javascript-developer',
      platform: 'LinkedIn',
      postedDate: '2024-01-13',
      matchScore: 78
    },
    {
      id: 'demo-4',
      title: 'React Developer',
      company: 'E-commerce Giant',
      location: 'Jakarta Barat',
      salary: 'Rp 15.000.000 - Rp 22.000.000',
      description: 'Kami mencari React Developer senior untuk mengembangkan platform e-commerce terdepan di Indonesia. Pengalaman dengan state management dan testing adalah nilai plus.',
      requirements: ['React.js', 'Redux', 'Jest', 'Webpack'],
      benefits: ['Competitive salary', 'Career development', 'Modern office'],
      url: 'https://example.com/job/react-developer',
      platform: 'Kalibrr',
      postedDate: '2024-01-12',
      matchScore: 88
    },
    {
      id: 'demo-5',
      title: 'Frontend Engineer',
      company: 'Fintech Startup',
      location: 'Jakarta Selatan',
      salary: 'Rp 11.000.000 - Rp 16.000.000',
      description: 'Bergabung dengan fintech startup yang sedang berkembang pesat. Kami membutuhkan Frontend Engineer yang dapat berkontribusi dalam membangun produk finansial yang inovatif.',
      requirements: ['React.js', 'TypeScript', 'Material-UI', 'API Integration'],
      benefits: ['Equity participation', 'Learning opportunities', 'Young team'],
      url: 'https://example.com/job/frontend-engineer',
      platform: 'Indeed',
      postedDate: '2024-01-11',
      matchScore: 82
    }
  ]

  const startDemoSearch = async () => {
    setIsSearching(true)
    setSearchStatus('Memulai pencarian kerja demo...')
    setSearchResults([])

    // Simulate search process
    const steps = [
      'Menghubungkan ke JobStreet Indonesia...',
      'Mencari lowongan Frontend Developer...',
      'Menghubungkan ke LinkedIn Jobs...',
      'Mencari lowongan React Developer...',
      'Menghubungkan ke Glints...',
      'Mencari lowongan JavaScript Developer...',
      'Menganalisis hasil pencarian...',
      'Menghitung match score...',
      'Pencarian selesai!'
    ]

    for (let i = 0; i < steps.length; i++) {
      setSearchStatus(steps[i])
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add jobs progressively
      if (i === 2) setSearchResults([demoJobs[0]])
      if (i === 4) setSearchResults([demoJobs[0], demoJobs[1]])
      if (i === 6) setSearchResults([demoJobs[0], demoJobs[1], demoJobs[2]])
      if (i === 7) setSearchResults([demoJobs[0], demoJobs[1], demoJobs[2], demoJobs[3]])
      if (i === 8) setSearchResults(demoJobs)
    }

    setIsSearching(false)
    toast.success(`Ditemukan ${demoJobs.length} lowongan kerja demo!`)
  }

  return (
    <div className="space-y-6">
      {/* Demo Search Parameters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Parameter Pencarian Demo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kata Kunci
            </label>
            <div className="flex flex-wrap gap-2">
              {cvAnalysis?.ringkasan_analisis?.potensi_kecocokan_posisi?.map((keyword: string, index: number) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lokasi
            </label>
            <p className="text-gray-600">Jakarta, Remote</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rentang Gaji
            </label>
            <p className="text-gray-600">
              Rp {cvAnalysis?.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah?.rentang_bawah?.toLocaleString('id-ID')} -
              Rp {cvAnalysis?.ringkasan_analisis?.estimasi_gaji_bulanan_rupiah?.rentang_atas?.toLocaleString('id-ID')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <p className="text-gray-600">JobStreet, LinkedIn, Glints, Kalibrr, Indeed</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={startDemoSearch}
            disabled={isSearching}
            className={`
              px-8 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto
              ${isSearching 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Mulai Pencarian Demo</span>
              </>
            )}
          </button>
          
          {searchStatus && (
            <p className="mt-2 text-sm text-gray-600">{searchStatus}</p>
          )}
        </div>
      </div>

      {/* Demo Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Hasil Pencarian Demo ({searchResults.length} lowongan)
          </h3>
          <div className="space-y-4">
            {searchResults.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-lg">{job.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      {job.matchScore}% match
                    </span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {job.platform}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-gray-600 mb-2">
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                </div>
                
                {job.salary && (
                  <div className="flex items-center space-x-1 text-green-600 font-medium mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{job.salary}</span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {job.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.requirements.map((req: string, index: number) => (
                    <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {req}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Posted: {new Date(job.postedDate).toLocaleDateString('id-ID')}
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center space-x-1">
                    <span>Lihat Detail</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
