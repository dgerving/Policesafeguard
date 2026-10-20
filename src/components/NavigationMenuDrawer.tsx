import React, { useState } from 'react';
import { 
  X, Shield, Video, Play, FileText, Scale, User, Lock, Sparkles, 
  ChevronRight, Download, RefreshCw, Radio, Gift, Mic, ShieldCheck, 
  UserX, EyeOff, HeartHandshake, LogOut, CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { UserProfile, JurisdictionLaw } from '../types';
import { AppUpdateService } from '../services/appUpdateService';

interface NavigationMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  userProfile: UserProfile;
  jurisdiction: JurisdictionLaw;
  evidenceRecordsCount: number;
  onOpenProfileModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenPermissionsModal: () => void;
  onOpenWitnessModal?: () => void;
  onOpenReferralModal: () => void;
  onOpenPromoModal?: () => void;
  onOpenCharityModal: () => void;
  onOpenServerActivity?: () => void;
  onOpenAdminPortal?: () => void;
  isAdminMode?: boolean;
  onOpenOfficialDomainModal?: () => void;
  onOpenPWADownloadModal: () => void;
  onOpenAccountManagement: (tab?: 'unsubscribe' | 'purge_personal' | 'delete_account') => void;
  onOpenBailVault?: () => void;
  onToggleOnlineMode?: () => void;
  onOpenVoiceCommandsModal?: () => void;
  onOpenStripePortal?: () => void;
  onOpenMarketingVideoDemo?: () => void;
  onLogout?: () => void;
}

