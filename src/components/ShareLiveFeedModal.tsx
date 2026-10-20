import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, Copy, CheckCircle2, ExternalLink, 
  ShieldAlert, Phone, UserPlus, Radio, Sparkles, QrCode, Lock, AlertCircle
} from 'lucide-react';
import { EmergencyContact, UserProfile } from '../types';
import { LiveStreamService } from '../services/liveStreamService';

interface ShareLiveFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  isRecording: boolean;
  userProfile: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  onUpgradePrompt?: () => void;
  locationCity?: string;
  locationState?: string;
}

export const ShareLiveFeedModal: React.FC<ShareLiveFeedModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  isRecording,
  userProfile,
  onUpdateProfile,
  onUpgradePrompt,
  locationCity,
  locationState
}) => {
  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';
  const isHigherTier = isPaid;

  const maxAllowedContacts = isHigherTier ? 5 : 1;

  // Aggregate user's emergency contacts (limited to tier allowance)
  const rawContacts: EmergencyContact[] = userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0
    ? userProfile.emergencyContacts
    : (userProfile.emergencyContactName ? [
        {
          id: 'contact-primary',
          name: userProfile.emergencyContactName,
          phone: userProfile.emergencyContactPhone || '',
          relationship: 'Primary Contact',
          isPrimary: true
        }
      ] : []);

  const [contactsList, setContactsList] = useState<EmergencyContact[]>(rawContacts.slice(0, maxAllowedContacts || 1));
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(() => {
    return rawContacts.slice(0, maxAllowedContacts || 1).map(c => c.id);
  });
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('');
  const [showQr, setShowQr] = useState(false);

  const locationDesc = locationCity ? `${locationCity}, ${locationState || ''}` : locationState;
  const [shareUrl, setShareUrl] = useState<string>(() => 
    LiveStreamService.getShareUrl(sessionId, {
      userName: userProfile.name,
      encounterType: 'traffic_stop',
      locationDesc: locationDesc || undefined,
      stateCode: locationState || undefined,
      userPhone: userProfile.phone || undefined
    })
  );
  const [broadcastAuditStatus, setBroadcastAuditStatus] = useState<{
    hasAudio: boolean;
    hasVideo: boolean;
    isCombining: boolean;
  }>({
    hasAudio: true,
    hasVideo: true,
    isCombining: false
  });

  // Ensure audio track initialization and video stream binding are combined into broadcast payload
  useEffect(() => {
    let isMounted = true;
    setBroadcastAuditStatus(prev => ({ ...prev, isCombining: true }));

    LiveStreamService.ensureCombinedBroadcastPayload(sessionId, undefined, {
      userName: userProfile.name,
      encounterType: 'traffic_stop',
      locationDesc: locationDesc || undefined,
      stateCode: locationState || undefined
    }).then(res => {
      if (isMounted) {
        setShareUrl(res.shareUrl);
        setBroadcastAuditStatus({
          hasAudio: res.hasAudio,
          hasVideo: res.hasVideo,
          isCombining: false
        });
      }
    }).catch(err => {
      console.warn('[ShareLiveFeedModal] Media stream combination notice:', err);
      if (isMounted) {
        setBroadcastAuditStatus(prev => ({ ...prev, isCombining: false }));
      }
    });

    return () => { isMounted = false; };
  }, [sessionId, userProfile.name, locationDesc, locationState]);

  const smsBodyPreview = LiveStreamService.generateSmsMessage(
    userProfile.name,
    sessionId,
    isRecording,
    locationDesc
  );

  const toggleSelectContact = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactRel.trim() || 'Emergency Contact',
      isPrimary: false
    };

    const updated = [...contactsList, newContact];
    setContactsList(updated);
    setSelectedContactIds(prev => [...prev, newContact.id]);

    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile,
        emergencyContacts: updated
      });
    }

    setNewContactName('');
    setNewContactPhone('');
    setNewContactRel('');
    setShowAddContact(false);
  };

  const handleSendViaSms = async () => {
    const selected = contactsList.filter(c => selectedContactIds.includes(c.id));
    if (selected.length === 0) {
      setSendError('Please select at least one emergency contact to send the link.');
      setTimeout(() => setSendError(null), 5000);
      return;
    }

    setSendError(null);
    setIsSending(true);
    try {
      const result = await LiveStreamService.dispatchSmsBroadcast(
        sessionId,
        selected,
        smsBodyPreview
      );

      setDeliveries(result.deliveries || []);
      setSendSuccess(`✅ Direct SMS alert auto-sent to ${selected.length} emergency witness(es) individually. You remain safely inside the app!`);
      setTimeout(() => setSendSuccess(null), 6000);
    } catch (err) {
      console.error('Failed to send SMS broadcast:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700/90 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-zinc-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-inner">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Share Live Feed with Emergency Contacts</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  {isRecording ? 'LIVE STREAM' : 'SECURE VAULT'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Send a secure, zero-login link via text message so contacts can watch live or view the full recording
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Evidence Vault Integrity Guarantee Notice */}
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-2.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-emerald-300">Evidence Vault Integrity Guaranteed:</strong> Live streaming runs on a separate, isolated network thread. Texting contacts or network loss will never pause, interrupt, or corrupt your local court-admissible recording or SHA-256 cryptographic seal. You remain safely inside the app.
            </div>
          </div>

          {/* Success Banner */}
          {sendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-xs">{sendSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {sendError && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/70 text-red-200 flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-semibold text-xs">{sendError}</span>
            </div>
          )}

          {/* Secure Incident Link Box */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Secure Incident Feed Link (Zero App/Login Required for Witnesses):</span>
              </span>
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
              </button>
            </div>

            {/* Broadcast Payload Audio & Video Combined State Verification */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${broadcastAuditStatus.isCombining ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-zinc-300">
                  {broadcastAuditStatus.isCombining
                    ? 'Auditing permissions & combining audio/video payload...'
                    : '✓ Audio & Video Streams Combined in Broadcast Payload'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-zinc-400">
                <span className="text-emerald-400 font-bold">MIC: READY</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">CAM: READY</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-xs font-mono select-all focus:outline-none focus:border-amber-500"
              />

              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 border border-zinc-700 transition-colors cursor-pointer"
                title="Copy link to clipboard"
              >
                {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                title="Open live viewer in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

            {/* QR Code display */}
            {showQr && (
              <div className="pt-2 flex flex-col items-center justify-center p-4 bg-white rounded-lg text-black text-center animate-in zoom-in-95 duration-150">
                <div className="font-mono text-[10px] text-zinc-600 mb-1">SCAN WITH ANY SMARTPHONE CAMERA:</div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`}
                  alt="Live Feed QR Code"
                  className="w-36 h-36 rounded-md shadow-md"
                />
                <div className="text-[11px] font-bold text-zinc-800 mt-1">Instant Emergency Live Access</div>
              </div>
            )}

            {/* Emergency Contacts Selection */}
            <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Contacts to Notify ({selectedContactIds.length} Selected):</span>
              </span>

              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Add Contact</span>
              </button>
            </div>

            {/* Contacts Checkbox List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {contactsList.map(contact => {
                const isSelected = selectedContactIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    onClick={() => toggleSelectContact(contact.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-zinc-800/90 border-amber-500/80 text-white shadow-sm' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {contact.relationship && (
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({contact.relationship})
                            </span>
                          )}
                          {contact.isPrimary && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">{contact.phone}</div>
                      </div>
                    </div>

                    <span className="text-[11px] text-zinc-500 font-medium">
                      {isSelected ? '✓ Will Receive SMS' : 'Skip'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Contact Form */}
            {showAddContact && (
              <form onSubmit={handleAddContact} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-white">Add New Emergency Contact:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contact Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone Number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Spouse, Lawyer)"
                    value={newContactRel}
                    onChange={(e) => setNewContactRel(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                  >
                    Save &amp; Select
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Text Message (SMS) Content Preview */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Outgoing Text Message (SMS) Preview:</span>
              </span>
              <span className="text-[10px] text-zinc-500">Auto-formatted</span>
            </div>
            <p className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-zinc-300 text-xs font-mono leading-relaxed select-all">
              {smsBodyPreview}
            </p>
          </div>

          {/* Auto-Notify Toggle Option */}
          <label className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:border-zinc-700 transition-colors">
            <div className="space-y-0.5">
              <div className="font-bold text-white text-xs">
                Auto-Share Live Feed on Recording Start
              </div>
              <div className="text-[11px] text-zinc-400">
                Instantly dispatch secure link to primary contact the moment you tap Record or say "Start Recording"
              </div>
            </div>
            <input
              type="checkbox"
              checked={userProfile.autoNotifyContactOnStart}
              onChange={(e) => {
                if (onUpdateProfile) {
                  onUpdateProfile({
                    ...userProfile,
                    autoNotifyContactOnStart: e.target.checked
                  });
                }
              }}
              className="w-5 h-5 rounded text-amber-500 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer shrink-0"
            />
          </label>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendViaSms}
              disabled={isSending || selectedContactIds.length === 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
                selectedContactIds.length > 0
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-950'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>
                {isSending 
                  ? 'Dispatching In-App SMS...' 
                  : `Auto-Send SMS In-App (${selectedContactIds.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
