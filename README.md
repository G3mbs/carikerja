# CariKerja - Automation Pencarian Kerja dengan AI

Sistem automation pencarian kerja yang menggunakan AI untuk analisis CV dan Browser Use API untuk pencarian kerja otomatis di berbagai platform job portal Indonesia.

## 🌐 Live Demo
**Recommended Deployment**: Deploy to [Vercel](https://vercel.com) for full functionality

[![Build and Test](https://github.com/G3mbs/carikerja/actions/workflows/deploy.yml/badge.svg)](https://github.com/G3mbs/carikerja/actions/workflows/deploy.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/G3mbs/carikerja.git)

## 🚀 Fitur Utama

### ✅ CV Upload & Analysis
- **Multi-format Support**: PDF, DOC, DOCX, TXT
- **AI-powered Analysis**: Ekstraksi data terstruktur dengan Mistral AI
- **Versioning**: Multiple CV per user dengan versioning
- **Secure Storage**: File storage dengan Supabase

### ✅ Browser Automation
- **Browser Use Cloud API**: Engine automation utama
- **Multi-platform Support**:
  - LinkedIn Jobs
  - JobStreet Indonesia
  - Glints
  - Kalibrr
  - Indeed Indonesia
- **Real-time Monitoring**: Live preview tasks
- **Auto-apply**: Aplikasi otomatis (coming soon)

### ✅ Intelligent Job Search
- **Smart Keywords**: AI-generated search terms
- **Location-based**: Regional job search
- **Salary Filtering**: Custom salary ranges
- **Experience Matching**: Fresh graduate to senior level
- **Industry Targeting**: Specific industry filtering

### ✅ Market Research
- **Salary Benchmarking**: Market salary comparison
- **Skill Demand Analysis**: Market skill requirements
- **Career Path Guidance**: Career progression suggestions
- **Company Insights**: Top employers and startup ecosystem

### ✅ Data Export
- **Excel Export**: Comprehensive data export
- **Google Sheets**: Online spreadsheet integration
- **Real-time Tracking**: Job application monitoring

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: Mistral AI (mistral-large-latest)
- **Automation**: Browser Use Cloud API
- **File Processing**: PDF-parse, Mammoth
- **UI Components**: Lucide React, React Hot Toast

## 📋 Prerequisites

1. **Node.js** 18+ dan npm
2. **Supabase Account** untuk database dan storage
3. **Mistral AI API Key**
4. **Browser Use Cloud API Key**

## 🚀 Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd carikerja
npm install
```

### 2. Environment Setup
Buat file `.env.local` dan isi dengan konfigurasi berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://eowwtefepmnxtdkrbour.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvd3d0ZWZlcG14bnRka3Jib3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyOTIzNjgsImV4cCI6MjA2NDg2ODM2OH0.Kez8UWFGZBBJdfvjwBB1A2B6deOk1Ia-IXfcu_KvShk
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Mistral AI Configuration
MISTRAL_API_KEY=x6ay6gt6Y5bA6codUJzIJtOKut4RF70j
MISTRAL_MODEL=mistral-large-latest

# Browser Use Cloud API
BROWSER_USE_API_KEY=bu_xlmmLOgEAdh_EUZEd7BSDiACpKen7fTqe2NeRe56qvI
BROWSER_USE_BASE_URL=https://api.browser-use.com/api/v1

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

1. **Buat project Supabase baru** di [supabase.com](https://supabase.com)

2. **Jalankan SQL script** di Supabase SQL Editor:
   ```sql
   -- Copy dan paste isi dari database.sql
   ```

3. **Setup Storage Bucket**:
   - Buka Storage di Supabase dashboard
   - Bucket `cv-files` akan otomatis dibuat oleh script SQL

### 4. API Keys Setup

#### Mistral AI
1. Daftar di [console.mistral.ai](https://console.mistral.ai)
2. Buat API key baru
3. Copy API key ke `.env.local`

#### Browser Use Cloud
1. Daftar di [browser-use.com](https://browser-use.com)
2. Buat API key baru
3. Copy API key ke `.env.local`

### 5. Jalankan Aplikasi

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📖 Cara Penggunaan

### 1. Upload CV
1. Buka tab "Upload CV"
2. Drag & drop atau pilih file CV (PDF, DOC, DOCX, TXT)
3. Tunggu proses upload dan analisis AI
4. Review hasil analisis CV

### 2. Pencarian Kerja
1. Buka tab "Cari Kerja"
2. Review dan edit parameter pencarian
3. Pilih platform yang diinginkan
4. Klik "Mulai Pencarian Kerja"
5. Monitor progress real-time
6. Review hasil pencarian

### 3. Export Data
1. Buka tab "Export Data"
2. Pilih jenis data yang ingin diekspor
3. Download file Excel

## 🚀 Deployment

### Vercel Deployment (Recommended)
Aplikasi ini dioptimalkan untuk deployment di Vercel yang mendukung Next.js dengan API routes.

#### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/G3mbs/carikerja.git)

#### Manual Setup
1. **Create Vercel Account** di [vercel.com](https://vercel.com)
2. **Import GitHub Repository**
3. **Configure Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MISTRAL_API_KEY`
   - `MISTRAL_MODEL`
   - `BROWSER_USE_API_KEY`
   - `BROWSER_USE_BASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

4. **Deploy**: Otomatis deploy setiap push ke main branch

### Alternative Platforms
- **Netlify**: Dengan Netlify Functions
- **Railway**: Full-stack deployment
- **Render**: Static sites dan web services

Untuk panduan deployment lengkap, lihat [docs/deployment-guide.md](docs/deployment-guide.md)

## 🔧 Development

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test:all     # Run all tests
```

### Project Structure
```
carikerja/
├── src/
│   ├── app/          # Next.js app router
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   └── types/        # TypeScript types
├── database/         # Database setup scripts
├── docs/             # Documentation
├── tests/            # Test files
└── scripts/          # Deployment scripts
```