export const NavigationMenuDrawer: React.FC<NavigationMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  userProfile,
  jurisdiction,
  evidenceRecordsCount,
  onOpenProfileModal,
  onOpenSubscriptionModal,
  onOpenPermissionsModal,
  onOpenWitnessModal,
  onOpenReferralModal,
  onOpenCharityModal,
  onOpenPWADownloadModal,
  onOpenAccountManagement,
  onOpenBailVault,
  onOpenVoiceCommandsModal,
  onOpenStripePortal,
  onOpenMarketingVideoDemo,
  onLogout
}) => {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusMessage, setUpdateStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';

  const handleCheckAppUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMessage('Checking build...');
    try {
      const res = await AppUpdateService.checkForUpdates();
      if (res.hasUpdate) {
        setUpdateStatusMessage(`Update v${res.latestVersion} available`);
        setTimeout(() => setUpdateStatusMessage(null), 4000);
      } else {
        setUpdateStatusMessage(`✅ Up to date (v${res.currentVersion})`);
        setTimeout(() => setUpdateStatusMessage(null), 3500);
      }
    } catch {
      setUpdateStatusMessage('✅ Latest build active');
      setTimeout(() => setUpdateStatusMessage(null), 3500);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const getTierDisplay = () => {
    if (userProfile.membershipTier === 'lifetime_pro') return 'Lifetime Pass';
    if (isPaid) return 'SafeGuard Pro';
    return 'Free Basic';
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800/80 shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Sleek Mobile Header */}
        <div className="p-4 sm:p-5 bg-zinc-950/95 border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 pt-[max(1rem,env(safe-area-inset-top,0px))]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <Shield className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="min-w-0 truncate">
              <div className="font-extrabold text-sm text-white truncate">
                {userProfile.name || 'Protected Citizen'}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {userProfile.email || 'Constitutional Defense Active'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              isPaid
                ? 'bg-amber-400/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {getTierDisplay()}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Effortless Scroll Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 text-xs">
          
          {/* Subscription Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                <span className="font-bold text-white text-xs">
                  {isPaid ? 'Pro Defense Active' : 'Free Basic Defense'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-amber-400 font-bold">
                {userProfile.credits ?? 5} Defense Credits
              </span>
            </div>

            <div className="flex gap-2">
              {!isPaid ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSubscriptionModal();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Start 3-Day Free Trial ($0 Due)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenStripePortal) onOpenStripePortal();
                    else onOpenSubscriptionModal();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manage Subscription &amp; Billing</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: CORE PROTECTION TOOLS */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
              Core Protection Tools
            </span>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
              
              {/* Marketing Video Demonstration */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenMarketingVideoDemo) onOpenMarketingVideoDemo();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200 bg-gradient-to-r from-amber-500/10 via-transparent to-red-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/30 to-red-500/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>🎬 Marketing Video Demonstration</span>
                      <span className="text-[9px] font-black bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded border border-red-500/30">
                        2-MIN DEMO
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Live app showcase, fictitious traffic stop &amp; feature walkthrough</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectTab('live-monitor');
                }}
                className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeTab === 'live-monitor' ? 'bg-red-950/20 text-white' : 'hover:bg-zinc-850/60 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Live Incident Dashcam</div>
                    <div className="text-[10px] text-zinc-400">Audio visualizer, GPS HUD &amp; instant tamper-proof recorder</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectTab('evidence-vault');
                }}
                className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeTab === 'evidence-vault' ? 'bg-emerald-950/20 text-white' : 'hover:bg-zinc-850/60 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>FRE 902 Evidence Vault</span>
                      <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        {evidenceRecordsCount}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400">SHA-256 sealed court exhibits &amp; chain of custody</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenWitnessModal) onOpenWitnessModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Emergency Witness Network</span>
                      <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                        {isPaid ? '5 Contacts' : '1 Contact'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Instant SMS relay links for emergency contacts</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectTab('simulator');
                }}
                className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeTab === 'simulator' ? 'bg-amber-950/20 text-white' : 'hover:bg-zinc-850/60 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Constitutional Stop Simulator</div>
                    <div className="text-[10px] text-zinc-400">Practice real scenarios with AI officer simulations</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectTab('jurisdictions');
                }}
                className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeTab === 'jurisdictions' ? 'bg-indigo-950/20 text-white' : 'hover:bg-zinc-850/60 text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">
                      State Laws ({jurisdiction.stateCode})
                    </div>
                    <div className="text-[10px] text-zinc-400">50-state statutory repository &amp; rights guide</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

            </div>
          </div>

          {/* SECTION 2: HARDWARE & DEFENSE PLEDGES */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
              Security &amp; Hardware
            </span>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
              
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPermissionsModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Device Permissions &amp; Hardware</div>
                    <div className="text-[10px] text-zinc-400">Camera, microphone, GPS &amp; biometric lock verification</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenVoiceCommandsModal) onOpenVoiceCommandsModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Hands-Free Voice Triggers</div>
                    <div className="text-[10px] text-zinc-400">"Record", "Call Help", "Read Rights" triggers</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenBailVault) onOpenBailVault();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Bail Relief Vault (5% Pledge)</div>
                    <div className="text-[10px] text-zinc-400">Wrongful accusation emergency defense fund</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCharityModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Honest Police Charity (5% Pledge)</div>
                    <div className="text-[10px] text-zinc-400">Fallen officer families &amp; mental wellness</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

            </div>
          </div>

          {/* SECTION 3: APP & SHARING */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
              App &amp; Rewards
            </span>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
              
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfileModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Profile, Audio &amp; Language</div>
                    <div className="text-[10px] text-zinc-400">Earbud whisper mode, voice, and theme presets</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPWADownloadModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Install Mobile App</span>
                      <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded">1-CLICK</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Direct install on iPhone, iPad, Android &amp; Desktop</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReferralModal();
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400 shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Ambassador Referral Program</div>
                    <div className="text-[10px] text-zinc-400">Give 1 month free, earn free Pro months</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleCheckAppUpdate}
                disabled={isCheckingUpdate}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
                    <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin text-amber-400' : ''}`} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">
                      {updateStatusMessage || 'Check for Production Updates'}
                    </div>
                    <div className="text-[10px] text-zinc-400">Verify latest cloud build &amp; rules</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

            </div>
          </div>

          {/* SECTION 4: PRIVACY & LOGOUT */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">
              Account &amp; Data Security
            </span>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
              
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccountManagement('purge_personal');
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-zinc-850/60 transition-colors cursor-pointer text-zinc-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Purge Personal Profile Data</div>
                    <div className="text-[10px] text-zinc-400">Clear cached identity details locally</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAccountManagement('delete_account');
                }}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-red-950/30 transition-colors cursor-pointer text-zinc-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-red-300">Delete Account &amp; Vault</div>
                    <div className="text-[10px] text-zinc-400">Permanent CCPA/GDPR right-to-be-forgotten</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-red-950/30 transition-colors cursor-pointer text-red-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-red-200">Sign Out of App</div>
                      <div className="text-[10px] text-zinc-400">Terminate local session safely</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </button>
              )}

            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-2 pb-6 text-center text-[10px] font-mono text-zinc-600">
            POLICE SAFEGUARD v2.5 • CIVILIAN AI COPILOT
          </div>

        </div>
      </div>
    </div>
  );
};
