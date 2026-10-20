import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, CreditCard, CheckCircle2, 
  ExternalLink, Zap, RefreshCw, AlertCircle,
  ArrowRight, Copy, Check, Sparkles, HeartHandshake, Building2,
  Shield, HelpCircle, ChevronRight, Gift
} from 'lucide-react';
import { BillingCycle, MembershipTier } from '../types';
import { PromoService } from '../services/promoService';

interface LiveStripeSubscriptionPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentTier?: MembershipTier;
  initialTier?: 'all_encounters_pro' | 'lifetime_pro';
  initialCycle?: BillingCycle;
  onPaymentSuccess?: (tier: MembershipTier, cycle?: BillingCycle, credits?: number) => void;
}

// Brand SVG Icons
const StripeLogoSvg: React.FC<{ className?: string }> = ({ className = "w-14 h-6" }) => (
  <svg viewBox="0 0 60 25" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M59.64 14.28c0-4.48-2.22-7.98-6.38-7.98-4.2 0-6.72 3.5-6.72 8 0 5.3 3.02 7.9 7.28 7.9 2.08 0 3.64-.48 4.82-1.16v-3.32c-1.18.6-2.5.94-4.04.94-1.68 0-3.16-.62-3.36-2.6h8.32c.04-.44.08-.94.08-1.78zm-8.4-1.66c0-1.84 1.1-2.6 2.06-2.6.94 0 1.98.76 1.98 2.6h-4.04zm-10.74-6.32c-1.66 0-2.76.78-3.32 1.34l-.22-1.06h-4.14v19.64l4.62-.98.02-4.78c.58.5 1.56 1.14 3.04 1.14 3.1 0 5.92-2.5 5.92-7.66 0-4.9-2.74-7.64-5.92-7.64zm-1.02 11.66c-1.04 0-1.72-.38-2.18-.88l-.02-5.46c.46-.54 1.16-.94 2.2-.94 1.7 0 2.82 1.56 2.82 3.64 0 2.1-1.12 3.64-2.82 3.64zm-15.02-4.18c0-1.86-1.5-2.64-3.56-2.64-1.62 0-3.26.46-4.66 1.24v-3.7c1.52-.64 3.32-.98 4.96-.98 4.46 0 7.42 2.22 7.42 6.54v9.64h-4.16l-.2-1.16c-.84.82-2.16 1.44-3.8 1.44-3.04 0-5.18-1.82-5.18-4.56 0-3.34 2.92-4.74 6.84-4.74.82 0 1.62.06 2.34.18v-.26zm-4.34 4.82c0 1.16.92 1.76 2.02 1.76 1.08 0 1.98-.56 2.32-1.42v-2.12c-.52-.1-1.16-.16-1.92-.16-1.52 0-2.42.54-2.42 1.94zm-11.42-7.5c-1.28 0-2.16.48-2.66 1.02l-.24-.74h-4.1v15.3l4.64-.98v-9.66c.5-.54 1.34-.94 2.36-.94v-4zM2.84 8.76l4.64-.98V3.6L2.84 4.58v4.18zm0 13.06l4.64-.98V8.92L2.84 9.9v11.92z"/>
  </svg>
);

const VisaLogoSvg: React.FC<{ className?: string }> = ({ className = "h-4" }) => (
  <svg viewBox="0 0 50 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.77 15.65h-3.25L18.55.35h3.25l-2.03 15.3zm13.78-14.8c-.64-.25-1.64-.52-2.88-.52-3.17 0-5.41 1.69-5.43 4.1-.02 1.78 1.6 2.78 2.82 3.37 1.25.61 1.67 1 1.67 1.55 0 .84-.99 1.23-1.92 1.23-1.28 0-1.97-.19-3.02-.66l-.42-.2-.45 2.78c.75.35 2.14.65 3.58.67 3.37 0 5.56-1.66 5.59-4.23.01-1.41-.84-2.48-2.69-3.37-1.12-.58-1.81-.97-1.8-1.56 0-.52.59-1.08 1.86-1.08 1.06-.02 1.83.23 2.42.49l.29.13.58-2.67zM42.27.35h-2.51c-.78 0-1.36.22-1.7.1.04l-5.99 14.3h3.41l.68-1.88h4.17l.39 1.88h3.01L42.27.35zm-5.04 10.15l1.72-4.73.99 4.73h-2.71zM14.07.35L10.98 10.8l-.33-1.68C10.08 7.37 8.64 5.67 6.78 4.67l2.97 10.98h3.43L17.5.35h-3.43z"/>
    <path d="M4.88.35H.02L0 .5c3.81.97 6.34 3.32 7.38 6.14L6.32 1.48C6.11.66 5.54.38 4.88.35z"/>
  </svg>
);

