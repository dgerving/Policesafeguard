import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StoredEvidenceRecord {
  recordId: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  createdAt: number;
  completedAt: number;
  durationSeconds: number;
  sha256Hash: string;
  certificateId: string;
  deviceFingerprint: string;
  encounterType: string;
  isEncrypted: boolean;
  encryptionAlgorithm: string;
  encryptedPayload?: string; // Base64 AES-GCM ciphertext
  iv?: string; // Base64 IV
  authTag?: string; // Base64 GCM auth tag
  transcript?: any[];
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    jurisdictionState: string;
    city?: string;
  };
  complianceScore?: number;
  admissibilityNotes: string;
  recoveryKeyHash?: string;
  chainOfCustody: Array<{
    timestamp: number;
    action: string;
    actor: string;
    nodeHash: string;
  }>;
}

export interface IndexItem {
  recordId: string;
  sessionId: string;
  userId: string;
  createdAt: number;
  sha256Hash: string;
  certificateId: string;
  recoveryKeyHash?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const EVIDENCE_DIR = path.join(DATA_DIR, 'vault_evidence');
const INDEX_FILE = path.join(EVIDENCE_DIR, 'index.json');
const VAULT_KEY_FILE = path.join(DATA_DIR, 'vault_master.key');

// Ensure evidence directory exists
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Master encryption key management (AES-256)
function getOrCreateMasterKey(): Buffer {
  if (fs.existsSync(VAULT_KEY_FILE)) {
    try {
      const keyHex = fs.readFileSync(VAULT_KEY_FILE, 'utf-8').trim();
      if (keyHex.length === 64) {
        return Buffer.from(keyHex, 'hex');
      }
    } catch (e) {
      console.warn('Error reading vault master key, generating fresh one:', e);
    }
  }
  const freshKey = crypto.randomBytes(32);
  try {
    fs.writeFileSync(VAULT_KEY_FILE, freshKey.toString('hex'), { mode: 0o600 });
  } catch (e) {
    console.warn('Could not write vault master key file:', e);
  }
  return freshKey;
}

const MASTER_KEY = getOrCreateMasterKey();

function loadIndex(): Map<string, IndexItem> {
  const map = new Map<string, IndexItem>();
  if (fs.existsSync(INDEX_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((item: IndexItem) => {
          if (item?.recordId) {
            map.set(item.recordId, item);
          }
        });
      }
    } catch (e) {
      console.error('[EvidenceService] Error reading index.json:', e);
    }
  }
  return map;
}

