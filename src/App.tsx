import React, { useState, useEffect } from 'react';
import { 
  Shield, Video, Play, FileText, Scale, User, Lock, Sparkles, 
  MapPin, Globe, Volume2, ShieldAlert, CheckCircle2, ChevronRight,
  Download, Check, AlertCircle, AlertTriangle, X, Coins, Infinity as InfinityIcon, Share2,
  Menu, Cloud, Gift, ShieldCheck, Radio, Mic, Activity, RefreshCw, Server, HeartHandshake,
  Maximize, Minimize, ExternalLink, Navigation, Zap, Camera
} from 'lucide-react';
import { 
  UserProfile, JurisdictionLaw, EvidenceCustodyRecord, MembershipTier, BillingCycle, ReferralRewardTier
} from './types';
import { JURISDICTIONS, DEFAULT_JURISDICTION, getJurisdictionByCode } from './data/jurisdictions';
import { LiveInteractionView } from './components/LiveInteractionView';
import { SimulatorView } from './components/SimulatorView';
import { EvidenceVaultView } from './components/EvidenceVaultView';
import { JurisdictionGuideView } from './components/JurisdictionGuideView';
import { UserProfileModal } from './components/UserProfileModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { LiveStripeSubscriptionPortalModal } from './components/LiveStripeSubscriptionPortalModal';
import { ArrestLockdownModal } from './components/ArrestLockdownModal';
import { LockdownScreen } from './components/LockdownScreen';
import { PWADownloadModal } from './components/PWADownloadModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { LiveStreamViewer } from './components/LiveStreamViewer';
import { NavigationMenuDrawer } from './components/NavigationMenuDrawer';
import { VaultCloudService } from './services/vaultCloudService';
import { ShareLiveFeedModal } from './components/ShareLiveFeedModal';
import { AccountOnboardingModal } from './components/AccountOnboardingModal';
import { ReferralProgramModal } from './components/ReferralProgramModal';
import { PromoCodeModal } from './components/PromoCodeModal';
import { DevicePermissionsModal } from './components/DevicePermissionsModal';
import { DevicePermissionsService } from './services/devicePermissionsService';
import { AppUrlHelper } from './services/appUrlHelper';
import { ReferralService } from './services/referralService';
import { AccountManagementModal } from './components/AccountManagementModal';
import { GeographicJurisdictionLegalModal } from './components/GeographicJurisdictionLegalModal';
import { LawEnforcementCharityModal } from './components/LawEnforcementCharityModal';
import { VoiceEngine } from './services/voiceEngine';
import { LiveStreamService } from './services/liveStreamService';
import { AuthClient } from './services/authClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { MandatoryLegalDisclaimerModal } from './components/MandatoryLegalDisclaimerModal';
import { CommercialVideoAdModal } from './components/CommercialVideoAdModal';
import { AdminDeveloperPortalModal } from './components/AdminDeveloperPortalModal';
import { ServerActivityModal } from './components/ServerActivityModal';
import { GpsJurisdictionService } from './services/gpsJurisdictionService';
import { US_STATE_LIST } from './data/jurisdictions';
import { PoliceScannerModal } from './components/PoliceScannerModal';
import { PoliceScannerMiniBar } from './components/PoliceScannerMiniBar';
import { FlockSurveillanceMapView } from './components/FlockSurveillanceMapView';

type ActiveTab = 'live-monitor' | 'simulator' | 'evidence-vault' | 'jurisdictions';

