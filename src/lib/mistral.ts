import { CVAnalysis, StructuredKeywords, MarketResearchReport, JobSearchSimulation, JobSearchParams } from '@/types'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest'

export class MistralService {
  private apiKey: string
  private model: string
  private baseUrl: string = 'https://api.mistral.ai/v1'

  constructor() {
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY environment variable is required')
    }
    this.apiKey = MISTRAL_API_KEY
    this.model = MISTRAL_MODEL
  }

  async analyzeCV(cvContent: string): Promise<CVAnalysis> {
    if (!cvContent || typeof cvContent !== 'string' || cvContent.trim().length === 0) {
      throw new Error('CV content is required and must be a non-empty string')
    }

    const prompt = this.buildCVAnalysisPrompt(cvContent)

    try {
      console.log('Sending request to Mistral AI...')

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Mistral API error response:', errorText)
        throw new Error(`Mistral API error (${response.status}): ${response.statusText}. ${errorText}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid Mistral API response structure:', data)
        throw new Error('Invalid response structure from Mistral AI')
      }

      const content = data.choices[0].message.content

      if (!content || typeof content !== 'string') {
        console.error('Empty or invalid content from Mistral AI:', content)
        throw new Error('Empty or invalid content received from AI')
      }

      // Parse JSON response - handle markdown code blocks
      try {
        // Clean the content by removing markdown code blocks if present
        let cleanContent = content.trim()

        // Remove markdown code blocks (```json ... ``` or ``` ... ```)
        if (cleanContent.startsWith('```')) {
          const lines = cleanContent.split('\n')
          // Remove first line if it starts with ```
          if (lines[0].startsWith('```')) {
            lines.shift()
          }
          // Remove last line if it starts with ```
          if (lines[lines.length - 1].startsWith('```')) {
            lines.pop()
          }
          cleanContent = lines.join('\n').trim()
        }

        console.log('Cleaned content for parsing:', cleanContent.substring(0, 200) + '...')

        const parsedAnalysis = JSON.parse(cleanContent) as CVAnalysis

        // Basic validation of the analysis structure
        if (!parsedAnalysis.informasi_pribadi || !parsedAnalysis.keahlian || !parsedAnalysis.ringkasan_analisis) {
          console.error('Analysis missing required fields:', parsedAnalysis)
          throw new Error('AI analysis is missing required fields')
        }

        console.log('CV analysis parsed successfully')
        return parsedAnalysis
      } catch (parseError) {
        console.error('Failed to parse CV analysis JSON:', parseError)
        console.error('Raw content from AI:', content)
        throw new Error(`Invalid JSON response from AI analysis: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`)
      }
    } catch (error) {
      console.error('CV Analysis error:', error)
      throw error
    }
  }

  async generateJobSearchKeywords(cvAnalysis: CVAnalysis): Promise<StructuredKeywords> {
    // Ekstrak informasi paling relevan dari analisis untuk konteks prompt yang lebih kaya
    const keyInfo = {
      posisi: cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi.join(', '),
      level: `${cvAnalysis.ringkasan_analisis.tingkat_pengalaman} (${cvAnalysis.ringkasan_analisis.justifikasi_tingkat_pengalaman})`,
      keahlianTeknis: cvAnalysis.keahlian.keahlian_teknis.join(', '),
      bahasaPemrograman: cvAnalysis.keahlian.bahasa_pemrograman.join(', '),
      tools: cvAnalysis.keahlian.tools_platform.join(', '),
      lokasi: cvAnalysis.informasi_pribadi.lokasi || 'Jakarta'
    }

    const prompt = `
### PERAN DAN TUJUAN UTAMA
Anda adalah seorang Career Strategist dan ahli SEO Rekrutmen. Tugas Anda adalah untuk menghasilkan serangkaian kata kunci pencarian kerja yang strategis dan optimal bagi seorang kandidat di pasar kerja Indonesia. Tujuannya adalah untuk memaksimalkan visibilitas di job portal seperti LinkedIn, Glints, Kalibrr, dan Jobstreet.

### KONTEKS: PROFIL KANDIDAT
Berikut adalah ringkasan profil kandidat berdasarkan analisis CV mereka:
- Target Posisi & Level: ${keyInfo.posisi} (${keyInfo.level})
- Lokasi Kandidat: ${keyInfo.lokasi}
- Bahasa Pemrograman Utama: ${keyInfo.bahasaPemrograman}
- Keahlian Teknis Lainnya: ${keyInfo.keahlianTeknis}
- Tools & Platform: ${keyInfo.tools}

### STRATEGI PEMBUATAN KATA KUNCI
Hasilkan kata kunci dengan menerapkan strategi kombinasi berikut. Jangan hanya mendaftar keahlian satu per satu.
1. **Kombinasi Inti (Posisi + Level + Keahlian Utama):** Gabungkan nama posisi, level, dan teknologi inti. Ini adalah kata kunci paling penting. (Contoh: "Senior Backend Developer Golang", "Lead Data Scientist Python")
2. **Kombinasi Spesifik (Long-tail):** Gabungkan 2-3 keahlian atau tools yang saling melengkapi untuk menemukan pekerjaan niche. (Contoh: "React Developer Next.js", "DevOps Engineer AWS Docker")
3. **Berbasis Lokasi:** Tambahkan lokasi kandidat atau kota besar di Indonesia ke kombinasi inti. (Contoh: "Frontend Developer Jakarta", "Lowongan IT Surabaya")
4. **Umum & Alternatif:** Sertakan istilah yang lebih luas atau variasi nama posisi.

### FORMAT OUTPUT & ATURAN
- Kembalikan HANYA objek JSON yang valid tanpa teks tambahan.
- Struktur JSON harus mengikuti format di bawah ini.
- Prioritaskan istilah Bahasa Inggris untuk peran teknis karena ini adalah standar di job portal Indonesia. Sertakan padanan Bahasa Indonesia jika umum digunakan.
- Hasilkan 3-5 kata kunci untuk setiap kategori.

{
  "kata_kunci_utama": [
    "string (Contoh: 'Senior Golang Developer')"
  ],
  "kombinasi_spesifik_niche": [
    "string (Contoh: 'Backend Engineer gRPC Kafka')"
  ],
  "berbasis_lokasi": [
    "string (Contoh: 'Remote Golang Developer Indonesia', 'Backend Developer Jakarta')"
  ],
  "umum_dan_alternatif": [
    "string (Contoh: 'Software Engineer (Backend)', 'Lowongan Programmer Go')"
  ]
}

`

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Clean and parse JSON response
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsedKeywords = JSON.parse(cleanContent) as StructuredKeywords

      // Validate structure
      if (!parsedKeywords.kata_kunci_utama || !Array.isArray(parsedKeywords.kata_kunci_utama)) {
        throw new Error('Invalid keywords structure')
      }

      return parsedKeywords
    } catch (error) {
      console.error('Keyword generation error:', error)

      // Return fallback structured keywords based on CV analysis
      return {
        kata_kunci_utama: cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi.slice(0, 3),
        kombinasi_spesifik_niche: [
          ...cvAnalysis.keahlian.bahasa_pemrograman.slice(0, 2).map(lang => `${lang} Developer`),
          ...cvAnalysis.keahlian.tools_platform.slice(0, 2).map(tool => `${tool} Specialist`)
        ].slice(0, 4),
        berbasis_lokasi: [
          `${cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi[0]} ${keyInfo.lokasi}`,
          `Remote ${cvAnalysis.ringkasan_analisis.potensi_kecocokan_posisi[0]} Indonesia`,
          `Lowongan IT ${keyInfo.lokasi}`
        ].slice(0, 3),
        umum_dan_alternatif: [
          'Software Engineer',
          'IT Professional',
          'Tech Specialist',
          'Programmer'
        ].slice(0, 4)
      }
    }
  }

  async conductMarketResearch(position: string, industry: string, location: string = 'Indonesia'): Promise<MarketResearchReport> {
    const prompt = `
### PERAN DAN TUJUAN UTAMA
Anda adalah seorang Principal Market & Career Analyst dengan spesialisasi pada lanskap tenaga kerja di Indonesia dan Asia Tenggara. Tugas Anda adalah melakukan riset pasar kerja yang sangat mendalam dan multifaset untuk menghasilkan sebuah laporan intelijen strategis. Laporan ini harus berbasis data, realistis, dan dapat ditindaklanjuti (actionable).

### PARAMETER RISET
- Posisi Target: ${position}
- Industri Fokus: ${industry}
- Cakupan Lokasi: ${location}

### INSTRUKSI DAN STRUKTUR OUTPUT
Lakukan analisis dari berbagai sudut pandang (permintaan pasar, profil kandidat, kompensasi, dan prospek masa depan). Sajikan seluruh temuan Anda HANYA dalam format objek JSON yang valid, tanpa teks atau penjelasan lain di luar JSON. Gunakan pengetahuan Anda hingga pembaruan terakhir mengenai data dari portal kerja (LinkedIn, Glints, Jobstreet), laporan industri, dan berita ekonomi untuk mengisi data.

### STRUKTUR JSON LAPORAN INTELIJEN PASAR (WAJIB DIIKUTI)
{
  "ringkasan_eksekutif": {
    "kesimpulan_utama": [
      "string (Poin utama 1 tentang kondisi pasar untuk posisi ini)",
      "string (Poin utama 2)",
      "string (Poin utama 3)"
    ],
    "tingkat_permintaan_saat_ini": "Sangat Tinggi | Tinggi | Sedang | Rendah | Sangat Rendah",
    "prospek_karir_5_tahun": "Sangat Menjanjikan | Menjanjikan | Stabil | Menurun",
    "rata_rata_gaji_menengah_nasional_idr": "number (Contoh: 18000000)"
  },
  "analisis_permintaan_pasar": {
    "volume_lowongan_rata_rata": "string (Estimasi kualitatif, contoh: 'Ribuan lowongan aktif secara nasional')",
    "perusahaan_perekrut_utama": ["string (Nama perusahaan 1)", "string (Nama perusahaan 2)"],
    "distribusi_geografis_utama": ["string (Contoh: 'Jabodetabek (70%)', 'Bandung (15%)', 'Surabaya (10%)')"],
    "sub_sektor_industri_paling_aktif": ["string (Contoh: 'Fintech', 'E-commerce', 'SaaS')"]
  },
  "profil_kandidat_ideal": {
    "kualifikasi_pendidikan_umum": ["string (Contoh: 'S1 Teknik Informatika', 'S1 Sistem Informasi')"],
    "keahlian_wajib_dimiliki": {
      "teknis_dan_pemrograman": ["string"],
      "tools_dan_platform": ["string"],
      "metodologi_dan_kerangka_kerja": ["string (Contoh: 'Agile', 'Scrum', 'ITIL')"],
      "soft_skills_paling_kritis": ["string (Contoh: 'Problem Solving', 'Komunikasi', 'Kolaborasi')"]
    },
    "sertifikasi_yang_sangat_dihargai": ["string (Contoh: 'AWS Certified Developer', 'Certified ScrumMaster')"]
  },
  "benchmark_kompensasi_dan_benefit": {
    "catatan_analisis_gaji": "string (Konteks singkat, misal: 'Data merefleksikan perusahaan teknologi skala menengah ke atas di kota besar')",
    "rentang_gaji_bulanan_idr": {
      "fresh_graduate_entry_level": { "min": "number", "max": "number", "rata_rata": "number" },
      "junior_1_3_tahun": { "min": "number", "max": "number", "rata_rata": "number" },
      "menengah_3_6_tahun": { "min": "number", "max": "number", "rata_rata": "number" },
      "senior_diatas_6_tahun": { "min": "number", "max": "number", "rata_rata": "number" },
      "level_lead_principal": { "min": "number", "max": "number", "rata_rata": "number" }
    },
    "variasi_gaji_antar_kota": "string (Deskripsi perbedaan, contoh: 'Gaji di Jakarta 15-25% lebih tinggi dari Bandung atau Yogyakarta.')",
    "struktur_bonus_tipikal": ["string (Contoh: 'Bonus kinerja tahunan (1-4x gaji)', 'Bonus pencapaian proyek')"],
    "tunjangan_dan_benefit_populer": ["BPJS Kesehatan & Ketenagakerjaan", "Asuransi kesehatan swasta (rawat inap & jalan)", "Tunjangan laptop/internet", "Opsi kerja remote/hybrid", "Budget pengembangan diri"]
  },
  "proyeksi_dan_jalur_karir": {
    "jalur_karir_vertikal_tipikal": ["string (Contoh: 'Senior -> Tech Lead -> Engineering Manager')"],
    "jalur_karir_lateral_alternatif": ["string (Contoh: 'Pindah ke peran Product Manager', 'Menjadi Solution Architect')"],
    "keahlian_untuk_dipelajari_2_3_tahun_kedepan": ["string (Skill yang sedang naik daun)"],
    "risiko_otomatisasi_dan_peran_ai": "string (Analisis bagaimana AI akan mengubah, bukan hanya menggantikan, peran ini)"
  },
  "wawasan_proses_rekrutmen": {
    "tahapan_interview_umum": ["Screening Awal oleh HR", "Tes Kompetensi Teknis (Live Coding/Studi Kasus)", "Interview dengan User/Calon Manajer", "Interview dengan Kepala Departemen/CTO", "Offering"],
    "topik_pertanyaan_teknis_umum": ["string"],
    "saran_untuk_kandidat": "string (Tips konkret untuk menonjol dalam proses seleksi)",
    "saran_untuk_perekrut": "string (Tips untuk menarik talenta terbaik untuk posisi ini)"
  }
}

### ATURAN PENTING
- Kembalikan HANYA objek JSON yang valid tanpa teks tambahan
- Semua nilai gaji dalam Rupiah (IDR) sebagai number
- Gunakan data realistis berdasarkan kondisi pasar Indonesia terkini
- Prioritaskan informasi yang actionable dan praktis
`

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Clean and parse JSON response
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsedReport = JSON.parse(cleanContent) as MarketResearchReport

      // Validate structure
      if (!parsedReport.ringkasan_eksekutif || !parsedReport.analisis_permintaan_pasar) {
        throw new Error('Invalid market research report structure')
      }

      return parsedReport
    } catch (error) {
      console.error('Market research error:', error)
      throw new Error(`Failed to conduct market research: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateJobSearchSimulation(params: JobSearchParams, platforms: string[]): Promise<JobSearchSimulation> {
    const instructions = this.buildJobSearchInstructions(params, platforms)

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: instructions }],
          temperature: 0.4,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      // Clean and parse JSON response
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsedSimulation = JSON.parse(cleanContent) as JobSearchSimulation

      // Validate structure
      if (!parsedSimulation.ringkasan_simulasi || !parsedSimulation.lowongan_kerja) {
        throw new Error('Invalid job search simulation structure')
      }

      return parsedSimulation
    } catch (error) {
      console.error('Job search simulation error:', error)
      throw new Error(`Failed to generate job search simulation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private buildJobSearchInstructions(params: JobSearchParams, platforms: string[]): string {
    const instructions = `
### PERAN & MISI UTAMA
Anda adalah sebuah Mesin Intelijen Pasar Kerja (Job Market Intelligence Engine). Misi Anda adalah mensimulasikan pencarian kerja berdasarkan parameter yang diberikan dan menghasilkan laporan snapshot pasar yang realistis dan kaya data. Anda tidak memiliki akses internet langsung, jadi semua output adalah sintesis dari data pelatihan Anda yang luas mengenai pasar kerja di Indonesia.

### PARAMETER PENCARIAN PENGGUNA
- Kata Kunci Utama: ${params.keywords.join(', ')}
- Lokasi Target: ${params.location.join(', ')}
- Ekspektasi Gaji (IDR): ${params.salaryRange.min.toLocaleString()} - ${params.salaryRange.max.toLocaleString()}
- Level Pengalaman: ${params.experienceLevel}
- Tipe Perusahaan: ${params.companyType.join(', ')}
- Industri Fokus: ${params.industry.join(', ')}

### PROSES BERPIKIR & STRATEGI (Chain-of-Thought)
Sebelum menghasilkan output, lakukan proses analisis internal berikut:
1.  **Analisis Permintaan:** Berdasarkan parameter, seberapa tinggi permintaan untuk peran ini? Perusahaan jenis apa (startup, korporat, BUMN) yang paling banyak merekrut?
2.  **Strategi Diversifikasi:** Rencanakan untuk menghasilkan lowongan yang bervariasi. Sebar lowongan di berbagai platform yang diminta (${platforms.join(', ')}), variasikan sedikit judul posisi (misal: 'Software Engineer', 'Backend Developer'), dan variasikan tipe perusahaan sesuai target.
3.  **Strategi Realisme:** Tentukan rentang gaji yang realistis untuk setiap lowongan berdasarkan level dan lokasi. Rencanakan tanggal posting agar tersebar dalam 45 hari terakhir.

### FORMAT OUTPUT FINAL (JSON)
Hasilkan HANYA satu objek JSON yang valid tanpa teks atau penjelasan lain. Objek ini harus memiliki struktur berikut:

{
  "ringkasan_simulasi": {
    "query_pencarian": "${params.keywords.join(', ')} di ${params.location.join(', ')}",
    "total_lowongan_disimulasikan": "number (antara 15-25)",
    "wawasan_utama": "string (Ringkasan 1-2 kalimat dari temuan Anda. Contoh: 'Permintaan untuk Senior Developer di Jakarta sangat tinggi, terutama di sektor Fintech, dengan banyak tawaran kerja remote/hybrid.')",
    "distribusi_platform": {
      "LinkedIn": "number",
      "Glints": "number",
      "Jobstreet": "number"
      // ... (sertakan platform lain yang diminta)
    }
  },
  "lowongan_kerja": [
    {
      "posisi": "string",
      "perusahaan": "string",
      "lokasi": "string (Contoh: 'Jakarta Selatan, DKI Jakarta')",
      "model_kerja": "On-site | Hybrid | Remote",
      "gaji_bulanan_idr": {
        "min": "number",
        "max": "number"
      },
      "deskripsi_singkat": "string (1-2 kalimat ringkasan peran)",
      "tanggung_jawab_utama": ["string"],
      "kualifikasi_wajib": ["string"],
      "benefit_unggulan": ["string (Sebutkan 2-4 benefit paling menarik)"],
      "url_palsu": "string (URL yang terlihat realistis, contoh: 'https://www.linkedin.com/jobs/view/123456789')",
      "platform": "string (Nama platform dari daftar yang diberikan)",
      "tanggal_diposting": "string (Format ISO 8601, tanggal dalam 45 hari terakhir dari sekarang)",
      "skor_kecocokan": "number (70-100, berdasarkan seberapa dekat lowongan ini dengan SEMUA parameter pengguna)"
    }
  ]
}

### PRINSIP REALISME & KUALITAS (WAJIB DIIKUTI)
- **Perusahaan Nyata:** Gunakan nama-nama perusahaan yang benar-benar ada dan relevan di Indonesia untuk industri yang ditargetkan.
- **Gaji Realistis:** Rentang gaji pada setiap lowongan harus sesuai dengan level, lokasi, dan standar industri di Indonesia.
- **Deskripsi & Kualifikasi Koheren:** Deskripsi pekerjaan dan kualifikasi harus sangat sesuai dengan judul posisi dan level pengalaman. Jangan meminta 5 tahun pengalaman untuk posisi 'Junior'.
- **Karakteristik Platform:**
  - **LinkedIn:** Cenderung untuk perusahaan multinasional, korporat besar, dan peran profesional/manajerial.
  - **Glints:** Kuat di ekosistem startup teknologi, agensi digital, dan peran untuk talenta muda.
  - **Jobstreet:** Cakupan luas, termasuk perusahaan manufaktur, ritel, dan BUMN.
- **Skor Kecocokan Logis:** Hitung skor berdasarkan seberapa baik lowongan yang Anda generate cocok dengan SEMUA parameter, terutama kata kunci, level, dan rentang gaji. Lowongan yang cocok sempurna harus mendekati 100.
- **Variasi Cerdas:** Berikan variasi pada judul posisi dan rentang gaji, namun tetap dalam koridor parameter yang diberikan.
`
    return instructions
  }

  private buildCVAnalysisPrompt(cvContent: string): string {
    return `
### PERAN DAN TUJUAN UTAMA
Anda adalah sistem AI Analisis CV yang sangat ahli, bertindak sebagai seorang Perekrut Teknis (Tech Recruiter) senior di Indonesia. Tujuan utama Anda adalah untuk mengekstrak, menganalisis, dan merangkum konten CV secara mendalam untuk mempercepat proses penyaringan kandidat.

### KONTEKS: KONTEN CV
Berikut adalah konten CV yang perlu dianalisis:
\`\`\`
${cvContent}
\`\`\`

### INSTRUKSI ANALISIS DAN FORMAT OUTPUT
Analisis secara menyeluruh konten CV di atas. Ikuti langkah-langkah berikut dengan saksama:
1.  **Ekstraksi Data:** Secara teliti ekstrak semua informasi yang relevan dari CV.
2.  **Penanganan Data Kosong:** Jika suatu bidang informasi tidak dapat ditemukan dalam CV, gunakan nilai \`null\` (bukan string "null"). Jangan mengarang informasi.
3.  **Inferensi Cerdas:** Untuk bidang yang memerlukan inferensi (seperti \`tingkat_pengalaman\` atau \`estimasi_gaji\`), gunakan seluruh konteks CV dan pengetahuan Anda tentang pasar kerja teknologi di Indonesia. Berikan justifikasi singkat untuk inferensi Anda di bidang \`ringkasan_analisis\`.
4.  **Format JSON:** Kembalikan hasil HANYA dalam format objek JSON yang valid dan sesuai dengan struktur di bawah ini. Jangan menyertakan teks pembuka, penutup, atau penjelasan lain di luar objek JSON.

### STRUKTUR JSON YANG WAJIB DIIKUTI

{
  "informasi_pribadi": {
    "nama_lengkap": "string | null",
    "email": "string | null",
    "nomor_telepon": "string | null",
    "lokasi": "string (contoh: Jakarta Selatan, DKI Jakarta) | null",
    "url_linkedin": "string | null",
    "url_portfolio_github": "string | null"
  },
  "ringkasan_analisis": {
    "profil_singkat_kandidat": "string (Ringkasan 2-3 kalimat tentang siapa kandidat ini berdasarkan keseluruhan CV)",
    "tingkat_pengalaman": "Fresh Graduate | Junior | Menengah | Senior | Ahli",
    "justifikasi_tingkat_pengalaman": "string (Jelaskan mengapa Anda mengklasifikasikan tingkat pengalaman ini, contoh: 'Total 5 tahun pengalaman relevan di bidang Backend Development.')",
    "estimasi_gaji_bulanan_rupiah": {
      "rentang_bawah": "number (contoh: 15000000) | null",
      "rentang_atas": "number (contoh: 20000000) | null",
      "justifikasi_estimasi": "string (Jelaskan dasar estimasi gaji berdasarkan keahlian, pengalaman, dan data pasar di Indonesia)"
    },
    "potensi_kecocokan_posisi": ["string (Contoh: 'Backend Developer (Node.js)', 'Software Engineer', 'DevOps Engineer')"],
    "catatan_untuk_perekrut": "string (Sorot kekuatan utama atau potensi 'red flag' seperti sering berpindah kerja, kesenjangan karir, dll.)"
  },
  "ringkasan_profil_cv": "string (Ekstrak bagian 'Tentang Saya' atau ringkasan yang ditulis oleh kandidat di CV. Jika tidak ada, gunakan null)",
  "pengalaman_kerja": [
    {
      "posisi": "string",
      "perusahaan": "string",
      "lokasi": "string | null",
      "tanggal_mulai": "string (format: YYYY-MM)",
      "tanggal_selesai": "string (format: YYYY-MM atau 'Sekarang')",
      "durasi": "string (contoh: '2 tahun 3 bulan')",
      "deskripsi_tugas": ["string"],
      "pencapaian_kunci": ["string (Ekstrak poin-poin pencapaian atau hasil terukur)"]
    }
  ],
  "pendidikan": [
    {
      "institusi": "string",
      "gelar": "string (contoh: 'Sarjana Teknik Informatika')",
      "bidang_studi": "string",
      "tahun_lulus": "number | null",
      "nilai_ipk": "number | null"
    }
  ],
  "keahlian": {
    "keahlian_teknis": ["string"],
    "soft_skills": ["string"],
    "tools_platform": ["string (contoh: 'Jira', 'Docker', 'AWS', 'Git')"],
    "bahasa_pemrograman": ["string"]
  },
  "proyek": [
    {
      "nama_proyek": "string",
      "deskripsi": "string",
      "teknologi_yang_digunakan": ["string"],
      "url_proyek": "string | null"
    }
  ],
  "sertifikasi_dan_pelatihan": [
    {
      "nama_sertifikasi": "string",
      "penerbit": "string",
      "tahun": "number | null"
    }
  ],
  "bahasa": [
    {
      "nama_bahasa": "string (contoh: 'Bahasa Indonesia', 'English')",
      "tingkat_kemahiran": "string (contoh: 'Native', 'Fluent', 'Professional Working Proficiency', 'Basic')"
    }
  ]
}

### ATURAN PENTING
- **HANYA JSON:** Respons Anda harus berupa satu blok kode JSON yang valid tanpa komentar atau teks lain.
- **Bahasa Indonesia:** Seluruh konten dan nilai dalam JSON harus menggunakan Bahasa Indonesia, kecuali untuk nama teknologi atau istilah teknis yang umum.
- **Rupiah:** Semua nilai moneter harus dalam Rupiah (IDR) dalam bentuk angka (number), bukan string.
- **Konteks Indonesia:** Analisis harus selalu mempertimbangkan konteks pasar kerja di Indonesia.
`
  }
}
