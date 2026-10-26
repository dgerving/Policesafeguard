import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, CreditCard, CheckCircle2, 
  ExternalLink, Zap, RefreshCw, AlertCircle,
  ArrowRight, Copy, Check, Sparkles, HeartHandshake,
  Shield, HelpCircle, ChevronRight, Gift
} from 'lucide-react';
import { BillingCycle, MembershipTier } from '../types';

interface LiveStripeSubscriptionPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentTier?: MembershipTier;
  initialTier?: 'all_encounters_pro' | 'lifetime_pro';
  initialCycle?: BillingCycle;
  onPaymentSuccess?: (tier: MembershipTier, cycle?: BillingCycle, credits?: number) => void;
  onOpenPromoModal?: () => void;
}

// Brand SVG Icons
const StripeLogoSvg: React.FC<{ className?: string }> = ({ className = "w-14 h-6" }) => (
  <svg viewBox="0 0 60 25" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M59.64 14.28c0-4.48-2.22-7.98-6.38-7.98-4.2 0-6.72 3.5-6.72 8 0 5.3 3.02 7.9 7.28 7.9 2.08 0 3.64-.48 4.82-1.16v-3.32c-1.18.6-2.5.94-4.04.94-1.68 0-3.16-.62-3.36-2.6h8.32c.04-.44.08-.94.08-1.78zm-8.4-1.66c0-1.84 1.1-2.6 2.06-2.6.94 0 1.98.76 1.98 2.6h-4.04zm-10.74-6.32c-1.66 0-2.76.78-3.32 1.34l-.22-1.06h-4.14v19.64l4.62-.98.02-4.78c.58.5 1.56 1.14 3.04 1.14 3.1 0 5.92-2.5 5.92-7.66 0-4.9-2.74-7.64-5.92-7.64zm-1.02 11.66c-1.04 0-1.72-.38-2.18-.88l-.02-5.46c.46-.54 1.16-.94 2.2-.94 1.7 0 2.82 1.56 2.82 3.64 0 2.1-1.12 3.64-2.82 3.64zm-15.02-4.18c0-1.86-1.5-2.64-3.56-2.64-1.62 0-3.26.46-4.66 1.24v-3.7c1.52-.64 3.32-.98 4.96-.98 4.46 0 7.42 2.22 7.42 6.54v9.64h-4.16l-.2-1.16c-.84.82-2.16 1.44-3.8 1.44-3.04 0-5.18-1.82-5.18-4.56 0-3.34 2.92-4.74 6.84-4.74.82 0 1.62.06 2.34.18v-.26zm-4.34 4.82c0 1.16.92 1.76 2.02 1.76 1.08 0 1.98-.56 2.32-1.42v-2.12c-.52-.1-1.16-.16-1.92-.16-1.52 0-2.42.54-2.42 1.94zm-11.42-7.5c-1.28 0-2.16.48-2.66 1.02l-.24-.74h-4.1v15.3l4.64-.98v-9.66c.5-.54 1.34-.94 2.36-.94v-4zM2.84 8.76l4.64-.98V3.6L2.84 4.58v4.18zm0 13.06l4.64-.98V8.92L2.84 9.9v11.92z"/>
  </svg>
);

