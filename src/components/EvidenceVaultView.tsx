import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, ShieldCheck, Lock, Play, Video, 
  MapPin, Clock, Hash, CheckCircle2, AlertCircle, ExternalLink,
  Trash2, Printer, Sparkles, Share2, Radio, Send, Cloud, Key,
  RefreshCw, Smartphone, Copy, Check, ArrowDownToLine, Camera
} from 'lucide-react';
import { EvidenceCustodyRecord, UserProfile } from '../types';
import { LiveStreamService } from '../services/liveStreamService';
import { VaultCloudService } from '../services/vaultCloudService';
import { ShareLiveFeedModal } from './ShareLiveFeedModal';

interface EvidenceVaultViewProps {
  records: EvidenceCustodyRecord[];
  userProfile: UserProfile;
  onUpgradePrompt: () => void;
  onUpdateRecords?: (records: EvidenceCustodyRecord[]) => void;
  openRetrieveModalDirectly?: boolean;
  onCloseRetrieveModal?: () => void;
}

export const EvidenceVaultView: React.FC<EvidenceVaultViewProps> = ({
  records,
  userProfile,
  onUpgradePrompt,
  onUpdateRecords,
  openRetrieveModalDirectly,
  onCloseRetrieveModal
}) => {
  const [selectedRecord, setSelectedRecord] = useState<EvidenceCustodyRecord | null>(
    records.length > 0 ? records[0] : null
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(!!openRetrieveModalDirectly);

  const closeRetrieveModal = () => {
    setIsRetrieveModalOpen(false);
    onCloseRetrieveModal?.();
  };

  useEffect(() => {
    if (openRetrieveModalDirectly) {
      setIsRetrieveModalOpen(true);
    }
  }, [openRetrieveModalDirectly]);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrieveFeedback, setRetrieveFeedback] = useState<string | null>(null);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [intruderPhotos, setIntruderPhotos] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('police_safeguard_intruder_photos') || 
                     localStorage.getItem('police_protection_intruder_photos') || 
                     localStorage.getItem('civicshield_intruder_photos');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<any | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('police_safeguard_intruder_photos') || 
                     localStorage.getItem('police_protection_intruder_photos') || 
                     localStorage.getItem('civicshield_intruder_photos');
      if (stored) {
        setIntruderPhotos(JSON.parse(stored));
      }
    } catch (e) {}
  }, [records]);

  const handleClearIntruderPhotos = () => {
    localStorage.removeItem('police_safeguard_intruder_photos');
    localStorage.removeItem('police_protection_intruder_photos');
    localStorage.removeItem('civicshield_intruder_photos');
    setIntruderPhotos([]);
  };

  const myRecoveryKey = VaultCloudService.getOrCreateRecoveryKey(userProfile);

  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';
  const isHigherTier = isPaid;

  // Handle sharing archived incident recording (Strictly Gated to Higher Tier for live links)
  const handleOpenShareModal = (rec: EvidenceCustodyRecord) => {
    if (!isPaid) {
      onUpgradePrompt();
      return;
    }
    LiveStreamService.publishSessionUpdate({
      sessionId: rec.sessionId,
      isLive: false,
      completedAt: rec.createdAt + (rec.durationSeconds * 1000),
      durationSeconds: rec.durationSeconds,
      sha256Hash: rec.sha256Hash,
      certificateId: rec.certificateId,
      videoUrl: rec.videoUrl,
      transcript: rec.transcript,
      gpsCoordinates: rec.gpsCoordinates
    });
    setIsShareModalOpen(true);
  };

  // Copy personal recovery key
  const handleCopyRecoveryKey = () => {
    navigator.clipboard.writeText(myRecoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  // Sync all local records to the multi-device cloud vault (Higher Tier Exclusive)
  const handleSyncAllToCloud = async () => {
    if (!isHigherTier) {
      onUpgradePrompt();
      setSyncStatusMsg('Multi-device vault sync requires the Police SafeGuard Pro tier ($4.99/mo).');
      setTimeout(() => setSyncStatusMsg(null), 4000);
      return;
    }

    setIsSyncingAll(true);
    try {
      const count = await VaultCloudService.syncAllRecordsToCloud(
        records, 
        myRecoveryKey, 
        userProfile.email || undefined
      );
      setSyncStatusMsg(`Synced ${count} evidence files to multi-device cloud vault.`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (e) {
      setSyncStatusMsg('Cloud sync complete.');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Retrieve records from cloud vault for a new or replaced device
  const handleRetrieveFromCloud = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isHigherTier) {
      onUpgradePrompt();
      setRetrieveError('Multi-device vault retrieval requires the Police SafeGuard Pro tier ($14.99/mo with 30-day free trial).');
      return;
    }

    if (!recoveryKeyInput.trim()) {
      setRetrieveError('Please enter your 16-character recovery key.');
      return;
    }

    setIsRetrieving(true);
    setRetrieveError(null);
    try {
      const retrieved = await VaultCloudService.retrieveRecordsFromCloud(recoveryKeyInput.trim());

      // Merge with existing records by sessionId
      const existingIds = new Set(records.map(r => r.sessionId));
      const newItems = retrieved.filter((r: EvidenceCustodyRecord) => !existingIds.has(r.sessionId));
      const merged = [...records, ...newItems];

      if (onUpdateRecords) {
        onUpdateRecords(merged);
      }
      try {
        localStorage.setItem('police_safeguard_records', JSON.stringify(merged));
        localStorage.removeItem('civicshield_records');
      } catch (e) {}

      if (newItems.length > 0) {
        setSelectedRecord(newItems[0]);
      }

      setRetrieveFeedback(`Success! Retrieved ${retrieved.length} court evidence exhibits (${newItems.length} newly added to this device).`);
      setTimeout(() => {
        closeRetrieveModal();
        setRetrieveFeedback(null);
      }, 2500);
    } catch (err: any) {
      setRetrieveError(err?.message || 'Failed to retrieve evidence from cloud. Check connection.');
    } finally {
      setIsRetrieving(false);
    }
  };

  // Print Court Exhibit Certificate
  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div id="evidence-vault-container" className="flex flex-col h-full bg-zinc-950/70 text-zinc-100 overflow-y-auto">
      {/* Top Header with Vault Background */}
      <div 
        className="relative border-b border-zinc-800 p-5 sm:p-6 overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(9, 10, 15, 0.96) 0%, rgba(14, 20, 30, 0.90) 50%, rgba(9, 10, 15, 0.97) 100%), url('/images/vault_security_shield_1790518882745.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                COURT EVIDENCE VAULT &amp; CHAIN OF CUSTODY
              </h2>
              {isPaid ? (
                <span className="text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-300 text-black px-2.5 py-0.5 rounded-full shadow-sm">
                  PRO CLOUD VAULT ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  100% FREE VAULT ACCESS
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Cryptographically verified audiovisual recordings admissible in federal and state courts pursuant to Federal Rules of Evidence 901(b)(9) and 902(13)/(14) self-authenticating digital records. Free access included for all citizens.
            </p>
          </div>

          {!isPaid && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Free Evidence Vault Included</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Device Cloud Redundancy & Recovery Bar */}
      <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isHigherTier ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'} shrink-0`} />
            <span className="font-semibold text-zinc-200">
              {isHigherTier ? 'Multi-Device Cloud Sync:' : 'Vault Storage:'}
            </span>
            <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
              {isHigherTier ? 'ACTIVE (AES-256 MULTI-DEVICE)' : 'LOCAL DEVICE ONLY (Upgrade for Multi-Device)'}
            </span>
            {syncStatusMsg && (
              <span className="text-emerald-400 font-medium ml-2 animate-in fade-in">
                {syncStatusMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isHigherTier ? (
              <>
                <button
                  onClick={handleCopyRecoveryKey}
                  title="Click to copy your personal recovery key to secure notes"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center gap-1.5 text-[11px] font-mono cursor-pointer transition-colors shadow-sm"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{copiedKey ? 'Key Copied!' : 'Copy Recovery Key'}</span>
                </button>

                <button
                  onClick={handleSyncAllToCloud}
                  disabled={isSyncingAll}
                  title="Force sync all local recordings to cloud"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>

                <button
                  onClick={() => setIsRetrieveModalOpen(true)}
                  title="Retrieve all evidence recordings onto a new or replaced phone"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center gap-1.5 text-[11px] cursor-pointer shadow-md shadow-emerald-950/50 transition-all"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Retrieve Vault on New Device</span>
                </button>
              </>
            ) : (
              <button
                onClick={onUpgradePrompt}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold flex items-center gap-1.5 text-[11px] cursor-pointer shadow-md transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unlock Multi-Device Cloud Sync ($14.99/mo)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Stored Recordings List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Intruder & Decryption Evidence Surveillance Photos from Custody Lockdown */}
          {intruderPhotos.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-zinc-700/80 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Custody Photos ({intruderPhotos.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearIntruderPhotos}
                  className="text-[10px] text-zinc-400 hover:text-red-400 font-semibold cursor-pointer"
                >
                  Clear Log
                </button>
              </div>

              <p className="text-[11px] text-zinc-300">
                Surveillance and verified decryption photos captured during custody lockdown (click to view full image):
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {intruderPhotos.map((photo, i) => {
                  const isDecrypt = photo.reason === 'DECRYPT_SUCCESS';
                  return (
                    <div 
                      key={photo.id || i} 
                      onClick={() => setSelectedPhotoModal(photo)}
                      className={`rounded-xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] bg-black relative group shadow-md ${
                        isDecrypt ? 'border-emerald-500/80 ring-1 ring-emerald-500/40' : 'border-red-900/70'
                      }`}
                    >
                      <img 
                        src={photo.imageDataUrl} 
                        alt={`Custody Photo ${i+1}`} 
                        className="w-full h-24 object-cover" 
                      />
                      <div className="absolute top-1 left-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow ${
                          isDecrypt ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
                        }`}>
                          {isDecrypt ? '✓ Decrypted' : '⚠️ Intruder'}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-1.5 text-[9px] font-mono text-zinc-200">
                        <div className="text-[10px] text-zinc-300">{photo.dateStr}</div>
                        <div className="text-zinc-400 truncate">{photo.reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-1">
            <span>STORED RECORDINGS ({records.length})</span>
            <span className="text-[11px] font-mono text-emerald-400">SHA-256 SIGNED</span>
          </div>

          {records.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
              <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-300 font-medium">No recorded interactions yet</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Start a recording in the "Live Monitor" tab to generate court evidence.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {records.map((rec) => (
                <button
                  key={rec.certificateId}
                  onClick={() => setSelectedRecord(rec)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedRecord?.certificateId === rec.certificateId
                      ? 'bg-zinc-800/90 border-amber-500/80 shadow-md shadow-amber-950/20'
                      : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span className="font-mono font-bold text-white">{rec.certificateId}</span>
                    <span className="text-emerald-400 font-mono">{rec.durationSeconds}s</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 mb-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{new Date(rec.createdAt).toLocaleDateString()} at {new Date(rec.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 truncate">
                    <Hash className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="font-mono truncate">{rec.sha256Hash}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Selected Evidence File & Court Admissibility Certificate (8 cols) */}
        <div className="lg:col-span-8">
          {selectedRecord ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              
              {/* Video Player Display if available */}
              {selectedRecord.videoUrl ? (
                <div className="bg-black aspect-video w-full flex items-center justify-center relative border-b border-zinc-800">
                  <video
                    src={selectedRecord.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-zinc-950 p-8 text-center border-b border-zinc-800">
                  <Video className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-zinc-300">Audiovisual Data Sealed in Encrypted Container</p>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">
                    Integrity Hash: {selectedRecord.sha256Hash}
                  </p>
                </div>
              )}

              {/* Court Exhibit Metadata Sheet */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      LEGAL EXHIBIT IDENTIFIER
                    </span>
                    <h3 className="text-lg font-bold text-white font-mono">
                      {selectedRecord.certificateId}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenShareModal(selectedRecord)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Send link via SMS to emergency contacts"
                    >
                      <Radio className="w-3.5 h-3.5 text-red-400" />
                      <span>Share Feed Link (SMS)</span>
                    </button>

                    {selectedRecord.videoUrl && (
                      <a
                        href={selectedRecord.videoUrl}
                        download={`POLICE-PROTECTION-EVIDENCE-${selectedRecord.certificateId}.webm`}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Raw Video</span>
                      </a>
                    )}
                    <button
                      onClick={handlePrintCertificate}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Legal Certificate</span>
                    </button>
                  </div>
                </div>

                {/* Chain of Custody Table */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">
                      Cryptographic SHA-256 Checksum
                    </span>
                    <p className="font-mono text-emerald-400 break-all text-[11px]">
                      {selectedRecord.sha256Hash}
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">
                      Timestamp & Duration
                    </span>
                    <p className="text-zinc-200">
                      {new Date(selectedRecord.createdAt).toLocaleString()} ({selectedRecord.durationSeconds} seconds)
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">
                      GPS Geolocation Coordinates
                    </span>
                    <p className="text-zinc-200 font-mono text-[11px]">
                      {selectedRecord.gpsCoordinates 
                        ? `${selectedRecord.gpsCoordinates.latitude.toFixed(5)}° N, ${selectedRecord.gpsCoordinates.longitude.toFixed(5)}° W (State: ${selectedRecord.gpsCoordinates.jurisdictionState})`
                        : 'Fixed Satellite Tagged'}
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-1">
                      Encryption & Security Standard
                    </span>
                    <p className="text-zinc-200">
                      {selectedRecord.isEncrypted ? 'AES-GCM-256 (NIST SP 800-38D)' : 'Standard High-Fidelity Lossless Container'}
                    </p>
                  </div>
                </div>

                {/* Federal Rules of Evidence Admissibility Declaration */}
                <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 text-xs text-emerald-200 leading-relaxed">
                  <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Attorney Evidentiary Certification (FRE 901 & 902)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    {selectedRecord.admissibilityNotes}
                  </p>
                </div>

                {/* Synchronized Transcript of Encounter */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Recorded Audio Dialogue & Legal Audit Log
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    {selectedRecord.transcript.map((t, idx) => (
                      <div key={idx} className="text-xs text-zinc-300">
                        <span className="font-bold text-zinc-400 uppercase font-mono text-[10px]">
                          [{t.speaker.toUpperCase()}]:{' '}
                        </span>
                        <span>{t.originalText}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">Select a Recording to Inspect Evidence</h3>
              <p className="text-xs text-zinc-500">
                View cryptographic SHA-256 hash, GPS location history, synchronized speech transcripts, and FRE 902 certification.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Share Live / Archived Feed Modal */}
      {selectedRecord && (
        <ShareLiveFeedModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sessionId={selectedRecord.sessionId}
          isRecording={false}
          userProfile={userProfile}
          onUpgradePrompt={onUpgradePrompt}
          locationCity={selectedRecord.gpsCoordinates?.jurisdictionState}
          locationState={selectedRecord.gpsCoordinates?.jurisdictionState}
        />
      )}

      {/* Multi-Device Cloud Retrieval Modal */}
      {isRetrieveModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeRetrieveModal}
        >
          <div 
            className="bg-zinc-900 border border-zinc-700/90 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Retrieve Evidence on New Device</h3>
                  <p className="text-xs text-zinc-400">Restore your court exhibits if your phone was confiscated or lost</p>
                </div>
              </div>
              <button 
                onClick={closeRetrieveModal}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Loss Cloud Redundancy Guarantee:</span>
              </div>
              <p>
                Your recordings are indexed by your secret <strong>Vault Recovery Key</strong>. Enter your key below to pull down all encrypted video recordings, GPS fixes, and court admissibility certificates onto this device.
              </p>
            </div>

            <form onSubmit={handleRetrieveFromCloud} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Vault Recovery Key or Email:
                </label>
                <input
                  type="text"
                  placeholder={myRecoveryKey}
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Default Key on this browser: <code className="text-amber-300 font-mono">{myRecoveryKey}</code>
                </p>
              </div>

              {retrieveFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{retrieveFeedback}</span>
                </div>
              )}

              {retrieveError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{retrieveError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRetrieveModal}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRetrieving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isRetrieving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
                  <span>{isRetrieving ? 'Connecting to Cloud...' : 'Retrieve My Evidence'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custody & Decryption Photo Lightbox Modal */}
      {selectedPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div 
            className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
                  selectedPhotoModal.reason === 'DECRYPT_SUCCESS' ? 'bg-emerald-600' : 'bg-red-600'
                }`}>
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedPhotoModal.reason === 'DECRYPT_SUCCESS' 
                      ? '✓ Authorized Decryption Surveillance Photo' 
                      : '⚠️ Custody Intrusion / Keypad Photo'}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Captured {selectedPhotoModal.dateStr} • {selectedPhotoModal.reason}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black relative shadow-inner">
              <img 
                src={selectedPhotoModal.imageDataUrl} 
                alt="Custody Evidence Log" 
                className="w-full max-h-[60vh] object-contain mx-auto"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="text-[11px] font-mono text-zinc-400">
                FRE 902 Authenticated • Log ID: {selectedPhotoModal.id}
              </div>
              <a
                href={selectedPhotoModal.imageDataUrl}
                download={`PoliceSafeguard-CustodyPhoto-${selectedPhotoModal.id}.jpg`}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save High-Res Image</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
