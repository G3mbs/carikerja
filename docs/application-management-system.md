# Sistem Manajemen Lamaran Kerja - CariKerja

## 📋 Overview

Sistem Manajemen Lamaran Kerja adalah fitur komprehensif yang terintegrasi dengan aplikasi CariKerja untuk membantu pengguna melacak, mengelola, dan menganalisis semua lamaran kerja mereka dalam satu platform terpusat.

## 🚀 Fitur Utama

### 1. Dashboard Lamaran Kerja
- **Statistik Visual**: Metrics jumlah lamaran per status dengan card design yang informatif
- **Distribusi Status**: Visualisasi distribusi lamaran berdasarkan status (Wishlist, Applied, Assessment, Interview, Offer, Rejected, Hired)
- **Aktivitas Terbaru**: Timeline aktivitas lamaran dengan quick actions
- **Metrics Penting**:
  - Total lamaran
  - Interview mendatang
  - Penawaran pending
  - Rata-rata waktu respon

### 2. Sistem CRUD Lamaran Kerja
- **Form Tambah/Edit**: Form komprehensif dengan validasi dan auto-fill dari CV
- **Auto-Fill dari CV**: Otomatis mengisi field berdasarkan analisis CV
- **Validasi Input**: Validasi komprehensif untuk semua field
- **Rich Data Support**: Support untuk berbagai jenis data (gaji, tanggal, kontak HR, dll.)

### 3. Tampilan dan Manajemen
- **Tabel View**: 
  - Sortable columns (tanggal, perusahaan, posisi, status)
  - Filter berdasarkan status, tanggal range, perusahaan
  - Search functionality
  - Pagination untuk performa optimal
- **Kanban Board View**: (Coming Soon)
  - Drag & drop functionality
  - Visual status management

### 4. Tracking dan Aktivitas
- **Activity Log**: Pencatatan semua perubahan dan aktivitas
- **Status Tracking**: Pelacakan perubahan status dengan timestamp
- **Document Management**: Manajemen dokumen terkait lamaran

## 🗄️ Database Schema