export const LiveStripeSubscriptionPortalModal: React.FC<LiveStripeSubscriptionPortalModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  currentTier = 'free',
  initialCycle = 'monthly',
  onPaymentSuccess,
  onOpenPromoModal
}) => {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>(
    initialCycle === 'yearly' ? 'yearly' : 'monthly'
  );
  const [email, setEmail] = useState<string>(userEmail || '');
  const [activeTab, setActiveTab] = useState<'checkout' | 'customer_portal'>('checkout');
  
  // Hosted Checkout State
  const [isGeneratingStripeUrl, setIsGeneratingStripeUrl] = useState(false);
  const [hostedStripeUrl, setHostedStripeUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Customer Portal State
  const [isLocatingCustomer, setIsLocatingCustomer] = useState(false);

  useEffect(() => {
    if (userEmail && !email) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Load Stripe checkout session URL whenever plan or email changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'checkout') return;

    let isMounted = true;
    const fetchSession = async () => {
      setIsGeneratingStripeUrl(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: 'all_encounters_pro',
            billingCycle: selectedCycle,
            email: email.trim() || undefined
          })
        });
        const data = await res.json();
        if (isMounted && data.success && data.checkoutUrl) {
          setHostedStripeUrl(data.checkoutUrl);
        } else if (isMounted && data.error) {
          setErrorMessage(data.error);
        }
      } catch (e: any) {
        if (isMounted) {
          console.warn('Stripe checkout session notice:', e);
        }
      } finally {
        if (isMounted) setIsGeneratingStripeUrl(false);
      }
    };

    fetchSession();
    return () => { isMounted = false; };
  }, [isOpen, selectedCycle, email, activeTab]);

  if (!isOpen) return null;

  // Plan pricing computations
  const isMonthly = selectedCycle === 'monthly';
  const planPriceDisplay = isMonthly ? '$3.99/mo' : '$25.99/yr';
  const trialText = isMonthly 
    ? '30-Day Free Trial ($0.00 Due Today)' 
    : 'Immediate Annual Coverage ($25.99 Due Today)';
  const billedCycleText = isMonthly
    ? 'Auto-bills $3.99/month on Day 30 unless canceled. Cancel anytime with 1 tap.'
    : 'Immediate annual activation. Auto-bills $25.99/year until canceled.';
  const policePledge = isMonthly ? '$0.20' : '$1.30';

  const handleLaunchStripeCheckout = () => {
    if (hostedStripeUrl) {
      window.location.href = hostedStripeUrl;
    } else {
      setErrorMessage('Generating your secure Stripe checkout session. Please tap again in 1 second.');
    }
  };

  const handleCopyStripeLink = () => {
    if (!hostedStripeUrl) return;
    navigator.clipboard.writeText(hostedStripeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenCustomerBillingPortal = async () => {
    const targetEmail = (email || userEmail || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Please enter the customer email address used during your Stripe checkout.');
      return;
    }

    setIsLocatingCustomer(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Could not find an active Stripe billing customer with this email.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Stripe Customer Portal unavailable for this account.');
    } finally {
      setIsLocatingCustomer(false);
    }
  };

  return (
    <div 
      id="live-stripe-subscription-portal-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-zinc-100">
        
        {/* Header with Verified Stripe Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Portal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              OFFICIAL STRIPE PORTAL
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700">
              Live Merchant Connected
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Police SafeGuard Pro
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md">
                100% of payments route directly through official Stripe PCI Level 1 encrypted checkout. Zero raw card data is ever collected or stored on our servers.
              </p>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-zinc-700/80 hidden sm:flex items-center justify-center shrink-0">
              <StripeLogoSvg className="w-16 h-7 text-[#635BFF]" />
            </div>
          </div>
        </div>

        {/* Tab Toggle: Checkout vs Existing Customer Portal */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('checkout')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'checkout'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Subscribe via Stripe</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customer_portal')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'customer_portal'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Manage Existing Plan</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* TAB 1: STRIPE HOSTED CHECKOUT */}
          {activeTab === 'checkout' && (
            <div className="space-y-5">
              
              {/* PLAN SELECTOR (Monthly $3.99 vs Annual $25.99) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Select Subscription Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Monthly Option ($3.99/mo) */}
                  <div
                    onClick={() => setSelectedCycle('monthly')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      selectedCycle === 'monthly'
                        ? 'bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-white">Monthly Pro</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          $3.99/mo
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300 font-medium">
                        30-Day Free Trial included.
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        $0.00 charged today. Auto-bills $3.99/mo starting on day 30.
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Cancel anytime</span>
                      {selectedCycle === 'monthly' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Annual Option ($25.99/yr) */}
                  <div
                    onClick={() => setSelectedCycle('yearly')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      selectedCycle === 'yearly'
                        ? 'bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-900 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                      Save 45% vs Monthly
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-white">Annual Pro</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          $25.99/yr
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-300 font-medium">
                        Immediate 1-Year Coverage.
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">
                        Charged $25.99 today. Auto-renews annually at $25.99/yr until canceled.
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Best Value</span>
                      {selectedCycle === 'yearly' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* PROMO CODE CALLOUT */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Have a Promo Code?</div>
                    <div className="text-[10px] text-zinc-400">Enter your promotional or access code to apply it to your account.</div>
                  </div>
                </div>
                {onOpenPromoModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPromoModal();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-[11px] cursor-pointer shrink-0 transition-colors"
                  >
                    Enter Code
                  </button>
                )}
              </div>

              {/* CUSTOMER EMAIL INPUT */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Customer Email for Receipt &amp; Account</span>
                  <span className="text-[10px] text-zinc-500">Auto-filled</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* ERROR ALERT */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* OFFICIAL STRIPE CHECKOUT CTA CARD */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 space-y-4">
                
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="text-sm font-black text-white">{trialText}</div>
                    <div className="text-[11px] text-zinc-400">{billedCycleText}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-amber-400 font-mono">{planPriceDisplay}</div>
                    <div className="text-[10px] text-emerald-400 font-bold">Official Stripe Routing</div>
                  </div>
                </div>

                <div className="text-xs text-zinc-300">
                  Click below to open the official, secure <strong>Stripe Checkout page</strong>. Seamlessly pay with Apple Pay, Google Pay, Credit/Debit Cards, Cash App, or Link:
                </div>

                {/* Main Launch Button */}
                <button
                  type="button"
                  onClick={handleLaunchStripeCheckout}
                  disabled={isGeneratingStripeUrl}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#635BFF] hover:bg-[#5851ea] text-white font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>
                    {isGeneratingStripeUrl 
                      ? 'Connecting to Stripe Gateway...' 
                      : `Launch Official Stripe Checkout (${planPriceDisplay})`}
                  </span>
                </button>

                {/* Secondary: Copy Direct Link */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyStripeLink}
                    disabled={!hostedStripeUrl}
                    className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Stripe Link'}</span>
                  </button>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    TLS 1.3 256-Bit Encrypted
                  </span>
                </div>

              </div>

              {/* Community Pledge Banner (Honest Police Wellness) */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-300">
                <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block">Transparent 5% Police Charity Pledge</span>
                  <span className="text-[11px] text-zinc-400">
                    5% ({policePledge}) of your subscription is automatically donated to verified 501(c)(3) charities supporting honest law enforcement training and officer wellness.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STRIPE CUSTOMER SELF-SERVICE PORTAL */}
          {activeTab === 'customer_portal' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Stripe Customer Billing Portal</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Active subscribers can log in directly through Stripe to update payment cards, modify subscription frequency, or download PDF tax invoices.
                </p>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] font-bold uppercase text-zinc-400 block">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleOpenCustomerBillingPortal}
                  disabled={isLocatingCustomer}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                  <span>{isLocatingCustomer ? 'Locating Customer on Stripe...' : 'Open Stripe Customer Portal'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stripe PCI Level 1 Certified • Zero Card Data Stored Locally</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
