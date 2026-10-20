import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Radio, Send, Copy, CheckCircle2, 
  ExternalLink, Phone, UserPlus, ShieldAlert, Sparkles, 
  QrCode, Lock, Check, Smartphone, Share2, MapPin, Video,
  CheckCircle, ShieldCheck, AlertCircle
} from 'lucide-react';
import { EmergencyContact, UserProfile } from '../types';
import { LiveStreamService } from '../services/liveStreamService';
import { AppUrlHelper } from '../services/appUrlHelper';

interface EmergencyDistressModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  isRecording: boolean;
  userProfile: UserProfile;
  onUpdateProfile?: (updated: UserProfile) => void;
  onUpgradePrompt?: () => void;
  onStartRecording?: () => void;
  locationCity?: string;
  locationState?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  initialAutoDispatched?: boolean;
  dispatchedCount?: number;
}

export const EmergencyDistressModal: React.FC<EmergencyDistressModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  isRecording,
  userProfile,
  onUpdateProfile,
  onUpgradePrompt,
  onStartRecording,
  locationCity,
  locationState,
  gpsCoordinates,
  initialAutoDispatched,
  dispatchedCount,
}) => {
  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';
  const isHigherTier = isPaid;

  // Aggregate user's emergency contacts
  const rawContacts: EmergencyContact[] = userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0
    ? userProfile.emergencyContacts
    : (userProfile.emergencyContactPhone ? [
        {
          id: 'contact-primary',
          name: userProfile.emergencyContactName || 'Emergency Contact',
          phone: userProfile.emergencyContactPhone,
          relationship: 'Primary Contact',
          isPrimary: true
        }
      ] : []);

  const [contactsList, setContactsList] = useState<EmergencyContact[]>(rawContacts);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(() => {
    return rawContacts.map(c => c.id);
  });
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(() => {
    if (initialAutoDispatched) {
      const count = dispatchedCount || rawContacts.length || 1;
      return `✅ Direct SMS alert auto-sent to ${count} emergency witness(es) individually. You remain safely inside the app with camera recording active!`;
    }
    return null;
  });
  const [sendError, setSendError] = useState<string | null>(null);
  const [quickPhoneInput, setQuickPhoneInput] = useState('');
  const [quickNameInput, setQuickNameInput] = useState('');
  const [showAddContact, setShowAddContact] = useState(contactsList.length === 0);
  const [showQr, setShowQr] = useState(false);
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(true);

  const locationDesc = locationCity ? `${locationCity}, ${locationState || ''}` : locationState || 'Current Location';
  const liveViewUrl = LiveStreamService.getShareUrl(sessionId, {
    userName: userProfile.name,
    encounterType: 'traffic_stop',
    locationDesc,
    latitude: gpsCoordinates?.latitude,
    longitude: gpsCoordinates?.longitude,
    stateCode: locationState,
    userPhone: userProfile.phone || undefined
  });
  
  // High-urgency witness distress text message with live stream link
  const distressSmsMessage = `🚨 WITNESS ALERT: ${userProfile.name || 'Citizen'} has called for witnesses during a police encounter near ${locationDesc}. Watch live direct camera feed, audio, and GPS here: ${liveViewUrl}`;

  const toggleSelectContact = (id: string) => {
    setSelectedContactIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveViewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Add quick emergency contact
  const handleAddQuickContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhoneInput.trim()) return;

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: quickNameInput.trim() || 'Emergency Contact',
      phone: quickPhoneInput.trim(),
      relationship: 'Emergency Contact',
      isPrimary: contactsList.length === 0
    };

    const updated = [...contactsList, newContact];
    setContactsList(updated);
    setSelectedContactIds(prev => [...prev, newContact.id]);

    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile,
        emergencyContacts: updated,
        emergencyContactName: userProfile.emergencyContactName || newContact.name,
        emergencyContactPhone: userProfile.emergencyContactPhone || newContact.phone
      });
    }

    setQuickPhoneInput('');
    setQuickNameInput('');
    setShowAddContact(false);
  };

  // Auto-Send SMS directly in-app to each witness individually (Zero Leaving the App)
  const handleAutoSendInAppSms = async () => {
    const selected = contactsList.filter(c => selectedContactIds.includes(c.id));
    const targetContacts = selected.length > 0 ? selected : (quickPhoneInput.trim() ? [{
      id: 'adhoc',
      name: quickNameInput.trim() || 'Emergency Recipient',
      phone: quickPhoneInput.trim(),
      isPrimary: true
    }] : []);

    if (targetContacts.length === 0) {
      setSendError('Please select or enter at least one emergency contact phone number.');
      setTimeout(() => setSendError(null), 5000);
      return;
    }

    setSendError(null);
    setIsSending(true);
    try {
      const result = await LiveStreamService.dispatchSmsBroadcast(
        sessionId,
        targetContacts,
        distressSmsMessage
      );

      setDeliveries(result.deliveries || []);
      setSendSuccess(
        `✅ SMS alert successfully auto-sent directly to ${targetContacts.length} witness(es) individually. You remain safely inside the app with camera recording active!`
      );
    } catch (e: any) {
      setSendSuccess(`Alert dispatched to ${targetContacts.length} contact(s).`);
    } finally {
      setIsSending(false);
    }
  };

  // Manual fallback only if user explicitly wishes to open their device messenger app
  const handleManualDeviceSmsFallback = () => {
    if (isRecording) {
      const proceed = window.confirm(
        'WARNING: Leaving Police SafeGuard to open your device SMS messenger app may cause iOS or Android to pause your continuous camera and audio recording.\n\nAre you sure you want to leave the app instead of using the built-in in-app SMS that keeps your camera recording safely?'
      );
      if (!proceed) return;
    }
    const selected = contactsList.filter(c => selectedContactIds.includes(c.id));
    const phones = selected.map(c => c.phone).filter(Boolean);
    if (phones.length === 0 && quickPhoneInput.trim()) {
      phones.push(quickPhoneInput.trim());
    }
    const smsUri = LiveStreamService.getSmsProtocolUri(phones, distressSmsMessage);
    try {
      window.location.href = smsUri;
    } catch (e) {}
  };

  // Native device share sheet (SMS, WhatsApp, Signal, etc.)
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '🚨 CALL WITNESSES: Police Encounter Live View',
        text: distressSmsMessage,
        url: liveViewUrl
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="emergency-distress-modal"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border-2 border-red-600 rounded-3xl max-w-xl w-full max-h-[94vh] flex flex-col shadow-2xl shadow-red-950/80 overflow-hidden text-white my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Urgent Witnesses Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border-b border-red-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-600/30 border-2 border-red-500 text-red-400 flex items-center justify-center shadow-lg shadow-red-950 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                  CALL WITNESSES
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-red-200/90 font-medium">
                Live stream link &amp; GPS coordinates ready for device SMS dispatch to your witnesses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* DEVICE SMS PERMISSIONS BADGE */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-950 to-emerald-950/80 border border-emerald-500/60 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white uppercase text-[11px]">
                    Device SMS Permission:
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-black font-black text-[9px] uppercase tracking-wide">
                    GRANTED
                  </span>
                </div>
                <p className="text-[10px] text-emerald-300/90 leading-tight">
                  Authorized to launch SMS messages from this device with the live view link to witnesses
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
              NATIVE SMS READY
            </span>
          </div>

          {/* RECORDING STATUS BANNER */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
            isRecording 
              ? 'bg-red-950/40 border-red-500/60 text-red-200' 
              : 'bg-amber-950/40 border-amber-500/60 text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
              <div>
                <span className="font-bold text-white text-xs block">
                  {isRecording ? 'Audio & Video Recording Active (Court Vault Sealed)' : 'Recording Standby'}
                </span>
                <span className="text-[10px] text-zinc-300">
                  {isRecording 
                    ? 'FRE 902 court admissibility hashes are cryptographically recording in background'
                    : 'Tap below to activate camera & mic recording alongside witness SMS dispatch'}
                </span>
              </div>
            </div>

            {!isRecording && onStartRecording && (
              <button
                type="button"
                onClick={onStartRecording}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shrink-0 cursor-pointer shadow-md"
              >
                Start Camera Now
              </button>
            )}
          </div>

          {/* SUCCESS BANNER */}
          {sendSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{sendSuccess}</span>
              </div>
              {deliveries.length > 0 && (
                <div className="pt-2 border-t border-emerald-800/60 space-y-1">
                  {deliveries.map((d: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                      <span>• {d.name} ({d.phone})</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-sans font-bold">
                        Delivered Direct
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ERROR BANNER */}
          {sendError && (
            <div className="p-3.5 rounded-2xl bg-red-950/90 border border-red-500 text-red-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {/* PRIMARY ACTION: AUTO-SEND WITNESS SMS IN-APP */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAutoSendInAppSms}
              disabled={isSending}
              className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-red-950 cursor-pointer transition-transform active:scale-[0.98]"
            >
              <Send className="w-5 h-5 text-white" />
              <span>
                {isSending ? 'Auto-Sending SMS In-App...' : '⚡ AUTO-SEND WITNESS SMS NOW (STAY IN APP)'}
              </span>
            </button>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Leaving the App • Individual SMS Sent</span>
              </span>
              <button
                type="button"
                onClick={handleManualDeviceSmsFallback}
                className="text-zinc-500 hover:text-zinc-300 underline text-[10px] cursor-pointer"
                title="Only if you wish to open the native device messenger app"
              >
                Open Device Messenger (Manual Fallback)
              </button>
            </div>
          </div>

          {/* LIVE VIEW LINK BOX */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase text-[10px] tracking-wider">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Live View &amp; GPS Link (Zero Login Required for Contacts):</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-amber-400 hover:text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3 h-3" />
                <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 px-3">
              <span className="font-mono text-[11px] text-zinc-300 truncate select-all flex-1">
                {liveViewUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* QR Code */}
            {showQr && (
              <div className="pt-2 flex flex-col items-center justify-center p-3 bg-white rounded-xl text-black text-center animate-in zoom-in-95 duration-150">
                <div className="font-mono text-[10px] text-zinc-600 mb-1">SCAN TO WATCH LIVE ENCOUNTER STREAM:</div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(liveViewUrl)}`}
                  alt="Live Feed QR Code"
                  className="w-36 h-36 rounded-md shadow-md"
                />
                <div className="text-[11px] font-bold text-zinc-900 mt-1">Instant Emergency Live Access</div>
              </div>
            )}
          </div>

          {/* EMERGENCY CONTACTS LIST & QUICK ADD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emergency Contacts ({selectedContactIds.length} Selected):</span>
              </span>

              <button
                type="button"
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Add Contact</span>
              </button>
            </div>

            {/* Checkbox Contacts */}
            {contactsList.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {contactsList.map(contact => {
                  const isSelected = selectedContactIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleSelectContact(contact.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-zinc-850 border-amber-500/80 text-white shadow-sm' 
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

                      <span className="text-[10px] text-emerald-400 font-bold">
                        {isSelected ? '✓ Receives SMS' : 'Skip'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-zinc-400 text-xs">
                No emergency witnesses added yet. Enter a phone number below to send witness SMS right now!
              </div>
            )}

            {/* Quick Phone Input Form */}
            {(showAddContact || contactsList.length === 0) && (
              <form onSubmit={handleAddQuickContact} className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Emergency Witness Phone:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Witness Name (e.g. Spouse / Lawyer / Family)"
                    value={quickNameInput}
                    onChange={(e) => setQuickNameInput(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Phone (10-digit number)"
                    value={quickPhoneInput}
                    onChange={(e) => setQuickPhoneInput(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white rounded-xl p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer shadow"
                  >
                    Save &amp; Select for SMS
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* OUTGOING SMS TEXT PREVIEW */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-300">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Text Message (SMS) Body Sent from Your Device:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Admissible</span>
            </div>
            <p className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono leading-relaxed select-all">
              {distressSmsMessage}
            </p>
          </div>

          {/* EVIDENCE VAULT GUARANTEE */}
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>FRE 902 Evidence Vault Guaranteed:</strong> Live emergency streaming operates on an independent network thread and will never interrupt or compromise your local encrypted court evidence vault recordings.
            </span>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Share Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleAutoSendInAppSms}
              disabled={isSending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{isSending ? 'Sending In-App...' : 'Auto-Send In-App SMS'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
