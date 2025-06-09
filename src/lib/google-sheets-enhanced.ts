import { LinkedInJobData, LinkedInJobSheetRow, GoogleSheetsExportConfig } from '@/types/linkedin'

/**
 * Enhanced Google Sheets integration for LinkedIn job data
 */
export class GoogleSheetsEnhanced {
  private apiKey: string
  private clientEmail: string
  private privateKey: string

  constructor() {
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY || ''
    this.clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
  }

  /**
   * Create new spreadsheet with LinkedIn job template
   */
  async createLinkedInJobSpreadsheet(
    config: GoogleSheetsExportConfig,
    userId: string
  ): Promise<{ spreadsheetId: string; url: string }> {
    try {
      const accessToken = await this.getAccessToken()
      
      // Create new spreadsheet
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: config.spreadsheetName || `LinkedIn Jobs - ${new Date().toLocaleDateString()}`
          },
          sheets: [{
            properties: {
              title: config.worksheetName || 'LinkedIn Jobs',
              gridProperties: {
                rowCount: 1000,
                columnCount: 15
              }
            }
          }]
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create spreadsheet: ${createResponse.statusText}`)
      }

      const spreadsheet = await createResponse.json()
      const spreadsheetId = spreadsheet.spreadsheetId
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

      // Add headers and formatting
      await this.setupLinkedInJobTemplate(spreadsheetId, config)

      // Share with user if email provided
      if (config.shareWithUser) {
        await this.shareSpreadsheet(spreadsheetId, config.shareWithUser)
      }

      console.log(`Created LinkedIn job spreadsheet: ${spreadsheetUrl}`)
      
      return {
        spreadsheetId,
        url: spreadsheetUrl
      }

    } catch (error) {
      console.error('Error creating LinkedIn job spreadsheet:', error)
      throw error
    }
  }

  /**
   * Setup LinkedIn job template with headers and formatting
   */
  private async setupLinkedInJobTemplate(
    spreadsheetId: string,
    config: GoogleSheetsExportConfig
  ): Promise<void> {
    const accessToken = await this.getAccessToken()

    // Define headers
    const headers = [
      'Company Logo',
      'Job Title',
      'Company',
      'Location',
      'Salary',
      'Posted Time',
      'Application Status',
      'Easy Apply',
      'LinkedIn URL',
      'Match Score',
      'Scraped Date',
      'Additional Insights'
    ]

    // Batch update requests
    const requests = []

    // Add headers
    if (config.includeHeaders) {
      requests.push({
        updateCells: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: headers.length
          },
          rows: [{
            values: headers.map(header => ({
              userEnteredValue: { stringValue: header },
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true
                }
              }
            }))
          }],
          fields: 'userEnteredValue,userEnteredFormat'
        }
      })
    }

    // Auto-format if enabled
    if (config.autoFormat) {
      // Freeze header row
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: 0,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          fields: 'gridProperties.frozenRowCount'
        }
      })

      // Auto-resize columns
      requests.push({
        autoResizeDimensions: {
          dimensions: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: headers.length
          }
        }
      })

      // Add data validation for specific columns
      requests.push({
        setDataValidation: {
          range: {
            sheetId: 0,
            startRowIndex: 1,
            endRowIndex: 1000,
            startColumnIndex: 6, // Application Status column
            endColumnIndex: 7
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'Not Applied' },
                { userEnteredValue: 'Applied' },
                { userEnteredValue: 'In Review' },
                { userEnteredValue: 'Interview' },
                { userEnteredValue: 'Rejected' },
                { userEnteredValue: 'Offer' }
              ]
            },
            showCustomUi: true
          }
        }
      })
    }

    // Execute batch update
    if (requests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      })
    }
  }

  /**
   * Export LinkedIn jobs to spreadsheet
   */
  async exportLinkedInJobs(
    spreadsheetId: string,
    jobs: LinkedInJobData[],
    config: GoogleSheetsExportConfig
  ): Promise<void> {
    try {
      const accessToken = await this.getAccessToken()
      
      // Convert jobs to sheet rows
      const rows = jobs.map(job => this.convertJobToSheetRow(job))
      
      // Determine start row (skip header if exists)
      const startRow = config.includeHeaders ? 2 : 1
      
      // Prepare values for batch update
      const values = rows.map(row => [
        row['Company Logo'],
        row['Job Title'],
        row['Company'],
        row['Location'],
        row['Salary'],
        row['Posted Time'],
        row['Application Status'],
        row['Easy Apply'],
        row['LinkedIn URL'],
        row['Match Score'],
        row['Scraped Date'],
        row['Additional Insights']
      ])

      // Update spreadsheet
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${config.worksheetName || 'LinkedIn Jobs'}!A${startRow}:L${startRow + values.length - 1}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      )

      if (!updateResponse.ok) {
        throw new Error(`Failed to update spreadsheet: ${updateResponse.statusText}`)
      }

      console.log(`Exported ${jobs.length} LinkedIn jobs to spreadsheet`)

    } catch (error) {
      console.error('Error exporting LinkedIn jobs:', error)
      throw error
    }
  }

  /**
   * Convert LinkedIn job data to sheet row format
   */
  private convertJobToSheetRow(job: LinkedInJobData): LinkedInJobSheetRow {
    return {
      'Company Logo': job.companyLogoUrl ? `=IMAGE("${job.companyLogoUrl}")` : '',
      'Job Title': job.jobTitle,
      'Company': job.companyName,
      'Location': job.location,
      'Salary': job.salaryRange || 'Not specified',
      'Posted Time': job.postedTime,
      'Application Status': job.applicationStatus || 'Not Applied',
      'Easy Apply': job.easyApply ? 'Yes' : 'No',
      'LinkedIn URL': `=HYPERLINK("${job.linkedinUrl}", "View Job")`,
      'Match Score': job.matchScore ? `${job.matchScore}%` : 'N/A',
      'Scraped Date': new Date(job.scrapedAt).toLocaleDateString(),
      'Additional Insights': job.additionalInsights.join(', ')
    }
  }

  /**
   * Share spreadsheet with user
   */
  private async shareSpreadsheet(spreadsheetId: string, userEmail: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken()

      await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'user',
          emailAddress: userEmail
        })
      })

      console.log(`Shared spreadsheet with ${userEmail}`)

    } catch (error) {
      console.warn('Failed to share spreadsheet:', error.message)
      // Don't throw error, sharing is optional
    }
  }

  /**
   * Get Google Sheets access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Create JWT for service account
      const jwt = await this.createJWT()
      
      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`)
      }

      const data = await response.json()
      return data.access_token

    } catch (error) {
      console.error('Error getting Google Sheets access token:', error)
      throw error
    }
  }

  /**
   * Create JWT for Google service account
   */
  private async createJWT(): Promise<string> {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // Note: In production, use proper JWT library like 'jsonwebtoken'
    // This is a simplified implementation
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`
    
    // For production, implement proper RSA signing
    // This is a placeholder that would need proper crypto implementation
    const signature = 'placeholder_signature'
    
    return `${signatureInput}.${signature}`
  }

  /**
   * Validate Google Sheets configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.apiKey) {
      errors.push('Google Sheets API key is required')
    }

    if (!this.clientEmail) {
      errors.push('Google service account email is required')
    }

    if (!this.privateKey) {
      errors.push('Google service account private key is required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