const MastercardLogoSvg: React.FC<{ className?: string }> = ({ className = "h-4" }) => (
  <svg viewBox="0 0 36 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#EB001B" fillOpacity="0.9" />
    <circle cx="24" cy="12" r="11" fill="#F79E1B" fillOpacity="0.85" />
    <path d="M18 4.5a11 11 0 0 1 0 15 11 11 0 0 1 0-15z" fill="#FF5F00" />
  </svg>
);

const AmexLogoSvg: React.FC<{ className?: string }> = ({ className = "h-4" }) => (
  <svg viewBox="0 0 36 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="24" rx="3" fill="#0077A6" />
    <path d="M4 17l4.5-10h3l4.5 10h-2.8l-.9-2.2H8.3L7.4 17H4zm5-4.5h2.1L10 8.5l-1 4zm8.5 4.5V7h5.5c1.8 0 3 1.2 3 2.8 0 1.1-.6 2-1.6 2.5 1.3.5 1.9 1.5 1.9 2.7 0 1.6-1.3 2-3.1 2H17.5zm2.5-6h2.5c.6 0 1-.3 1-.8 0-.6-.4-.8-1-.8H20v1.6zm0 3.8h2.8c.7 0 1.2-.4 1.2-1 0-.6-.5-1-1.2-1H20v2z" fill="#FFFFFF"/>
  </svg>
);

