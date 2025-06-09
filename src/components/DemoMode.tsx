'use client'

import { useState } from 'react'
import { AlertTriangle, Database, Key, ExternalLink, CheckCircle } from 'lucide-react'

interface DemoModeProps {
  onContinueDemo: () => void
}

export default function DemoMode({ onContinueDemo }: DemoModeProps) {
  const [showSetupGuide, setShowSetupGuide] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Warning Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mode Demo</h1>
              <p className="text-gray-600">Database belum dikonfigurasi</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-gray-700">
              Aplikasi CariKerja memerlukan konfigurasi database dan API keys untuk berfungsi penuh. 
              Saat ini Anda dapat melihat interface dan fitur-fitur yang tersedia.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Yang Diperlukan:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Supabase Database & Storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Mistral AI API Key</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Browser Use Cloud API Key</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setShowSetupGuide(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <span>Panduan Setup</span>
              <ExternalLink className="h-4 w-4" />
            </button>
            <button
              onClick={onContinueDemo}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Lanjut Demo
            </button>
          </div>
        </div>

        {/* Setup Guide */}
        {showSetupGuide && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Panduan Setup</h2>
              <button
                onClick={() => setShowSetupGuide(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Step 1: Supabase */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">1. Setup Supabase</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Buat project baru di <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></p>
                  <p>• Copy URL dan API keys dari Settings → API</p>
                  <p>• Jalankan script SQL dari file <code className="bg-gray-100 px-1 rounded">database.sql</code></p>
                  <p>• Setup storage bucket untuk CV files</p>
                </div>
              </div>

              {/* Step 2: Mistral AI */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">2. Setup Mistral AI</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Daftar di <a href="https://console.mistral.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.mistral.ai</a></p>
                  <p>• Buat API key baru</p>
                  <p>• Copy API key untuk analisis CV dengan AI</p>
                </div>
              </div>

              {/* Step 3: Browser Use */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">3. Setup Browser Use</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Daftar di <a href="https://browser-use.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">browser-use.com</a></p>
                  <p>• Buat API key untuk automation</p>
                  <p>• Copy API key untuk pencarian kerja otomatis</p>
                </div>
              </div>

              {/* Step 4: Environment */}
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-gray-900 mb-2">4. Environment Variables</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Buat file <code className="bg-gray-100 px-1 rounded">.env.local</code></p>
                  <p>• Isi dengan semua API keys dan URLs</p>
                  <p>• Restart aplikasi setelah konfigurasi</p>
                </div>
              </div>

              {/* Example .env.local */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Contoh .env.local:</h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

MISTRAL_API_KEY=your-mistral-api-key
MISTRAL_MODEL=mistral-large-latest

BROWSER_USE_API_KEY=your-browser-use-api-key
BROWSER_USE_BASE_URL=https://api.browser-use.com/api/v1`}
                </pre>
              </div>

              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Setelah setup, semua fitur akan aktif!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
