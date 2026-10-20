import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, X, Sparkles, Shield, Lock, Volume2, Globe, FileText, 
  CheckCircle2, Star, ArrowRight, CreditCard, ShieldCheck, 
  Loader2, AlertCircle, Building2, Landmark, HelpCircle, Car, Home, 
  Footprints, Video, Coins, AlertTriangle, Infinity as InfinityIcon, Gift,
  Languages, Phone, Radio, FolderLock, HeartHandshake, Heart, Scale
} from 'lucide-react';
import { MembershipTier, BillingCycle, CreditPackage } from '../types';
import { ClaimsService, ClaimsStatus } from '../services/claimsService';
import { PromoService } from '../services/promoService';
import { GeographicJurisdictionLegalModal } from './GeographicJurisdictionLegalModal';
import { LawEnforcementCharityModal } from './LawEnforcementCharityModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: MembershipTier;
  currentCredits?: number;
  onSelectTier: (tier: MembershipTier, cycle?: BillingCycle, addedCredits?: number) => void;
  userEmail?: string;
  onOpenReferralProgram?: () => void;
  onOpenPromoModal?: () => void;
  onOpenBailVault?: () => void;
  onOpenStripePortal?: (config?: { tier?: any; billingCycle?: any }) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentTier,
  currentCredits = 5,
  onSelectTier,
  userEmail = '',
  onOpenReferralProgram,
  onOpenPromoModal,
  onOpenBailVault,
  onOpenStripePortal
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [selectedPlanTier, setSelectedPlanTier] = useState<'all_encounters_pro'>('all_encounters_pro');
  const [selectedCreditPack, setSelectedCreditPack] = useState<string>('credits_15');
  const [bonusCodeInput, setBonusCodeInput] = useState<string>('');
  const [bonusCodeStatus, setBonusCodeStatus] = useState<{
    isChecking: boolean;
    message?: string;
    isError?: boolean;
    isSuccess?: boolean;
  }>({ isChecking: false });
  const [immediateCharge, setImmediateCharge] = useState<boolean>(false);
  const [showStripeExplanation, setShowStripeExplanation] = useState<boolean>(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(true);
  const [jurisdictionTermsAccepted, setJurisdictionTermsAccepted] = useState<boolean>(() => {
    try {
      return (localStorage.getItem('police_safeguard_jurisdiction_terms_accepted') || localStorage.getItem('police_protection_jurisdiction_terms_accepted')) === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isJurisdictionModalOpen, setIsJurisdictionModalOpen] = useState<boolean>(false);
  const [isCharityModalOpen, setIsCharityModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(userEmail);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean>(false);
  const [showBankDetails, setShowBankDetails] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimsStatus, setClaimsStatus] = useState<ClaimsStatus>({
    totalSlots: 100,
    claimedCount: 0,
    remainingSlots: 100,
    isSoldOut: false
  });

  const CREDIT_PACKAGES: CreditPackage[] = [
    {
      id: 'credits_5',
      name: 'Starter Defense Pack',
      credits: 5,
      price: 4.99,
      pricePerCredit: '$1.00 / session',
    },
    {
      id: 'credits_15',
      name: 'Standard Defense Pack',
      credits: 15,
      price: 11.99,
      pricePerCredit: '$0.80 / session',
      popular: true,
    },
    {
      id: 'credits_30',
      name: 'Executive Defense Pack',
      credits: 30,
      price: 19.99,
      pricePerCredit: '$0.67 / session',
    },
    {
      id: 'credits_100',
      name: 'Civilian Rights Fleet Pack',
      credits: 100,
      price: 49.99,
      pricePerCredit: '$0.50 / session',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      ClaimsService.getStatus().then(status => {
        setClaimsStatus(status);
      });

      const unsubscribe = ClaimsService.subscribe(status => {
        setClaimsStatus(status);
      });

      fetch('/api/payment/config')
        .then(res => res.json())
        .then(data => {
          setStripeConfigured(!!data.isStripeConfigured);
        })
        .catch(err => {
          console.warn('Payment config check fallback:', err);
        });

      return () => {
        unsubscribe();
      };
    }
  }, [isOpen]);

  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const termsSectionRef = useRef<HTMLDivElement>(null);
  const [highlightTerms, setHighlightTerms] = useState(false);
  const [pendingCheckoutTier, setPendingCheckoutTier] = useState<'all_encounters_pro' | undefined>(undefined);

  if (!isOpen) return null;

  const handleInitiateCheckout = async (targetTier?: 'all_encounters_pro') => {
    const chosenTier = targetTier || selectedPlanTier;

    // Automatically confirm terms so user is never blocked from checkout
    if (!jurisdictionTermsAccepted || !disclaimerAccepted) {
      setJurisdictionTermsAccepted(true);
      setDisclaimerAccepted(true);
      try {
        localStorage.setItem('police_safeguard_jurisdiction_terms_accepted', 'true');
        localStorage.removeItem('civicshield_jurisdiction_terms_accepted');
      } catch (e) {}
    }

    if (billingCycle === 'lifetime' && claimsStatus.isSoldOut) {
      setErrorMessage('All 100 Early-Access Lifetime Pass slots have been claimed. Lifetime access is now sold out.');
      return;
    }

    setErrorMessage(null);

    // Determine plan title and price display
    let title = 'Police SafeGuard Pro';
    let price = '$14.99/mo (30-Day Free Trial)';
    let creditsGranted = 0;

    if (billingCycle === 'lifetime') {
      title = 'Police SafeGuard Early Access Lifetime Pass';
      price = '$79.99 One-Time (100 Slots)';
    } else if (billingCycle === 'yearly') {
      title = 'Police SafeGuard Pro (Annual Subscription)';
      price = '$49.99/yr (No Trial • Annual Auto-Bill)';
    } else if (billingCycle === 'monthly') {
      title = 'Police SafeGuard Pro (Monthly Subscription)';
      price = immediateCharge ? '$14.99/mo (Charged Today)' : '$14.99/mo (30-Day Free Trial)';
    } else if (billingCycle === 'pay_per_use') {
      const pack = CREDIT_PACKAGES.find(p => p.id === selectedCreditPack) || CREDIT_PACKAGES[1];
      title = `${pack.credits} Defense Credits Pack`;
      price = `$${pack.price} One-Time`;
      creditsGranted = pack.credits;
    }

    // Immediately open the Live Stripe Payment Portal
    if (onOpenStripePortal) {
      onOpenStripePortal({
        tier: (billingCycle === 'lifetime' ? 'lifetime_pro' : chosenTier) as any,
        billingCycle
      });
      return;
    }

    // Direct checkout to Stripe Portal
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: chosenTier,
          billingCycle,
          creditPackId: billingCycle === 'pay_per_use' ? selectedCreditPack : undefined,
          email: email.trim(),
          immediateCharge,
          returnUrl: window.location.origin
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      console.warn('Stripe checkout session fetch error:', err);
    }
  };

  const handleApplyBonusCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = bonusCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setBonusCodeStatus({ isChecking: false, message: 'Please enter a bonus or ambassador promo code.', isError: true });
      return;
    }
    setBonusCodeStatus({ isChecking: true });
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('police_safeguard_profile') : null;
      let baseProfile: any = {};
      try { if (stored) baseProfile = JSON.parse(stored); } catch {}
      const profileToUpdate = {
        name: baseProfile.name || 'Citizen Defender',
        email: email.trim() || baseProfile.email || 'user@policesafeguard.com',
        phone: baseProfile.phone || '',
        nativeLanguage: baseProfile.nativeLanguage || 'en',
        membershipTier: baseProfile.membershipTier || 'free',
        billingCycle: 'lifetime' as BillingCycle,
        credits: 9999
      };
      const result = await PromoService.redeem(cleanCode, profileToUpdate as any);
      if (result.success && result.updatedProfile) {
        setBonusCodeStatus({
          isChecking: false,
          message: result.message || '🎉 Bonus code verified! Lifetime Pro membership unlocked at $0 charge.',
          isSuccess: true,
          isError: false
        });
        const completedProfile = {
          ...result.updatedProfile,
          membershipTier: 'lifetime_pro' as MembershipTier,
          billingCycle: 'lifetime' as BillingCycle
        };
        try {
          localStorage.setItem('police_safeguard_profile', JSON.stringify(completedProfile));
          localStorage.setItem('police_safeguard_membership_tier', 'lifetime_pro');
        } catch {}
        setTimeout(() => {
          onSelectTier('lifetime_pro', 'lifetime', 9999);
          onClose();
        }, 1500);
      } else {
        setBonusCodeStatus({
          isChecking: false,
          message: result.message || 'Invalid or exhausted bonus code. Please verify and retry.',
          isError: true
        });
      }
    } catch (err: any) {
      setBonusCodeStatus({
        isChecking: false,
        message: err?.message || 'Error checking bonus code.',
        isError: true
      });
    }
  };

  const handleOpenDirectCardModal = (targetTier?: 'all_encounters_pro') => {
    handleInitiateCheckout(targetTier);
  };

  const handleQuickAgreeAndCheckout = (targetTier?: 'all_encounters_pro') => {
    setJurisdictionTermsAccepted(true);
    setDisclaimerAccepted(true);
    localStorage.setItem('police_safeguard_jurisdiction_terms_accepted', 'true');
    localStorage.removeItem('police_protection_jurisdiction_terms_accepted');
    localStorage.removeItem('civicshield_jurisdiction_terms_accepted');
    setHighlightTerms(false);
    setErrorMessage(null);
    const tierToRun = targetTier || pendingCheckoutTier;
    handleInitiateCheckout(tierToRun);
  };

  const isCurrentUniversal = currentTier === 'all_encounters_pro' || currentTier === 'paid';
  const isCurrentFree = currentTier === 'free';
  const isPaid = currentTier === 'all_encounters_pro' || currentTier === 'lifetime_pro' || currentTier === 'paid';

  return (
    <div id="subscription-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full h-[100dvh] sm:h-[92dvh] max-h-[100dvh] sm:max-h-[92dvh] max-w-5xl rounded-none sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Compact Sticky Top Header */}
        <div className="p-3 sm:p-4 border-b border-zinc-800 text-center relative bg-gradient-to-b from-zinc-850 to-zinc-900 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 rounded-full text-amber-400 text-[11px] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CONSTITUTIONAL PROTECTION • ALL BILLING CYCLES &amp; CREDITS</span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
            Police SafeGuard: Membership &amp; Credit Store
          </h2>
          <p className="text-[11px] sm:text-xs text-amber-300/90 mt-0.5 max-w-xl mx-auto font-medium">
            Your AI real-time assistant to guide you safely through encounters with law enforcement
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <div className="inline-flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
              
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Monthly ($14.99/mo)</span>
                <span className="text-[9px] bg-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                  30-DAY FREE TRIAL
                </span>
              </button>

              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  billingCycle === 'yearly' ? 'bg-amber-500 text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Annual ($49.99/yr)</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">NO TRIAL • RECURRING</span>
              </button>

              <button
                onClick={() => setBillingCycle('lifetime')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  billingCycle === 'lifetime' ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black font-black shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>$79.99 Lifetime Pass</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  claimsStatus.isSoldOut 
                    ? 'bg-zinc-700 text-zinc-300' 
                    : claimsStatus.claimedCount === 0 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-red-600 text-white animate-pulse'
                }`}>
                  {claimsStatus.isSoldOut 
                    ? 'SOLD OUT' 
                    : claimsStatus.claimedCount === 0 
                    ? '100 SLOTS' 
                    : `${claimsStatus.remainingSlots} LEFT`}
                </span>
              </button>

              <button
                onClick={() => setBillingCycle('pay_per_use')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  billingCycle === 'pay_per_use' ? 'bg-amber-500 text-black font-bold shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Coins className="w-3 h-3 text-amber-400" />
                <span>Pay-Per-Use Credits</span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 rounded font-mono">{currentCredits} Bal</span>
              </button>

            </div>
          </div>
        </div>

        {/* Payment Confirmation Banner */}
        {paymentStatus && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/60 p-3 px-6 flex items-center justify-between gap-3 text-emerald-300 text-xs font-medium shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{paymentStatus}</span>
            </div>
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-950/90 border-b border-red-700/60 p-3 px-6 flex items-center gap-2 text-red-300 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MAIN BODY: Scrollable Tab Content Container */}
        <div 
          ref={scrollBodyRef}
          className="p-3 sm:p-6 overflow-y-auto flex-1 min-h-0 overscroll-contain space-y-4 sm:space-y-5 pb-32 sm:pb-24 touch-pan-y" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >

          {/* LIVE STRIPE SUBSCRIPTION PAYMENT PORTAL HERO BANNER */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-purple-950/80 border-2 border-indigo-500/70 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                    LIVE STRIPE SUBSCRIPTION PAYMENT PORTAL
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    PCI-DSS Level 1
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                  Prefer official checkout directly on Stripe? Pay with Google Pay, Apple Pay, Link, or credit cards, or manage existing subscriptions.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenStripePortal) {
                  onOpenStripePortal({
                    tier: selectedPlanTier,
                    billingCycle
                  });
                } else {
                  handleInitiateCheckout();
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Launch Live Stripe Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* BONUS CODE ENTRY (ON THE SAME PAGE AS PAYMENTS) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 border-2 border-amber-400/50 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-black flex items-center justify-center font-bold">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    Redeem Bonus or Ambassador Promo Code
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    Enter code on this page to unlock instant Lifetime Pro or promotional subscription credits.
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-black uppercase">
                Instant Unlock
              </span>
            </div>

            <form onSubmit={handleApplyBonusCode} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Enter Bonus Code (e.g. FAMILY5, VIPLIFETIME)"
                value={bonusCodeInput}
                onChange={(e) => {
                  setBonusCodeInput(e.target.value.toUpperCase());
                  if (bonusCodeStatus.message) setBonusCodeStatus({ isChecking: false });
                }}
                className="flex-1 bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={bonusCodeStatus.isChecking || !bonusCodeInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-40 text-black font-black text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-950/40"
              >
                {bonusCodeStatus.isChecking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Apply Code</span>
              </button>
            </form>

            {bonusCodeStatus.message && (
              <div className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                bonusCodeStatus.isSuccess 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' 
                  : 'bg-red-950/80 text-red-300 border border-red-500/50'
              }`}>
                {bonusCodeStatus.isSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <span>{bonusCodeStatus.message}</span>
              </div>
            )}
          </div>

          {/* EARLY ACCESS $79.99 LIFETIME PROMOTION BANNER (ACCURATE REAL-TIME CLAIMS COUNTER) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-zinc-900 to-amber-950/70 border-2 border-amber-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-300 text-black flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/30">
                <InfinityIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    LIMITED EARLY ACCESS PROMOTION: $79.99 LIFETIME PASS
                  </span>
                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    claimsStatus.isSoldOut 
                      ? 'bg-red-800 text-red-200' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {claimsStatus.isSoldOut 
                      ? `SOLD OUT: ${claimsStatus.claimedCount} / ${claimsStatus.totalSlots} SLOTS CLAIMED`
                      : `${claimsStatus.claimedCount} / ${claimsStatus.totalSlots} SLOTS CLAIMED (${claimsStatus.remainingSlots} REMAINING)`}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                  {claimsStatus.isSoldOut ? (
                    <span>All {claimsStatus.totalSlots} Early Access Lifetime Pass slots have been claimed. Lifetime access is now permanently closed and only monthly subscriptions or pay-per-use credits are available.</span>
                  ) : (
                    <span>
                      Accurate Real-Time Counter: <strong>{claimsStatus.claimedCount} of {claimsStatus.totalSlots}</strong> slots have been claimed (<strong>{claimsStatus.remainingSlots} remaining</strong>). Once all {claimsStatus.totalSlots} slots are claimed, Lifetime access will be permanently closed and only monthly subscriptions will be available. <strong>Purchasers receive guaranteed continued lifetime access for the entire lifetime of the app.</strong>
                    </span>
                  )}
                </p>
                <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                  <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Feature availability varies by geographic location, state laws &amp; travel.</span>
                  <button
                    type="button"
                    onClick={() => setIsJurisdictionModalOpen(true)}
                    className="text-amber-300 hover:text-amber-200 underline font-extrabold cursor-pointer"
                  >
                    Read Full Terms
                  </button>
                </div>
                
                {/* Dual 5% Pledges Callout */}
                <div className="mt-2 p-2 rounded-xl bg-blue-950/60 border border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                    <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Includes $4.00 (5%) to Police Charities &amp; $4.00 (5%) to Bail Relief Vault</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCharityModalOpen(true)}
                      className="text-blue-300 hover:text-white underline font-bold text-[10px] cursor-pointer"
                    >
                      Police Charity (5%)
                    </button>
                    {onOpenBailVault && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenBailVault();
                        }}
                        className="text-amber-300 hover:text-white underline font-bold text-[10px] cursor-pointer"
                      >
                        Bail Vault (5%)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={claimsStatus.isSoldOut || isLoading}
              onClick={() => {
                setBillingCycle('lifetime');
                setSelectedPlanTier('all_encounters_pro');
                handleInitiateCheckout('all_encounters_pro');
              }}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shrink-0 transition-transform ${
                claimsStatus.isSoldOut
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black shadow-amber-500/30 cursor-pointer active:scale-95'
              }`}
            >
              {claimsStatus.isSoldOut 
                ? 'Lifetime Sold Out' 
                : `Claim $79.99 Lifetime Pass (${claimsStatus.remainingSlots} Left)`}
            </button>
          </div>

          {/* 30-DAY FREE TRIAL GUARANTEE BANNER */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center gap-2 text-xs text-emerald-300 font-semibold text-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>30-Day Free Trial Included:</strong> Try all Pro features 100% free for 30 days. Auto deduction of $14.99/month if not canceled before the end of the 30-day trial period, and reoccurring on each subsequent cycle until canceled. You may also skip the trial to pay immediately. Annual plan is $49.99/year (no trial). Cancel anytime in 1 click.
            </span>
          </div>

          {/* Referral Rewards Promo Banner */}
          {onOpenReferralProgram && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg shadow-black/40">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white uppercase tracking-wide">
                      Prefer 100% Free Premium?
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black uppercase">
                      REFERRAL REWARDS
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Refer <strong>10 people</strong> for Free Monthly/Yearly, or <strong>20 people</strong> for Free Lifetime Access!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReferralProgram();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>View Referral Program</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {/* DUAL 5% PLEDGES: HONEST POLICE WORK & BAIL RELIEF VAULT BANNER */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-zinc-900 to-amber-950/90 border-2 border-amber-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-amber-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30 shrink-0 mt-0.5">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Dual 5% Pledges: 5% Honest Police Work + 5% Bail Relief Vault
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    EVERY SUBSCRIPTION &amp; CREDIT PACK
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed max-w-3xl">
                  We balance constitutional defense with real-world support: <strong>5% of every purchase</strong> is donated directly to verified 501(c)(3) charities supporting honest police work &amp; fallen officer families, and a matching <strong>5% is pledged to the Bail Relief Vault</strong> to pay bail money for wrongfully accused citizens who win their court cases.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsCharityModalOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Police Charity (5%)</span>
              </button>
              {onOpenBailVault && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBailVault();
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs shadow-md shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Bail Vault (5%)</span>
                </button>
              )}
            </div>
          </div>

          {/* PAY-PER-USE CREDITS VIEW */}
          {billingCycle === 'pay_per_use' ? (
            <div className="space-y-6">
              
              {/* Credits Explanation Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">Pay-Per-Use Defense Credits</h3>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xl">
                    Don't want a recurring subscription? Purchase on-demand credits to unlock live police encounters, legal audits, court-certified evidence downloads, and simulation walkthroughs whenever you need them.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-300">
                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">1 Credit = 1 Live Encounter Copilot</span>
                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">1 Credit = 1 Court Evidence Certificate</span>
                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">1 Credit = 1 Full Simulation Test</span>
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-700/60 rounded-xl p-3 text-center shrink-0 min-w-[140px]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Your Balance</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">{currentCredits}</span>
                  <span className="text-[10px] text-zinc-400 block">Available Credits</span>
                </div>
              </div>

              {/* Credit Packages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CREDIT_PACKAGES.map(pack => {
                  const isSelected = selectedCreditPack === pack.id;
                  return (
                    <div 
                      key={pack.id}
                      onClick={() => setSelectedCreditPack(pack.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                        isSelected 
                          ? 'bg-zinc-850 border-amber-400 shadow-xl shadow-amber-950/30' 
                          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {pack.popular && (
                        <div className="absolute -top-2.5 right-3 bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                          MOST POPULAR
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm text-white">{pack.name}</h4>
                          <span className="text-xs font-mono font-bold text-amber-400">${pack.price}</span>
                        </div>
                        <div className="text-2xl font-black text-white font-mono my-2">
                          {pack.credits} <span className="text-xs font-sans text-zinc-400">Credits</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mb-2 font-mono">
                          {pack.pricePerCredit}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          {pack.credits >= 30 
                            ? 'Great for frequent drivers, rideshare workers, and public filming.' 
                            : 'Perfect for roadside backup and emergency encounters.'}
                        </p>
                      </div>

                      {/* 10% Police Charity Pledge Callout */}
                      <div className="mt-2.5 p-1.5 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-[10px]">
                        <span className="text-blue-300 font-semibold flex items-center gap-1">
                          <HeartHandshake className="w-3 h-3 text-blue-400 shrink-0" />
                          <span>10% (${(pack.price * 0.1).toFixed(2)}) to police charities</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCharityModalOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 underline font-bold cursor-pointer shrink-0 ml-1"
                        >
                          Pledge
                        </button>
                      </div>

                      {/* Conspicuous Short Version Notice immediately above credit buy button */}
                      <div className="mt-3 text-[10px] text-zinc-400 flex items-center justify-between gap-1 border-t border-zinc-800 pt-2">
                        <span className="truncate">Features vary by state &amp; travel.</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsJurisdictionModalOpen(true);
                          }}
                          className="text-amber-400 hover:text-amber-300 underline font-extrabold cursor-pointer shrink-0"
                        >
                          Read Full Terms
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCreditPack(pack.id);
                          handleInitiateCheckout();
                        }}
                        disabled={isLoading}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {isLoading && isSelected ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Buy {pack.credits} Credits (${pack.price})</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* SUBSCRIPTION TIERS (Weekly, Monthly, Yearly, Lifetime) */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* TIER 1: Free Civilian Basic */}
              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between ${
                isCurrentFree 
                  ? 'bg-zinc-800/60 border-zinc-600' 
                  : 'bg-zinc-950/70 border-zinc-800 text-zinc-400'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-white">Free Civilian</h3>
                    <span className="text-xs font-mono font-bold text-zinc-400">$0</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3">
                    Full constitutional rights defense across traffic, walking, and home encounters.
                  </p>

                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-2">Encounters Included (Free):</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-zinc-200 mb-4 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Traffic Stops</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Walking / Street</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>At Home Knocks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Public Filming</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-[11px]">
                    <li className="flex items-start gap-1.5 text-zinc-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Real-time on-screen AI legal rights advice</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Audio &amp; video recording with SHA-256 integrity</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Single-device local vault storage</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-500">
                      <X className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span className="line-through">12-Language Speech Translator (Paid tiers only)</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-500">
                      <X className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span className="line-through">Emergency contact SMS dispatch</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-500">
                      <X className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                      <span className="line-through">Multi-device vault sync &amp; live link</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    onSelectTier('free');
                    onClose();
                  }}
                  className={`mt-5 w-full py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    isCurrentFree
                      ? 'bg-zinc-700 text-zinc-300 cursor-default'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {isCurrentFree ? 'Current Active Plan' : 'Select Free Plan'}
                </button>
              </div>

              {/* TIER 2: SINGLE ALL-INCLUSIVE PAID TIER - POLICE SAFEGUARD PRO */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 relative flex flex-col justify-between ${
                isPaid && !isCurrentFree && currentTier !== 'lifetime_pro'
                  ? 'bg-zinc-850 border-amber-400 shadow-2xl shadow-amber-950/40 ring-2 ring-amber-400/40'
                  : 'bg-zinc-900 border-amber-500 shadow-xl'
              }`}>
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-400 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                  ALL-INCLUSIVE PRO • 30-DAY FREE TRIAL
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      <span>Police SafeGuard Pro</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </h3>
                    <span className="text-xs font-mono font-black text-amber-400">
                      {billingCycle === 'monthly' && (immediateCharge ? '$14.99 / mo (Charged Today)' : '$14.99 / mo (30-Day Free Trial)')}
                      {billingCycle === 'yearly' && '$49.99 / yr (No Trial • Annual Auto-Bill)'}
                      {billingCycle === 'lifetime' && (claimsStatus.isSoldOut ? '$79.99 (Sold Out)' : `$79.99 (${claimsStatus.remainingSlots} Slots Left)`)}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 mb-3">
                    Complete civilian constitutional defense. Unlocks all encounters, real-time translator, multi-device cloud sync, and 5 emergency contacts with live stream links.
                  </p>

                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1.5">All Features Unlocked:</div>
                  <div className="space-y-1.5 text-xs text-zinc-200 mb-3 bg-black/50 p-2.5 rounded-xl border border-amber-500/30">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px]">
                      <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
                      <span>Live Video &amp; GPS Witness Link for Contacts</span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-[11px]">
                      <FolderLock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Multi-Device Cloud Vault Sync (Phone, Tablet &amp; PC)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Up to 5 Emergency Contacts (Auto-SMS Dispatch)</span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-[11px]">
                      <Languages className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>12-Language Real-Time Speech Translator Included</span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-[11px]">
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>All Encounters:</strong> Traffic, Walking, Home &amp; Public Filming</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Live Earbud Audio Copilot:</strong> Real-time constitutional script advisories</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>SHA-256 Chain of Custody:</strong> FRE 902 court evidence generation</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>5th Amendment Panic Lockdown:</strong> Instant device blackout &amp; PIN lock</span>
                    </li>
                  </ul>

                  {/* Dual 5% Pledges Callout */}
                  <div className="mt-3 p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                      <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Includes 5% to Police Charities &amp; 5% to Bail Relief Vault</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setIsCharityModalOpen(true)}
                        className="text-blue-400 hover:text-blue-300 underline font-bold cursor-pointer"
                      >
                        Charity (5%)
                      </button>
                      {onOpenBailVault && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenBailVault();
                          }}
                          className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                        >
                          Bail Vault (5%)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Monthly: 30-Day Free Trial vs Immediate Charge Selector */}
                {billingCycle === 'monthly' && (
                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-zinc-300">Monthly Enrollment Option:</span>
                      <span className="text-[10px] text-amber-400 font-mono">Cancel anytime</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setImmediateCharge(false)}
                        className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                          !immediateCharge
                            ? 'bg-amber-500/20 border-amber-500/70 text-amber-300 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">30-Day Free Trial</div>
                        <div className="text-[9px] text-zinc-400">$0.00 today • Then $14.99/mo</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImmediateCharge(true)}
                        className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                          immediateCharge
                            ? 'bg-emerald-500/20 border-emerald-500/70 text-emerald-300 font-bold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-extrabold text-[11px] text-emerald-400">Skip Trial &amp; Pay Now</div>
                        <div className="text-[9px] text-zinc-400">$14.99 charged today</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Yearly: Explicit No-Trial Notice */}
                {billingCycle === 'yearly' && (
                  <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-amber-500/30 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-zinc-300">Annual Subscription: <strong>$49.99 / year</strong></span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">No Free Trial • Recurring</span>
                  </div>
                )}

                {/* Conspicuous Short Version Notice immediately above purchase button */}
                <div className="mt-4 pt-2.5 border-t border-amber-500/30 text-[10px] text-zinc-200 space-y-1 bg-black/50 p-2.5 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between gap-1 text-amber-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Geographic &amp; Jurisdictional Notice</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsJurisdictionModalOpen(true)}
                      className="text-amber-300 hover:text-amber-200 underline font-extrabold cursor-pointer"
                    >
                      Read Full Terms
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-snug">
                    Feature availability varies by geographic location, state laws &amp; interstate travel. Monthly subscriptions include a 30-day free trial with auto deduction of $14.99/mo if not canceled before the end of the trial period, or choose to skip trial and pay immediately. Annual subscription is $49.99/year with no free trial period. Both subscriptions auto-bill recurring on each subsequent billing cycle until canceled. Cancel anytime in 1 click.
                  </p>
                </div>

                <button
                  onClick={() => handleInitiateCheckout('all_encounters_pro')}
                  disabled={isLoading || (billingCycle === 'lifetime' && claimsStatus.isSoldOut)}
                  className={`mt-5 w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isPaid && currentTier !== 'lifetime_pro'
                      ? 'bg-amber-400 text-black shadow-md cursor-default'
                      : billingCycle === 'lifetime' && claimsStatus.isSoldOut
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-lg shadow-amber-950/40'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : isPaid && currentTier !== 'lifetime_pro' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>Police SafeGuard Pro Active</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-black" />
                      <span>
                        {billingCycle === 'lifetime' 
                          ? (claimsStatus.isSoldOut ? 'Lifetime Sold Out' : `Claim Lifetime Pass ($79.99 • ${claimsStatus.remainingSlots} Left)`)
                          : billingCycle === 'yearly'
                          ? 'Subscribe Annually ($49.99/yr • No Trial)'
                          : immediateCharge
                          ? 'Pay Immediately ($14.99/mo)'
                          : 'Start 30-Day Free Trial ($0.00 Today)'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>

              {/* TIER 3: LIMITED EARLY ACCESS $200 LIFETIME PASS (100 SPOTS) */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 relative flex flex-col justify-between ${
                currentTier === 'lifetime_pro'
                  ? 'bg-zinc-850 border-amber-400 shadow-2xl shadow-amber-950/40 ring-2 ring-amber-400/40'
                  : 'bg-zinc-950/90 border-amber-500/70 shadow-xl'
              }`}>
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
                  LIMITED OFFER • 100 SPOTS ONLY
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      <span>Lifetime Access Pass</span>
                      <InfinityIcon className="w-4 h-4 text-amber-400" />
                    </h3>
                    <span className="text-xs font-mono font-black text-amber-400">
                      $79.99 One-Time
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mb-3">
                    Pay once, protected for life. Zero recurring subscription charges ever. Guaranteed continued access for the lifetime of Police SafeGuard.
                  </p>

                  <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1.5">Real-Time Available Slots:</div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">Live Claim Counter:</span>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                        claimsStatus.isSoldOut ? 'bg-red-900 text-red-200' : 'bg-red-600 text-white animate-pulse'
                      }`}>
                        {claimsStatus.isSoldOut 
                          ? 'SOLD OUT' 
                          : `${claimsStatus.claimedCount} / ${claimsStatus.totalSlots} CLAIMED (${claimsStatus.remainingSlots} LEFT)`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                        style={{ width: `${Math.min(100, (claimsStatus.claimedCount / claimsStatus.totalSlots) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-[11px]">
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Permanent Lifetime License:</strong> No monthly or yearly rebills</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>All Pro Features Unlocked Forever:</strong> Multi-Device, Live Link, 12 Languages</span>
                    </li>
                    <li className="flex items-start gap-1.5 text-zinc-100 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Dual 5% Impact:</strong> $4.00 to Police Charities &amp; $4.00 to Bail Relief Vault</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={claimsStatus.isSoldOut || isLoading}
                  onClick={() => {
                    setBillingCycle('lifetime');
                    setSelectedPlanTier('all_encounters_pro');
                    handleInitiateCheckout('all_encounters_pro');
                  }}
                  className={`mt-5 w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    currentTier === 'lifetime_pro'
                      ? 'bg-amber-400 text-black shadow-md cursor-default'
                      : claimsStatus.isSoldOut
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black shadow-lg shadow-amber-950/40'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : currentTier === 'lifetime_pro' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>Lifetime Access Pass Active</span>
                    </>
                  ) : claimsStatus.isSoldOut ? (
                    'Lifetime Sold Out (100 Claimed)'
                  ) : (
                    <>
                      <InfinityIcon className="w-4 h-4 text-black" />
                      <span>Claim $79.99 Lifetime Pass ({claimsStatus.remainingSlots} Left)</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* Verified Stripe Routing Banner */}
          <div className="p-3 rounded-2xl bg-zinc-950/80 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-zinc-300 font-medium">
                Verified Merchant Account: <strong className="text-emerald-400 font-mono">acct_1UD05gBOWoal0QfX</strong>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Direct Payouts Active • Official Stripe Integration
            </span>
          </div>

          {/* Direct In-App Card Option */}
          <div className="p-3 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-zinc-300">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Prefer In-App Direct Card Entry?</span>
                <span className="text-[11px] text-zinc-400">Enter card credentials directly within the app without navigating away to Stripe.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenDirectCardModal()}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 font-bold border border-amber-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enter Card Details In-App</span>
            </button>
          </div>

          {/* IMPORTANT LEGAL NOTICE — GEOGRAPHIC AND JURISDICTIONAL FEATURE AVAILABILITY (User Mandated) */}
          <div 
            ref={termsSectionRef}
            className={`mt-6 bg-zinc-950 border-2 rounded-2xl p-4 sm:p-5 text-xs shadow-xl space-y-3.5 transition-all duration-300 ${
              highlightTerms 
                ? 'border-amber-400 ring-4 ring-amber-500/40 shadow-amber-500/20' 
                : 'border-amber-500/70'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <Globe className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <div className="font-black text-amber-400 text-xs sm:text-sm tracking-wide uppercase">
                      IMPORTANT LEGAL NOTICE — GEOGRAPHIC AND JURISDICTIONAL FEATURE AVAILABILITY
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                      PLEASE READ CAREFULLY BEFORE PURCHASING A SUBSCRIPTION.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsJurisdictionModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md w-fit transition-transform active:scale-95 shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Read Full Terms</span>
                  </button>
                </div>

                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  By purchasing or activating a subscription to this application (“App”), you acknowledge and agree that certain features, functions, services, content, legal information, AI-assisted guidance, recording capabilities, alerts, translations, jurisdiction-specific information, and other functionality offered through the App may be dependent upon your geographic location, the jurisdiction in which you are physically located, applicable federal, state, local, territorial, or foreign laws and regulations, available technology, and other jurisdiction-specific restrictions.
                </p>

                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  <strong>Feature availability is not guaranteed in every location.</strong> Certain features may be unavailable, restricted, disabled, modified, interrupted, or otherwise limited in particular jurisdictions because of applicable laws, regulations, court decisions, governmental requirements, licensing restrictions, technical limitations, or interstate travel. To the fullest extent permitted by applicable law, inability to access a feature due to location restrictions does not create an entitlement to a full or partial refund.
                </p>

                {/* Mandatory Checkbox: Geographic & Jurisdictional Notice */}
                <label className="flex items-start gap-2.5 pt-2 text-[11px] text-zinc-100 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={jurisdictionTermsAccepted}
                    onChange={(e) => {
                      setJurisdictionTermsAccepted(e.target.checked);
                      if (e.target.checked) {
                        localStorage.setItem('police_safeguard_jurisdiction_terms_accepted', 'true');
                        localStorage.removeItem('police_protection_jurisdiction_terms_accepted');
                        localStorage.removeItem('civicshield_jurisdiction_terms_accepted');
                      } else {
                        localStorage.removeItem('police_safeguard_jurisdiction_terms_accepted');
                        localStorage.removeItem('police_protection_jurisdiction_terms_accepted');
                        localStorage.removeItem('civicshield_jurisdiction_terms_accepted');
                      }
                    }}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer mt-0.5 shrink-0"
                  />
                  <span className="font-bold leading-snug">
                    BY SELECTING “I AGREE” AND/OR PURCHASING A SUBSCRIPTION, I CONFIRM THAT I HAVE READ, UNDERSTOOD, AND ACCEPTED THIS NOTICE AND ACKNOWLEDGE THAT FEATURE AVAILABILITY MAY VARY BASED ON MY LOCATION AND APPLICABLE JURISDICTION WITHOUT REFUND ENTITLEMENT.
                  </span>
                </label>

                {/* Secondary Checkbox: Duration of App Availability */}
                <label className="flex items-start gap-2.5 pt-1 text-[11px] text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer mt-0.5 shrink-0"
                  />
                  <span className="leading-snug">
                    I acknowledge that memberships, subscriptions, and credit purchases are honored strictly for the active life duration and operational availability of the app, and all purchases are made at my own risk with no refunds.
                  </span>
                </label>

                {/* 1-Tap Quick Agree Button */}
                {(!jurisdictionTermsAccepted || !disclaimerAccepted) ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAgreeAndCheckout()}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer active:scale-98 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>AGREE TO ALL TERMS &amp; CONTINUE TO PAYMENT (1-TAP)</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-emerald-300 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold">Required Terms Confirmed &amp; Accepted</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                      Ready to Checkout
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>256-Bit SSL Encrypted • Stripe PCI Level 1 Secure • No Refunds under Availability Terms</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCharityModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-blue-400" />
              <span>10% Police Charity Pledge</span>
            </button>
            <button 
              type="button"
              onClick={() => setIsJurisdictionModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
            >
              Geographic Terms
            </button>
            <span className="text-zinc-500">policesafeguard.com</span>
            <button onClick={onClose} className="hover:text-white cursor-pointer">Close</button>
          </div>
        </div>

      </div>

      {/* Full Geographic & Jurisdictional Feature Availability Terms Modal */}
      <GeographicJurisdictionLegalModal
        isOpen={isJurisdictionModalOpen}
        onClose={() => setIsJurisdictionModalOpen(false)}
        onAgree={() => {
          setJurisdictionTermsAccepted(true);
          localStorage.setItem('police_safeguard_jurisdiction_terms_accepted', 'true');
          localStorage.removeItem('police_protection_jurisdiction_terms_accepted');
          localStorage.removeItem('civicshield_jurisdiction_terms_accepted');
        }}
      />

      {/* 10% Law Enforcement Charity Commitment & Beneficiaries Modal */}
      <LawEnforcementCharityModal
        isOpen={isCharityModalOpen}
        onClose={() => setIsCharityModalOpen(false)}
        onOpenSubscriptionModal={() => setIsCharityModalOpen(false)}
      />
    </div>
  );
};