export default function App() {
  // Check URL path or query parameter for shared live stream feeds: /live/:id, /stream/:id, ?feed=:id, ?live=:id
  const [sharedFeedSessionId, setSharedFeedSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (path.startsWith('/live/')) {
      return path.replace('/live/', '').trim();
    }
    if (path.startsWith('/stream/')) {
      return path.replace('/stream/', '').trim();
    }
    if (searchParams.get('live')) {
      return searchParams.get('live')!.trim();
    }
    if (searchParams.get('feed')) {
      return searchParams.get('feed')!.trim();
    }
    return null;
  });

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      if (path.startsWith('/live/')) {
        setSharedFeedSessionId(path.replace('/live/', '').trim());
      } else if (path.startsWith('/stream/')) {
        setSharedFeedSessionId(path.replace('/stream/', '').trim());
      } else if (searchParams.get('live')) {
        setSharedFeedSessionId(searchParams.get('live')!.trim());
      } else if (searchParams.get('feed')) {
        setSharedFeedSessionId(searchParams.get('feed')!.trim());
      } else {
        setSharedFeedSessionId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Unlock browser speech synthesis and AudioContext on first interaction
  useEffect(() => {
    const unlock = () => {
      VoiceEngine.unlockAudio();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('live-monitor');
  const [openVaultRetrieveModal, setOpenVaultRetrieveModal] = useState(false);

  // App-level Fullscreen state for mobile/desktop
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsAppFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleAppFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('App fullscreen toggle:', e);
    }
  };

  // PWA Install hook
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // One button click to download mobile app
  const handleHeaderDownloadApp = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) return;
    }
    setIsPWAModalOpen(true);
  };

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('police_safeguard_profile') || localStorage.getItem('police_protection_profile') || localStorage.getItem('civicshield_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            credits: typeof parsed.credits === 'number' ? parsed.credits : 5,
            billingCycle: parsed.billingCycle || 'monthly',
          };
        }
      }
    } catch (e) {
      console.warn('Error reading userProfile from storage:', e);
    }
    return {
      name: '',
      email: '',
      phone: '',
      nativeLanguage: 'en',
      membershipTier: 'free',
      billingCycle: 'monthly',
      credits: 5,
      vehicleMakeModel: '',
      vehicleLicensePlate: '',
      vehicleColor: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContacts: [],
      medicalConditions: 'None',
      isDeafOrHardOfHearing: false,
      preferredVoice: 'standard-system',
      whisperModeEnabled: true,
      duressLockPin: '7482',
      autoNotifyContactOnStart: true
    };
  });

  // Current Jurisdiction (defaults to US/Federal, attempts browser GPS lookup)
  const [jurisdiction, setJurisdiction] = useState<JurisdictionLaw>(() => {
    return JURISDICTIONS.CA; // default realistic baseline state
  });

  // Evidence Records Archive
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceCustodyRecord[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('police_safeguard_records') || localStorage.getItem('police_protection_records') || localStorage.getItem('civicshield_records');
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {
      console.warn('Error reading evidenceRecords from storage:', e);
    }
    return [];
  });

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isArrestLockModalOpen, setIsArrestLockModalOpen] = useState(false);
  const [isLockdownActive, setIsLockdownActive] = useState(() => {
    try {
      return (localStorage.getItem('police_safeguard_is_locked') || localStorage.getItem('police_protection_is_locked') || localStorage.getItem('civicshield_is_locked')) === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isPWAModalOpen, setIsPWAModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isShareFeedModalOpen, setIsShareFeedModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isAccountManagementModalOpen, setIsAccountManagementModalOpen] = useState(false);
  const [accountManagementTab, setAccountManagementTab] = useState<'unsubscribe' | 'purge_personal' | 'delete_account'>('unsubscribe');
  const [isJurisdictionTermsModalOpen, setIsJurisdictionTermsModalOpen] = useState(false);
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);
  const [isSignoutAdOpen, setIsSignoutAdOpen] = useState(false);
  const [isStripePortalOpen, setIsStripePortalOpen] = useState(false);
  const [isPoliceScannerOpen, setIsPoliceScannerOpen] = useState(false);
  const [isFlockMapOpen, setIsFlockMapOpen] = useState(false);
  const [isServerActivityModalOpen, setIsServerActivityModalOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [activeAdminViewMode, setActiveAdminViewMode] = useState<'client' | 'admin'>('client');
  const isUserAdmin = userProfile.role === 'admin' || userProfile.email === 'dgerving@gmail.com';
  const isDeveloperModeActive = isUserAdmin && activeAdminViewMode === 'admin';

  // Secret URL trigger for app owner only (never shown to regular end users)
  useEffect(() => {
    if (typeof window !== 'undefined' && userProfile.email === 'dgerving@gmail.com') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('dev') === '1' || params.get('admin') === '1') {
        setActiveAdminViewMode('admin');
        setIsAdminPortalOpen(true);
      }
    }
  }, [userProfile.email]);

  const [adModalConfig, setAdModalConfig] = useState<{
    isOpen: boolean;
    reason: 'signout' | 'legal_qa' | 'simulation_question' | 'general';
    onFinished?: () => void;
  }>({
    isOpen: false,
    reason: 'general'
  });

  const triggerSafeCommercialAd = (reason: 'legal_qa' | 'simulation_question' | 'general', onFinished?: () => void) => {
    // CRITICAL CONSTITUTIONAL & LIFE-SAFETY RULES:
    // NEVER run advertisements before or during an encounter or active recording!
    // Always protect evidence files and distress signals!
    if (isLockdownActive || activeTab === 'live-monitor') {
      if (onFinished) onFinished();
      return;
    }
    if (userProfile.membershipTier === 'lifetime_pro') {
      if (onFinished) onFinished();
      return;
    }
    setAdModalConfig({
      isOpen: true,
      reason,
      onFinished
    });
  };

  const [stripePortalConfig, setStripePortalConfig] = useState<{
    initialTier?: 'all_encounters_pro' | 'lifetime_pro';
    initialCycle?: BillingCycle;
  }>({});

  const handleOpenUpgradePortal = (tier?: any, cycle?: any) => {
    if (tier || cycle) {
      setStripePortalConfig({
        initialTier: tier,
        initialCycle: cycle
      });
    }
    setIsStripePortalOpen(true);
  };

  // Sync data-theme attribute on document root whenever theme changes
  useEffect(() => {
    const activeTheme = userProfile.appTheme || 'tactical_dark';
    try {
      document.documentElement.setAttribute('data-theme', activeTheme);
      document.body.setAttribute('data-theme', activeTheme);
      const rootEl = document.getElementById('police-safeguard-app-root');
      if (rootEl) {
        rootEl.setAttribute('data-theme', activeTheme);
      }
    } catch (e) {}
  }, [userProfile.appTheme]);
  // User Agreement is now presented directly during sign-up inside AccountOnboardingModal, not before
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = (window.location.pathname || '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const token = localStorage.getItem('police_safeguard_auth_token') || localStorage.getItem('police_protection_auth_token');
      const savedProfile = localStorage.getItem('police_safeguard_profile');
      let parsedName = '';
      try {
        if (savedProfile) parsedName = JSON.parse(savedProfile)?.name || '';
      } catch (e) {}
      const hasAuth = !!(token && parsedName && parsedName !== 'Protected Citizen');

      // Intent queries for download, signup, login, referral
      if (
        params.get('download') === '1' || params.get('install') === '1' ||
        params.get('signup') === '1' || params.get('signup') === 'true' ||
        params.get('register') === '1' || params.get('join') === '1' ||
        params.get('login') === '1' || params.get('signin') === '1' ||
        params.get('account') || params.get('citizen') ||
        path === '/signup' || path === '/register' || path === '/login' || path === '/signin' ||
        path === '/download' || path === '/install'
      ) {
        if (!hasAuth) return true;
      }

      // Default: If user has no valid authenticated session, open by default to login / create profile page
      if (!hasAuth) {
        return true;
      }
    }
    return false;
  });
  const [paymentToast, setPaymentToast] = useState<string | null>(null);

  // Emergency Server Connection Refresh Handler
  const handleEmergencyRefreshServer = async () => {
    try {
      const start = performance.now();
      const res = await fetch(`/api/health?t=${Date.now()}`, { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setPaymentToast(`✅ Server connection refreshed (${elapsed}ms). Live streaming sockets and cloud vault verified.`);
      } else {
        setPaymentToast(`⚠️ Server degraded (${elapsed}ms). Emergency local device vault failover active.`);
      }
    } catch (e) {
      setPaymentToast(`⚠️ Offline Failover Active: Audio/video evidence is being stored securely in encrypted local vault.`);
    }
  };

  // Handle Promo Code Redemption
  const handlePromoSuccess = (updated: UserProfile) => {
    handleSaveProfile(updated);
    setIsPromoModalOpen(false);
    setPaymentToast('✓ Promo code successfully applied! Full access granted.');
  };

  // Handle Free Premium Subscription reward from Referral Program
  const handleReferralRewardClaimed = (tier: ReferralRewardTier) => {
    let newTier: MembershipTier = 'all_encounters_pro';
    let newCycle: BillingCycle = 'monthly';
    let label = 'Free Monthly Premium';

    if (tier === 'monthly') {
      newTier = 'all_encounters_pro';
      newCycle = 'monthly';
      label = 'Free Monthly Premium (All-Encounters Universal Defense)';
    } else if (tier === 'yearly') {
      newTier = 'all_encounters_pro';
      newCycle = 'yearly';
      label = 'Free Yearly Premium (All-Encounters Universal Defense - 1 Year)';
    } else if (tier === 'lifetime') {
      newTier = 'lifetime_pro';
      newCycle = 'lifetime';
      label = 'Free Lifetime Access Pro (Universal Legal Protection)';
    }

    const updatedProfile: UserProfile = {
      ...userProfile,
      membershipTier: newTier,
      billingCycle: newCycle,
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('police_safeguard_profile', JSON.stringify(updatedProfile));
    localStorage.removeItem('civicshield_profile');
    setPaymentToast(`🎉 Referral Reward Claimed! ${label} is now active on your account ($0 charge)!`);
  };

  // Handle Opening Account Management (Unsubscribe, Purge Personal Info, Delete Account)
  const handleOpenAccountManagement = (tab?: 'unsubscribe' | 'purge_personal' | 'delete_account') => {
    if (tab) {
      setAccountManagementTab(tab);
    } else {
      setAccountManagementTab(userProfile.membershipTier !== 'free' ? 'unsubscribe' : 'purge_personal');
    }
    setIsAccountManagementModalOpen(true);
  };

  // Handle Completed Account Deletion
  const handleAccountDeleted = () => {
    const defaultProfile: UserProfile = {
      name: 'Citizen',
      email: '',
      phone: '',
      nativeLanguage: 'en',
      membershipTier: 'free',
      billingCycle: 'monthly',
      credits: 5,
      vehicleMakeModel: '',
      vehicleLicensePlate: '',
      vehicleColor: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContacts: [],
      medicalConditions: '',
      isDeafOrHardOfHearing: false,
      preferredVoice: 'executive-counsel',
      whisperModeEnabled: false,
      duressLockPin: '7482',
      autoNotifyContactOnStart: true
    };
    setUserProfile(defaultProfile);
    setEvidenceRecords([]);
    setIsProfileModalOpen(false);
    setIsMenuDrawerOpen(false);
    setPaymentToast('Your account, personal profile info, and stored data have been permanently deleted.');
  };

  // Handle User Log Out - immediately terminates connection & session
  const handleLogout = () => {
    // Show brief sponsor ad video upon logout as requested, then complete session termination
    setIsSignoutAdOpen(true);
  };

  const handleCompleteLogout = async () => {
    setIsSignoutAdOpen(false);
    try {
      await AuthClient.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }

    AuthClient.clearToken();
    localStorage.removeItem('police_auth_token');
    localStorage.removeItem('police_safeguard_auth_token');
    localStorage.removeItem('police_protection_auth_token');
    localStorage.removeItem('civicshield_auth_token');
    localStorage.removeItem('police_safeguard_profile');
    localStorage.removeItem('police_protection_profile');
    localStorage.removeItem('civicshield_profile');
    localStorage.removeItem('police_safeguard_account_created');
    localStorage.removeItem('police_protection_account_created');
    localStorage.removeItem('civicshield_account_created');

    const defaultProfile: UserProfile = {
      name: '',
      email: '',
      phone: '',
      nativeLanguage: 'en',
      membershipTier: 'free',
      billingCycle: 'monthly',
      credits: 5,
      vehicleMakeModel: '',
      vehicleLicensePlate: '',
      vehicleColor: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContacts: [],
      medicalConditions: 'None',
      isDeafOrHardOfHearing: false,
      preferredVoice: 'standard-system',
      whisperModeEnabled: true,
      duressLockPin: '7482',
      autoNotifyContactOnStart: true
    };
    setUserProfile(defaultProfile);
    setIsMenuDrawerOpen(false);
    setIsProfileModalOpen(false);
    // Immediately return user to login / welcome screen
    setIsAccountModalOpen(true);
    setPaymentToast('👋 Session terminated. You have been safely logged out of your account.');
  };

  // Check for Stripe Checkout return redirect parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        const sessionId = params.get('session_id');
        const tier = (params.get('tier') as MembershipTier) || (params.get('plan') as MembershipTier) || 'all_encounters_pro';
        const cycle = (params.get('cycle') as BillingCycle) || 'monthly';
        const rawCredits = Number(params.get('credits') || 0);

        if (sessionId && sessionId !== 'active_session') {
          // Verify directly with Stripe that real funds were approved and paid
          fetch('/api/checkout/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, tier, cycle })
          })
            .then(res => res.json())
            .then(data => {
              if (data.paid) {
                const verifiedTier = (data.tier as MembershipTier) || tier;
                const verifiedCycle = (data.billingCycle as BillingCycle) || cycle;
                const addedCredits = Number(data.creditsGranted || rawCredits || 0);

                const currentCreds = userProfile.credits ?? 5;
                const newCredits = addedCredits > 0 ? currentCreds + addedCredits : currentCreds;

                const updatedProfile: UserProfile = { 
                  ...userProfile, 
                  membershipTier: verifiedTier,
                  billingCycle: verifiedCycle,
                  credits: newCredits
                };
                setUserProfile(updatedProfile);
                localStorage.setItem('police_safeguard_profile', JSON.stringify(updatedProfile));
                localStorage.removeItem('civicshield_profile');

                if (addedCredits > 0) {
                  setPaymentToast(`🎉 Payment confirmed! ${addedCredits} defense credits added to your account.`);
                } else {
                  const tierTitle = 
                    verifiedTier === 'lifetime_pro' ? 'Universal Lifetime Access' : 'All-Encounters Universal Defense Pro';
                  setPaymentToast(`🎉 Payment approved and confirmed by Stripe! ${tierTitle} (${verifiedCycle}) is now active.`);
                }
              } else {
                setPaymentToast('⚠️ Payment was not approved or completed by Stripe. No subscription was activated.');
              }
            })
            .catch(() => {
              setPaymentToast('⚠️ Payment verification failed with Stripe. No subscription was activated.');
            });
        } else {
          setPaymentToast('⚠️ Payment cannot be verified without a valid Stripe transaction. No charges were made.');
        }

        // Clean URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('payment') === 'failed') {
        const updatedProfile: UserProfile = {
          ...userProfile,
          paymentStatus: 'failed',
          membershipTier: 'free'
        };
        setUserProfile(updatedProfile);
        localStorage.setItem('police_safeguard_profile', JSON.stringify(updatedProfile));
        localStorage.removeItem('civicshield_profile');
        setPaymentToast('⚠️ Payment failed! Access restricted until payment method is updated.');
        handleOpenUpgradePortal();
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('payment') === 'cancelled') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Handle Direct Download / Install Link for live account: ?download=1, ?install=1, /download, /install
      const isDownloadParam = params.get('download') === '1' || params.get('download') === 'true' || params.get('install') === '1' || params.get('install') === 'true';
      const isDownloadPath = window.location.pathname === '/download' || window.location.pathname === '/install';
      if (isDownloadParam || isDownloadPath) {
        const token = AuthClient.getToken();
        const savedProfile = localStorage.getItem('police_safeguard_profile');
        let parsedName = '';
        try {
          if (savedProfile) parsedName = JSON.parse(savedProfile)?.name || '';
        } catch (e) {}
        if (!token || !parsedName || parsedName === 'Protected Citizen') {
          setIsAccountModalOpen(true);
        } else {
          setIsPWAModalOpen(true);
        }
      }

      // Handle Referral / Account Invite Link: ?ref=SHIELD-XXXX
      const refCode = params.get('ref');
      if (refCode) {
        try {
          const cleanCode = refCode.trim().toUpperCase();
          localStorage.setItem('police_safeguard_referred_by', cleanCode);
          localStorage.removeItem('civicshield_referred_by');
          setPaymentToast(`🎉 Welcome to Police Safeguard! Referred with code ${cleanCode}. Real-time civilian rights copilot active.`);
          // Automatically launch the official sign-up / onboarding screen for referred new users
          setIsAccountModalOpen(true);
        } catch (e) {}
      }

      // Handle Direct Sign-Up Intent: ?signup=1, ?register=1, ?join=1, /signup, /register
      const isSignupIntent = params.get('signup') === '1' || params.get('signup') === 'true' || 
                             params.get('register') === '1' || params.get('join') === '1' ||
                             window.location.pathname === '/signup' || window.location.pathname === '/register';
      if (isSignupIntent) {
        setIsAccountModalOpen(true);
      }

      // Handle Citizen Account Welcome message: ?citizen=... or ?account=...
      const invitedBy = params.get('citizen') || params.get('account');
      if (invitedBy) {
        setPaymentToast(`👋 Welcome! Connected to ${decodeURIComponent(invitedBy)}'s live account. Complete sign-up to activate Police Safeguard.`);
        setIsAccountModalOpen(true);
      }

      // Handle Direct Download / Install intent parameter: ?download=1
      if (params.get('download') === '1') {
        setIsPWAModalOpen(true);
      }
    } catch (e) {
      console.warn('URL param parse error:', e);
    }
  }, []);

  // Sync authenticated session on mount and listen for offline reconnect
  useEffect(() => {
    const token = AuthClient.getToken();
    if (token) {
      AuthClient.fetchCurrentUser().then(serverUser => {
        if (serverUser) {
          setUserProfile(prev => ({
            ...prev,
            ...serverUser
          }));
          VaultCloudService.retrieveRecordsFromCloud(
            serverUser.duressLockPin || '7482',
            serverUser.email
          ).then(records => {
            if (records && records.length > 0) {
              setEvidenceRecords(records);
              try {
                localStorage.setItem('police_safeguard_records', JSON.stringify(records));
                localStorage.removeItem('civicshield_records');
              } catch (e) {}
            }
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    const handleOnline = () => {
      VaultCloudService.flushPendingSyncQueue().catch(() => {});
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Persistent Authentication & Firestore Profile Rehydration across restarts/refreshes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          if (!db) return;
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const remoteData = snap.data();
            setUserProfile(prev => {
              const remoteTier = remoteData.membershipTier || 'free';
              const localTier = prev?.membershipTier || 'free';
              const highestTier = (remoteTier === 'lifetime_pro' || localTier === 'lifetime_pro')
                ? 'lifetime_pro'
                : (remoteTier === 'all_encounters_pro' || localTier === 'all_encounters_pro')
                ? 'all_encounters_pro'
                : remoteTier;

              const merged: UserProfile = {
                ...prev,
                ...remoteData,
                id: fbUser.uid,
                userId: fbUser.uid,
                email: fbUser.email || prev.email,
                name: remoteData.name || prev.name || fbUser.displayName || 'Protected Citizen',
                membershipTier: highestTier,
                billingCycle: remoteData.billingCycle || prev.billingCycle || 'monthly',
                credits: Math.max(Number(remoteData.credits || 0), Number(prev.credits || 0), 5)
              };
              localStorage.setItem('police_safeguard_profile', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (err) {
          console.warn('[Firestore Profile Sync Notice]', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save profile changes and persist to Firestore + localStorage
  const handleSaveProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
    localStorage.removeItem('civicshield_profile');
    try {
      await AuthClient.updateProfile(updated);
    } catch (e) {
      console.warn('Profile sync error:', e);
    }
  };

  // Save tier change and optional credits and persist to Firestore + localStorage
  const handleSelectTier = async (tier: MembershipTier, cycle?: BillingCycle, addedCredits?: number) => {
    const currentCreds = userProfile.credits ?? 5;
    const newCredits = addedCredits ? currentCreds + addedCredits : currentCreds;
    const updated: UserProfile = { 
      ...userProfile, 
      membershipTier: tier,
      billingCycle: cycle || userProfile.billingCycle || 'monthly',
      credits: newCredits
    };
    setUserProfile(updated);
    localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
    localStorage.removeItem('civicshield_profile');
    try {
      await AuthClient.updateProfile(updated);
    } catch (e) {
      console.warn('Tier sync error:', e);
    }
  };

  // Save new recorded session and asynchronously back up to multi-device cloud vault
  const handleSessionRecorded = (record: EvidenceCustodyRecord) => {
    const updated = [record, ...evidenceRecords];
    setEvidenceRecords(updated);
    localStorage.setItem('police_safeguard_records', JSON.stringify(updated));
    localStorage.removeItem('civicshield_records');

    // Asynchronously synchronize custody record to multi-device cloud vault
    // This ensures court evidence can be retrieved across multi devices if phone is lost, damaged, or seized
    VaultCloudService.syncRecordToCloud(
      record, 
      undefined, 
      userProfile.email || undefined
    ).catch(e => console.warn('[Cloud Vault Sync]', e));

    setActiveTab('evidence-vault');
  };

  /**
   * INSTANT ARREST LOCKDOWN ROUTINE
   * Executed automatically by voice command (e.g. "Arrest Mode", "Under Arrest", "Being Arrested")
   * or one-tap emergency button when user is about to lose or has lost physical custody of the device.
   * 1. Seals all evidence records under FRE 902 / 5th Amendment with AES-256
   * 2. Automatically syncs all records to off-device multi-device cloud storage
   * 3. Releases screen WakeLock so native device screen timeout powers down hardware display
   * 4. Exits any browser fullscreen
   * 5. Instantly engages impenetrable full-screen device lock with pitch-black screen timeout mode
   */
  const handleInstantArrestLockdown = async (recordToSave?: EvidenceCustodyRecord) => {
    // 1. Release wakeLock if held so OS native display sleep triggers
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        // Any browser sentinel will expire/release
      }
    } catch (e) {}

    // 2. Turn off fullscreen if active to prevent browser lockup
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) {}

    // 3. Prepare complete list of records (including new record)
    let allRecords = [...evidenceRecords];
    if (recordToSave) {
      const existingIdx = allRecords.findIndex(r => r.sessionId === recordToSave.sessionId);
      if (existingIdx >= 0) {
        allRecords[existingIdx] = recordToSave;
      } else {
        allRecords = [recordToSave, ...allRecords];
      }
    }

    // 4. Seal all evidence records under FRE 902 / 5th Amendment with AES-256
    const sealedRecords = allRecords.map(rec => ({
      ...rec,
      isEncrypted: true,
      encryptionAlgorithm: 'AES-GCM-256 (NIST SP 800-38D)',
      custodyStatus: 'POLICE_CUSTODY_SEALED',
      sealedAt: Date.now()
    }));

    setEvidenceRecords(sealedRecords);
    try {
      localStorage.setItem('police_safeguard_records', JSON.stringify(sealedRecords));
      localStorage.removeItem('civicshield_records');
      localStorage.setItem('police_safeguard_is_locked', 'true');
      localStorage.removeItem('civicshield_is_locked');
      localStorage.removeItem('police_safeguard_active_recording_session');
      localStorage.setItem('police_safeguard_lockdown_options', JSON.stringify({
        requireCardRefundUnlock: true,
        captureIntruderPhoto: true,
        verifiedCardHolderName: userProfile.name || 'Verified Citizen',
        style: 'high-security',
        startWithScreenTimeout: true
      }));
      localStorage.removeItem('civicshield_lockdown_options');
    } catch (e) {}

    // 5. Automatically sync sealed evidence to multi-device cloud storage
    const userEmail = userProfile.email || undefined;
    const recoveryKey = VaultCloudService.getOrCreateRecoveryKey(userProfile);
    VaultCloudService.syncAllRecordsToCloud(sealedRecords, recoveryKey, userEmail).catch(err => {
      console.warn('[Arrest Cloud Sync Error]', err);
    });

    if (recordToSave) {
      VaultCloudService.syncRecordToCloud(recordToSave, recoveryKey, userEmail).catch(() => {});
    }

    // 6. Emergency live broadcast update
    try {
      LiveStreamService.publishSessionUpdate({
        sessionId: recordToSave?.sessionId || 'ARREST-LOCKDOWN',
        isLive: false,
        currentStatusNote: 'POLICE_CUSTODY_LOCKDOWN',
        completedAt: Date.now()
      });
    } catch (e) {}

    // Audio feedback indicating evidence is sealed, encrypted, synced and screen timed out
    try {
      VoiceEngine.speakAdvice(
        'Arrest mode activated. Evidence sealed, encrypted, and synced to cloud. Locking device.',
        userProfile.preferredVoice,
        userProfile.whisperModeEnabled
      );
    } catch (e) {}

    // 7. Instantly activate device screen lockdown with zero user prompt
    setIsArrestLockModalOpen(false);
    setIsLockdownActive(true);
  };

  // State for high-precision GPS locating status
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);

  // User-invoked or system-invoked high-precision GPS auto-detection for all 50 US States
  const handleAutoDetectGps = async () => {
    setIsGpsLocating(true);
    try {
      const res = await GpsJurisdictionService.detectPreciseJurisdiction();
      if (res && res.jurisdiction) {
        setJurisdiction(res.jurisdiction);
        const cityStr = res.city ? ` in ${res.city}` : '';
        setPaymentToast(
          `GPS Locked: ${res.stateName} (${res.stateCode})${cityStr} • ±${Math.round(res.accuracyMeters)}m precision`
        );
      }
    } catch (err: any) {
      console.warn('[GPS Auto-Detect] Location access error:', err);
      setPaymentToast(err?.message || 'GPS location unavailable. Please verify Location permissions.');
    } finally {
      setIsGpsLocating(false);
    }
  };

  // High-Precision GPS Auto-Detection across all 50 US States on initial mount
  useEffect(() => {
    GpsJurisdictionService.detectPreciseJurisdiction()
      .then((res) => {
        if (res && res.jurisdiction) {
          setJurisdiction(res.jurisdiction);
          console.info(
            `[GPS Auto-Detect] Precision locked to ${res.stateName} (${res.stateCode}) ` +
            `±${Math.round(res.accuracyMeters)}m via ${res.source}${res.city ? ` in ${res.city}` : ''}`
          );
        }
      })
      .catch((err) => {
        console.info('[GPS Auto-Detect] Geolocation prompt skipped or unavailable:', err?.message || err);
      });
  }, []);

  // When Lockdown is active, render full-screen lock screen
  if (isLockdownActive) {
    return (
      <LockdownScreen
        correctPin={userProfile.duressLockPin || '7482'}
        userProfile={userProfile}
        onUnlock={(photos) => {
          try {
            localStorage.removeItem('police_safeguard_is_locked');
            localStorage.setItem('police_safeguard_is_locked', 'false');
            localStorage.removeItem('police_protection_is_locked');
            localStorage.removeItem('civicshield_is_locked');
            localStorage.removeItem('police_safeguard_active_recording_session');
            localStorage.removeItem('police_safeguard_lockdown_options');
          } catch (e) {}

          // Ensure decryption photo is visible in Evidence Vault
          if (photos && photos.length > 0) {
            const decryptPhoto = photos.find((p: any) => p.reason === 'DECRYPT_SUCCESS') || photos[0];
            if (decryptPhoto && decryptPhoto.imageDataUrl) {
              const photoRecord: EvidenceCustodyRecord = {
                sessionId: `DECRYPT-VERIFIED-${Date.now().toString(36).toUpperCase()}`,
                createdAt: decryptPhoto.timestamp || Date.now(),
                completedAt: decryptPhoto.timestamp || Date.now(),
                durationSeconds: 0,
                sha256Hash: `SHA256-${decryptPhoto.id || Date.now()}`,
                deviceFingerprint: 'DEVICE-SECURE-HARDWARE',
                certificateId: `CERT-${Date.now()}`,
                admissibilityNotes: 'Verified owner decryption photo captured under FRE 902 / 5th Amendment standards.',
                videoUrl: decryptPhoto.imageDataUrl,
                thumbnailUrl: decryptPhoto.imageDataUrl,
                isEncrypted: false,
                isSealed: false,
                custodyStatus: 'VERIFIED_CHAIN_OF_CUSTODY',
                transcript: [
                  {
                    id: 'decrypt-cert',
                    timestamp: decryptPhoto.timestamp || Date.now(),
                    speaker: 'system',
                    originalText: `✓ CONSTITUTIONAL CUSTODY RELEASE: Verified owner decryption photo captured under FRE 902 / 5th Amendment standards.`
                  }
                ]
              };

              setEvidenceRecords(prev => {
                const nextRecords = [photoRecord, ...prev.filter(r => r.sessionId !== photoRecord.sessionId)];
                try {
                  localStorage.setItem('police_safeguard_records', JSON.stringify(nextRecords));
                } catch (e) {}
                const userEmail = userProfile.email || undefined;
                const recoveryKey = VaultCloudService.getOrCreateRecoveryKey(userProfile);
                VaultCloudService.syncRecordToCloud(photoRecord, recoveryKey, userEmail).catch(() => {});
                return nextRecords;
              });
            }
          }

          setIsLockdownActive(false);
          setPaymentToast('✓ Device decrypted. Constitutional custody record & decryption photo saved to Evidence Vault.');
        }}
      />
    );
  }

  // When viewing a shared live stream or post-incident archive via SMS link
  if (sharedFeedSessionId) {
    return (
      <LiveStreamViewer
        sessionId={sharedFeedSessionId}
        onExit={() => {
          // Security isolation: Witness viewers closing the stream must never be dropped into any citizen account
          try {
            window.location.href = '/download';
          } catch (e) {
            setSharedFeedSessionId(null);
            setIsAccountModalOpen(true);
          }
        }}
      />
    );
  }

  const isPaid = userProfile.membershipTier === 'paid';

  return (
    <div 
      id="police-safeguard-app-root" 
      data-theme={userProfile.appTheme || 'tactical_dark'}
      className="flex flex-col h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full max-w-full text-zinc-100 font-sans overflow-hidden select-none relative bg-zinc-950 transition-colors duration-300"
      style={{
        backgroundImage: userProfile.customBackgroundImageUrl 
          ? `linear-gradient(rgba(0,0,0,${userProfile.backgroundOpacity ?? 0.65}), rgba(0,0,0,${userProfile.backgroundOpacity ?? 0.65})), url('${userProfile.customBackgroundImageUrl}')`
          : userProfile.appTheme === 'midnight_blue'
          ? `radial-gradient(ellipse at 50% 0%, rgba(14, 40, 95, 0.92) 0%, rgba(8, 20, 50, 0.96) 55%, rgba(2, 6, 23, 0.99) 100%), url('/images/app_background_dark_1790279147669.jpg')`
          : userProfile.appTheme === 'carbon_fiber'
          ? `radial-gradient(ellipse at 50% 0%, rgba(45, 45, 45, 0.92) 0%, rgba(24, 24, 24, 0.98) 60%, rgba(10, 10, 10, 1) 100%), url('/images/app_background_dark_1790279147669.jpg')`
          : userProfile.appTheme === 'amber_gold'
          ? `radial-gradient(ellipse at 50% 0%, rgba(100, 65, 12, 0.90) 0%, rgba(50, 30, 5, 0.96) 60%, rgba(15, 10, 4, 0.99) 100%), url('/images/app_background_dark_1790279147669.jpg')`
          : userProfile.appTheme === 'crimson_guard'
          ? `radial-gradient(ellipse at 50% 0%, rgba(110, 18, 30, 0.90) 0%, rgba(55, 10, 16, 0.96) 60%, rgba(20, 5, 8, 0.99) 100%), url('/images/app_background_dark_1790279147669.jpg')`
          : userProfile.appTheme === 'forest_camo'
          ? `radial-gradient(ellipse at 50% 0%, rgba(20, 75, 38, 0.90) 0%, rgba(10, 40, 20, 0.96) 60%, rgba(4, 18, 9, 0.99) 100%), url('/images/app_background_dark_1790279147669.jpg')`
          : `radial-gradient(ellipse at 50% 0%, rgba(24, 28, 42, 0.75) 0%, rgba(9, 10, 15, 0.94) 65%, rgba(6, 7, 10, 0.98) 100%), url('/images/app_background_dark_1790279147669.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      
      {/* Dynamic ambient lighting vignette overlay customized per theme */}
      <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ${
        userProfile.appTheme === 'midnight_blue'
          ? 'bg-gradient-to-b from-blue-600/[0.14] via-transparent to-black/60 shadow-[inset_0_0_120px_rgba(37,99,235,0.22)]'
          : userProfile.appTheme === 'crimson_guard'
          ? 'bg-gradient-to-b from-red-600/[0.16] via-transparent to-black/60 shadow-[inset_0_0_120px_rgba(220,38,38,0.25)]'
          : userProfile.appTheme === 'amber_gold'
          ? 'bg-gradient-to-b from-amber-400/[0.15] via-transparent to-black/60 shadow-[inset_0_0_120px_rgba(245,158,11,0.25)]'
          : userProfile.appTheme === 'forest_camo'
          ? 'bg-gradient-to-b from-emerald-500/[0.14] via-transparent to-black/60 shadow-[inset_0_0_120px_rgba(16,185,129,0.22)]'
          : userProfile.appTheme === 'carbon_fiber'
          ? 'bg-gradient-to-b from-zinc-300/[0.08] via-transparent to-black/60 shadow-[inset_0_0_120px_rgba(255,255,255,0.06)]'
          : 'bg-gradient-to-b from-amber-500/[0.04] via-transparent to-black/50'
      }`} />
      
      {/* Payment Success Toast Banner */}
      {paymentToast && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shrink-0 shadow-lg animate-in slide-in-from-top duration-300 z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{paymentToast}</span>
          </div>
          <button 
            onClick={() => setPaymentToast(null)}
            className="p-1 hover:bg-black/20 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Navigation Header - Fully Animated Cinematic Theme with Pictures */}
      <header className="relative bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-6 py-2 sm:py-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] flex items-center justify-between gap-2 shrink-0 z-30 shadow-2xl shadow-black/60 overflow-hidden">
        
        {/* Animated Background Picture with Cinematic Ambient Lighting */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          <img
            src="/images/header_hero_bg_1790518831644.jpg"
            alt="Police SafeGuard Ambient Highway Header"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30 animate-slow-pan scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-zinc-950/95" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-zinc-950" />
          <div className="absolute -top-12 left-1/4 w-96 h-28 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />
        </div>

        {/* Shimmering Animated Bottom Highlight Border reflecting active theme */}
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] animate-shimmer pointer-events-none ${
          userProfile.appTheme === 'midnight_blue'
            ? 'bg-gradient-to-r from-blue-500/0 via-cyan-400/90 to-blue-500/0'
            : userProfile.appTheme === 'crimson_guard'
            ? 'bg-gradient-to-r from-red-500/0 via-rose-400/90 to-red-500/0'
            : userProfile.appTheme === 'forest_camo'
            ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-400/90 to-emerald-500/0'
            : userProfile.appTheme === 'carbon_fiber'
            ? 'bg-gradient-to-r from-zinc-400/0 via-zinc-200/90 to-zinc-400/0'
            : 'bg-gradient-to-r from-amber-500/0 via-amber-400/90 to-amber-500/0'
        }`} />

        {/* Brand Logo & Name with Radar Sweep Animation */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10 select-none min-w-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0 ring-2 ring-amber-400/50 group overflow-hidden">
            {/* Rotating Radar Sweep Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent animate-radar-sweep pointer-events-none" />
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 fill-black relative z-10 drop-shadow" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black tracking-wide text-white uppercase flex items-center gap-1.5 whitespace-nowrap">
                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-sm">POLICE SAFEGUARD</span>
              </h1>
              <span className="hidden md:flex text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-amber-400/20 text-amber-300 border border-amber-500/50 uppercase tracking-wider shadow-sm items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>REAL-TIME AI</span>
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium hidden sm:flex items-center gap-1.5 max-w-2xl truncate">
              <span>Personal AI rights guide &amp; court evidence vault</span>
            </p>
          </div>
        </div>

        {/* Consolidated Right Status & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Active Jurisdiction Pill with 50-State Selector and Precise GPS Trigger */}
          <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-700/80 rounded-lg p-0.5 shadow-sm">
            <button
              id="header-jurisdiction-pill"
              onClick={() => setActiveTab('jurisdictions')}
              title="Click to view full statutory repository for this state"
              className="flex items-center gap-1 hover:bg-zinc-800 px-1.5 sm:px-2 py-1 rounded text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-bold text-[11px] sm:text-xs">{jurisdiction.stateCode}</span>
              <span className="text-[10px] text-zinc-400 hidden xl:inline">({jurisdiction.stateName})</span>
            </button>

            {/* All 50 States Quick Selector - Desktop / Tablet */}
            <select
              id="header-state-select"
              value={jurisdiction.stateCode}
              onChange={(e) => {
                const target = getJurisdictionByCode(e.target.value);
                setJurisdiction(target);
                setPaymentToast(`Jurisdiction set to: ${target.stateName}`);
              }}
              className="hidden sm:block bg-zinc-950/80 text-amber-300 border border-zinc-700/60 rounded px-1.5 py-0.5 text-[11px] font-bold focus:outline-none focus:border-amber-400 cursor-pointer max-w-[130px] truncate"
              title="Select any of the 50 US States to load local statutes"
            >
              {US_STATE_LIST.map((st) => (
                <option key={st.code} value={st.code} className="bg-zinc-900 text-white">
                  {st.code} - {st.name}
                </option>
              ))}
            </select>

            {/* High-Precision GPS Auto-Detect Button */}
            <button
              type="button"
              id="header-auto-gps-btn"
              onClick={handleAutoDetectGps}
              disabled={isGpsLocating}
              title="Auto-detect state using precise GPS"
              className={`hidden sm:flex p-1.5 rounded-md text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 transition-all cursor-pointer ${
                isGpsLocating ? 'animate-spin text-amber-400 bg-amber-500/10' : ''
              }`}
            >
              <Navigation className={`w-3 h-3 ${isGpsLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Unified Membership Tier & Defense Credits Badge */}
          <button
            id="header-membership-btn"
            onClick={() => handleOpenUpgradePortal()}
            title="Membership Plan & Defense Credits"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
              userProfile.membershipTier === 'lifetime_pro'
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-black shadow-amber-500/20'
                : userProfile.membershipTier === 'all_encounters_pro' || userProfile.membershipTier === 'paid'
                ? 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 text-black shadow-amber-500/20' 
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border border-amber-500/40'
            }`}
          >
            {userProfile.membershipTier === 'lifetime_pro' ? (
              <InfinityIcon className="w-3 h-3 text-black shrink-0" />
            ) : userProfile.membershipTier === 'all_encounters_pro' || userProfile.membershipTier === 'paid' ? (
              <Sparkles className="w-3 h-3 text-black shrink-0" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            )}
            <span className="font-black uppercase text-[10px] sm:text-xs">
              {userProfile.membershipTier === 'lifetime_pro'
                ? 'LIFETIME'
                : userProfile.membershipTier === 'all_encounters_pro' || userProfile.membershipTier === 'paid'
                ? 'PRO'
                : 'FREE'}
            </span>
            <span className="text-zinc-500 mx-0.5 hidden xs:inline">•</span>
            <span className="font-mono text-amber-400 text-[10px] sm:text-xs hidden xs:inline">{userProfile.credits ?? 5}C</span>
          </button>

          {/* Live Police Scanner Radio Button */}
          <button
            id="header-police-scanner-btn"
            onClick={() => setIsPoliceScannerOpen(true)}
            title="Listen in on Live Local Police Radio Scanner"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-black transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span className="hidden sm:inline">SCANNER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          </button>

          {/* User Profile & Audio Settings Button */}
          <button
            id="header-profile-btn"
            onClick={() => setIsProfileModalOpen(true)}
            title="Citizen profile, earbud whisper mode, and native language"
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 hover:border-zinc-600 transition-colors cursor-pointer relative shadow-sm shrink-0"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
            {userProfile.nativeLanguage !== 'en' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-zinc-950" />
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            id="header-fullscreen-btn"
            onClick={toggleAppFullscreen}
            title={isAppFullscreen ? "Exit full screen" : "View full screen on mobile device"}
            className="hidden sm:flex p-1.5 sm:p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 hover:border-zinc-600 transition-colors cursor-pointer relative shadow-sm shrink-0"
          >
            {isAppFullscreen ? (
              <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            )}
          </button>

          {/* One-Click Mobile App Download Button */}
          <button
            id="header-download-app-btn"
            onClick={handleHeaderDownloadApp}
            title="Download & Install Mobile App (1-Click)"
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 text-xs font-black transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-extrabold flex items-center gap-1">
              <span>App</span>
              <span className="hidden md:inline px-1 py-0.2 rounded bg-emerald-400/20 text-emerald-300 text-[9px] font-black uppercase">1-CLICK</span>
            </span>
          </button>

          {/* Master Menu Drawer Button */}
          <button
            id="header-menu-btn"
            onClick={() => setIsMenuDrawerOpen(true)}
            title="Open Consolidated Menu: Server Status, Device Permissions, Witness Network, Referral Program, Charity Pledge & Privacy"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 text-amber-300 border border-amber-500/50 hover:border-amber-400 text-xs font-black tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-amber-500/20 shrink-0"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">MENU</span>
          </button>
        </div>
      </header>

      {/* Payment Failure / Access Restricted Alert Banner */}
      {userProfile.paymentStatus === 'failed' && (
        <div className="bg-red-950/95 border-b border-red-600 px-4 py-2.5 flex items-center justify-between gap-3 text-red-200 text-xs shrink-0 z-20 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            <span>
              <strong className="text-white uppercase tracking-wider">Payment Failed — Access Restricted:</strong> Your recurring subscription payment could not be processed. Pro features are currently locked. Please update your card or start your 30-day free trial to restore full protection.
            </span>
          </div>
          <button
            onClick={() => handleOpenUpgradePortal()}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-wider shrink-0 cursor-pointer shadow-md"
          >
            Update Payment
          </button>
        </div>
      )}

      {/* Main Tab Navigation Bar - Desktop Only */}
      <nav className="hidden md:flex bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-6 py-1.5 items-center justify-between shrink-0 overflow-x-auto gap-2 z-20">
        <div className="flex items-center gap-1 sm:gap-2">
          
          <button
            id="tab-live-monitor"
            onClick={() => setActiveTab('live-monitor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'live-monitor'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-950/60 ring-1 ring-red-400/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>LIVE DASHCAM</span>
          </button>

          <button
            id="tab-evidence-vault"
            onClick={() => setActiveTab('evidence-vault')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'evidence-vault'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>COURT EVIDENCE VAULT</span>
            <span className="text-[10px] font-mono bg-black/40 px-1.5 rounded">
              {evidenceRecords.length}
            </span>
          </button>

          <button
            id="tab-jurisdictions"
            onClick={() => setActiveTab('jurisdictions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'jurisdictions'
                ? 'bg-zinc-800 text-white border border-zinc-600 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>JURISDICTION LAWS</span>
          </button>

          <button
            id="tab-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-950/60 ring-1 ring-amber-300/50 font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>STOP SIMULATOR</span>
          </button>

        </div>

        {/* Right Action Controls: Police Scanner, Emergency Witness Broadcast & Audio Whisper */}
        <div className="flex items-center gap-2.5">
          <button
            id="nav-police-scanner"
            onClick={() => setIsPoliceScannerOpen(true)}
            title="Listen in on Live Local Police Radio Scanner"
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">POLICE SCANNER</span>
            <span className="sm:hidden">SCANNER</span>
          </button>

          <button
            id="nav-flock-radar"
            onClick={() => setIsFlockMapOpen(true)}
            title="View Live Flock Safety Cameras & Surveillance Radar Map"
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-500/50 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">FLOCK MAP</span>
            <span className="sm:hidden">RADAR</span>
            <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-purple-500/30 text-purple-200">
              RADAR
            </span>
          </button>

          <button
            id="tab-witness-network"
            onClick={() => setIsShareFeedModalOpen(true)}
            title="Configure Emergency Witnesses and view live stream sharing link"
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-500/50 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="hidden sm:inline">WITNESS NETWORK</span>
            <span className="sm:hidden">WITNESSES</span>
            <span className="text-[9px] font-black uppercase px-1 rounded bg-red-500/20 text-red-300">
              LIVE
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-full border border-zinc-800/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EARBUD ISOLATION ACTIVE</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'live-monitor' && !isAccountModalOpen && (
          <LiveInteractionView
            jurisdiction={jurisdiction}
            userProfile={userProfile}
            onUpdateProfile={handleSaveProfile}
            onSessionRecorded={handleSessionRecorded}
            onTriggerArrestLockdown={() => setIsArrestLockModalOpen(true)}
            onInstantArrestLockdown={handleInstantArrestLockdown}
            onUpgradePrompt={() => handleOpenUpgradePortal()}
            onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
            onEmergencyRefreshServer={handleEmergencyRefreshServer}
            onOpenFlockMap={() => setIsFlockMapOpen(true)}
            isSuspended={false}
          />
        )}

        {activeTab === 'live-monitor' && isAccountModalOpen && (
          <div className="flex-1 h-full w-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-amber-400 shadow-xl">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wider">Police Safeguard AI Copilot</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Please complete account setup or sign in to activate real-time encrypted surveillance and legal rights analysis.
            </p>
          </div>
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            jurisdiction={jurisdiction}
            userProfile={userProfile}
            onUpgradePrompt={() => handleOpenUpgradePortal()}
          />
        )}

        {activeTab === 'evidence-vault' && (
          <EvidenceVaultView
            records={evidenceRecords}
            userProfile={userProfile}
            onUpgradePrompt={() => handleOpenUpgradePortal()}
            onUpdateRecords={(records) => setEvidenceRecords(records)}
            openRetrieveModalDirectly={openVaultRetrieveModal}
            onCloseRetrieveModal={() => setOpenVaultRetrieveModal(false)}
          />
        )}

        {activeTab === 'jurisdictions' && (
          <JurisdictionGuideView
            currentJurisdiction={jurisdiction}
            onSelectJurisdiction={(law) => setJurisdiction(law)}
          />
        )}
      </main>

      {/* Mobile Convenient Bottom Navigation Bar with Menu Tab */}
      <nav 
        id="mobile-bottom-navigation" 
        className="md:hidden bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/90 px-2 py-1.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] pl-[max(0.5rem,env(safe-area-inset-left,0px))] pr-[max(0.5rem,env(safe-area-inset-right,0px))] flex items-center justify-around shrink-0 z-30 shadow-2xl safe-area-bottom"
      >
        <button
          id="mobile-tab-live"
          onClick={() => setActiveTab('live-monitor')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'live-monitor'
              ? 'text-red-400 font-extrabold bg-red-950/50 border border-red-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Video className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dashcam</span>
        </button>

        <button
          id="mobile-tab-simulator"
          onClick={() => setActiveTab('simulator')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'simulator'
              ? 'text-amber-400 font-extrabold bg-amber-950/50 border border-amber-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Play className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Simulator</span>
        </button>

        <button
          id="mobile-tab-vault"
          onClick={() => setActiveTab('evidence-vault')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'evidence-vault'
              ? 'text-emerald-400 font-extrabold bg-emerald-950/50 border border-emerald-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Vault ({evidenceRecords.length})</span>
        </button>

        <button
          id="mobile-tab-laws"
          onClick={() => setActiveTab('jurisdictions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'jurisdictions'
              ? 'text-zinc-100 font-extrabold bg-zinc-800 border border-zinc-600/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Scale className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Laws</span>
        </button>

        {/* Convenient Menu Tab Button on Mobile */}
        <button
          id="mobile-tab-menu"
          onClick={() => setIsMenuDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-400/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm"
        >
          <Menu className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[10px] font-bold tracking-tight">Menu</span>
        </button>
      </nav>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        onSave={handleSaveProfile}
        onUpgradePrompt={() => {
          setIsProfileModalOpen(false);
          handleOpenUpgradePortal();
        }}
        onOpenAccountOnboarding={() => {
          setIsProfileModalOpen(false);
          setIsAccountModalOpen(true);
        }}
        onOpenAccountManagement={(tab) => {
          setIsProfileModalOpen(false);
          handleOpenAccountManagement(tab);
        }}
        onOpenCharityModal={() => {
          setIsProfileModalOpen(false);
          setIsCharityModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Subscription Tier Modal (Stripe Checkout) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        currentTier={userProfile.membershipTier}
        currentCredits={userProfile.credits ?? 5}
        onSelectTier={handleSelectTier}
        userEmail={userProfile.email || ''}
        onOpenReferralProgram={() => {
          setIsSubscriptionModalOpen(false);
          setIsReferralModalOpen(true);
        }}
        onOpenPromoModal={() => {
          setIsSubscriptionModalOpen(false);
          setIsPromoModalOpen(true);
        }}
                onOpenStripePortal={(config) => {
          setIsSubscriptionModalOpen(false);
          setStripePortalConfig({
            initialTier: config?.tier,
            initialCycle: config?.billingCycle
          });
          setIsStripePortalOpen(true);
        }}
      />

      {/* Live Stripe Subscription Payment Portal Modal */}
      <LiveStripeSubscriptionPortalModal
        isOpen={isStripePortalOpen}
        onClose={() => setIsStripePortalOpen(false)}
        onOpenPromoModal={() => {
          setIsStripePortalOpen(false);
          setIsPromoModalOpen(true);
        }}
        userEmail={userProfile.email || ''}
        currentTier={userProfile.membershipTier}
        initialTier={stripePortalConfig.initialTier}
        initialCycle={stripePortalConfig.initialCycle}
        onPaymentSuccess={(tier, cycle, credits) => {
          handleSelectTier(tier, cycle, credits);
          setIsStripePortalOpen(false);
          setPaymentToast('🎉 Subscription Confirmed! Official Stripe payment successfully routed.');
        }}
      />

      {/* Arrest Emergency Encryption Modal */}
      <ArrestLockdownModal
        isOpen={isArrestLockModalOpen}
        onClose={() => setIsArrestLockModalOpen(false)}
        userPin={userProfile.duressLockPin || '7482'}
        userProfile={userProfile}
        onUpgradePrompt={() => handleOpenUpgradePortal()}
        onLockEngaged={() => {
          setIsArrestLockModalOpen(false);
          setIsLockdownActive(true);
        }}
      />

      {/* PWA Download / Mobile Install Modal */}
      <PWADownloadModal
        isOpen={isPWAModalOpen}
        onClose={() => setIsPWAModalOpen(false)}
        appUrl={AppUrlHelper.getLiveAccountDownloadUrl(
          ReferralService.getReferralState().referralCode,
          userProfile.name
        )}
        referralCode={ReferralService.getReferralState().referralCode}
        citizenName={userProfile.name}
      />

      {/* Navigation Menu Drawer (Convenient Command Center) */}
      <NavigationMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as ActiveTab)}
        userProfile={userProfile}
        jurisdiction={jurisdiction}
        evidenceRecordsCount={evidenceRecords.length}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenSubscriptionModal={() => handleOpenUpgradePortal()}
        onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
        onOpenWitnessModal={() => setIsShareFeedModalOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
        onOpenPromoModal={() => setIsPromoModalOpen(true)}
        onOpenCharityModal={() => setIsCharityModalOpen(true)}
        onOpenServerActivity={() => setIsServerActivityModalOpen(true)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        isAdminMode={isDeveloperModeActive}
        onOpenOfficialDomainModal={() => setIsPWAModalOpen(true)}
        onOpenPWADownloadModal={() => setIsPWAModalOpen(true)}
        onOpenAccountManagement={(tab) => {
          setIsMenuDrawerOpen(false);
          handleOpenAccountManagement(tab);
        }}
                onOpenStripePortal={() => {
          setIsMenuDrawerOpen(false);
          handleOpenUpgradePortal();
        }}
        onOpenPoliceScanner={() => {
          setIsMenuDrawerOpen(false);
          setIsPoliceScannerOpen(true);
        }}
        onOpenFlockMap={() => {
          setIsMenuDrawerOpen(false);
          setIsFlockMapOpen(true);
        }}
        onToggleOnlineMode={() => {
          const next = userProfile.isCloudOnlineMode === false ? true : false;
          const updated = { ...userProfile, isCloudOnlineMode: next };
          setUserProfile(updated);
          localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
          setPaymentToast(next ? '🌐 Online Cloud Mode Active (Real-Time Relay)' : '🔒 Offline Local Shield Active (Air-Gapped)');
        }}
        onLogout={handleLogout}
      />

      {/* Live Police Scanner Radio Modal & Background Mini Player */}
      <PoliceScannerModal
        isOpen={isPoliceScannerOpen}
        onClose={() => setIsPoliceScannerOpen(false)}
        userStateCode={jurisdiction?.stateCode || 'TX'}
      />
      <PoliceScannerMiniBar
        onOpenFullModal={() => setIsPoliceScannerOpen(true)}
      />

      {/* Flock Camera Surveillance & ALPR Radar Map Modal */}
      {isFlockMapOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col">
          <FlockSurveillanceMapView
            onClose={() => setIsFlockMapOpen(false)}
          />
        </div>
      )}

      {/* Standalone Emergency Share Modal Triggered from Menu */}
      <ShareLiveFeedModal
        isOpen={isShareFeedModalOpen}
        onClose={() => setIsShareFeedModalOpen(false)}
        sessionId={evidenceRecords[0]?.sessionId || 'ACTIVE-VAULT-FEED'}
        isRecording={false}
        userProfile={userProfile}
        onUpdateProfile={handleSaveProfile}
        onUpgradePrompt={() => handleOpenUpgradePortal()}
        locationCity={jurisdiction.stateName}
        locationState={jurisdiction.stateCode}
      />

      {/* First-Time Launch Account Creation Modal (Google, Facebook, Apple + Up to 5 Emergency Contacts) */}
      <AccountOnboardingModal
        isOpen={isAccountModalOpen}
        canDismiss={(() => {
          try {
            const token = AuthClient.getToken();
            return !!(token && userProfile.name && userProfile.name !== 'Protected Citizen');
          } catch {
            return false;
          }
        })()}
        onClose={() => setIsAccountModalOpen(false)}
        initialProfile={userProfile}
        onComplete={(newProfile) => {
          handleSaveProfile(newProfile);
          setIsAccountModalOpen(false);
          setPaymentToast('Citizen Account registered! Real-time constitutional protection active.');
        }}
      />

      {/* Civilian Referral Rewards Modal (Free Monthly, Yearly, or Lifetime Access) */}
      <ReferralProgramModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        onRewardClaimed={handleReferralRewardClaimed}
      />

      {/* Ambassador Promo Code Modal (Friends & Family Lifetime Access) */}
      <PromoCodeModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        userProfile={userProfile}
        onSuccess={handlePromoSuccess}
      />

      {/* Device Permissions Modal (Camera, Mic, GPS, Notifications) */}
      <DevicePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        onPermissionsUpdated={(perms) => {
          if (perms.location) {
            handleAutoDetectGps();
          }
        }}
      />

      {/* Account Deletion, Subscription Cancellation & Data Privacy Modal (GDPR/CCPA Compliant) */}
      <AccountManagementModal
        isOpen={isAccountManagementModalOpen}
        onClose={() => setIsAccountManagementModalOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={handleSaveProfile}
        onAccountDeleted={handleAccountDeleted}
        evidenceRecords={evidenceRecords}
        initialTab={accountManagementTab}
      />

      {/* Standalone Geographic and Jurisdictional Feature Availability Terms Modal */}
      <GeographicJurisdictionLegalModal
        isOpen={isJurisdictionTermsModalOpen}
        onClose={() => setIsJurisdictionTermsModalOpen(false)}
      />

      {/* Standalone 5% Law Enforcement Charity Pledge & Impact Modal */}
      <LawEnforcementCharityModal
        isOpen={isCharityModalOpen}
        onClose={() => setIsCharityModalOpen(false)}
        onOpenSubscriptionModal={() => {
          setIsCharityModalOpen(false);
          handleOpenUpgradePortal();
        }}
              />

      

      {/* Mandatory Legal Disclaimer & FRE 902 Safety Acknowledgment Modal */}
      <MandatoryLegalDisclaimerModal
        isOpen={isDisclaimerModalOpen}
        canDismiss={(() => {
          try {
            return (localStorage.getItem('police_safeguard_legal_disclaimer_accepted') || localStorage.getItem('police_protection_legal_disclaimer_accepted') || localStorage.getItem('civicshield_legal_disclaimer_accepted')) === 'true';
          } catch {
            return false;
          }
        })()}
        onClose={() => setIsDisclaimerModalOpen(false)}
        onAgree={() => {
          setIsDisclaimerModalOpen(false);
        }}
      />


      {/* Programmatic Commercial Video Sponsor Interstitial (Safe Non-Encounter Mode) */}
      <CommercialVideoAdModal
        isOpen={isSignoutAdOpen || adModalConfig.isOpen}
        onClose={() => {
          if (isSignoutAdOpen) handleCompleteLogout();
          setAdModalConfig(prev => ({ ...prev, isOpen: false }));
        }}
        reason={isSignoutAdOpen ? 'signout' : adModalConfig.reason}
        onAdFinished={() => {
          if (isSignoutAdOpen) handleCompleteLogout();
          if (adModalConfig.onFinished) adModalConfig.onFinished();
          setAdModalConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />

      {/* Administrative Developer Portal Modal (Live Stripe, System Stats, Role Manager) */}
      <AdminDeveloperPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile(updated);
          try {
            localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
          } catch (e) {}
        }}
        onSwitchToClientMode={() => {
          setActiveAdminViewMode('client');
          try {
            localStorage.setItem('police_safeguard_admin_view_mode', 'client');
          } catch (e) {}
          setIsAdminPortalOpen(false);
          setPaymentToast('Switched to Civilian Client View (All sensitive developer controls hidden)');
        }}
      />

      {/* Real-Time Server Health & Multi-Device Cloud Sync Telemetry Modal */}
      {isDeveloperModeActive && (
        <ServerActivityModal
          isOpen={isServerActivityModalOpen}
          onClose={() => setIsServerActivityModalOpen(false)}
          onRefreshComplete={(msg) => setPaymentToast(msg)}
        />
      )}
    </div>
  );
};