export const LiveStripeSubscriptionPortalModal: React.FC<LiveStripeSubscriptionPortalModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  currentTier = 'free',
  initialTier = 'all_encounters_pro',
  initialCycle = 'monthly',
  onPaymentSuccess
}) => {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(initialCycle === 'lifetime' ? 'lifetime' : initialCycle === 'yearly' ? 'yearly' : 'monthly');
  const [selectedTier, setSelectedTier] = useState<'all_encounters_pro' | 'lifetime_pro'>(initialTier === 'lifetime_pro' ? 'lifetime_pro' : 'all_encounters_pro');
  const [paymentMode, setPaymentMode] = useState<'in_app_card' | 'stripe_hosted' | 'customer_portal'>('in_app_card');
  
  // Card Form Inputs
  const [email, setEmail] = useState(userEmail);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Stripe Configuration Status (Read-only, no secret keys exposed to customer)
  const [stripeConfigInfo, setStripeConfigInfo] = useState<any | null>(null);

  // Bonus / Ambassador Promo Code State
  const [bonusCodeInput, setBonusCodeInput] = useState('');
  const [bonusCodeStatus, setBonusCodeStatus] = useState<{
    isChecking: boolean;
    message?: string;
    isError?: boolean;
    isSuccess?: boolean;
  }>({ isChecking: false });

  // Async & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingStripeUrl, setIsGeneratingStripeUrl] = useState(false);
  const [hostedStripeUrl, setHostedStripeUrl] = useState<string | null>(null);
  const [isGeneratingPortalUrl, setIsGeneratingPortalUrl] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync initial props if changed
  useEffect(() => {
    if (initialTier) setSelectedTier(initialTier === 'lifetime_pro' ? 'lifetime_pro' : 'all_encounters_pro');
    if (initialCycle) setSelectedCycle(initialCycle);
  }, [initialTier, initialCycle]);

  useEffect(() => {
    if (userEmail && !email) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Load Stripe checkout session URL smoothly whenever plan changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      fetchHostedCheckoutUrl();
    }
  }, [isOpen, selectedTier, selectedCycle]);

  const fetchHostedCheckoutUrl = async () => {
    const cleanEmail = email.trim();
    setIsGeneratingStripeUrl(true);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedCycle === 'lifetime' ? 'lifetime_pro' : selectedTier,
          billingCycle: selectedCycle,
          email: cleanEmail || undefined,
          immediateCharge: false,
          returnUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        setHostedStripeUrl(data.checkoutUrl);
      }
    } catch (e) {
      console.warn('Stripe checkout session notice:', e);
    } finally {
      setIsGeneratingStripeUrl(false);
    }
  };

  const loadStripeConfig = async () => {
    try {
      const res = await fetch('/api/checkout/config');
      const data = await res.json();
      setStripeConfigInfo(data);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      loadStripeConfig();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Plan pricing & pledge computations
  let planPriceDisplay = '$14.99/mo';
  let trialText = '30-Day Free Trial ($0.00 Due Today)';
  let billedCycleText = 'Auto-bills $14.99/month on Day 30 unless canceled. Cancel anytime with 1 tap.';
  let policePledge = '$0.75';
  let bailVaultPledge = '$0.75';

  if (selectedCycle === 'yearly') {
    planPriceDisplay = '$49.99/yr';
    trialText = 'Immediate Annual Coverage ($49.99 Due Today)';
    billedCycleText = 'No free trial period. Auto-bills $49.99/year annually until canceled.';
    policePledge = '$2.50';
    bailVaultPledge = '$2.50';
  } else if (selectedCycle === 'lifetime') {
    planPriceDisplay = '$79.99 One-Time';
    trialText = 'Lifetime Constitutional Access (100 Slots)';
    billedCycleText = 'Never bills again. Guaranteed continued lifetime constitutional coverage.';
    policePledge = '$4.00';
    bailVaultPledge = '$4.00';
  }

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvc(raw);
  };

  const getCardBrand = (): string => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    return 'Card';
  };

  // Instant In-App Card Submission with PCI-DSS & Luhn Validation
  const handleProcessInAppCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid customer email for receipt delivery and account confirmation.');
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage('Please enter the cardholder name as printed on the card.');
      return;
    }

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 15) {
      setErrorMessage('Please enter a complete 15 or 16 digit card number.');
      return;
    }

    // Client-side Luhn Checksum validation
    let luhnSum = 0;
    let alternate = false;
    for (let i = cleanCard.length - 1; i >= 0; i--) {
      let n = parseInt(cleanCard.charAt(i), 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }
      luhnSum += n;
      alternate = !alternate;
    }
    if (luhnSum % 10 !== 0) {
      setErrorMessage('Card number digits failed verification. Please re-check the number.');
      return;
    }

    if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
      setErrorMessage('Please enter a valid expiration date (MM/YY).');
      return;
    }

    if (cardCvc.length < 3) {
      setErrorMessage('Please enter a valid 3 or 4 digit security code (CVC).');
      return;
    }

    if (billingZip.trim().length < 5) {
      setErrorMessage('Please enter a valid 5-digit billing ZIP/postal code.');
      return;
    }

    if (!termsAgreed) {
      setErrorMessage('Please confirm authorization of the payment terms and 30-day free trial.');
      return;
    }

    setIsSubmitting(true);
    try {
      let clientTokenId: string | undefined;

      // If Stripe Publishable Key is available, tokenize securely in browser so raw card data never touches server
      if (stripeConfigInfo?.publishableKey) {
        try {
          const expParts = cardExpiry.split('/');
          const expMonth = expParts[0].trim();
          const expYearRaw = expParts[1].trim();
          const expYear = expYearRaw.length === 2 ? `20${expYearRaw}` : expYearRaw;

          const params = new URLSearchParams();
          params.append('card[number]', cleanCard);
          params.append('card[exp_month]', expMonth);
          params.append('card[exp_year]', expYear);
          params.append('card[cvc]', cardCvc.trim());
          params.append('card[name]', cardholderName.trim());
          params.append('card[address_zip]', billingZip.trim());

          const tokenRes = await fetch('https://api.stripe.com/v1/tokens', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeConfigInfo.publishableKey.trim()}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });

          const tokenJson = await tokenRes.json();
          if (tokenJson?.id) {
            clientTokenId = tokenJson.id;
          }
        } catch (tokErr) {
          console.warn('Client-side Stripe token notice:', tokErr);
        }
      }

      const res = await fetch('/api/checkout/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedCycle === 'lifetime' ? 'lifetime_pro' : selectedTier,
          billingCycle: selectedCycle,
          cardholderName: cardholderName.trim(),
          cardNumber: cleanCard,
          cardExpiry,
          cardCvc,
          billingZip: billingZip.trim(),
          email: cleanEmail,
          disclaimerAccepted: true,
          tokenId: clientTokenId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment card authorization failed. Please check your card information.');
      }

      if (data.requiresRedirect || data.checkoutUrl) {
        // Direct the user to the official Stripe Checkout page to actually charge and verify funds with their bank
        const targetUrl = data.checkoutUrl || hostedStripeUrl;
        if (targetUrl) {
          setHostedStripeUrl(targetUrl);
          try {
            if (window.top && window.top !== window) {
              window.top.location.href = targetUrl;
            } else {
              window.location.href = targetUrl;
            }
          } catch {
            window.location.href = targetUrl;
          }
          return;
        }
      }

      if (!data.paid) {
        throw new Error(data.error || 'Payment was not approved or completed by your bank. No subscription was activated.');
      }

      // ONLY execute onPaymentSuccess if genuine payment funds were confirmed and captured
      setSuccessReceipt(data);

      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess(
            data.tier,
            data.billingCycle,
            data.creditsGranted
          );
        }
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment processing failed. Please verify your card details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Hosted Link Fallback
  const handleCopyLink = () => {
    if (!hostedStripeUrl) return;
    navigator.clipboard.writeText(hostedStripeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Open Stripe Customer Billing Portal
  const handleOpenCustomerPortal = async () => {
    setErrorMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter the email address used for your subscription.');
      return;
    }

    setIsGeneratingPortalUrl(true);
    try {
      const res = await fetch('/api/checkout/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          returnUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (!res.ok || !data.portalUrl) {
        throw new Error(data.error || 'Could not find an active Stripe billing customer with this email.');
      }

      setPortalUrl(data.portalUrl);
      // Safe navigation
      const win = window.open(data.portalUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        // If popup was blocked, fallback is displayed on screen
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to open customer portal.');
    } finally {
      setIsGeneratingPortalUrl(false);
    }
  };

  // Redeem Bonus / Ambassador Promo Code on the same payment page
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
        name: cardholderName.trim() || baseProfile.name || 'Citizen Defender',
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
          if (onPaymentSuccess) {
            onPaymentSuccess('lifetime_pro', 'lifetime', 9999);
          }
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

  return (
    <div 
      id="live-stripe-subscription-portal-modal"
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100 ring-1 ring-zinc-800 relative">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shrink-0 relative">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              OFFICIAL STRIPE PORTAL
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              PCI-DSS LEVEL 1
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[9px] font-medium hidden sm:inline-block">
              256-Bit SSL
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Police SafeGuard Subscription Gateway</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Direct merchant checkout for Police SafeGuard. 100% of payments route to your verified Stripe account.
              </p>
            </div>
            <div className="hidden sm:flex items-center text-indigo-400 pr-8">
              <StripeLogoSvg className="w-16 h-7 text-[#635BFF]" />
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* STEP 1: Plan Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                1. Select Subscription Plan:
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> 30-Day Free Trial ($0.00 Today)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Universal Pro Monthly */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCycle('monthly');
                  setSelectedTier('all_encounters_pro');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedCycle === 'monthly' && selectedTier === 'all_encounters_pro'
                    ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950/40 ring-2 ring-indigo-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-extrabold text-white text-xs">Monthly Pro</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">$14.99/mo</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  All Encounters • Traffic, Home, Street &amp; Filming
                </div>
                <div className="mt-2 text-[9px] text-emerald-300 font-semibold flex items-center gap-1">
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">30-DAY TRIAL</span>
                  <span>$0 Today</span>
                </div>
              </button>

              {/* Universal Pro Yearly */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCycle('yearly');
                  setSelectedTier('all_encounters_pro');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedCycle === 'yearly' && selectedTier === 'all_encounters_pro'
                    ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950/40 ring-2 ring-indigo-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-[9px] uppercase tracking-wide">
                  NO TRIAL • RECURRING
                </span>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-extrabold text-white text-xs">Annual Pro</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">$49.99/yr</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  Full Year Coverage • Complete Defense Copilot
                </div>
                <div className="mt-2 text-[9px] text-amber-300 font-semibold flex items-center gap-1">
                  <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black">ANNUAL</span>
                  <span>$49.99 Today</span>
                </div>
              </button>

              {/* Early Access Lifetime Pass */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCycle('lifetime');
                  setSelectedTier('lifetime_pro');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                  selectedCycle === 'lifetime'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/40 ring-2 ring-amber-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black text-[9px] uppercase tracking-wide">
                  100 SLOTS ONLY
                </span>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-extrabold text-white text-xs">Lifetime Pass</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">$79.99 Once</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  Never Bills Again • Perpetual Shield
                </div>
                <div className="mt-2 text-[9px] text-amber-300 font-semibold">
                  Guaranteed Lifetime Rights Access
                </div>
              </button>
            </div>
          </div>

          {/* Pricing Summary Box */}
          <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Due Today</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {selectedCycle === 'lifetime' 
                  ? '$79.99 (Immediate Activation)' 
                  : selectedCycle === 'yearly'
                  ? '$49.99 (Immediate Annual Activation)'
                  : '$0.00 (30-Day Free Trial)'}
              </span>
              <p className="text-[10px] text-zinc-400">
                {billedCycleText}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-zinc-400 block">Plan Rate</span>
              <span className="text-sm font-bold text-white">{planPriceDisplay}</span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/80 text-red-200 flex items-center gap-2 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* BONUS / PROMO CODE ENTRY ON THE SAME PAYMENT PAGE */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>Have a Bonus / Ambassador Promo Code?</span>
              </div>
              <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Instant Unlock
              </span>
            </div>
            <form onSubmit={handleApplyBonusCode} className="flex gap-2">
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
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-extrabold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center gap-1.5"
              >
                {bonusCodeStatus.isChecking ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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

          {/* STEP 2: Checkout Method Switcher */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              2. Choose Checkout Method:
            </span>
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setPaymentMode('in_app_card')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMode === 'in_app_card'
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Instant In-App Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('stripe_hosted')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMode === 'stripe_hosted'
                    ? 'bg-[#635BFF] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Stripe 1-Click Pay</span>
              </button>
            </div>
          </div>

          {/* METHOD 1: INSTANT IN-APP CARD ENTRY */}
          {paymentMode === 'in_app_card' && !successReceipt && (
            <form onSubmit={handleProcessInAppCard} className="space-y-3.5">
              {/* Virtual Card Graphic Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-zinc-900 via-zinc-850 to-zinc-800 border border-zinc-700/80 shadow-lg text-white space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400">
                    POLICE SAFEGUARD PRE-AUTH
                  </span>
                  <div className="flex items-center gap-2">
                    {getCardBrand() === 'Visa' && <VisaLogoSvg className="h-3 text-white" />}
                    {getCardBrand() === 'Mastercard' && <MastercardLogoSvg className="h-4" />}
                    {getCardBrand() === 'Amex' && <AmexLogoSvg className="h-4" />}
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                      {getCardBrand()}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-sm sm:text-base tracking-widest text-zinc-100 font-bold">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <div>
                    <span className="text-[9px] uppercase block text-zinc-500">CARDHOLDER</span>
                    <span className="text-zinc-200 font-bold uppercase">{cardholderName || 'FULL NAME'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase block text-zinc-500">EXPIRES</span>
                    <span className="text-zinc-200 font-bold">{cardExpiry || 'MM/YY'}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  Customer Email (For Receipt &amp; Vault Recovery):
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Cardholder Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  Cardholder Name (as printed on card):
                </label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Jane Citizen"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 uppercase font-medium"
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  Card Number:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-3 pr-20 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 tracking-wider"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                    {getCardBrand() === 'Visa' && <VisaLogoSvg className="h-3 text-white" />}
                    {getCardBrand() === 'Mastercard' && <MastercardLogoSvg className="h-3.5" />}
                    <span>{getCardBrand()}</span>
                  </div>
                </div>
              </div>

              {/* Expiry, CVC, ZIP */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-300">Expires:</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2 text-xs font-mono text-center text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-300">CVC Code:</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="•••"
                    value={cardCvc}
                    onChange={handleCvcChange}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2 text-xs font-mono text-center text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 tracking-widest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-300">Billing ZIP:</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="90210"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2 text-xs font-mono text-center text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Terms and Auto-bill agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-[10px] text-zinc-400 select-none">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400"
                  />
                  <span>
                    I authorize Police SafeGuard to process my payment method. For monthly subscriptions, I am enrolling in a <strong>30-day free trial ($0.00 charged today)</strong> and understand I will be auto-billed $14.99/mo on Day 30 unless cancelled. For annual subscriptions, I authorize the immediate charge of $49.99/yr recurring annually until canceled. Cancel anytime with 1 tap.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !termsAgreed}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 transition-all cursor-pointer active:scale-98 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Authorizing with Stripe Gateway...</span>
                  </>
                ) : selectedCycle === 'lifetime' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize $79.99 Lifetime Access Pass</span>
                  </>
                ) : selectedCycle === 'yearly' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize $49.99 Today • Start Annual Pro</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize $0.00 Today • Start 30-Day Free Trial</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* METHOD 2: STRIPE HOSTED CHECKOUT */}
          {paymentMode === 'stripe_hosted' && !successReceipt && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 border border-indigo-500/40 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs sm:text-sm">Official Stripe Hosted Checkout Page</h4>
                  <p className="text-[11px] text-zinc-400">Apple Pay, Google Pay, Link &amp; Credit Cards</p>
                </div>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed">
                Click below to launch the official, secure <strong>Stripe Checkout page</strong>. Seamlessly checkout with Apple Pay, Google Pay, or card:
              </p>

              <div className="bg-black/60 p-3 rounded-xl border border-zinc-800 space-y-1.5 text-[11px] text-zinc-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Plan:</span>
                  <span className="text-white font-bold">{selectedCycle === 'lifetime' ? 'Lifetime Pass' : 'Police SafeGuard Pro'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Rate:</span>
                  <span className="text-amber-400 font-bold">{planPriceDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Today:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedCycle === 'lifetime' 
                      ? '$79.99 One-Time' 
                      : selectedCycle === 'yearly'
                      ? '$49.99 Due Today (Annual Pro)'
                      : '$0.00 Due Today (30-Day Free Trial)'}
                  </span>
                </div>
              </div>

              {/* Direct Anchor Launch Button - Immune to Popup Blockers */}
              {hostedStripeUrl ? (
                <div className="space-y-2">
                  <a
                    href={hostedStripeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#635BFF] via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/80 transition-all cursor-pointer active:scale-98"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Launch Official Stripe Checkout</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Stripe Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = hostedStripeUrl;
                      }}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Navigate directly in this window"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Direct Redirect</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 text-zinc-400 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Connecting to Stripe Gateway...</span>
                </button>
              )}

              <p className="text-[10px] text-zinc-400 text-center">
                Want to complete checkout instantly without leaving this screen? Switch to the <strong>Instant In-App Card</strong> tab above!
              </p>
            </div>
          )}

          {/* METHOD 3: CUSTOMER PORTAL */}
          {paymentMode === 'customer_portal' && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Stripe Customer Self-Service Dashboard</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Active subscribers can log in to update credit cards, switch plans, or download PDF tax receipts directly through Stripe.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  Account Subscription Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {portalUrl ? (
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-[#635BFF] hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Open Stripe Customer Portal (New Window)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCustomerPortal}
                  disabled={isGeneratingPortalUrl}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isGeneratingPortalUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Locating Stripe Customer Account...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Access Customer Portal</span>
                      <ChevronRight className="w-3 h-3 text-zinc-400" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* SUCCESS RECEIPT DISPLAY */}
          {successReceipt && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 space-y-2.5 animate-in zoom-in-95">
              <div className="flex items-center gap-2 font-black text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Stripe Payment Confirmed &amp; Activated!</span>
              </div>
              <p className="text-xs leading-relaxed">{successReceipt.message}</p>
              <div className="p-3 rounded-xl bg-black/60 font-mono text-[10px] text-zinc-300 space-y-1">
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="text-emerald-300 font-bold">{successReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pre-Auth Amount:</span>
                  <span>${successReceipt.preAuthHoldAmount || '14.99'} (Held)</span>
                </div>
                <div className="flex justify-between">
                  <span>Settled Today:</span>
                  <span className="text-emerald-400 font-bold">
                    {successReceipt.trialActive ? '$0.00 (30-Day Free Trial)' : `$${successReceipt.amountChargedToday}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Charity Pledges:</span>
                  <span className="text-blue-300">
                    ${successReceipt.policePledgeDollars || '0.25'} (5% Police Wellness) + ${successReceipt.bailVaultPledgeDollars || '0.25'} (5% Bail Vault)
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 pt-1">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Your account has been upgraded. Enjoy complete constitutional coverage!</span>
              </div>
            </div>
          )}

          {/* Dual 5% Charities Callout */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-blue-200 text-[10px]">
            <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Dual 5% Pledges Included:</strong> 5% (${policePledge}) is donated to verified charities supporting honest police work &amp; officer wellness, and 5% (${bailVaultPledge}) is pledged to the Bail Relief Vault supporting wrongfully accused citizens.
            </div>
          </div>

          {/* Customer Portal Quick Switch */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Already subscribed?</span>
            <button
              type="button"
              onClick={() => setPaymentMode(paymentMode === 'customer_portal' ? 'in_app_card' : 'customer_portal')}
              className="text-indigo-400 hover:text-indigo-300 underline font-bold cursor-pointer"
            >
              {paymentMode === 'customer_portal' ? 'Back to Payment Form' : 'Manage Existing Plan on Stripe'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-zinc-900/80 border-t border-zinc-800 text-center text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted with TLS 1.3 • Verified Stripe Gateway • Zero Card Data Stored Locally</span>
        </div>
      </div>
    </div>
  );
};
