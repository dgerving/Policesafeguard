import React, { useState, useRef } from 'react';
import { 
  User, Globe, Phone, Shield, Volume2, KeyRound, 
  Car, HeartPulse, X, Check, Sparkles, Coins,
  Plus, Trash2, Star, AlertCircle, Radio, Copy, Download,
  Mic, Square, Play, Sliders, ShieldCheck,
  UserX, EyeOff, ShieldAlert, HeartHandshake,
  Palette, Wifi, WifiOff, Eye, EyeOff as EyeOffIcon,
  AlertTriangle, CheckCircle2, Lock, Camera,
  FileText, ExternalLink, CreditCard, RefreshCw, Layers,
  Image as ImageIcon, Infinity as InfinityIcon, LogOut, Upload
} from 'lucide-react';
import { UserProfile, EmergencyContact, VoiceTrainingProfile } from '../types';
import { SUPPORTED_LANGUAGES } from '../services/translator';
import { AVAILABLE_VOICES, VoiceEngine } from '../services/voiceEngine';
import { US_STATE_LIST } from '../data/jurisdictions';
import { VoiceBiometricsService } from '../services/voiceBiometricsService';
import { AuthClient } from '../services/authClient';

type ProfileTab = 'personal' | 'language' | 'appearance' | 'customization' | 'voice' | 'arrest' | 'subscription' | 'medical';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onUpgradePrompt: () => void;
  onOpenAccountOnboarding?: () => void;
  onOpenOfficialDomainModal?: () => void;
  onOpenAccountManagement?: (tab?: 'unsubscribe' | 'purge_personal' | 'delete_account') => void;
  onOpenCharityModal?: () => void;
  onLogout?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
  onUpgradePrompt,
  onOpenAccountOnboarding,
  onOpenOfficialDomainModal,
  onOpenAccountManagement,
  onOpenCharityModal,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [showPin, setShowPin] = useState(false);
  const [testVoicePlaying, setTestVoicePlaying] = useState<string | null>(null);

  // Riley v. California Lockdown PIN security & ownership verification states
  const [isPinOwnershipVerified, setIsPinOwnershipVerified] = useState(false);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [pinVerificationError, setPinVerificationError] = useState<string | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinSaveFeedback, setPinSaveFeedback] = useState<string | null>(null);
  const [isVerifyingOwnership, setIsVerifyingOwnership] = useState(false);

  const [formData, setFormData] = useState<UserProfile>({ 
    ...userProfile,
    emergencyContacts: userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0
      ? [...userProfile.emergencyContacts]
      : userProfile.emergencyContactPhone
      ? [
          {
            id: 'primary-c',
            name: userProfile.emergencyContactName || 'Emergency Contact',
            phone: userProfile.emergencyContactPhone,
            relationship: 'Primary Contact',
            isPrimary: true
          }
        ]
      : []
  });

  // Keep formData synchronized when userProfile updates
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        ...userProfile,
        emergencyContacts: userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0
          ? [...userProfile.emergencyContacts]
          : prev.emergencyContacts
      }));
    }
  }, [isOpen, userProfile]);

  // Check paid subscription status
  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';

  // Instant Theme Switcher Handler - immediately updates app and storage
  const handleSelectTheme = (themeId: 'tactical_dark' | 'midnight_blue' | 'carbon_fiber' | 'amber_gold' | 'crimson_guard' | 'forest_camo') => {
    const updated: UserProfile = {
      ...userProfile,
      ...formData,
      appTheme: themeId,
      customBackgroundImageUrl: undefined // Clear custom wallpaper so chosen theme color atmosphere is 100% visible
    };
    setFormData(updated);
    onSave(updated);
    try {
      localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
      localStorage.removeItem('civicshield_profile');
      document.documentElement.setAttribute('data-theme', themeId);
      document.body.setAttribute('data-theme', themeId);
      const rootEl = document.getElementById('police-safeguard-app-root') || document.getElementById('root');
      if (rootEl) {
        rootEl.setAttribute('data-theme', themeId);
      }
    } catch (e) {}
  };

  const handleOpacityChange = (opacity: number) => {
    if (!isPaid) {
      if (onUpgradePrompt) onUpgradePrompt();
      return;
    }
    const updated: UserProfile = {
      ...userProfile,
      ...formData,
      backgroundOpacity: opacity
    };
    setFormData(updated);
    onSave(updated);
    try {
      localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
    } catch (e) {}
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wallpaperUploadError, setWallpaperUploadError] = useState<string | null>(null);

  const handleWallpaperChange = (url?: string) => {
    const updated: UserProfile = {
      ...userProfile,
      ...formData,
      customBackgroundImageUrl: url
    };
    setFormData(updated);
    onSave(updated);
    try {
      localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleVerifyOwnershipForPin = async () => {
    setPinVerificationError(null);
    if (!verifyPasswordInput.trim()) {
      setPinVerificationError('Please enter your account password or current PIN to verify profile ownership.');
      return;
    }
    setIsVerifyingOwnership(true);
    try {
      const cleanInput = verifyPasswordInput.trim();
      const currentPin = formData.duressLockPin || userProfile.duressLockPin || '7482';
      const cleanEmail = (userProfile.email || '').toLowerCase().trim();
      
      // Check 1: matches current PIN
      if (cleanInput === currentPin) {
        setIsPinOwnershipVerified(true);
        setNewPinInput('');
        setConfirmPinInput('');
        setIsVerifyingOwnership(false);
        return;
      }

      // Check 2: verify against stored account password hash
      const accountsRaw = localStorage.getItem('police_safeguard_saved_accounts');
      const accounts = accountsRaw ? JSON.parse(accountsRaw) : {};
      const acc = accounts[cleanEmail];
      if (acc && acc.passwordHash && acc.passwordHash === btoa(cleanInput)) {
        setIsPinOwnershipVerified(true);
        setNewPinInput('');
        setConfirmPinInput('');
        setIsVerifyingOwnership(false);
        return;
      }

      // Check 3: verify against recovery key
      const savedKey = localStorage.getItem('police_safeguard_recovery_key');
      if (savedKey && cleanInput.toUpperCase() === savedKey.toUpperCase()) {
        setIsPinOwnershipVerified(true);
        setNewPinInput('');
        setConfirmPinInput('');
        setIsVerifyingOwnership(false);
        return;
      }

      setPinVerificationError('Incorrect password or current PIN. You must prove profile ownership to modify the Arrest Lockdown PIN.');
    } catch (e) {
      setPinVerificationError('Verification failed. Please check credentials.');
    } finally {
      setIsVerifyingOwnership(false);
    }
  };

  const handleSaveNewPin = () => {
    setPinVerificationError(null);
    setPinSaveFeedback(null);
    const cleanNew = newPinInput.replace(/\D/g, '');
    if (cleanNew.length < 4 || cleanNew.length > 8) {
      setPinVerificationError('PIN must be between 4 and 8 digits.');
      return;
    }
    if (cleanNew !== confirmPinInput.replace(/\D/g, '')) {
      setPinVerificationError('New PIN and confirmation PIN do not match.');
      return;
    }

    const updated: UserProfile = {
      ...userProfile,
      ...formData,
      duressLockPin: cleanNew
    };
    setFormData(updated);
    onSave(updated);
    try {
      localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
    } catch (e) {}
    AuthClient.updateProfile({ duressLockPin: cleanNew }).catch(() => {});
    setPinSaveFeedback(`✅ Arrest Lockdown PIN successfully updated to ${cleanNew}!`);
    setTimeout(() => {
      setPinSaveFeedback(null);
      setIsPinOwnershipVerified(false);
      setVerifyPasswordInput('');
    }, 4000);
  };

  const compressImageFile = (file: File, maxDimension = 1920, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file from device'));
      reader.readAsDataURL(file);
    });
  };

  const handleDeviceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setWallpaperUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setWallpaperUploadError('Please choose a valid photo file (JPG, PNG, WEBP, GIF, HEIC).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setWallpaperUploadError('Selected image is over 25MB. Please choose a smaller photo.');
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, 1920, 0.85);
      handleWallpaperChange(compressedDataUrl);
    } catch (err: any) {
      setWallpaperUploadError(err?.message || 'Could not process photo from your device.');
    }
  };

  // Emergency Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Family');
  const [contactError, setContactError] = useState<string | null>(null);

  // Voice Biometrics State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceVolLevel, setVoiceVolLevel] = useState(0);
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [voiceBiometricError, setVoiceBiometricError] = useState<string | null>(null);
  const [voiceBiometricSuccess, setVoiceBiometricSuccess] = useState<string | null>(null);

  const calibrationSentence = "Officer, I am exercising my right to remain silent and I do not consent to any searches.";

  const handleRecordVoiceProfile = async () => {
    setVoiceBiometricError(null);
    setVoiceBiometricSuccess(null);
    setIsRecordingVoice(true);
    setVoiceProgress(0);
    setVoiceVolLevel(0);

    try {
      const sample = await VoiceBiometricsService.recordVoiceProfileSample(
        calibrationSentence,
        4500,
        (pct, vol) => {
          setVoiceProgress(pct);
          setVoiceVolLevel(vol);
        }
      );

      const updatedVoiceProfile: VoiceTrainingProfile = {
        isTrained: true,
        trainedAt: Date.now(),
        sampleCount: (formData.voiceTraining?.sampleCount || 0) + 1,
        trainedPhrases: [calibrationSentence],
        confidenceThreshold: 85,
        audioSampleDataUrl: sample.audioDataUrl,
        audioDurationMs: sample.durationMs,
        pitchHz: sample.pitchHz,
        spectralCentroid: sample.spectralCentroid,
        voiceLockActive: true,
        sensitivity: formData.voiceTraining?.sensitivity || 'balanced'
      };

      setFormData(prev => ({
        ...prev,
        voiceTraining: updatedVoiceProfile
      }));

      setVoiceBiometricSuccess(`Voice profile successfully calibrated (~${sample.pitchHz}Hz). AI voice lock active!`);
    } catch (err: any) {
      console.error('Voice recording error:', err);
      setVoiceBiometricError(err.message || 'Microphone recording failed. Please check permissions.');
    } finally {
      setIsRecordingVoice(false);
      setVoiceProgress(0);
      setVoiceVolLevel(0);
    }
  };

  const handlePlaySavedVoiceSample = () => {
    if (!formData.voiceTraining?.audioSampleDataUrl) return;
    setIsPlayingVoiceSample(true);
    VoiceBiometricsService.playSavedAudio(formData.voiceTraining.audioSampleDataUrl, () => {
      setIsPlayingVoiceSample(false);
    });
  };

  const handleClearVoiceProfile = () => {
    setFormData(prev => ({
      ...prev,
      voiceTraining: undefined
    }));
    setVoiceBiometricSuccess(null);
    setVoiceBiometricError('Voice profile removed. AI voice lock disabled.');
  };

  const handleTestVoice = (voiceId: string) => {
    setTestVoicePlaying(voiceId);
    VoiceEngine.speakAdvice(
      "Officer, I am remaining silent and do not consent to searches.",
      voiceId,
      formData.whisperModeEnabled
    );
    setTimeout(() => {
      setTestVoicePlaying(null);
    }, 2800);
  };

  if (!isOpen) return null;

  const contactsList = formData.emergencyContacts || [];

  const handleAddContact = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setContactError(null);

    const maxAllowedContacts = isPaid ? 5 : 1;
    if (contactsList.length >= maxAllowedContacts) {
      if (!isPaid) {
        setContactError('Free tier allows 1 emergency witness contact. Upgrade to Pro ($3.99/mo) with a 30-day free trial to unlock up to 5 witness contacts with live video broadcasting.');
        if (onUpgradePrompt) onUpgradePrompt();
      } else {
        setContactError('Maximum of 5 emergency contacts reached.');
      }
      return;
    }

    if (!newContactName.trim()) {
      setContactError('Contact name is required.');
      return;
    }

    const cleanPhone = newContactPhone.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      setContactError('Please enter a valid phone number with area code.');
      return;
    }

    const newContact: EmergencyContact = {
      id: `c_${Date.now()}`,
      name: newContactName.trim(),
      phone: cleanPhone,
      relationship: newContactRel,
      isPrimary: contactsList.length === 0
    };

    const updated = [...contactsList, newContact];
    setFormData(prev => ({
      ...prev,
      emergencyContacts: updated,
      emergencyContactName: updated.find(c => c.isPrimary)?.name || updated[0].name,
      emergencyContactPhone: updated.find(c => c.isPrimary)?.phone || updated[0].phone
    }));

    setNewContactName('');
    setNewContactPhone('');
  };

  const handleRemoveContact = (id: string) => {
    const filtered = contactsList.filter(c => c.id !== id);
    if (filtered.length > 0 && !filtered.some(c => c.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    setFormData(prev => ({
      ...prev,
      emergencyContacts: filtered,
      emergencyContactName: filtered.find(c => c.isPrimary)?.name || filtered[0]?.name || '',
      emergencyContactPhone: filtered.find(c => c.isPrimary)?.phone || filtered[0]?.phone || ''
    }));
  };

  const handleSetPrimary = (id: string) => {
    const updated = contactsList.map(c => ({
      ...c,
      isPrimary: c.id === id
    }));
    const primary = updated.find(c => c.isPrimary);
    setFormData(prev => ({
      ...prev,
      emergencyContacts: updated,
      emergencyContactName: primary?.name || '',
      emergencyContactPhone: primary?.phone || ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'appearance', label: 'Themes & Appearance', icon: Palette },
    { id: 'customization', label: 'App Customization', icon: Sliders },
    { id: 'voice', label: 'Voice Recognition', icon: Mic },
    { id: 'arrest', label: 'Arrest Mode & PIN', icon: Lock },
    { id: 'subscription', label: 'Subscription & Plans', icon: CreditCard },
    { id: 'medical', label: 'Medical & Safety', icon: HeartPulse },
  ];

  return (
    <div id="user-profile-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full h-[95vh] sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100 ring-1 ring-amber-500/20">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CITIZEN PROFILE
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                  {formData.membershipTier.toUpperCase()} TIER
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
                Driver Profile &amp; Defense Settings
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-zinc-900/95 border-b border-zinc-800 px-2 sm:px-4 flex items-center gap-1 overflow-x-auto shrink-0 no-scrollbar py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body with Smooth Mobile Scrolling */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs overscroll-contain">
          
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Personal Contact Details */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Civilian Identity &amp; Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Email Address (Vault &amp; Receipts)
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. jane@domain.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. (555) 123-4567"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Primary State / Jurisdiction
                    </label>
                    <select
                      value={formData.homeState || 'CA'}
                      onChange={(e) => setFormData({ ...formData, homeState: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {US_STATE_LIST.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Vehicle Profile (For Traffic Stops)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Make &amp; Model
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleMakeModel}
                      onChange={(e) => setFormData({ ...formData, vehicleMakeModel: e.target.value })}
                      placeholder="e.g. 2022 Toyota Camry"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Vehicle Color
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleColor || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                      placeholder="e.g. Silver / Grey"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      License Plate #
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleLicensePlate}
                      onChange={(e) => setFormData({ ...formData, vehicleLicensePlate: e.target.value })}
                      placeholder="e.g. 7XYZ890"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contacts (1 for Free, 5 for Pro) */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                      Emergency Witness Contacts ({contactsList.length}/{isPaid ? '5 Pro' : '1 Free'})
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Auto-alerted upon incident
                  </span>
                </div>

                {/* Free tier 1-contact limit notice */}
                {!isPaid && contactsList.length >= 1 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>1 of 1 Free Witness Contact Added</span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        Upgrade to Pro ($3.99/mo) with a 30-day free trial to unlock up to 5 Emergency Witness Contacts with simultaneous multi-device live streaming.
                      </p>
                    </div>
                    {onUpgradePrompt && (
                      <button
                        type="button"
                        onClick={onUpgradePrompt}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 text-black font-black text-xs shrink-0 cursor-pointer shadow-sm active:scale-95"
                      >
                        Unlock 5 Contacts
                      </button>
                    )}
                  </div>
                )}

                {/* Contacts List */}
                <div className="space-y-2">
                  {contactsList.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          contact.isPrimary ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span>{contact.name}</span>
                            {contact.isPrimary && (
                              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {contact.phone} • {contact.relationship || 'Witness'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!contact.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(contact.id)}
                            className="p-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(contact.id)}
                          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {contactsList.length === 0 && (
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center text-zinc-500 text-xs">
                      No emergency contacts configured yet. Add trusted contacts below.
                    </div>
                  )}
                </div>

                {/* Add Contact Form (up to 1 on Free, up to 5 on Pro) */}
                {contactsList.length < (isPaid ? 5 : 1) && (
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                      Add New Emergency Contact ({contactsList.length + 1}/{isPaid ? 5 : 1})
                    </span>

                    {contactError && (
                      <div className="p-2 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{contactError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Contact Name"
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="tel"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex gap-1.5">
                        <select
                          value={newContactRel}
                          onChange={(e) => setNewContactRel(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1.5 text-xs text-white flex-1 focus:outline-none focus:border-amber-400"
                        >
                          <option value="Family">Family</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Attorney">Attorney</option>
                          <option value="Parent">Parent</option>
                          <option value="Friend">Friend</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddContact}
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: LANGUAGE & TRANSLATION */}
          {activeTab === 'language' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Native Language &amp; Speech Interpretation
                  </span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">
                  The AI legal assistant automatically translates live officer dialogue and recommendations into your preferred language in real time.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase">
                      Select Your Native Language
                    </label>
                    {!isPaid && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/40">
                        PRO ONLY
                      </span>
                    )}
                  </div>

                  {!isPaid ? (
                    <div 
                      onClick={onUpgradePrompt}
                      className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/40 hover:border-amber-400/70 cursor-pointer transition-all space-y-2 group shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <span>🇺🇸 English (US) — Default Free Language</span>
                        </span>
                        <span className="text-[10px] font-black text-amber-400 uppercase group-hover:underline flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Unlock 14+ Languages →</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Real-time language translation for live officer dialogue and citizen scripts is a Pro subscription feature. Upgrade to Pro ($3.99/mo) with a 30-day free trial to unlock Spanish, French, Mandarin, Arabic, and 10+ more languages.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.nativeLanguage}
                      onChange={(e) => setFormData({ ...formData, nativeLanguage: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name} — {lang.nativeName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Bilingual Legal Pocket Card Preview */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block font-mono">
                    Bilingual Invocation Preview:
                  </span>
                  <div className="text-xs text-white italic">
                    "Officer, I am exercising my right to remain silent and I do not consent to any search."
                  </div>
                  {formData.nativeLanguage !== 'en' && (
                    <div className="text-xs text-zinc-400 pt-1 border-t border-zinc-900">
                      Target translation will automatically stream in your chosen native dialect.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: THEMES & APP APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                      App Theme &amp; Visual Style
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase">
                    {formData.appTheme || 'tactical_dark'}
                  </span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">
                  Customize the visual aesthetic and tactical visibility of Police SafeGuard. Themes dynamically modify background atmospheric lighting, status badges, and contrast filters.
                </p>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    {
                      id: 'tactical_dark' as const,
                      name: 'Tactical Dark',
                      subtitle: 'Stealth obsidian black with gold radar sweep (Default Free)',
                      bgGradient: 'from-zinc-950 via-zinc-900 to-black',
                      borderClass: 'border-amber-500/50',
                      chip: 'bg-amber-400 text-black'
                    },
                    {
                      id: 'midnight_blue' as const,
                      name: 'Midnight Blue',
                      subtitle: 'Deep law enforcement navy with cobalt highlights (Pro)',
                      bgGradient: 'from-slate-950 via-blue-950/40 to-slate-900',
                      borderClass: 'border-blue-500/50',
                      chip: 'bg-blue-500 text-white'
                    },
                    {
                      id: 'carbon_fiber' as const,
                      name: 'Carbon Fiber',
                      subtitle: 'Textured graphite armor plate with neutral contrast (Pro)',
                      bgGradient: 'from-neutral-950 via-zinc-900 to-black',
                      borderClass: 'border-zinc-500/50',
                      chip: 'bg-zinc-400 text-black'
                    },
                    {
                      id: 'amber_gold' as const,
                      name: 'Amber Gold',
                      subtitle: 'High-visibility roadside caution & gold glow HUD (Pro)',
                      bgGradient: 'from-amber-950/40 via-zinc-950 to-black',
                      borderClass: 'border-amber-400',
                      chip: 'bg-amber-400 text-black'
                    },
                    {
                      id: 'crimson_guard' as const,
                      name: 'Crimson Guard',
                      subtitle: 'Crisis alert deep red emergency perimeter HUD (Pro)',
                      bgGradient: 'from-red-950/40 via-zinc-950 to-black',
                      borderClass: 'border-red-500/50',
                      chip: 'bg-red-500 text-white'
                    },
                    {
                      id: 'forest_camo' as const,
                      name: 'Forest Camo',
                      subtitle: 'Field tactical muted olive & emerald dark theme (Pro)',
                      bgGradient: 'from-emerald-950/40 via-zinc-950 to-black',
                      borderClass: 'border-emerald-500/50',
                      chip: 'bg-emerald-500 text-white'
                    }
                  ].map((theme) => {
                    const isSelected = (formData.appTheme || 'tactical_dark') === theme.id;

                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`p-3 rounded-xl border bg-gradient-to-br ${theme.bgGradient} cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? `${theme.borderClass} ring-2 ring-amber-400 shadow-lg scale-[1.01]`
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs">{theme.name}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${theme.chip}`}>
                              {theme.id.split('_')[0]}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase bg-emerald-500 text-black">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-300 leading-snug">{theme.subtitle}</p>
                        </div>
                        <div className="pt-0.5 shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-zinc-700 bg-zinc-900/80" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Background Opacity & Custom Wallpaper */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                      Background Wallpaper &amp; Darkness
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {Math.round((formData.backgroundOpacity ?? 0.65) * 100)}% Dark Overlay
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-zinc-300">
                    <span>Dark Vignette Opacity</span>
                    <span className="font-mono text-amber-400">{(formData.backgroundOpacity ?? 0.65).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={formData.backgroundOpacity ?? 0.65}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>Brighter Wallpaper (0.20)</span>
                    <span>Standard (0.65)</span>
                    <span>High Contrast Stealth (0.95)</span>
                  </div>
                </div>

                {/* Device Photo & Wallpaper Selector */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                      Custom Background Wallpaper
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">From Your Device</span>
                  </div>

                  {/* Hidden native file input for browsing local files */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDeviceFileSelect}
                  />

                  {/* Active Wallpaper Preview or Empty State */}
                  {formData.customBackgroundImageUrl ? (
                    <div className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-16 h-12 rounded-xl border border-zinc-700 bg-cover bg-center shrink-0 shadow-md"
                          style={{ backgroundImage: `url('${formData.customBackgroundImageUrl}')` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span className="font-extrabold text-xs text-white">Device Photo Active</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">
                            Custom wallpaper is applied across all app screens with safe dimming overlay.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose Different Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWallpaperChange(undefined)}
                          className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition-colors"
                        >
                          Reset to Theme
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-dashed border-zinc-700 text-center space-y-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block">
                          Set Custom Background Photo
                        </span>
                        <p className="text-[10px] text-zinc-400 max-w-xs mx-auto mt-0.5">
                          Browse files downloaded on your device and select any photo to set as your personal app wallpaper.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg shadow-amber-950/50 active:scale-95 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Browse Device Files &amp; Select Photo</span>
                      </button>
                    </div>
                  )}

                  {wallpaperUploadError && (
                    <p className="text-[10px] text-red-400 font-semibold animate-in fade-in flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{wallpaperUploadError}</span>
                    </p>
                  )}

                  {/* Optional Image URL Fallback */}
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Or Paste Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.customBackgroundImageUrl?.startsWith('data:') ? '' : (formData.customBackgroundImageUrl || '')}
                      onChange={(e) => handleWallpaperChange(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APP CUSTOMIZATION */}
          {activeTab === 'customization' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Preferred AI Voice */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                      Preferred AI Copilot Voice
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Earbud speech delivery</span>
                </div>

                <div className="space-y-2">
                  {AVAILABLE_VOICES.map((voice) => {
                    const isSelected = formData.preferredVoice === voice.id;
                    const isTesting = testVoicePlaying === voice.id;
                    const isVoicePaid = voice.isPaidOnly;
                    const isVoiceLocked = isVoicePaid && !isPaid;

                    return (
                      <div
                        key={voice.id}
                        onClick={() => {
                          if (isVoiceLocked) {
                            if (onUpgradePrompt) onUpgradePrompt();
                            return;
                          }
                          setFormData({ ...formData, preferredVoice: voice.id });
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 shadow-md'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="preferredVoice"
                            checked={isSelected}
                            disabled={isVoiceLocked}
                            onChange={() => {
                              if (isVoiceLocked) {
                                if (onUpgradePrompt) onUpgradePrompt();
                                return;
                              }
                              setFormData({ ...formData, preferredVoice: voice.id });
                            }}
                            className="text-amber-500 bg-zinc-900 border-zinc-700"
                          />
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{voice.name}</span>
                              <span className="text-[9px] font-mono text-zinc-400">({voice.accent})</span>
                              {isVoiceLocked && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase bg-amber-400/20 text-amber-300 border border-amber-500/40">
                                  PRO • NATURAL
                                </span>
                              )}
                              {!isVoicePaid && (
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  FREE INCLUDED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400">{voice.description}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(voice.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'Playing...' : 'Test Voice'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Toggles & Behavior */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Audio &amp; Monitoring Behavior
                  </span>
                </div>

                {/* Whisper Mode (Paid Only) */}
                <div 
                  onClick={() => {
                    if (!isPaid) {
                      if (onUpgradePrompt) onUpgradePrompt();
                      return;
                    }
                    setFormData({ ...formData, whisperModeEnabled: !formData.whisperModeEnabled });
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    !isPaid 
                      ? 'bg-zinc-950/80 border-amber-500/30 hover:border-amber-500/50' 
                      : 'bg-zinc-950 border-zinc-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white block">Whisper Mode</span>
                      {!isPaid && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-amber-400/20 text-amber-300 border border-amber-500/40">
                          PRO ONLY
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">Ultra-quiet subdued delivery for stealth earbud coaching</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPaid && formData.whisperModeEnabled}
                    disabled={!isPaid}
                    readOnly
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 pointer-events-none"
                  />
                </div>

                {/* Auto-notify on start */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-white block">Auto-Alert Contacts on Recording Start</span>
                    <span className="text-[10px] text-zinc-400">Instantly sends SMS live video link when copilot is activated</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoNotifyContactOnStart}
                    onChange={(e) => setFormData({ ...formData, autoNotifyContactOnStart: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                  />
                </label>

                {/* Announce Recording Out Loud */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-white block">Audible Recording Notice Out Loud</span>
                    <span className="text-[10px] text-zinc-400">Speaker announces: "Officer, this encounter is being recorded."</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.announceRecordingOutLoud}
                    onChange={(e) => setFormData({ ...formData, announceRecordingOutLoud: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                  />
                </label>

                {/* Online Cloud vs Offline Air-gap */}
                <label className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-white block">Online Cloud Relay Mode</span>
                    <span className="text-[10px] text-zinc-400">Enables off-device backup; disable for 100% air-gapped local shield</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isCloudOnlineMode !== false}
                    onChange={(e) => setFormData({ ...formData, isCloudOnlineMode: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                  />
                </label>
              </div>

            </div>
          )}

          {/* TAB 4: VOICE RECOGNITION & BIOMETRICS */}
          {activeTab === 'voice' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                      Citizen Voice Lock Biometrics
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    formData.voiceTraining?.isTrained 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {formData.voiceTraining?.isTrained ? 'VOICE LOCKED' : 'NOT ENROLLED'}
                  </span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">
                  When voice recognition is locked, <strong>the AI only responds to your unique vocal frequency and pitch</strong>. Police officers, passengers, or bystanders cannot issue commands to your copilot.
                </p>

                {/* Calibration Box */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block font-mono">
                    Calibration Phrase (Read Aloud to Train):
                  </span>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-medium text-xs leading-relaxed italic">
                    "{calibrationSentence}"
                  </div>

                  {isRecordingVoice && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Recording Voice Biometric Profile...</span>
                        <span>{Math.round(voiceProgress)}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-400 h-full transition-all duration-100" 
                          style={{ width: `${voiceProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {voiceBiometricSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{voiceBiometricSuccess}</span>
                    </div>
                  )}

                  {voiceBiometricError && (
                    <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{voiceBiometricError}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isRecordingVoice}
                      onClick={handleRecordVoiceProfile}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{formData.voiceTraining?.isTrained ? 'Re-Calibrate Voice' : 'Record & Enroll Voice'}</span>
                    </button>

                    {formData.voiceTraining?.isTrained && (
                      <>
                        <button
                          type="button"
                          onClick={handlePlaySavedVoiceSample}
                          className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className={`w-3.5 h-3.5 ${isPlayingVoiceSample ? 'animate-spin text-amber-400' : ''}`} />
                          <span>{isPlayingVoiceSample ? 'Playing...' : 'Play Sample'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearVoiceProfile}
                          className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 text-zinc-400 hover:text-red-400 font-bold text-xs cursor-pointer"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Voice Lock Sensitivity */}
                {formData.voiceTraining?.isTrained && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-bold text-white block">Recognition Sensitivity</span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['lenient', 'balanced', 'strict'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            if (formData.voiceTraining) {
                              setFormData({
                                ...formData,
                                voiceTraining: { ...formData.voiceTraining, sensitivity: lvl }
                              });
                            }
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer border ${
                            formData.voiceTraining?.sensitivity === lvl
                              ? 'bg-amber-400 text-black border-amber-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 5: ARREST MODE & DURESS PIN */}
          {activeTab === 'arrest' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Riley v. California 5th Amendment Lockdown PIN
                  </span>
                </div>

                <p className="text-zinc-300 text-xs leading-relaxed">
                  Under <em>Riley v. California</em> (2014), police cannot search your digital phone without a warrant. When you trigger <strong>Arrest Mode</strong>, the display instantly blacks out and all evidence is sealed under FRE 902.
                </p>

                {/* PIN Management Section with Profile Ownership Verification */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase">
                        Current Duress Unlock PIN
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        Required to unlock screen after triggering Riley v. California arrest mode
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-sm font-black text-amber-300 tracking-widest">
                        {showPin ? (formData.duressLockPin || '7482') : '••••'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                        title={showPin ? 'Hide PIN' : 'View PIN'}
                      >
                        {showPin ? <EyeOffIcon className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {!isPinOwnershipVerified ? (
                    /* Step 1: Prove Profile Ownership */
                    <div className="pt-2 border-t border-zinc-850 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-white">
                          Prove Profile Ownership to Modify PIN
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        To prevent unauthorized tampering, you must enter your account password or current PIN ({formData.duressLockPin || '7482'}) before changing this duress security code.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="password"
                          value={verifyPasswordInput}
                          onChange={(e) => setVerifyPasswordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleVerifyOwnershipForPin();
                            }
                          }}
                          placeholder="Enter account password or current PIN"
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOwnershipForPin}
                          disabled={isVerifyingOwnership}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isVerifyingOwnership ? 'Verifying...' : 'Verify Ownership'}</span>
                        </button>
                      </div>

                      {pinVerificationError && (
                        <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{pinVerificationError}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Step 2: Set New 4-8 Digit PIN */
                    <div className="pt-2 border-t border-zinc-850 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Profile Ownership Verified</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsPinOwnershipVerified(false);
                            setVerifyPasswordInput('');
                            setNewPinInput('');
                            setConfirmPinInput('');
                          }}
                          className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-300 uppercase mb-1">
                            New PIN (4 to 8 Digits)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={8}
                            value={newPinInput}
                            onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 4-8 digits"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-300 uppercase mb-1">
                            Confirm New PIN
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={8}
                            value={confirmPinInput}
                            onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Re-enter new PIN"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      {pinVerificationError && (
                        <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{pinVerificationError}</span>
                        </div>
                      )}

                      {pinSaveFeedback && (
                        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-[11px] flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{pinSaveFeedback}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSaveNewPin}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                      >
                        <Lock className="w-3.5 h-3.5 fill-black" />
                        <span>Save &amp; Seal New Lockdown PIN</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Intruder Snapshot Feature */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Camera className="w-4 h-4 text-red-400" />
                    <span>Silent Front-Camera Custody Snapshot</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    If an unauthorized party touches or attempts unlocking your device during arrest lockdown, the front camera automatically snaps surveillance photos and logs them to your sealed vault record.
                  </p>
                </div>

                {/* Card Refund Unlock Requirement */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-white block">High-Security Verified Unlock</span>
                    <span className="text-[10px] text-zinc-400">Requires cardholder identity confirmation to release lockdown</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.requireCardRefundUnlock !== false}
                    onChange={(e) => setFormData({ ...formData, requireCardRefundUnlock: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                  />
                </label>
              </div>

            </div>
          )}

          {/* TAB: SUBSCRIPTION & RECURRING PLANS */}
          {activeTab === 'subscription' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Current Plan Overview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-zinc-900 border-2 border-amber-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-white text-xs uppercase tracking-wider">
                      Current Subscription Plan
                    </span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    formData.membershipTier === 'lifetime_pro'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black border-amber-400 font-black'
                      : formData.membershipTier === 'all_encounters_pro' || formData.membershipTier === 'paid'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}>
                    {formData.membershipTier === 'lifetime_pro'
                      ? 'LIFETIME PASS'
                      : formData.membershipTier === 'all_encounters_pro' || formData.membershipTier === 'paid'
                      ? 'ALL-ENCOUNTERS PRO'
                      : 'FREE CITIZEN'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">Billing Cycle</span>
                    <span className="font-bold text-white capitalize">
                      {formData.billingCycle === 'yearly' ? 'Annual Recurring' : formData.billingCycle === 'lifetime' ? 'Lifetime One-Time' : 'Monthly Recurring'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">Defense Credits</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formData.credits ?? 5} Available
                    </span>
                  </div>
                </div>

                {/* Recurring billing default guarantee */}
                <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-start gap-2 text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Reoccurring Payments Active by Default:</strong> Subscriptions renew automatically monthly or annually with a <strong>3-Day Free Trial</strong> included. Cancel anytime in 1 tap from this profile without penalty.
                  </p>
                </div>

                {/* Plan change / upgrade CTA */}
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onUpgradePrompt();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer active:scale-98 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Change Plan / Start 3-Day Trial</span>
                  </button>

                  {onOpenAccountManagement && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAccountManagement('unsubscribe');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Manage / Cancel Auto-Renew</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Billing Cycle Preferences */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Recurring Frequency Preference
                  </span>
                  <span className="text-[10px] text-zinc-400">Monthly vs Annual</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div 
                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      (formData.billingCycle || 'monthly') === 'monthly'
                        ? 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Monthly Recurring</span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">3-DAY TRIAL</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Billed every month, auto-renews automatically</div>
                  </div>

                  <div 
                    onClick={() => setFormData({ ...formData, billingCycle: 'yearly' })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.billingCycle === 'yearly'
                        ? 'bg-amber-500/10 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Annual Recurring</span>
                      <span className="text-[9px] font-mono text-amber-300 font-bold">SAVE 34%</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Billed annually, auto-renews automatically</div>
                  </div>
                </div>
              </div>

              {/* Police Charity & Payment Protection */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">PCI-DSS Level 1 Encrypted • 10% Donated to Police Charities</span>
                </div>
                {onOpenCharityModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCharityModal();
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline font-bold cursor-pointer shrink-0"
                  >
                    Charity Fund
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 6: MEDICAL & SAFETY ACCESSIBILITY */}
          {activeTab === 'medical' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                  <HeartPulse className="w-4 h-4 text-red-400" />
                  <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Medical Directives &amp; Accessibility
                  </span>
                </div>

                {/* Deaf or Hard of Hearing Card Toggle */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950 border border-amber-500/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDeafOrHardOfHearing}
                    onChange={(e) => setFormData({ ...formData, isDeafOrHardOfHearing: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 mt-0.5 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-xs text-amber-300 block">
                      I am Deaf or Hard of Hearing (Visual Rights Card)
                    </span>
                    <span className="text-[10px] text-zinc-300 leading-relaxed block mt-0.5">
                      Enabling this automatically renders a bold, oversized high-contrast visual display card for officers during stops: <em>"OFFICER: DRIVER IS DEAF OR HARD OF HEARING. PLEASE COMMUNICATE VIA WRITING."</em>
                    </span>
                  </div>
                </label>

                {/* Medical Conditions */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                    Known Medical Conditions (e.g. Diabetes, Epilepsy, Asthma, Pacemaker)
                  </label>
                  <input
                    type="text"
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                    placeholder="e.g. Type 1 Diabetic (emergency insulin in vehicle), Asthma"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Emergency Directives */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                    Emergency Medical Instructions / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.anonymousAlias || ''}
                    onChange={(e) => setFormData({ ...formData, anonymousAlias: e.target.value })}
                    placeholder="e.g. Blood type O+, allergic to penicillin, emergency contact is authorized healthcare proxy"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Log out of account"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Log Out</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile &amp; Preferences</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
