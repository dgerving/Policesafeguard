import { EvidenceCustodyRecord, UserProfile } from '../types';
import { AuthClient } from './authClient';

const RECOVERY_KEY_STORAGE = 'police_protection_recovery_key';
const LEGACY_RECOVERY_KEY_STORAGE = 'civicshield_recovery_key';
const PENDING_SYNC_STORAGE = 'police_protection_pending_sync_records';
const LEGACY_PENDING_SYNC_STORAGE = 'civicshield_pending_sync_records';

export class VaultCloudService {
  /**
   * Generates or retrieves the end-user's secure multi-device recovery key
   */
  static getOrCreateRecoveryKey(userProfile?: UserProfile): string {
    if (typeof window === 'undefined') return 'SHIELD-VAULT-DEFAULT';
    
    const saved = localStorage.getItem(RECOVERY_KEY_STORAGE) || localStorage.getItem(LEGACY_RECOVERY_KEY_STORAGE);
    if (saved && saved.trim()) {
      const trimmed = saved.trim().toUpperCase();
      try {
        localStorage.setItem(RECOVERY_KEY_STORAGE, trimmed);
        localStorage.removeItem(LEGACY_RECOVERY_KEY_STORAGE);
      } catch (e) {}
      return trimmed;
    }

    const pinPart = userProfile?.duressLockPin || '7482';
    const randA = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randB = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `SHIELD-${pinPart}-${randA}-${randB}`;

    try {
      localStorage.setItem(RECOVERY_KEY_STORAGE, newKey);
    } catch (e) {}

    return newKey;
  }

  /**
   * Saves a customized recovery key
   */
  static setRecoveryKey(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(RECOVERY_KEY_STORAGE, key.trim().toUpperCase());
    } catch (e) {}
  }

  /**
   * Enqueues a record for offline synchronization
   */
  static enqueuePendingSync(record: EvidenceCustodyRecord): void {
    try {
      const pendingRaw = localStorage.getItem(PENDING_SYNC_STORAGE);
      const pending: EvidenceCustodyRecord[] = pendingRaw ? JSON.parse(pendingRaw) : [];
      if (!pending.some(r => r.sessionId === record.sessionId)) {
        pending.push(record);
        localStorage.setItem(PENDING_SYNC_STORAGE, JSON.stringify(pending));
      }
    } catch (e) {}
  }

  /**
   * Flushes offline queued records when network becomes available
   */
  static async flushPendingSyncQueue(recoveryKey?: string, userEmail?: string): Promise<number> {
    try {
      const pendingRaw = localStorage.getItem(PENDING_SYNC_STORAGE);
      if (!pendingRaw) return 0;
      const pending: EvidenceCustodyRecord[] = JSON.parse(pendingRaw);
      if (!Array.isArray(pending) || pending.length === 0) return 0;

      const synced = await this.syncAllRecordsToCloud(pending, recoveryKey, userEmail);
      if (synced > 0) {
        localStorage.removeItem(PENDING_SYNC_STORAGE);
      }
      return synced;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Backs up a single newly completed custody record to the multi-device cloud vault
   * Operates asynchronously with detached error handling so local recording is NEVER disrupted.
   */
  static async syncRecordToCloud(
    record: EvidenceCustodyRecord, 
    recoveryKey?: string,
    userEmail?: string
  ): Promise<boolean> {
    try {
      const key = (recoveryKey || this.getOrCreateRecoveryKey()).trim().toUpperCase();
      const headers = AuthClient.getAuthHeaders();

      const response = await fetch('/api/vault/backup', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          record,
          recoveryKey: key,
          userEmail: userEmail || ''
        })
      });

      if (!response.ok) {
        this.enqueuePendingSync(record);
        return false;
      }

      const resJson = await response.json();
      return !!resJson.success;
    } catch (err) {
      this.enqueuePendingSync(record);
      return false;
    }
  }

  /**
   * Bulk syncs all stored local records to the server cloud vault
   */
  static async syncAllRecordsToCloud(
    records: EvidenceCustodyRecord[],
    recoveryKey?: string,
    userEmail?: string
  ): Promise<number> {
    if (!records || records.length === 0) return 0;
    try {
      const key = (recoveryKey || this.getOrCreateRecoveryKey()).trim().toUpperCase();
      const headers = AuthClient.getAuthHeaders();

      const response = await fetch('/api/vault/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          records,
          recoveryKey: key,
          userEmail: userEmail || ''
        })
      });

      if (!response.ok) return 0;
      const data = await response.json();
      return data.syncedCount || 0;
    } catch (err) {
      return 0;
    }
  }

  /**
   * Retrieves all evidence records from the cloud vault for a given recovery key or email
   */
  static async retrieveRecordsFromCloud(
    recoveryKey: string,
    userEmail?: string
  ): Promise<EvidenceCustodyRecord[]> {
    try {
      const headers = AuthClient.getAuthHeaders();
      const response = await fetch('/api/vault/retrieve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recoveryKey: recoveryKey.trim().toUpperCase(),
          userEmail: userEmail ? userEmail.trim().toLowerCase() : ''
        })
      });

      if (!response.ok) {
        throw new Error('Server returned error while retrieving cloud vault');
      }

      const data = await response.json().catch(() => ({}));
      if (Array.isArray(data.records)) {
        return data.records;
      }
      return [];
    } catch (err: any) {
      console.warn('[VaultCloudService] Failed to retrieve cloud vault:', err);
      return [];
    }
  }
}