### Tabel `job_applications`
```sql
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    cv_id UUID REFERENCES cvs(id),
    
    -- Basic job information
    company_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    job_url TEXT,
    application_date DATE DEFAULT CURRENT_DATE,
    
    -- Application status management
    status VARCHAR(50) DEFAULT 'wishlist' CHECK (status IN (
        'wishlist', 'applied', 'assessment', 'interview', 
        'offer', 'rejected', 'hired', 'withdrawn'
    )),
    
    -- Additional details
    location VARCHAR(255),
    salary_offered DECIMAL(15,2),
    salary_currency VARCHAR(10) DEFAULT 'IDR',
    employment_type VARCHAR(50),
    work_arrangement VARCHAR(50),
    
    -- Contact and communication
    hr_contact VARCHAR(255),
    hr_email VARCHAR(255),
    hr_phone VARCHAR(50),
    
    -- Application tracking
    application_method VARCHAR(100),
    referral_source VARCHAR(255),
    
    -- Notes and documents
    notes TEXT,
    cover_letter_used TEXT,
    documents_submitted TEXT[],
    
    -- Interview and assessment tracking
    interview_rounds INTEGER DEFAULT 0,
    next_interview_date TIMESTAMP WITH TIME ZONE,
    assessment_type VARCHAR(100),
    assessment_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Offer details
    offer_received_date DATE,
    offer_deadline DATE,
    offer_salary DECIMAL(15,2),
    offer_benefits TEXT,
    
    -- Integration fields
    task_id VARCHAR(255),
    linkedin_job_id UUID,
    cv_data JSONB,
    automation_results JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel `application_documents`
```sql
CREATE TABLE application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel `application_activities`
```sql
CREATE TABLE application_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Applications CRUD
- `GET /api/applications` - Get user's applications with filters and pagination
- `POST /api/applications` - Create new application
- `GET /api/applications/[id]` - Get specific application with details
- `PUT /api/applications/[id]` - Update application
- `DELETE /api/applications/[id]` - Delete application

### Statistics and Analytics
- `GET /api/applications/stats` - Get dashboard statistics
- `POST /api/applications/stats` - Get recent activities

### Query Parameters (GET /api/applications)
- `userId` - User ID (required)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (comma-separated)
- `companyName` - Filter by company name
- `positionTitle` - Filter by position title
- `location` - Filter by location
- `dateFrom` - Filter by application date from
- `dateTo` - Filter by application date to
- `salaryMin` - Filter by minimum salary
- `salaryMax` - Filter by maximum salary
- `sortField` - Sort field (applicationDate, companyName, positionTitle, status, salaryOffered)
- `sortDirection` - Sort direction (asc, desc)

## 🎨 Komponen UI

### 1. ApplicationManager
Komponen utama yang menggabungkan semua fitur:
- View mode selector (Dashboard, Table, Kanban)
- Integration dengan semua sub-komponen
- State management untuk form dan data

### 2. ApplicationDashboard
Dashboard dengan statistik dan metrics:
- Stats cards dengan icons
- Status distribution chart
- Recent activities timeline
- Quick action buttons

### 3. ApplicationForm
Form untuk tambah/edit lamaran:
- Auto-fill dari CV analysis
- Comprehensive validation
- Modal design dengan responsive layout
- Support untuk semua field types

### 4. ApplicationTable
Tabel view dengan fitur lengkap:
- Sortable columns
- Advanced filtering
- Search functionality
- Pagination
- Bulk actions

## 🔗 Integrasi dengan Fitur Existing

### 1. CV Analysis Integration
- Auto-populate form fields dari hasil analisis CV
- Suggest matching positions dari database analisis
- Salary estimation berdasarkan analisis CV

### 2. LinkedIn Scraping Integration
- Quick add lamaran dari hasil scraping LinkedIn
- Import job details otomatis
- Link ke linkedin_jobs table

### 3. Document Management
- Integration dengan Supabase Storage
- Versioning system untuk dokumen
- Link dokumen ke lamaran spesifik

## 📊 Status Lamaran

| Status | Deskripsi | Color |
|--------|-----------|-------|
| wishlist | Lamaran yang ingin dilamar | Gray |
| applied | Sudah melamar | Blue |
| assessment | Tahap assessment/test | Yellow |
| interview | Tahap interview | Purple |
| offer | Mendapat penawaran | Green |
| rejected | Ditolak | Red |
| hired | Diterima bekerja | Emerald |
| withdrawn | Dibatalkan sendiri | Gray |

## 🚀 Cara Penggunaan

### 1. Akses Fitur
- Login ke aplikasi CariKerja
- Klik tab "Aplikasi" di navigasi utama
- Pilih view mode (Dashboard/Table/Kanban)

### 2. Tambah Lamaran Baru
- Klik tombol "Tambah Lamaran"
- Isi form dengan data lamaran
- Pilih CV yang digunakan (opsional)
- Klik "Auto-Fill" untuk mengisi otomatis dari CV
- Simpan lamaran

### 3. Kelola Lamaran
- Edit lamaran dengan klik icon edit
- Update status sesuai progress
- Tambah notes dan dokumen
- Track interview dan offer

### 4. Monitor Progress
- Lihat dashboard untuk overview
- Filter dan search di table view
- Export data untuk analisis external

## 🔧 Setup dan Konfigurasi

### 1. Database Setup
```bash
# Jalankan database setup
node database/setup-database.js
```

### 2. Environment Variables
Pastikan environment variables sudah dikonfigurasi:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Storage Bucket
Bucket `application-documents` akan otomatis dibuat untuk menyimpan dokumen lamaran.

## 📈 Roadmap

### Phase 1 (Completed)
- ✅ Database schema dan API endpoints
- ✅ Dashboard dengan statistik
- ✅ Form tambah/edit lamaran
- ✅ Table view dengan filter dan search
- ✅ Integration dengan CV analysis

### Phase 2 (Coming Soon)
- 🔄 Kanban board view dengan drag & drop
- 🔄 Document management system
- 🔄 Advanced analytics dan reporting
- 🔄 Export functionality (Excel/CSV)
- 🔄 Real-time notifications

### Phase 3 (Future)
- 📅 Calendar integration untuk interview
- 📅 Email templates untuk follow-up
- 📅 Mobile app support
- 📅 AI-powered insights dan recommendations
