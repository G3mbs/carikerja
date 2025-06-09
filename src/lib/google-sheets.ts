import { google } from 'googleapis'

export class GoogleSheetsService {
  private sheets: any
  private auth: any

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  async createSpreadsheet(title: string, userEmail: string) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: title,
          },
          sheets: [
            {
              properties: {
                title: 'Job Results',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20,
                },
              },
            },
            {
              properties: {
                title: 'Applications',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 15,
                },
              },
            },
            {
              properties: {
                title: 'Market Research',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 10,
                },
              },
            },
          ],
        },
      })

      const spreadsheetId = response.data.spreadsheetId

      // Share with user
      await this.shareSpreadsheet(spreadsheetId!, userEmail)

      // Add headers
      await this.addHeaders(spreadsheetId!)

      return {
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw new Error('Failed to create Google Spreadsheet')
    }
  }

  async shareSpreadsheet(spreadsheetId: string, userEmail: string) {
    const drive = google.drive({ version: 'v3', auth: this.auth })
    
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: userEmail,
      },
    })
  }

  async addHeaders(spreadsheetId: string) {
    const jobResultsHeaders = [
      'Job Title', 'Company', 'Location', 'Salary', 'Platform', 
      'Posted Date', 'Match Score', 'URL', 'Description', 'Requirements'
    ]

    const applicationsHeaders = [
      'Job URL', 'Status', 'CV Used', 'Applicant Name', 'Email',
      'Application Date', 'Last Updated', 'Error Message'
    ]

    const marketResearchHeaders = [
      'Position', 'Industry', 'Location', 'Salary Min', 'Salary Max',
      'Salary Average', 'Research Date', 'Top Skills', 'Career Path', 'Companies'
    ]

    const requests = [
      {
        updateCells: {
          range: {
            sheetId: 0, // Job Results sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: jobResultsHeaders.length,
          },
          rows: [
            {
              values: jobResultsHeaders.map(header => ({
                userEnteredValue: { stringValue: header },
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                },
              })),
            },
          ],
          fields: 'userEnteredValue,userEnteredFormat',
        },
      },
      {
        updateCells: {
          range: {
            sheetId: 1, // Applications sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: applicationsHeaders.length,
          },
          rows: [
            {
              values: applicationsHeaders.map(header => ({
                userEnteredValue: { stringValue: header },
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                },
              })),
            },
          ],
          fields: 'userEnteredValue,userEnteredFormat',
        },
      },
      {
        updateCells: {
          range: {
            sheetId: 2, // Market Research sheet
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: marketResearchHeaders.length,
          },
          rows: [
            {
              values: marketResearchHeaders.map(header => ({
                userEnteredValue: { stringValue: header },
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                },
              })),
            },
          ],
          fields: 'userEnteredValue,userEnteredFormat',
        },
      },
    ]

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    })
  }

  async appendJobResults(spreadsheetId: string, jobResults: any[]) {
    const values = jobResults.map(job => [
      job.title,
      job.company,
      job.location,
      job.salary || '',
      job.platform,
      job.postedDate,
      job.matchScore || '',
      job.url,
      job.description?.substring(0, 500) || '', // Limit description length
      job.requirements?.join(', ') || '',
    ])

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Job Results!A:J',
      valueInputOption: 'RAW',
      requestBody: { values },
    })
  }

  async appendApplications(spreadsheetId: string, applications: any[]) {
    const values = applications.map(app => [
      app.job_url,
      app.status,
      app.cvs?.original_name || '',
      app.cv_data?.nama || '',
      app.cv_data?.email || '',
      new Date(app.created_at).toLocaleDateString('id-ID'),
      app.updated_at ? new Date(app.updated_at).toLocaleDateString('id-ID') : '',
      app.error || '',
    ])

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Applications!A:H',
      valueInputOption: 'RAW',
      requestBody: { values },
    })
  }

  async appendMarketResearch(spreadsheetId: string, research: any[]) {
    const values = research.map(item => [
      item.position,
      item.industry,
      item.location,
      item.research_data?.salaryBenchmark?.min || '',
      item.research_data?.salaryBenchmark?.max || '',
      item.research_data?.salaryBenchmark?.average || '',
      new Date(item.created_at).toLocaleDateString('id-ID'),
      item.research_data?.skillDemand?.map((s: any) => s.skill).join(', ') || '',
      item.research_data?.careerPath?.map((c: any) => c.nextLevel).join(', ') || '',
      item.research_data?.companies?.map((c: any) => c.name).join(', ') || '',
    ])

    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Market Research!A:J',
      valueInputOption: 'RAW',
      requestBody: { values },
    })
  }
}