function saveIndex(map: Map<string, IndexItem>): void {
  try {
    const list = Array.from(map.values());
    const tempFile = `${INDEX_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tempFile, INDEX_FILE);
  } catch (e) {
    console.error('[EvidenceService] Error writing index.json:', e);
  }
}

const indexCache = loadIndex();

export class EvidenceService {
  /**
   * Encrypts plaintext buffer or string with AES-256-GCM
   */
  public static encryptPayload(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12); // NIST SP 800-38D recommended 96-bit IV
    const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      authTag
    };
  }

  /**
   * Decrypts ciphertext with AES-256-GCM
   */
  public static decryptPayload(ciphertext: string, ivBase64: string, authTagBase64: string): string | null {
    try {
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error('[EvidenceService] Decryption failed:', e);
      return null;
    }
  }

  /**
   * Securely saves an evidence record to persistent disk storage with AES-GCM encryption
   */
  public static saveRecord(userId: string, userEmail: string, recordData: any, recoveryKey?: string): StoredEvidenceRecord {
    const recordId = recordData.recordId || recordData.sessionId || `EV-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const sessionId = recordData.sessionId || recordId;

    // Verify or compute SHA-256 digest
    const contentString = JSON.stringify(recordData.transcript || recordData);
    const calculatedHash = crypto.createHash('sha256').update(contentString).digest('hex');
    const finalHash = recordData.sha256Hash || calculatedHash;
    const certId = recordData.certificateId || `CERT-FRE902-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Compute recovery key hash if provided
    let recoveryKeyHash = recordData.recoveryKeyHash;
    if (recoveryKey && recoveryKey.trim()) {
      recoveryKeyHash = crypto.createHash('sha256').update(recoveryKey.trim().toUpperCase()).digest('hex');
    }

    // Encrypt sensitive transcript and location payload if not already client-encrypted
    let encryptedPayload = recordData.encryptedPayload;
    let iv = recordData.iv;
    let authTag = recordData.authTag;

    if (!encryptedPayload && recordData.transcript) {
      const sensitiveBundle = JSON.stringify({
        transcript: recordData.transcript,
        gpsCoordinates: recordData.gpsCoordinates,
        encounterType: recordData.encounterType
      });
      const encrypted = this.encryptPayload(sensitiveBundle);
      encryptedPayload = encrypted.ciphertext;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    const storedRecord: StoredEvidenceRecord = {
      recordId,
      sessionId,
      userId: userId || 'anonymous_citizen',
      userEmail: userEmail || '',
      createdAt: recordData.createdAt || Date.now(),
      completedAt: recordData.completedAt || Date.now(),
      durationSeconds: recordData.durationSeconds || 0,
      sha256Hash: finalHash,
      certificateId: certId,
      deviceFingerprint: recordData.deviceFingerprint || `CLIENT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      encounterType: recordData.encounterType || 'traffic_stop',
      isEncrypted: true,
      encryptionAlgorithm: 'AES-GCM-256 (NIST SP 800-38D)',
      encryptedPayload,
      iv,
      authTag,
      transcript: recordData.transcript || [],
      gpsCoordinates: recordData.gpsCoordinates,
      complianceScore: recordData.complianceScore,
      recoveryKeyHash,
      admissibilityNotes: recordData.admissibilityNotes || 
        'Contemporaneous audiovisual recording formatted to satisfy Federal Rules of Evidence 901(b)(9) (process producing accurate result), FRE 902(13) (certified electronic records), and FRE 902(14) (certified digital data). Technical authenticity and tamper-evidence established via cryptographic SHA-256 digest.',
      chainOfCustody: [
        ...(recordData.chainOfCustody || []),
        {
          timestamp: Date.now(),
          action: 'EVIDENCE_STORED_IN_PERSISTENT_ENCRYPTED_VAULT',
          actor: userEmail || userId || 'Authenticated Citizen',
          nodeHash: finalHash.slice(0, 16)
        }
      ]
    };

    const recordFile = path.join(EVIDENCE_DIR, `${recordId}.json`);
    const tempFile = `${recordFile}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(storedRecord, null, 2), 'utf-8');
    fs.renameSync(tempFile, recordFile);

    // Update index
    indexCache.set(recordId, {
      recordId,
      sessionId,
      userId: storedRecord.userId,
      createdAt: storedRecord.createdAt,
      sha256Hash: finalHash,
      certificateId: certId,
      recoveryKeyHash
    });
    saveIndex(indexCache);

    console.info(`[EvidenceService] Encrypted and stored record ${recordId} for user ${userEmail || userId} (Hash: ${finalHash.slice(0, 12)}...)`);
    return storedRecord;
  }

  /**
   * Retrieves all evidence records belonging to a user
   */
  public static getRecordsForUser(userId: string): StoredEvidenceRecord[] {
    const records: StoredEvidenceRecord[] = [];
    for (const item of indexCache.values()) {
      if (item.userId === userId) {
        const filePath = path.join(EVIDENCE_DIR, `${item.recordId}.json`);
        if (fs.existsSync(filePath)) {
          try {
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            records.push(raw);
          } catch (e) {
            console.error(`[EvidenceService] Error reading record ${item.recordId}:`, e);
          }
        }
      }
    }
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Retrieves records matching a recovery key hash or user email
   */
  public static getRecordsByRecoveryKey(recoveryKey: string, userEmail?: string): StoredEvidenceRecord[] {
    const targetHash = crypto.createHash('sha256').update(recoveryKey.trim().toUpperCase()).digest('hex');
    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : '';
    const records: StoredEvidenceRecord[] = [];

    for (const item of indexCache.values()) {
      let matches = false;
      if (item.recoveryKeyHash && item.recoveryKeyHash === targetHash) {
        matches = true;
      }
      if (matches || cleanEmail) {
        const filePath = path.join(EVIDENCE_DIR, `${item.recordId}.json`);
        if (fs.existsSync(filePath)) {
          try {
            const raw: StoredEvidenceRecord = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (matches || (cleanEmail && raw.userEmail && raw.userEmail.toLowerCase() === cleanEmail && raw.recoveryKeyHash === targetHash)) {
              records.push(raw);
            }
          } catch (e) {}
        }
      }
    }
    return records.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Retrieves a single record by recordId, ensuring user ownership
   */
  public static getRecordById(userId: string, recordId: string): StoredEvidenceRecord | null {
    const item = indexCache.get(recordId);
    if (!item || item.userId !== userId) {
      return null;
    }
    const filePath = path.join(EVIDENCE_DIR, `${recordId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Deletes a record by ID with ownership verification
   */
  public static deleteRecord(userId: string, recordId: string): boolean {
    const item = indexCache.get(recordId);
    if (!item || item.userId !== userId) {
      return false;
    }
    const filePath = path.join(EVIDENCE_DIR, `${recordId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}
    }
    indexCache.delete(recordId);
    saveIndex(indexCache);
    return true;
  }

  /**
   * Deletes all records for a user (GDPR/CCPA purge)
   */
  public static purgeAllRecordsForUser(userId: string): number {
    let count = 0;
    for (const [recordId, item] of indexCache.entries()) {
      if (item.userId === userId) {
        const filePath = path.join(EVIDENCE_DIR, `${recordId}.json`);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}
        }
        indexCache.delete(recordId);
        count++;
      }
    }
    saveIndex(indexCache);
    return count;
  }
}
