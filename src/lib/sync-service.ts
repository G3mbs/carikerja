import { supabaseAdmin, testSupabaseConnection } from './supabase'
import { OfflineStorage } from './offline-storage'

export class SyncService {
  private static isOnline = false
  private static syncInProgress = false

  // Check if database is available and sync if needed
  static async checkAndSync(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    if (this.syncInProgress) {
      return { success: false, synced: 0, errors: ['Sync already in progress'] }
    }

    this.syncInProgress = true
    const errors: string[] = []
    let syncedCount = 0

    try {
      // Test connection
      const connectionTest = await testSupabaseConnection()
      this.isOnline = connectionTest.success

      if (!this.isOnline) {
        return { 
          success: false, 
          synced: 0, 
          errors: [`Database unavailable: ${connectionTest.error}`] 
        }
      }

      // Sync pending items
      const syncQueue = OfflineStorage.getSyncQueue()
      
      for (const item of syncQueue) {
        try {
          await this.syncItem(item)
          syncedCount++
        } catch (error) {
          errors.push(`Failed to sync ${item.type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Clear successfully synced items
      if (syncedCount > 0) {
        OfflineStorage.clearSyncQueue()
      }

      return { success: true, synced: syncedCount, errors }

    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { success: false, synced: syncedCount, errors }
    } finally {
      this.syncInProgress = false
    }
  }

  // Sync individual item to database
  private static async syncItem(item: any): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Database not available')
    }

    switch (item.type) {
      case 'cv':
        await this.syncCV(item.data)
        break
      case 'job_search':
        await this.syncJobSearch(item.data)
        break
      case 'job_alert':
        await this.syncJobAlert(item.data)
        break
      default:
        throw new Error(`Unknown sync type: ${item.type}`)
    }
  }

  // Sync CV to database
  private static async syncCV(cvData: any): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('cvs')
      .insert({
        user_id: cvData.user_id,
        filename: cvData.filename,
        original_name: cvData.original_name,
        file_size: cvData.file_size,
        mime_type: cvData.mime_type,
        content: cvData.content,
        basic_info: cvData.basic_info,
        analysis: cvData.analysis,
        version: cvData.version || 1,
        is_active: cvData.is_active !== false
      })

    if (error) {
      throw new Error(`CV sync failed: ${error.message}`)
    }
  }

  // Sync job search to database
  private static async syncJobSearch(searchData: any): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('job_searches')
      .insert({
        user_id: searchData.user_id,
        task_id: searchData.task_id,
        search_params: searchData.search_params,
        platforms: searchData.platforms,
        status: searchData.status || 'pending'
      })

    if (error) {
      throw new Error(`Job search sync failed: ${error.message}`)
    }
  }

  // Sync job alert to database
  private static async syncJobAlert(alertData: any): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('job_alerts')
      .insert({
        user_id: alertData.user_id,
        name: alertData.name,
        search_params: alertData.search_params,
        frequency: alertData.frequency || 'daily',
        is_active: alertData.is_active !== false
      })

    if (error) {
      throw new Error(`Job alert sync failed: ${error.message}`)
    }
  }

  // Get connection status
  static getConnectionStatus(): boolean {
    return this.isOnline
  }

  // Force connection check
  static async forceConnectionCheck(): Promise<boolean> {
    const result = await testSupabaseConnection()
    this.isOnline = result.success
    return this.isOnline
  }

  // Auto-sync on interval
  static startAutoSync(intervalMs: number = 30000): void {
    setInterval(async () => {
      if (!this.syncInProgress) {
        try {
          await this.checkAndSync()
        } catch (error) {
          console.error('Auto-sync failed:', error)
        }
      }
    }, intervalMs)
  }
}
