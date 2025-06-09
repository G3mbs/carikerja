// Offline storage fallback for when Supabase is unavailable
export class OfflineStorage {
  private static readonly STORAGE_KEYS = {
    CVS: 'carikerja_cvs',
    JOB_SEARCHES: 'carikerja_job_searches',
    JOB_RESULTS: 'carikerja_job_results',
    JOB_ALERTS: 'carikerja_job_alerts',
    SYNC_QUEUE: 'carikerja_sync_queue'
  }

  // Save CV data locally
  static saveCVLocally(cvData: any): string {
    try {
      const cvs = this.getCVsFromStorage()
      const cvId = `local_cv_${Date.now()}`
      const cvWithId = { ...cvData, id: cvId, synced: false }
      
      cvs.push(cvWithId)
      localStorage.setItem(this.STORAGE_KEYS.CVS, JSON.stringify(cvs))
      
      // Add to sync queue
      this.addToSyncQueue('cv', 'insert', cvWithId)
      
      return cvId
    } catch (error) {
      console.error('Failed to save CV locally:', error)
      throw error
    }
  }

  // Get CVs from local storage
  static getCVsFromStorage(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CVS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get CVs from storage:', error)
      return []
    }
  }

  // Save job search locally
  static saveJobSearchLocally(searchData: any): string {
    try {
      const searches = this.getJobSearchesFromStorage()
      const searchId = `local_search_${Date.now()}`
      const searchWithId = { ...searchData, id: searchId, synced: false }
      
      searches.push(searchWithId)
      localStorage.setItem(this.STORAGE_KEYS.JOB_SEARCHES, JSON.stringify(searches))
      
      this.addToSyncQueue('job_search', 'insert', searchWithId)
      
      return searchId
    } catch (error) {
      console.error('Failed to save job search locally:', error)
      throw error
    }
  }

  // Get job searches from local storage
  static getJobSearchesFromStorage(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.JOB_SEARCHES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get job searches from storage:', error)
      return []
    }
  }

  // Save job alert locally
  static saveJobAlertLocally(alertData: any): string {
    try {
      const alerts = this.getJobAlertsFromStorage()
      const alertId = `local_alert_${Date.now()}`
      const alertWithId = { ...alertData, id: alertId, synced: false }
      
      alerts.push(alertWithId)
      localStorage.setItem(this.STORAGE_KEYS.JOB_ALERTS, JSON.stringify(alerts))
      
      this.addToSyncQueue('job_alert', 'insert', alertWithId)
      
      return alertId
    } catch (error) {
      console.error('Failed to save job alert locally:', error)
      throw error
    }
  }

  // Get job alerts from local storage
  static getJobAlertsFromStorage(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.JOB_ALERTS)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get job alerts from storage:', error)
      return []
    }
  }

  // Add item to sync queue for later upload to Supabase
  private static addToSyncQueue(type: string, operation: string, data: any) {
    try {
      const queue = this.getSyncQueue()
      queue.push({
        id: `sync_${Date.now()}_${Math.random()}`,
        type,
        operation,
        data,
        timestamp: new Date().toISOString(),
        attempts: 0
      })
      localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to add to sync queue:', error)
    }
  }

  // Get sync queue
  static getSyncQueue(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get sync queue:', error)
      return []
    }
  }

  // Clear sync queue
  static clearSyncQueue() {
    localStorage.removeItem(this.STORAGE_KEYS.SYNC_QUEUE)
  }

  // Export all data for backup
  static exportAllData(): any {
    return {
      cvs: this.getCVsFromStorage(),
      jobSearches: this.getJobSearchesFromStorage(),
      jobAlerts: this.getJobAlertsFromStorage(),
      syncQueue: this.getSyncQueue(),
      exportedAt: new Date().toISOString()
    }
  }

  // Import data from backup
  static importData(data: any) {
    try {
      if (data.cvs) {
        localStorage.setItem(this.STORAGE_KEYS.CVS, JSON.stringify(data.cvs))
      }
      if (data.jobSearches) {
        localStorage.setItem(this.STORAGE_KEYS.JOB_SEARCHES, JSON.stringify(data.jobSearches))
      }
      if (data.jobAlerts) {
        localStorage.setItem(this.STORAGE_KEYS.JOB_ALERTS, JSON.stringify(data.jobAlerts))
      }
      if (data.syncQueue) {
        localStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(data.syncQueue))
      }
    } catch (error) {
      console.error('Failed to import data:', error)
      throw error
    }
  }

  // Clear all local data
  static clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  // Check if running in browser environment
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }
}
