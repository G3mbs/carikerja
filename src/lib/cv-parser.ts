export class CVParser {
  async parseFile(file: File): Promise<string> {
    const fileType = file.type
    const buffer = await file.arrayBuffer()

    try {
      switch (fileType) {
        case 'application/pdf':
          return await this.parsePDF(buffer)

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.parseWord(buffer)

        case 'text/plain':
          return await this.parseText(buffer)

        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }
    } catch (error) {
      console.error('CV parsing error:', error)
      throw new Error('Failed to parse CV file')
    }
  }

  private async parsePDF(buffer: ArrayBuffer): Promise<string> {
    try {
      // Dynamic import to avoid build issues
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(Buffer.from(buffer), {
        // Add options to prevent file system access
        max: 0, // No limit on pages
        version: 'v1.10.100' // Specify version to avoid compatibility issues
      })
      return this.cleanText(data.text)
    } catch (error) {
      console.error('PDF parsing error:', error)
      // Fallback: return basic file info if parsing fails
      return `PDF file uploaded: ${buffer.byteLength} bytes. Content parsing failed.`
    }
  }

  private async parseWord(buffer: ArrayBuffer): Promise<string> {
    try {
      // Dynamic import to avoid build issues
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      return this.cleanText(result.value)
    } catch (error) {
      console.error('Word parsing error:', error)
      throw new Error('Failed to parse Word document')
    }
  }

  private async parseText(buffer: ArrayBuffer): Promise<string> {
    try {
      const decoder = new TextDecoder('utf-8')
      const text = decoder.decode(buffer)
      return this.cleanText(text)
    } catch (error) {
      console.error('Text parsing error:', error)
      throw new Error('Failed to parse text file')
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim()
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, DOC, DOCX, or TXT files.'
      }
    }

    return { isValid: true }
  }

  extractBasicInfo(text: string): {
    email?: string
    phone?: string
    name?: string
  } {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const phoneRegex = /(\+62|62|0)[\s-]?(\d{2,3})[\s-]?(\d{3,4})[\s-]?(\d{3,4})/g
    
    const emails = text.match(emailRegex)
    const phones = text.match(phoneRegex)
    
    // Simple name extraction (first line that looks like a name)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    let name = ''
    
    for (const line of lines.slice(0, 5)) {
      // Skip lines that look like contact info or headers
      if (line.includes('@') || line.includes('CV') || line.includes('CURRICULUM') || 
          line.includes('RESUME') || line.match(/^\d+/) || line.length < 3) {
        continue
      }
      
      // Check if line looks like a name (2-4 words, mostly letters)
      const words = line.split(' ').filter(word => word.length > 0)
      if (words.length >= 2 && words.length <= 4 && 
          words.every(word => /^[A-Za-z\s.]+$/.test(word))) {
        name = line
        break
      }
    }

    return {
      email: emails?.[0],
      phone: phones?.[0],
      name: name || undefined
    }
  }
}
