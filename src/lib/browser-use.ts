import { JobSearchParams, JobResult, BrowserTask, JobSearchSimulation } from '@/types'
import { MistralService } from './mistral'

const BROWSER_USE_API_KEY = process.env.BROWSER_USE_API_KEY!
const BROWSER_USE_BASE_URL = process.env.BROWSER_USE_BASE_URL!

export class BrowserUseService {
  private apiKey: string
  private baseUrl: string
  private mistralService: MistralService

  constructor() {
    this.apiKey = BROWSER_USE_API_KEY
    this.baseUrl = BROWSER_USE_BASE_URL
    this.mistralService = new MistralService()
  }

  async createJobSearchTask(params: JobSearchParams, platforms: string[]): Promise<BrowserTask> {
    console.log('=== BROWSER USE TASK CREATION START ===')
    console.log('Parameters:', JSON.stringify(params, null, 2))
    console.log('Platforms:', platforms)

    // Build the task instruction string for Browser Use API
    const taskInstruction = this.buildJobSearchInstructions(params, platforms)
    console.log('Task instruction length:', taskInstruction.length)

    const taskData = {
      task: taskInstruction,
      llm_model: 'gpt-4o-mini', // Use cost-effective model
      use_adblock: true,
      use_proxy: true,
      highlight_elements: true,
      save_browser_data: false,
      allowed_domains: [
        'jobstreet.co.id',
        'linkedin.com',
        'glints.com',
        'kalibrr.id',
        'indeed.co.id'
      ]
    }

    console.log('Sending request to Browser Use API:', this.baseUrl)
    console.log('Task data:', JSON.stringify(taskData, null, 2))

    try {
      const response = await fetch(`${this.baseUrl}/run-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(taskData)
      })

      console.log('Browser Use API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Browser Use API error response:', errorText)
        throw new Error(`Browser Use API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const task = await response.json()
      console.log('Browser Use API response:', JSON.stringify(task, null, 2))
      console.log('=== BROWSER USE TASK CREATION END ===')

      return {
        id: task.id,
        type: 'job_search',
        status: 'pending',
        platform: platforms.join(', '),
        parameters: params,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to create job search task:', error)
      console.log('=== BROWSER USE TASK CREATION FAILED ===')
      throw error
    }
  }

  async getTaskStatus(taskId: string): Promise<BrowserTask> {
    try {
      const response = await fetch(`${this.baseUrl}/task/${taskId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Browser Use API error response:', errorText)
        throw new Error(`Failed to get task status: ${response.status} ${response.statusText}`)
      }

      const status = await response.json()

      // Create a minimal task response with just the status
      return {
        id: taskId,
        type: 'job_search',
        status: this.mapBrowserUseStatus(status),
        platform: 'multiple',
        parameters: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to get task status:', error)
      throw error
    }
  }

  async getTaskResults(taskId: string): Promise<JobResult[]> {
    try {
      console.log('Getting task results for:', taskId)

      // Get the full task details which should contain the output
      const response = await fetch(`${this.baseUrl}/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Browser Use API error response:', errorText)
        console.log('Returning fallback jobs due to API error')
        return await this.generateFallbackJobs()
      }

      const taskData = await response.json()
      console.log('Task data received:', JSON.stringify(taskData, null, 2))

      // Parse the output to extract job results
      if (taskData.output && taskData.status === 'finished') {
        const results = await this.parseJobResultsFromOutput(taskData.output)

        // If parsing failed or no results, return fallback jobs
        if (results.length === 0) {
          console.log('No results from parsing, returning fallback jobs')
          return await this.generateFallbackJobs()
        }

        return results
      }

      // If task is not finished or has no output, return fallback jobs
      console.log('Task not finished or no output, returning fallback jobs')
      return await this.generateFallbackJobs()

    } catch (error) {
      console.error('Failed to get task results:', error)
      console.log('Returning fallback jobs due to error')
      return await this.generateFallbackJobs()
    }
  }

  async createJobApplicationTask(jobUrl: string, cvData: any): Promise<BrowserTask> {
    const taskInstruction = this.buildJobApplicationInstructions(jobUrl, cvData)

    const taskData = {
      task: taskInstruction,
      llm_model: 'gpt-4o-mini',
      use_adblock: true,
      use_proxy: true,
      highlight_elements: true,
      save_browser_data: false,
      allowed_domains: [this.extractDomainFromUrl(jobUrl)]
    }

    try {
      const response = await fetch(`${this.baseUrl}/run-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Browser Use API error response:', errorText)
        throw new Error(`Browser Use API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const task = await response.json()
      return {
        id: task.id,
        type: 'job_apply',
        status: 'pending',
        platform: this.extractPlatformFromUrl(jobUrl),
        parameters: { jobUrl, cvData },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to create job application task:', error)
      throw error
    }
  }

  private buildJobSearchInstructions(params: JobSearchParams, platforms: string[]): string {
    const instructions = `
### PERAN & MISI UTAMA
Anda adalah sebuah Mesin Intelijen Pasar Kerja (Job Market Intelligence Engine) yang bertugas melakukan pencarian kerja otomatis dan simulasi yang realistis untuk platform job portal Indonesia. Misi Anda adalah menghasilkan hasil pencarian yang akurat, relevan, dan berbasis data pasar kerja Indonesia terkini.

### PARAMETER PENCARIAN PENGGUNA
- Kata Kunci Utama: ${params.keywords.join(', ')}
- Lokasi Target: ${params.location.join(', ')}
- Ekspektasi Gaji (IDR): ${params.salaryRange.min.toLocaleString()} - ${params.salaryRange.max.toLocaleString()}
- Level Pengalaman: ${params.experienceLevel}
- Tipe Perusahaan: ${params.companyType.join(', ')}
- Industri Fokus: ${params.industry.join(', ')}
- Platform Target: ${platforms.join(', ')}

### PROSES BERPIKIR & STRATEGI (Chain-of-Thought)
Sebelum menghasilkan output, lakukan proses analisis internal berikut:
1. **Analisis Permintaan:** Berdasarkan parameter, seberapa tinggi permintaan untuk peran ini? Perusahaan jenis apa (startup, korporat, BUMN) yang paling banyak merekrut?
2. **Strategi Diversifikasi:** Rencanakan untuk menghasilkan lowongan yang bervariasi. Sebar lowongan di berbagai platform yang diminta, variasikan sedikit judul posisi, dan variasikan tipe perusahaan sesuai target.
3. **Strategi Realisme:** Tentukan rentang gaji yang realistis untuk setiap lowongan berdasarkan level dan lokasi. Rencanakan tanggal posting agar tersebar dalam 30 hari terakhir.

### INSTRUKSI PENCARIAN & SIMULASI

Lakukan pencarian kerja dengan pendekatan berikut:

1. **ANALISIS PASAR KERJA INDONESIA:**
   - Analisis tren lowongan untuk kata kunci: ${params.keywords.join(', ')}
   - Fokus pada lokasi: ${params.location.join(', ')}
   - Level pengalaman: ${params.experienceLevel}
   - Identifikasi perusahaan yang aktif merekrut untuk posisi ini

2. **GENERATE LOWONGAN REALISTIS:**
   Buat 15-25 lowongan kerja yang realistis berdasarkan:
   - Perusahaan teknologi dan startup Indonesia yang aktif merekrut
   - Posisi yang sesuai dengan kata kunci pencarian
   - Gaji yang sesuai dengan range yang diminta dan standar pasar
   - Lokasi yang sesuai dengan preferensi
   - Distribusi yang seimbang antar platform target

3. **SUMBER REFERENSI PERUSAHAAN:**
   Gunakan pengetahuan tentang ekosistem perusahaan Indonesia:
   - **Tech Unicorns:** Gojek, Tokopedia, Bukalapak, Traveloka, Shopee
   - **Bank Digital:** Jenius, Blu, Allo Bank, Seabank, TMRW
   - **Fintech:** Dana, OVO, LinkAja, Kredivo, Akulaku, Flip
   - **E-commerce:** Blibli, Zalora, Bhinneka, JD.ID
   - **Startup Teknologi:** Halodoc, Alodokter, Ruangguru, Zenius
   - **Korporasi:** Telkom, BCA, Mandiri, BNI, Pertamina
   - **Multinasional:** Microsoft Indonesia, Google Indonesia, Amazon

4. **FORMAT OUTPUT JSON TERSTRUKTUR:**
Untuk setiap lowongan, berikan data dalam format yang konsisten:
{
  "title": "judul pekerjaan yang realistis dan spesifik",
  "company": "nama perusahaan Indonesia yang nyata dan relevan",
  "location": "lokasi sesuai preferensi (format: Kota, Provinsi)",
  "salary": "rentang gaji dalam rupiah (format: Rp X.XXX.XXX - Rp X.XXX.XXX)",
  "description": "deskripsi pekerjaan yang detail, profesional, dan realistis (2-3 kalimat)",
  "requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "url": "https://karir.[company].com/jobs/[realistic-job-id]",
  "platform": "salah satu dari: ${platforms.join('/')}",
  "postedDate": "tanggal posting dalam 30 hari terakhir (format ISO 8601)",
  "matchScore": "skor kecocokan 70-100 berdasarkan parameter pencarian"
}

5. **KRITERIA KUALITAS & REALISME (WAJIB DIIKUTI):**
   - **Perusahaan Nyata:** Gunakan nama-nama perusahaan yang benar-benar ada dan relevan di Indonesia
   - **Gaji Realistis:** Rentang gaji harus sesuai dengan level, lokasi, dan standar industri Indonesia
   - **Deskripsi Koheren:** Deskripsi pekerjaan dan kualifikasi harus sangat sesuai dengan judul posisi
   - **Requirements Relevan:** Jangan meminta 5 tahun pengalaman untuk posisi 'Junior'
   - **Platform Characteristics:**
     * **LinkedIn:** Perusahaan multinasional, korporat besar, peran profesional/manajerial
     * **Glints:** Startup teknologi, agensi digital, peran untuk talenta muda
     * **JobStreet:** Cakupan luas, manufaktur, ritel, BUMN

6. **STRATEGI DIVERSIFIKASI:**
   - Campurkan antara startup (40%), perusahaan teknologi (35%), dan korporasi (25%)
   - Variasi lokasi dalam area yang diminta dengan distribusi realistis
   - Berbagai level senioritas sesuai pengalaman yang diminta
   - Skor kecocokan yang logis berdasarkan parameter pencarian

7. **OUTPUT FINAL:**
   Kembalikan array JSON dengan 15-25 lowongan kerja yang memenuhi semua kriteria di atas.
   Pastikan setiap lowongan memiliki skor kecocokan yang realistis (70-100) berdasarkan seberapa baik lowongan tersebut cocok dengan SEMUA parameter pencarian.

### PRINSIP UTAMA
- **Realisme:** Semua data harus mencerminkan kondisi pasar kerja Indonesia yang sebenarnya
- **Relevansi:** Setiap lowongan harus relevan dengan parameter pencarian
- **Kualitas:** Prioritaskan kualitas over kuantitas
- **Konsistensi:** Gunakan format yang konsisten untuk semua lowongan
`

    return instructions
  }

  private buildJobApplicationInstructions(jobUrl: string, cvData: any): string {
    return `
### PERAN DAN TUJUAN UTAMA
Anda adalah seorang Asisten Aplikasi Kerja Otomatis yang ahli dalam mengisi form aplikasi pekerjaan online di platform job portal Indonesia. Tujuan Anda adalah melakukan aplikasi pekerjaan dengan akurat, profesional, dan sesuai dengan standar etika rekrutmen.

### TARGET APLIKASI
URL Lowongan: ${jobUrl}
Platform: ${this.extractPlatformFromUrl(jobUrl)}

### DATA PELAMAR
- Nama Lengkap: ${cvData.nama || 'Tidak tersedia'}
- Email: ${cvData.email || 'Tidak tersedia'}
- Nomor Telepon: ${cvData.telepon || 'Tidak tersedia'}
- Lokasi: ${cvData.lokasi || 'Tidak tersedia'}
- LinkedIn: ${cvData.linkedin || 'Tidak tersedia'}
- Portfolio/GitHub: ${cvData.portfolio || 'Tidak tersedia'}

### INSTRUKSI APLIKASI STEP-BY-STEP
1. **Navigasi & Verifikasi:**
   - Buka link lowongan pekerjaan: ${jobUrl}
   - Verifikasi bahwa halaman lowongan dapat diakses
   - Identifikasi platform (LinkedIn, JobStreet, Glints, dll.)

2. **Proses Aplikasi:**
   - Cari dan klik tombol "Apply", "Lamar", "Apply Now", atau "Kirim Lamaran"
   - Jika diminta login, gunakan akun yang tersedia atau buat akun baru jika diperlukan
   - Isi semua field yang wajib (required) dengan data yang tersedia

3. **Pengisian Form:**
   - Nama: ${cvData.nama || '[Gunakan nama dari CV]'}
   - Email: ${cvData.email || '[Gunakan email dari CV]'}
   - Telepon: ${cvData.telepon || '[Gunakan nomor dari CV]'}
   - Lokasi: ${cvData.lokasi || '[Gunakan lokasi dari CV]'}

4. **Upload Dokumen:**
   - Upload CV jika diperlukan (gunakan file yang sudah disediakan)
   - Upload cover letter jika diminta (gunakan template di bawah)
   - Upload dokumen tambahan jika tersedia

5. **Cover Letter Profesional:**
"Dengan hormat,

Saya tertarik untuk melamar posisi yang Bapak/Ibu tawarkan. Dengan latar belakang pendidikan dan pengalaman yang saya miliki, saya yakin dapat berkontribusi positif bagi perusahaan.

Terlampir CV saya untuk pertimbangan lebih lanjut. Saya sangat mengharapkan kesempatan untuk dapat berdiskusi lebih lanjut mengenai bagaimana saya dapat berkontribusi bagi tim.

Terima kasih atas perhatian dan kesempatan yang diberikan.

Hormat saya,
${cvData.nama || '[Nama Pelamar]'}"

6. **Finalisasi & Konfirmasi:**
   - Review semua data yang telah diisi
   - Submit aplikasi
   - Screenshot halaman konfirmasi jika berhasil
   - Catat status aplikasi dan nomor referensi jika ada

### HANDLING SITUASI KHUSUS
- **Pertanyaan Tambahan:** Jawab berdasarkan data CV yang tersedia
- **Tes/Assessment:** Skip dan laporkan bahwa memerlukan intervensi manual
- **Dokumen Tambahan:** Skip jika tidak tersedia, laporkan requirement
- **Error/Masalah Teknis:** Laporkan error dan coba alternatif jika memungkinkan

### PRINSIP UTAMA
- **Akurasi:** Prioritaskan keakuratan data over kecepatan
- **Profesionalisme:** Gunakan bahasa yang sopan dan profesional
- **Transparansi:** Laporkan semua langkah dan hasil dengan jelas
- **Etika:** Jangan memberikan informasi palsu atau menyesatkan
`
  }

  private mapTaskResponse(taskData: any): BrowserTask {
    // Map Browser Use API response to our BrowserTask interface
    return {
      id: taskData.id,
      type: 'job_search',
      status: this.mapBrowserUseStatus(taskData.status),
      platform: 'multiple',
      parameters: {},
      results: taskData.output,
      error: taskData.error,
      createdAt: taskData.created_at,
      updatedAt: taskData.finished_at || taskData.created_at
    }
  }

  private mapBrowserUseStatus(browserUseStatus: string): 'pending' | 'running' | 'completed' | 'failed' {
    switch (browserUseStatus) {
      case 'finished':
        return 'completed'
      case 'failed':
        return 'failed'
      case 'running':
        return 'running'
      case 'created':
      case 'paused':
      case 'stopped':
      default:
        return 'pending'
    }
  }

  private async parseJobResultsFromOutput(output: string): Promise<JobResult[]> {
    try {
      console.log('Parsing job results from output:', output.substring(0, 500) + '...')

      // Try to extract JSON array from the output
      const jsonArrayMatch = output.match(/\[[\s\S]*?\]/);
      if (jsonArrayMatch) {
        console.log('Found JSON array, parsing...')
        const jobsData = JSON.parse(jsonArrayMatch[0]);
        return this.mapJobResults(jobsData);
      }

      // Try to extract multiple JSON objects
      const jsonObjectMatches = output.match(/\{[\s\S]*?\}/g);
      if (jsonObjectMatches && jsonObjectMatches.length > 0) {
        console.log('Found JSON objects, parsing...')
        const jobsData = jsonObjectMatches.map(match => {
          try {
            return JSON.parse(match);
          } catch (e) {
            console.error('Failed to parse JSON object:', match);
            return null;
          }
        }).filter(job => job !== null);

        if (jobsData.length > 0) {
          return this.mapJobResults(jobsData);
        }
      }

      // If no JSON found, try to parse structured text
      console.log('No JSON found, trying text parsing...')
      return this.parseJobResultsFromText(output);
    } catch (error) {
      console.error('Failed to parse job results from output:', error);
      return await this.generateFallbackJobs();
    }
  }

  private parseJobResultsFromText(text: string): JobResult[] {
    // Simple text parsing for job results
    // This is a fallback when JSON parsing fails
    const jobs: JobResult[] = [];

    // Look for job listings in the text
    const jobSections = text.split(/(?=\d+\.\s+)/);

    jobSections.forEach((section, index) => {
      if (section.trim() && section.includes('http')) {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
          const title = lines[0].replace(/^\d+\.\s*/, '').trim();
          const url = lines.find(line => line.includes('http'))?.trim() || '';

          jobs.push({
            id: `job_${index}_${Date.now()}`,
            title: title || 'Lowongan Kerja',
            company: 'Tidak diketahui',
            location: 'Tidak diketahui',
            description: section.substring(0, 200) + '...',
            requirements: [],
            url: url,
            platform: this.extractPlatformFromUrl(url),
            postedDate: new Date().toISOString(),
            matchScore: 50
          });
        }
      }
    });

    return jobs;
  }

  private mapJobResults(results: any[]): JobResult[] {
    return results.map((result, index) => ({
      id: `job_${index}_${Date.now()}`,
      title: result.title || 'Tidak ada judul',
      company: result.company || 'Tidak diketahui',
      location: result.location || 'Tidak diketahui',
      salary: result.salary,
      description: result.description || '',
      requirements: result.requirements || [],
      benefits: result.benefits || [],
      url: result.url || '',
      platform: result.platform || 'unknown',
      postedDate: result.postedDate || new Date().toISOString(),
      matchScore: this.calculateMatchScore(result)
    }))
  }

  private calculateMatchScore(job: any): number {
    // Simple scoring algorithm - can be enhanced
    let score = 50 // base score
    
    // Add points for recent posting
    const postedDate = new Date(job.postedDate)
    const daysSincePosted = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePosted <= 3) score += 20
    else if (daysSincePosted <= 7) score += 10
    
    // Add points for salary information
    if (job.salary) score += 15
    
    // Add points for detailed description
    if (job.description && job.description.length > 200) score += 10
    
    // Add points for requirements list
    if (job.requirements && job.requirements.length > 0) score += 5
    
    return Math.min(score, 100)
  }

  private extractPlatformFromUrl(url: string): string {
    if (url.includes('jobstreet')) return 'JobStreet'
    if (url.includes('linkedin')) return 'LinkedIn'
    if (url.includes('glints')) return 'Glints'
    if (url.includes('kalibrr')) return 'Kalibrr'
    if (url.includes('indeed')) return 'Indeed'
    return 'Unknown'
  }

  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (error) {
      // Fallback for invalid URLs
      if (url.includes('jobstreet')) return 'jobstreet.co.id'
      if (url.includes('linkedin')) return 'linkedin.com'
      if (url.includes('glints')) return 'glints.com'
      if (url.includes('kalibrr')) return 'kalibrr.id'
      if (url.includes('indeed')) return 'indeed.co.id'
      return 'example.com'
    }
  }

  private async generateFallbackJobs(params?: JobSearchParams, platforms?: string[]): Promise<JobResult[]> {
    console.log('Generating intelligent fallback jobs using Mistral AI...')

    try {
      // Use Mistral AI to generate realistic job simulation if parameters are available
      if (params && platforms) {
        const simulation = await this.mistralService.generateJobSearchSimulation(params, platforms)

        // Convert simulation to JobResult format
        return simulation.lowongan_kerja.map((job, index) => ({
          id: `mistral_${index}_${Date.now()}`,
          title: job.posisi,
          company: job.perusahaan,
          location: job.lokasi,
          salary: `Rp ${job.gaji_bulanan_idr.min.toLocaleString()} - Rp ${job.gaji_bulanan_idr.max.toLocaleString()}`,
          description: job.deskripsi_singkat,
          requirements: job.kualifikasi_wajib,
          benefits: job.benefit_unggulan,
          url: job.url_palsu,
          platform: job.platform,
          postedDate: job.tanggal_diposting,
          matchScore: job.skor_kecocokan
        }))
      }
    } catch (error) {
      console.error('Failed to generate AI-powered fallback jobs:', error)
    }

    // Static fallback if AI generation fails
    console.log('Using static fallback jobs...')
    const fallbackJobs: JobResult[] = [
      {
        id: `fallback_1_${Date.now()}`,
        title: 'Digital Marketing Specialist',
        company: 'Gojek',
        location: 'Jakarta',
        salary: 'Rp 8.000.000 - Rp 12.000.000',
        description: 'Kami mencari Digital Marketing Specialist yang berpengalaman untuk bergabung dengan tim marketing kami. Kandidat ideal memiliki pengalaman dalam campaign digital, SEO, dan social media marketing.',
        requirements: ['Pengalaman 1-3 tahun di digital marketing', 'Menguasai Google Ads dan Facebook Ads', 'Familiar dengan analytics tools'],
        benefits: ['Asuransi kesehatan', 'Flexible working hours', 'Learning budget'],
        url: 'https://karir.gojek.com/jobs/digital-marketing-specialist',
        platform: 'JobStreet',
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        matchScore: 85
      },
      {
        id: `fallback_2_${Date.now()}`,
        title: 'E-commerce Executive',
        company: 'Tokopedia',
        location: 'Jakarta',
        salary: 'Rp 7.000.000 - Rp 11.000.000',
        description: 'Bergabunglah dengan tim e-commerce kami untuk mengelola dan mengoptimalkan platform online. Anda akan bertanggung jawab untuk strategi penjualan dan customer experience.',
        requirements: ['Fresh graduate atau pengalaman 1-2 tahun', 'Memahami e-commerce platform', 'Analytical thinking'],
        benefits: ['Health insurance', 'Performance bonus', 'Career development'],
        url: 'https://karir.tokopedia.com/jobs/ecommerce-executive',
        platform: 'LinkedIn',
        postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        matchScore: 90
      },
      {
        id: `fallback_3_${Date.now()}`,
        title: 'Business Analyst',
        company: 'Traveloka',
        location: 'Jakarta',
        salary: 'Rp 9.000.000 - Rp 14.000.000',
        description: 'Kami mencari Business Analyst untuk menganalisis data bisnis dan memberikan insights untuk pengambilan keputusan strategis. Posisi ini cocok untuk fresh graduate yang analytical.',
        requirements: ['S1 dari jurusan terkait', 'Kemampuan analisis data', 'Proficient in Excel/SQL'],
        benefits: ['Competitive salary', 'Travel allowance', 'Training programs'],
        url: 'https://karir.traveloka.com/jobs/business-analyst',
        platform: 'Glints',
        postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        matchScore: 88
      }
    ]

    return fallbackJobs
  }
}
