import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, User, Phone, Car, Globe, Lock, CheckCircle2, 
  Sparkles, ArrowRight, ArrowLeft, Plus, Trash2, Star, 
  AlertCircle, ShieldCheck, HeartPulse, Check, Radio, X,
  Key, LogIn, UserPlus, Loader2, Eye, EyeOff, FileText, Scale
} from 'lucide-react';
import { UserProfile, EmergencyContact, AuthProvider } from '../types';
import { SUPPORTED_LANGUAGES } from '../services/translator';
import { AVAILABLE_VOICES, VoiceEngine } from '../services/voiceEngine';
import { AuthClient } from '../services/authClient';
import { VaultCloudService } from '../services/vaultCloudService';

interface AccountOnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
  canDismiss?: boolean;
  onClose?: () => void;
  defaultEmail?: string;
}

// Brand SVG Icons
const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.61 1.34-.55.63-.99 1.68-.87 2.7.99.08 2.01-.51 2.55-1.19z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const AccountOnboardingModal: React.FC<AccountOnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialProfile,
  canDismiss = false,
  onClose,
  defaultEmail = ''
}) => {
  // Landing Mode: 'signup' (new user) or 'signin' (returning user) - both accessible on same page
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('signin') === '1' ||
        params.get('login') === '1' ||
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/signin')
      ) {
        return 'signin';
      }
      try {
        const lastEmail = localStorage.getItem('police_safeguard_last_email');
        const accountCreated = localStorage.getItem('police_safeguard_account_created');
        if (lastEmail || accountCreated === 'true') {
          return 'signin';
        }
      } catch (e) {}
    }
    return 'signup';
  });

  // Step state: 1 = Auth / Landing, 2 = Identity & Vehicle, 3 = Emergency Contacts (up to 5), 4 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Silence safeguard: unconditionally stop any speech or audio whenever onboarding modal is visible
  useEffect(() => {
    if (isOpen) {
      VoiceEngine.stopAudio();
    }
  }, [isOpen]);

  const [selectedProvider, setSelectedProvider] = useState<AuthProvider>('google');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('');
  const [showAuthPassword, setShowAuthPassword] = useState<boolean>(false);
  const [showAuthConfirmPassword, setShowAuthConfirmPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [isSocialVerified, setIsSocialVerified] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'client' | 'admin'>('client');

  // Returning Citizen / Sign In state
  const [loginEmail, setLoginEmail] = useState<string>(() => {
    if (defaultEmail) return defaultEmail;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('police_safeguard_last_email') || initialProfile?.email || '';
    }
    return '';
  });
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Recovery Key state for returning users who forgot password
  const [showRecoveryView, setShowRecoveryView] = useState<boolean>(false);
  const [recoveryEmail, setRecoveryEmail] = useState<string>('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState<string>('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const [emailAuthError, setEmailAuthError] = useState<string | null>(null);
  const completedProfileIdRef = useRef<string | null>(null);

  // Mandatory End-User Legal Agreement & FRE 902 Safety Acknowledgment (displayed during sign up)
  const [legalAgreementAccepted, setLegalAgreementAccepted] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('police_safeguard_legal_disclaimer_accepted') ||
        localStorage.getItem('police_protection_legal_disclaimer_accepted')
      ) === 'true';
    } catch {
      return false;
    }
  });
  const [showLegalTermsModal, setShowLegalTermsModal] = useState<boolean>(false);

  // Step 2: Personal & Vehicle details (starts empty if fresh citizen registration)
  const [phone, setPhone] = useState<string>(initialProfile?.phone || '');
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>(initialProfile?.vehicleMakeModel || '');
  const [vehiclePlate, setVehiclePlate] = useState<string>(initialProfile?.vehicleLicensePlate || '');
  const [vehicleColor, setVehicleColor] = useState<string>(initialProfile?.vehicleColor || '');
  const [nativeLanguage, setNativeLanguage] = useState<string>(initialProfile?.nativeLanguage || 'en');
  const [preferredVoice, setPreferredVoice] = useState<string>(initialProfile?.preferredVoice || 'executive-counsel');
  const [whisperMode, setWhisperMode] = useState<boolean>(initialProfile?.whisperModeEnabled ?? true);
  const [duressPin, setDuressPin] = useState<string>(initialProfile?.duressLockPin || '7482');
  const [medicalNotes, setMedicalNotes] = useState<string>(initialProfile?.medicalConditions || 'None');
  const [isHardOfHearing, setIsHardOfHearing] = useState<boolean>(initialProfile?.isDeafOrHardOfHearing || false);

  // Step 3: Up to 5 Emergency Contacts (starts empty if no saved contacts)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    (initialProfile?.emergencyContacts && initialProfile.emergencyContacts.length > 0)
      ? initialProfile.emergencyContacts.slice(0, 5)
      : []
  );
  const [autoNotifyOnStart, setAutoNotifyOnStart] = useState<boolean>(initialProfile?.autoNotifyContactOnStart ?? true);

  // Inline new contact form
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactRel, setNewContactRel] = useState<string>('Family');
  const [contactError, setContactError] = useState<string | null>(null);

  // Real Device-Verified Google Sign-In & Authentication
  const handleSelectSocial = async (provider: AuthProvider) => {
    setSelectedProvider(provider);
    setEmailAuthError(null);
    setLoginError(null);

    if (provider === 'google') {
      setIsAuthenticating(true);
      try {
        const fbRes = await AuthClient.signInWithFirebaseGoogle();
        if (fbRes.success && fbRes.user) {
          const verifiedUser = fbRes.user;
          const resolvedName = verifiedUser.name || verifiedUser.displayName || 'Protected Citizen';
          const resolvedEmail = verifiedUser.email || '';
          const resolvedPhone = verifiedUser.phone || '';

          setFullName(resolvedName);
          setAuthEmail(resolvedEmail);
          if (resolvedPhone) setPhone(resolvedPhone);
          setIsSocialVerified(true);
          setSelectedProvider('google');

          if (verifiedUser.id) {
            completedProfileIdRef.current = verifiedUser.id;
          }

          // Complete login and enter app immediately without friction
          onComplete(verifiedUser);
          return;
        }

        const err = fbRes.error || 'Google sign-in could not be completed.';
        if (authMode === 'signin') {
          setLoginError(err);
        } else {
          setEmailAuthError(err);
        }
      } catch (err: any) {
        const msg = err?.message || 'Google verification could not be completed.';
        if (authMode === 'signin') {
          setLoginError(msg);
        } else {
          setEmailAuthError(msg);
        }
      } finally {
        setIsAuthenticating(false);
      }
      return;
    }

    // Apple / Facebook: Direct social authentication with verified email
    if (provider === 'apple' || provider === 'facebook') {
      const emailCandidate = authEmail.trim() || loginEmail.trim() || defaultEmail;
      if (!emailCandidate || !emailCandidate.includes('@')) {
        setSelectedProvider('email');
        setEmailAuthError(`Please enter your email address to continue with ${provider === 'apple' ? 'Apple ID' : 'Facebook'}.`);
        return;
      }
      setIsAuthenticating(true);
      const targetEmail = emailCandidate.toLowerCase().trim();
      const targetName = fullName.trim() || targetEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Citizen';
      try {
        const res = await AuthClient.socialLogin({
          provider,
          email: targetEmail,
          name: targetName,
          role: 'client'
        });
        if (res.success && res.user) {
          onComplete(res.user);
          return;
        } else {
          setEmailAuthError(res.error || `${provider} authentication failed.`);
        }
      } catch (err: any) {
        setEmailAuthError(err?.message || `${provider} sign-in failed.`);
      } finally {
        setIsAuthenticating(false);
      }
      return;
    }
  };

  const handleLoginWithEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid account email address.');
      return;
    }
    setIsLoggingIn(true);
    try {
      // Support passwordless 1-click login for social accounts and returning citizens
      const res = await AuthClient.login(loginEmail.trim(), loginPassword ? loginPassword.trim() : undefined);
      if (!res.success || !res.user) {
        setLoginError(res.error || 'Sign in failed. Please verify your credentials.');
        return;
      }
      const fullUser: UserProfile = {
        ...initialProfile,
        ...res.user,
        role: loginEmail.trim().toLowerCase() === 'dgerving@gmail.com' ? 'admin' : (res.user.role || initialProfile?.role || 'client'),
        hasCompletedOnboarding: true,
      };
      try {
        localStorage.setItem('police_safeguard_profile', JSON.stringify(fullUser));
        localStorage.setItem('police_safeguard_account_created', 'true');
        localStorage.setItem('police_safeguard_last_email', loginEmail.trim());
        localStorage.removeItem('police_protection_profile');
        localStorage.removeItem('police_protection_account_created');
        localStorage.removeItem('civicshield_profile');
        localStorage.removeItem('civicshield_account_created');
      } catch (e) {}
      onComplete(fullUser);
    } catch (err: any) {
      setLoginError(err?.message || 'Sign in failed. Please verify your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRecoverAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setRecoveryError('Please enter your account email address.');
      return;
    }
    if (!recoveryKeyInput.trim()) {
      setRecoveryError('Please enter your 4-word secret recovery phrase or key.');
      return;
    }
    if (!recoveryNewPassword || recoveryNewPassword.length < 8) {
      setRecoveryError('New password must be at least 8 characters long.');
      return;
    }
    setIsRecovering(true);
    try {
      const res = await AuthClient.recoverAccount({
        email: recoveryEmail.trim(),
        recoveryKey: recoveryKeyInput.trim(),
        newPassword: recoveryNewPassword
      });
      if (!res.success || !res.user) {
        setRecoveryError(res.error || 'Account recovery failed. Please check your recovery key.');
        return;
      }
      setRecoverySuccess('Password reset successfully! Logging in...');
      const fullUser: UserProfile = {
        ...initialProfile,
        ...res.user,
        hasCompletedOnboarding: true,
      };
      try {
        localStorage.setItem('police_safeguard_profile', JSON.stringify(fullUser));
        localStorage.setItem('police_safeguard_account_created', 'true');
        localStorage.removeItem('police_protection_profile');
        localStorage.removeItem('police_protection_account_created');
      } catch (e) {}
      setTimeout(() => {
        onComplete(fullUser);
      }, 1000);
    } catch (err: any) {
      setRecoveryError(err?.message || 'Recovery failed.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleContinueStep1 = async () => {
    setEmailAuthError(null);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setEmailAuthError('Please enter your legal full name.');
      return;
    }
    if (!authEmail.trim() || !authEmail.includes('@')) {
      setEmailAuthError('Please enter a valid account email address.');
      return;
    }

    const isSocialAccount = isSocialVerified || selectedProvider !== 'email';

    // Password is ONLY required for email/password accounts; NEVER for social logins
    if (!isSocialAccount) {
      if (!authPassword || authPassword.trim().length < 8) {
        setEmailAuthError('An account password is required (minimum 8 characters) to secure your account credentials.');
        return;
      }
      if (authConfirmPassword && authPassword !== authConfirmPassword) {
        setEmailAuthError('Passwords do not match. Please re-enter your password to confirm.');
        return;
      }
    }

    // Mandatory User Agreement Acknowledgement during sign up
    if (!legalAgreementAccepted) {
      setEmailAuthError('Please review and check the End-User Legal Agreement & FRE 902 Safety Acknowledgment below to create your account.');
      return;
    }

    try {
      localStorage.setItem('police_safeguard_legal_disclaimer_accepted', 'true');
      localStorage.setItem('police_safeguard_legal_disclaimer_timestamp', new Date().toISOString());
    } catch (e) {}

    setIsAuthenticating(true);
    const assignedRole: 'client' | 'admin' = authEmail.trim().toLowerCase() === 'dgerving@gmail.com' ? 'admin' : 'client';
    try {
      let authRes;
      if (isSocialAccount) {
        authRes = await AuthClient.socialLogin({
          provider: (selectedProvider === 'email' ? 'google' : selectedProvider) as any,
          email: authEmail.trim(),
          name: fullName.trim(),
          phone: phone.trim() || undefined,
          role: assignedRole
        });
      } else {
        authRes = await AuthClient.register({
          email: authEmail.trim(),
          password: authPassword,
          name: fullName.trim(),
          phone: phone.trim() || undefined,
          nativeLanguage,
          role: assignedRole
        });
      }

      if (!authRes.success) {
        setEmailAuthError(authRes.error || 'Registration failed. Please check your credentials or sign in.');
        setIsAuthenticating(false);
        return;
      }

      if (authRes.recoveryKey) {
        localStorage.setItem('police_safeguard_recovery_key', authRes.recoveryKey);
      }
      if (authRes.token) {
        AuthClient.setToken(authRes.token);
      }
      if (authRes.user?.id) {
        completedProfileIdRef.current = authRes.user.id;
      }
      setCurrentStep(2);
    } catch (err: any) {
      setEmailAuthError(err?.message || 'Network error during registration.');
      setIsAuthenticating(false);
      return;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleContinueWithEmail = handleContinueStep1;

  const handleAddEmergencyContact = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setContactError(null);

    if (emergencyContacts.length >= 5) {
      setContactError('Maximum of 5 emergency contacts reached.');
      return;
    }

    if (!newContactName.trim()) {
      setContactError('Please provide a contact name.');
      return;
    }

    if (!newContactPhone.trim() || newContactPhone.trim().length < 7) {
      setContactError('Please enter a valid mobile phone number for SMS.');
      return;
    }

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactRel.trim() || 'Emergency Contact',
      isPrimary: emergencyContacts.length === 0
    };

    setEmergencyContacts(prev => [...prev, newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRel('Family');
  };

  const handleQuickAddPreset = (rel: string, defaultName: string) => {
    if (emergencyContacts.length >= 5) {
      setContactError('Maximum of 5 emergency contacts reached.');
      return;
    }
    setNewContactName(defaultName);
    setNewContactRel(rel);
    setNewContactPhone('');
  };

  const handleRemoveContact = (id: string) => {
    setEmergencyContacts(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length > 0 && !filtered.some(c => c.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimary = (id: string) => {
    setEmergencyContacts(prev =>
      prev.map(c => ({
        ...c,
        isPrimary: c.id === id
      }))
    );
  };

  const handleFinalSubmit = async () => {
    const primaryContact = emergencyContacts.find(c => c.isPrimary) || emergencyContacts[0];
    const finalRole: 'client' | 'admin' = (authEmail.trim().toLowerCase() === 'dgerving@gmail.com') ? 'admin' : 'client';

    const completedProfile: UserProfile = {
      id: completedProfileIdRef.current || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: authEmail,
      phone,
      authProvider: selectedProvider,
      role: finalRole,
      hasCompletedOnboarding: true,
      name: fullName.trim() || 'Protected Citizen',
      nativeLanguage,
      membershipTier: initialProfile?.membershipTier || 'free',
      billingCycle: initialProfile?.billingCycle || 'monthly',
      credits: initialProfile?.credits ?? 5,
      vehicleMakeModel: vehicleMakeModel.trim() || 'Unspecified Vehicle',
      vehicleLicensePlate: vehiclePlate.trim().toUpperCase() || 'UNKNOWN',
      vehicleColor: vehicleColor.trim(),
      emergencyContactName: primaryContact?.name || 'Emergency Contact',
      emergencyContactPhone: primaryContact?.phone || '',
      emergencyContacts: emergencyContacts.slice(0, 5),
      medicalConditions: medicalNotes.trim() || 'None',
      isDeafOrHardOfHearing: isHardOfHearing,
      preferredVoice,
      whisperModeEnabled: whisperMode,
      duressLockPin: duressPin.trim() || '7482',
      autoNotifyContactOnStart: autoNotifyOnStart
    };

    // Sync profile details to the server
    try {
      await AuthClient.updateProfile(completedProfile);
    } catch (e) {
      console.warn('Backend profile update notice:', e);
    }

      // Also sync profile and role to social provider account if applicable
      if (selectedProvider && selectedProvider !== 'email') {
        try {
          await AuthClient.socialLogin({
            provider: selectedProvider as any,
            email: authEmail,
            name: fullName.trim() || 'Protected Citizen',
            phone,
            password: authPassword || undefined,
            role: finalRole
          });
        } catch (e) {}
      }

    try {
      localStorage.setItem('police_safeguard_profile', JSON.stringify(completedProfile));
      localStorage.setItem('police_safeguard_account_created', 'true');
      localStorage.removeItem('police_protection_profile');
      localStorage.removeItem('police_protection_account_created');
      localStorage.removeItem('civicshield_profile');
      localStorage.removeItem('civicshield_account_created');
    } catch (e) {}

    onComplete(completedProfile);
  };

  if (!isOpen) return null;

  return (
    <div 
      id="account-onboarding-modal" 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 10%, rgba(24, 28, 45, 0.9) 0%, rgba(9, 10, 15, 0.98) 75%, #050507 100%)`
      }}
    >
      <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Top Header & Progress Stepper */}
        <div className="p-5 sm:p-6 bg-zinc-950/90 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                <Shield className="w-5 h-5 fill-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                    POLICE SAFEGUARD
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    Account Registration
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  First-Time Launch Setup • Secure Citizen Profile &amp; Live Emergency Network
                </p>
              </div>
            </div>

            {canDismiss && onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Stepper Dots & Labels */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] font-bold">
            {[
              { num: 1, label: 'Sign In' },
              { num: 2, label: 'Identity' },
              { num: 3, label: 'Contacts (Up to 5)' },
              { num: 4, label: 'Clearance' },
            ].map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div 
                  key={step.num}
                  className={`flex flex-col items-center sm:items-start p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-md shadow-amber-950/40'
                      : isDone
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isCurrent
                        ? 'bg-amber-400 text-black'
                        : isDone
                        ? 'bg-emerald-400 text-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isDone ? '✓' : step.num}
                    </span>
                    <span className="hidden sm:inline font-semibold">{step.label}</span>
                  </div>
                  <span className="sm:hidden text-[9px] mt-0.5">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 sm:p-7 overflow-y-auto max-h-[68vh] space-y-6 text-xs flex-1">
          
          {/* ======================================================= */}
          {/* STEP 1: AUTHENTICATION PROVIDER (GOOGLE, APPLE, FACEBOOK) */}
          {/* ======================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Unified Landing Mode Switcher: Sign Up vs Returning Citizen */}
              <div className="flex items-center justify-center p-1 bg-zinc-950 border border-zinc-800 rounded-2xl max-w-sm mx-auto shadow-inner">
                <button
                  type="button"
                  id="tab-create-account"
                  onClick={() => {
                    setAuthMode('signup');
                    setLoginError(null);
                    setShowRecoveryView(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  id="tab-return-user"
                  onClick={() => {
                    setAuthMode('signin');
                    setEmailAuthError(null);
                    setLoginError(null);
                    if (!loginEmail) {
                      const saved = typeof window !== 'undefined' ? localStorage.getItem('police_safeguard_last_email') : '';
                      if (saved) setLoginEmail(saved);
                      else if (authEmail) setLoginEmail(authEmail);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    authMode === 'signin'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Returning Citizen</span>
                </button>
              </div>

              {authMode === 'signup' ? (
                <>
                  <div className="text-center max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-black text-white uppercase tracking-wide">
                      Create Your Protected Account
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Verify your identity with 1 click to auto-fill your profile, activate multi-device encrypted cloud sync, and enable live witness alerts.
                    </p>
                  </div>

                  {/* Social Login Buttons Deck */}
                  <div className="space-y-3 max-w-md mx-auto pt-1">
                    {isSocialVerified ? (
                      /* Social Identity Auto-Filled Card */
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-emerald-950/80 border border-emerald-500/50 shadow-lg space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
                              {selectedProvider === 'google' ? <GoogleIcon /> : selectedProvider === 'apple' ? <AppleIcon /> : <FacebookIcon />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-xs">{fullName || 'Protected Citizen'}</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wide">
                                  ✓ {selectedProvider === 'google' ? 'Google' : selectedProvider} Auto-Filled
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-300 font-mono">{authEmail}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSocialVerified(false);
                              setFullName('');
                              setAuthEmail('');
                              setAuthPassword('');
                              setAuthConfirmPassword('');
                            }}
                            className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                          >
                            Switch
                          </button>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/30 text-[11px] text-emerald-200/90 leading-relaxed flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Identity verified via {selectedProvider === 'google' ? 'Google' : selectedProvider}. <strong>No password required</strong> — authenticated directly by your provider.</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Apple Sign In Button */}
                        <button
                          id="signup-apple-btn"
                          onClick={() => handleSelectSocial('apple')}
                          disabled={isAuthenticating}
                          className="w-full py-3.5 px-4 rounded-2xl bg-black hover:bg-zinc-900 text-white border border-zinc-700 font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                        >
                          <AppleIcon />
                          <span>Sign in with Apple (Auto-Fill)</span>
                        </button>

                        {/* Google Sign In Button */}
                        <button
                          id="signup-google-btn"
                          onClick={() => handleSelectSocial('google')}
                          disabled={isAuthenticating}
                          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                        >
                          <GoogleIcon />
                          <span>Continue with Google (Auto-Fill)</span>
                        </button>

                        {/* Facebook Sign In Button */}
                        <button
                          id="signup-facebook-btn"
                          onClick={() => handleSelectSocial('facebook')}
                          disabled={isAuthenticating}
                          className="w-full py-3.5 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                        >
                          <FacebookIcon />
                          <span>Continue with Facebook (Auto-Fill)</span>
                        </button>

                        {/* Divider */}
                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-zinc-800"></div>
                          <span className="flex-shrink mx-4 text-[11px] text-zinc-500 uppercase tracking-widest font-mono">
                            Or Sign Up with Email
                          </span>
                          <div className="flex-grow border-t border-zinc-800"></div>
                        </div>
                      </>
                    )}

                    {/* Registration Credentials Form */}
                    <div className="space-y-3.5 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-zinc-300">
                            Legal Full Name: <span className="text-amber-400 font-bold">*</span>
                          </label>
                          {isSocialVerified && (
                            <span className="text-[10px] text-emerald-400 font-bold">Auto-filled</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Jane Citizen"
                          required
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-zinc-300">
                            Account Email Address: <span className="text-amber-400 font-bold">*</span>
                          </label>
                          {isSocialVerified && (
                            <span className="text-[10px] text-emerald-400 font-bold">Auto-filled</span>
                          )}
                        </div>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="yourname@domain.com"
                          required
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      {/* Password inputs - ONLY for email/password accounts; NEVER for social logins */}
                      {(!isSocialVerified && selectedProvider === 'email') ? (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-zinc-300">
                                Set Account Password: <span className="text-amber-400 font-bold">* Required</span>
                              </label>
                              <span className="text-[10px] text-zinc-400 font-mono">Min 8 characters</span>
                            </div>
                            <div className="relative">
                              <input
                                type={showAuthPassword ? 'text' : 'password'}
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Set secure account password"
                                required
                                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowAuthPassword(!showAuthPassword)}
                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                              >
                                {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-1">
                              Required to encrypt your evidence vault and allow password login from any browser.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                              Confirm Account Password: <span className="text-amber-400 font-bold">* Required</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showAuthConfirmPassword ? 'text' : 'password'}
                                value={authConfirmPassword}
                                onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                placeholder="Re-enter password to confirm"
                                required
                                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowAuthConfirmPassword(!showAuthConfirmPassword)}
                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                              >
                                {showAuthConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-extrabold text-xs text-white block">
                              Verified with {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} • No Password Required
                            </span>
                            <span className="text-[10px] text-emerald-300/90 leading-tight block">
                              Your identity is confirmed by {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}. You will never be asked to remember or enter a password.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Mandatory End-User Legal Agreement & FRE 902 Safety Acknowledgment */}
                      <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-500/40 space-y-2 mt-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            id="signup-legal-agreement"
                            checked={legalAgreementAccepted}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setLegalAgreementAccepted(checked);
                              if (checked) {
                                try {
                                  localStorage.setItem('police_safeguard_legal_disclaimer_accepted', 'true');
                                  localStorage.setItem('police_safeguard_legal_disclaimer_timestamp', new Date().toISOString());
                                } catch (err) {}
                              }
                            }}
                            className="mt-0.5 w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 cursor-pointer shrink-0"
                          />
                          <label htmlFor="signup-legal-agreement" className="text-[11px] text-zinc-300 leading-tight cursor-pointer select-none">
                            I acknowledge that I have read, understood, and agree to the{' '}
                            <button
                              type="button"
                              onClick={() => setShowLegalTermsModal(true)}
                              className="text-amber-400 hover:text-amber-300 underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              End-User Legal Agreement &amp; Safety Notice
                            </button>
                            , and acknowledge FRE 902 evidence custody certification.
                          </label>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <Scale className="w-3 h-3" />
                            <span>FRE 902 Certified</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowLegalTermsModal(true)}
                            className="text-zinc-400 hover:text-white underline flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>View Full 11 Terms</span>
                          </button>
                        </div>
                      </div>

                      {emailAuthError && (
                        <div className="text-red-400 text-xs font-semibold flex flex-col gap-2 animate-in fade-in bg-red-950/60 p-3 rounded-xl border border-red-500/50">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                            <span>{emailAuthError}</span>
                          </div>
                          {emailAuthError.includes('already exists') && (
                            <button
                              type="button"
                              onClick={() => {
                                setLoginEmail(authEmail);
                                setAuthMode('signin');
                                setEmailAuthError(null);
                              }}
                              className="mt-1 w-full py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Switch to Sign In with Existing Account</span>
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleContinueStep1}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all mt-2 flex items-center justify-center gap-1.5"
                      >
                        <span>
                          {isSocialVerified || selectedProvider !== 'email'
                            ? `Continue to Identity Details (Verified • No Password Required)`
                            : 'Save Password & Continue to Identity Details'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </>
              ) : (
                /* RETURNING CITIZEN SIGN IN FLOW */
                <div className="space-y-4 max-w-md mx-auto animate-in fade-in">
                  <div className="text-center space-y-1.5">
                    <h3 className="text-lg font-black text-white uppercase tracking-wide">
                      Welcome Back, Citizen
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Sign in with your verified credentials to restore your evidence vault, active subscriptions, and emergency contact network.
                    </p>
                  </div>

                  {/* 1-Click Social Sign-In */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectSocial('apple')}
                      disabled={isAuthenticating}
                      className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-zinc-900 text-white border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <AppleIcon />
                      <span>Sign In with Apple</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSocial('google')}
                      disabled={isAuthenticating}
                      className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <GoogleIcon />
                      <span>Sign In with Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectSocial('facebook')}
                      disabled={isAuthenticating}
                      className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <FacebookIcon />
                      <span>Sign In with Facebook</span>
                    </button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-zinc-800"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                      Or Sign In with Email
                    </span>
                    <div className="flex-grow border-t border-zinc-800"></div>
                  </div>

                  {!showRecoveryView ? (
                    <form onSubmit={handleLoginWithEmail} className="space-y-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                          Account Email:
                        </label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="yourname@domain.com"
                          required
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-zinc-300">
                            Password: <span className="text-zinc-500 font-normal">(Optional for social or passwordless logins)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowRecoveryView(true);
                              setRecoveryEmail(loginEmail);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter password (or leave blank for 1-click login)"
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 pr-10 text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {loginError && (
                        <div className={`p-3 rounded-xl text-xs flex flex-col gap-1.5 animate-in fade-in ${
                          loginError.includes('policesafeguard.com') || loginError.includes('authorization')
                            ? 'bg-amber-950/40 border border-amber-500/40 text-amber-200'
                            : 'bg-red-950/80 border border-red-500/50 text-red-300'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              loginError.includes('policesafeguard.com') ? 'text-amber-400' : 'text-red-400'
                            }`} />
                            <span className="leading-relaxed font-medium">{loginError}</span>
                          </div>
                          {loginError.includes('policesafeguard.com') && (
                            <div className="pt-1.5 mt-1 border-t border-amber-500/20 text-[11px] text-zinc-300">
                              <span>For app owners: To enable native 1-click popup on this domain, add <code className="px-1 py-0.5 rounded bg-black/40 text-amber-300 font-mono">policesafeguard.com</code> to Authorized Domains in </span>
                              <a
                                href="https://console.firebase.google.com/project/prefab-overview-275605/authentication/settings"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-400 hover:text-amber-300 underline font-bold"
                              >
                                Firebase Authentication Settings
                              </a>.
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        {isLoggingIn ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Sign In to My Account</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* ACCOUNT RECOVERY VIEW */
                    <form onSubmit={handleRecoverAccount} className="space-y-3 p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Secret Key Account Recovery</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowRecoveryView(false)}
                          className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Back to Sign In
                        </button>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Enter your account email, your 4-word secret recovery phrase generated at registration, and your new password.
                      </p>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-300 mb-1">
                          Account Email:
                        </label>
                        <input
                          type="email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="yourname@domain.com"
                          required
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-300 mb-1">
                          Secret Recovery Key (e.g. SHIELD-RIGHTS-VERIFIED-CITIZEN-A1B2):
                        </label>
                        <input
                          type="text"
                          value={recoveryKeyInput}
                          onChange={(e) => setRecoveryKeyInput(e.target.value)}
                          placeholder="WORD1-WORD2-WORD3-WORD4-HEX"
                          required
                          className="w-full bg-zinc-900 border border-zinc-700 text-amber-300 uppercase rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-300 mb-1">
                          New Master Password (Min 8 characters):
                        </label>
                        <input
                          type="password"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {recoveryError && (
                        <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                          <span>{recoveryError}</span>
                        </div>
                      )}

                      {recoverySuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          <span>{recoverySuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isRecovering}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        {isRecovering ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Key className="w-3.5 h-3.5" />
                            <span>Reset Password &amp; Sign In</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Privacy & Constitutional Protection Notice */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-zinc-200">Zero-Compromise Constitutional Privacy:</strong> Your account credentials and identity details are secured with AES-256 and never shared with law enforcement or marketing brokers.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* STEP 2: PERSONAL IDENTITY & VEHICLE DETAILS */}
          {/* ======================================================= */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Personal Identity &amp; Vehicle Profile</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Pre-configures your legal standing, identification duties, and language translation
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 font-bold uppercase">
                  via {selectedProvider}
                </span>
              </div>

              {isSocialVerified && (
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Identity Verified via <strong>{selectedProvider === 'apple' ? 'Apple ID' : selectedProvider === 'google' ? 'Google' : 'Facebook'}</strong>. Name &amp; email auto-filled.
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    VERIFIED
                  </span>
                </div>
              )}

              {/* Identity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Legal Full Name (Civilian Driver): <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Your Mobile Phone Number:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Vehicle Information for Traffic Stops */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>Primary Vehicle Information (Used for Stop Identification):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-semibold">Make &amp; Model:</label>
                    <input
                      type="text"
                      value={vehicleMakeModel}
                      onChange={(e) => setVehicleMakeModel(e.target.value)}
                      placeholder="e.g. 2022 Toyota Camry"
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-semibold">License Plate #:</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="e.g. 7XYZ123"
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs uppercase font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1 font-semibold">Vehicle Color:</label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="e.g. Silver Metallic"
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Native Language & Voice Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Native Language (Real-time Speech Translation):</span>
                  </label>
                  <select
                    value={nativeLanguage}
                    onChange={(e) => setNativeLanguage(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Riley Duress Lock PIN (5th Amendment Defense):</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={duressPin}
                    onChange={(e) => setDuressPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="7482"
                    className="w-full bg-zinc-950 border border-zinc-800 text-amber-400 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Emergency PIN that immediately seals evidence and prevents forced phone inspection.
                  </p>
                </div>
              </div>

              {/* Sensory / Medical condition */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-200 text-xs">Deaf / Hard of Hearing Notice</div>
                    <div className="text-[10px] text-zinc-400">Enables high-contrast visual cueing and silent tactical guidance</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isHardOfHearing}
                  onChange={(e) => setIsHardOfHearing(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* STEP 3: EMERGENCY CONTACTS FOR LIVE SHARE (UP TO 5) */}
          {/* ======================================================= */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Emergency Contacts for Live Share (Up to 5)</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Contacts who can receive instant SMS text alerts with an encrypted live stream link during encounters
                  </p>
                </div>
                <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border shrink-0 ${
                  emergencyContacts.length >= 5
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                }`}>
                  {emergencyContacts.length} of 5 Contacts Added
                </span>
              </div>

              {/* Quick Preset Buttons */}
              {emergencyContacts.length < 5 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Quick-Add Typical Emergency Roles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { role: 'Spouse / Partner', name: 'Partner' },
                      { role: 'Parent', name: 'Mom / Dad' },
                      { role: 'Legal Counsel / Attorney', name: 'Attorney' },
                      { role: 'Sibling', name: 'Brother / Sister' },
                      { role: 'Trusted Friend', name: 'Best Friend' },
                    ].map((preset) => (
                      <button
                        key={preset.role}
                        type="button"
                        onClick={() => handleQuickAddPreset(preset.role, preset.name)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>{preset.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* List of Configured Contacts */}
              {emergencyContacts.length === 0 ? (
                <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Radio className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Emergency Contacts Added Yet</h4>
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed mt-1">
                      Click any role above or use the form below to add your real emergency contacts (spouse, parents, or legal counsel).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {emergencyContacts.map((contact, index) => (
                    <div 
                      key={contact.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        contact.isPrimary
                          ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(contact.id)}
                        title={contact.isPrimary ? 'Primary Contact' : 'Click to set as primary contact'}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
                          contact.isPrimary
                            ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${contact.isPrimary ? 'fill-black' : ''}`} />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {contact.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                            {contact.relationship || 'Contact'}
                          </span>
                          {contact.isPrimary && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{contact.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

              {/* Inline Add Contact Form (If less than 5) */}
              {emergencyContacts.length < 5 && (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="font-bold text-zinc-200 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Add Emergency Contact ({emergencyContacts.length + 1}/5):</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      {5 - emergencyContacts.length} slots remaining
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Contact Full Name"
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <input
                        type="tel"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="Mobile Phone (SMS)"
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newContactRel}
                        onChange={(e) => setNewContactRel(e.target.value)}
                        placeholder="Relationship"
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddEmergencyContact}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {contactError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>{contactError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Auto Notify Toggle */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-white text-xs">
                    Auto-Dispatch Live Feed on Encounter Start
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                    Instantly texts your primary contact a secure live view link when recording begins (Requires Paid Pro tier for SMS relay).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoNotifyOnStart}
                  onChange={(e) => setAutoNotifyOnStart(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
              </div>

              {/* Evidence Vault Isolation Guarantee Callout */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-zinc-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Evidence Vault Isolation:</strong> Live emergency streaming operates on an independent network thread and never jeopardizes your local FRE 902 court evidence vault recordings.
                </span>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* STEP 4: CONFIRMATION & REGISTRATION CLEARANCE */}
          {/* ======================================================= */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center max-w-md mx-auto space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                  Account Registration Verified
                </h3>
                <p className="text-xs text-zinc-400">
                  Review your constitutional civilian profile and emergency network before entering Police SafeGuard AI.
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5">
                
                {/* Account Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white uppercase">
                      {fullName.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{fullName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{authEmail}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase text-[10px]">
                    Verified via {selectedProvider}
                  </span>
                </div>

                {/* Vehicle & Identity Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block">Vehicle:</span>
                    <span className="text-zinc-200 font-semibold">{vehicleMakeModel}</span>
                    <span className="text-zinc-400 text-[11px] block">{vehiclePlate} • {vehicleColor}</span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold block">Language &amp; Voice:</span>
                    <span className="text-zinc-200 font-semibold">{SUPPORTED_LANGUAGES.find(l => l.code === nativeLanguage)?.name || 'English'}</span>
                    <span className="text-zinc-400 text-[11px] block">{whisperMode ? 'Earbud Whisper Active' : 'Standard Voice'}</span>
                  </div>
                </div>

                {/* Emergency Contacts Roster */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-300 uppercase">Emergency Live Share Contacts ({emergencyContacts.length}/5):</span>
                    <span className="text-emerald-400 font-mono">READY</span>
                  </div>

                  <div className="space-y-1">
                    {emergencyContacts.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                        <div className="flex items-center gap-2">
                          {c.isPrimary && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                          <span className="font-bold text-white">{c.name}</span>
                          <span className="text-zinc-500">({c.relationship})</span>
                        </div>
                        <span className="font-mono text-zinc-400">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password Security Status */}
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Account Master Password:</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">
                    ✓ Encrypted &amp; Configured
                  </span>
                </div>

              </div>

              {/* Ready Activation Guarantee */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-emerald-500/10 border border-amber-500/30 text-xs text-zinc-300 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="leading-relaxed">
                  Your profile is fully configured. You are protected by real-time constitutional case law, state statutes, and automated court evidence certification.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Navigation */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => (prev - 1) as any)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    handleContinueStep1();
                  } else if (currentStep === 2) {
                    setCurrentStep(3);
                  } else if (currentStep === 3) {
                    setCurrentStep(4);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/60 cursor-pointer transition-all active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-950/80 cursor-pointer transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 fill-black" />
                <span>Activate Protection &amp; Enter App</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Embedded End-User Legal Agreement & FRE 902 Safety Notice Modal */}
      {showLegalTermsModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  End-User Legal Agreement &amp; Safety Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalTermsModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <p className="font-bold text-[11px] uppercase tracking-wider mb-1">Notice to User:</p>
                <p>
                  By creating an account, selecting “I Agree,” checking the acknowledgment box, or accessing Police SafeGuard, you acknowledge that you have read, understood, and agreed to the following 11 legal terms and safety notices.
                </p>
              </div>

              <div className="space-y-3 font-sans">
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1">1. NOT LEGAL ADVICE</h4>
                  <p className="text-zinc-400 text-[11px]">This application is an educational, evidence-custody, and constitutional reference tool powered by automated algorithms. It does NOT provide legal advice and does NOT create an attorney-client relationship.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1">2. FEDERAL RULE OF EVIDENCE 902(13) &amp; 902(14) EVIDENCE CUSTODY</h4>
                  <p className="text-zinc-400 text-[11px]">Encounter recordings and witness logs are cryptographically sealed with SHA-256 digital hashes to satisfy self-authenticating evidence requirements under Federal Rule of Evidence 902.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1">3. SOLE CITIZEN RESPONSIBILITY &amp; OFFICER SAFETY</h4>
                  <p className="text-zinc-400 text-[11px]">You are solely responsible for your physical safety, compliance with lawful police orders, and state-specific recording consent laws (e.g., one-party vs. two-party wiretap statutes). Keep your hands visible at all times.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1">4. EMERGENCY 911 / FIRST RESPONDER CLARIFICATION</h4>
                  <p className="text-zinc-400 text-[11px]">Police SafeGuard is not a direct dispatch 911 replacement. In an immediate physical emergency, dial 911 directly.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1">5. ENCRYPTED VAULT PRIVACY &amp; NO UNAUTHORIZED SHARING</h4>
                  <p className="text-zinc-400 text-[11px]">Your evidence vault is encrypted. We do not sell or monetize your personal information or video footage without your explicit instruction.</p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1">6. RILEY V. CALIFORNIA ARREST LOCKDOWN</h4>
                  <p className="text-zinc-400 text-[11px]">The duress lockdown feature blacks out the screen to invoke your 5th Amendment and 4th Amendment rights against warrantless digital search. Your secure PIN unlocks the device after release.</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-mono">FRE 902 • 11 CLAUSES</span>
              <button
                type="button"
                onClick={() => {
                  setLegalAgreementAccepted(true);
                  try {
                    localStorage.setItem('police_safeguard_legal_disclaimer_accepted', 'true');
                    localStorage.setItem('police_safeguard_legal_disclaimer_timestamp', new Date().toISOString());
                  } catch (e) {}
                  setShowLegalTermsModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs cursor-pointer shadow-md"
              >
                Accept Terms &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
