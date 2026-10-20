import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Scale, HeartHandshake, DollarSign, Award, CheckCircle2, 
  Share2, Copy, ExternalLink, X, Heart, Users, Landmark, AlertCircle, 
  Sparkles, Check, ChevronRight, Lock, TrendingUp, HandCoins
} from 'lucide-react';
import { BailVaultService, BailVaultState } from '../services/bailVaultService';
import { UserProfile } from '../types';

interface BailReliefVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  referralCode?: string;
  onOpenSubscriptionModal?: () => void;
  onDirectDonateSuccess?: (amount: number) => void;
}

export const BailReliefVaultModal: React.FC<BailReliefVaultModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  referralCode,
  onOpenSubscriptionModal,
  onDirectDonateSuccess
}) => {
  const [vaultState, setVaultState] = useState<BailVaultState>(() => BailVaultService.getState());
  const [donationAmount, setDonationAmount] = useState<number>(25);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [donateSuccessMsg, setDonateSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVaultState(BailVaultService.getState());
      setDonateSuccessMsg(null);
      BailVaultService.syncWithServer().then(setVaultState).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSubscriber = userProfile.membershipTier !== 'free';
  const effectiveRefCode = referralCode || userProfile.referralCode || 'DEFENSE';
  const promotionalShareUrl = BailVaultService.getPromotionalShareUrl(effectiveRefCode);

  const goalPercent = Math.min(100, Math.round((vaultState.totalVaultBalance / vaultState.donationCycleGoal) * 100));

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(promotionalShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleExecuteDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubscriber) {
      if (onOpenSubscriptionModal) {
        onClose();
        onOpenSubscriptionModal();
      }
      return;
    }

    const finalAmount = isCustom ? parseFloat(customAmountStr) : donationAmount;
    if (isNaN(finalAmount) || finalAmount < 1) {
      return;
    }

    setIsDonating(true);
    try {
      // Record donation in service
      const updated = BailVaultService.recordDirectDonation(finalAmount, userProfile.name);
      setVaultState(updated);
      setDonateSuccessMsg(`Thank you! Your contribution of $${finalAmount.toFixed(2)} was deposited into the Bail Relief Vault.`);
      if (onDirectDonateSuccess) {
        onDirectDonateSuccess(finalAmount);
      }
    } catch (err) {
      console.error('Donation error:', err);
    } finally {
      setIsDonating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[115] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-black overflow-hidden ring-1 ring-amber-400/30">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-zinc-950 to-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  DUAL 5% PLEDGE &amp; BAIL RELIEF VAULT
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">CYCLE #{vaultState.cycleNumber}</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
                WRONGFUL ACCUSATION &amp; BAIL RELIEF VAULT
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-zinc-300 space-y-5 leading-relaxed font-sans scroll-smooth">
          
          {/* Vault Balance & Goal Progress Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-900/90 to-zinc-950 border-2 border-amber-500/40 text-zinc-200 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Current Vault Balance</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5 flex items-baseline gap-2">
                  <span>${vaultState.totalVaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs text-zinc-400 font-normal">/ ${vaultState.donationCycleGoal.toLocaleString('en-US')} Goal</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Funded by 5% automatic purchase pledges + direct subscriber contributions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-black shadow">
                  {goalPercent}% GOAL MET
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {vaultState.subscriberContributionsCount} Contributors
                </span>
              </div>
            </div>

            {/* Visual Goal Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500 rounded-full"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>Cycle #{vaultState.cycleNumber} Progress</span>
                <span>${Math.max(0, vaultState.donationCycleGoal - vaultState.totalVaultBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })} Remaining to Target Goal</span>
              </div>
            </div>
          </div>

          {/* Dual 5% Pledges Explanation Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Our Two-Way Commitment: Balancing Rights &amp; Law Enforcement</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pillar 1: Honest Police Work */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-blue-300 text-xs uppercase">
                    <HeartHandshake className="w-4 h-4 text-blue-400" />
                    <span>5% Honest Police Work</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-600/40">5% PLEDGE</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  5% of all subscription and credit purchases is donated directly to reputable 501(c)(3) law enforcement charities supporting fallen officer families, youth outreach, and officer mental wellness.
                </p>
              </div>

              {/* Pillar 2: Bail Relief Vault */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-amber-300 text-xs uppercase">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>5% Wrongful Accusation Vault</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-600/40">5% PLEDGE</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  5% of all purchases is deposited directly into this separate Bail Relief Vault account to help out families of wrongfully accused or falsely imprisoned citizens.
                </p>
              </div>
            </div>
          </div>

          {/* Official Rules & Community Relief Mechanics */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>How the Bail Relief Vault Works &amp; Distribution Rules</span>
            </h3>

            <div className="space-y-2 text-[11px] text-zinc-300">
              <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                <div>
                  <strong className="text-white">Equal Protection &amp; Community Pledges:</strong> Subscribers can contribute any amount at any frequency. 100% of community contributions go directly toward pretrial relief, defense retainers, and bail bonds for wrongfully arrested citizens.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                <div>
                  <strong className="text-white">Cycle Goal ($10,000 Target):</strong> Once the community fund hits the target milestone, capital is allocated toward emergency legal defense counsel and verified bail relief partners to assist innocent citizens who cannot afford excessive bail.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                <div>
                  <strong className="text-white">Constitutional Defense Support:</strong> Funds specifically prioritize First Amendment audits, peaceful filming of police, unlawful search challenges, and unwarranted traffic stop detentions.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</div>
                <div>
                  <strong className="text-white">Audited Reserve Accounting:</strong> The vault balance is tracked in real-time, verifying every 5% transaction match with transparent ledger accounting.
                </div>
              </div>
            </div>
          </div>

          {/* Subscriber Direct Donation Panel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <HandCoins className="w-4 h-4 text-amber-400" />
                  <span>Contribute Directly to the Bail Relief Vault</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isSubscriber 
                    ? 'Subscribers can contribute any amount at any frequency to help reach the cycle goal.'
                    : 'Active subscribers can contribute additional funds anytime to help reach the cycle goal.'}
                </p>
              </div>

              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${
                isSubscriber 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {isSubscriber ? 'Subscriber Active' : 'Requires Subscription'}
              </span>
            </div>

            {donateSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{donateSuccessMsg}</span>
              </div>
            )}

            {isSubscriber ? (
              <form onSubmit={handleExecuteDonation} className="space-y-3">
                {/* Preset Amount Pills */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {[5, 15, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setDonationAmount(amt);
                        setIsCustom(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        !isCustom && donationAmount === amt
                          ? 'bg-amber-400 text-black border-amber-300 shadow-md font-black'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Field */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmountStr}
                    onChange={(e) => {
                      setCustomAmountStr(e.target.value);
                      setIsCustom(true);
                    }}
                    placeholder="Custom amount (e.g. $75)"
                    className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 flex-1 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isDonating}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950/50 cursor-pointer disabled:opacity-50"
                  >
                    <span>Deposit into Vault</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3">
                <div className="text-zinc-300 text-xs">
                  Subscribe to <strong>Police SafeGuard Pro ($14.99/mo)</strong> with a 30-day free trial to unlock direct vault contributions.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenSubscriptionModal) onOpenSubscriptionModal();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow"
                >
                  Start Free Trial
                </button>
              </div>
            )}
          </div>

          {/* Personal Referral Link to Promote Cause on Social Media */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Personal Social Media Referral Link
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">Code: {effectiveRefCode}</span>
            </div>

            <p className="text-zinc-300 text-[11px] leading-relaxed">
              Share your personal link to promote the Bail Relief Vault on social media. 5% of every new subscriber who signs up with your link goes into the vault to free innocent citizens!
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={promotionalShareUrl}
                className="bg-black/60 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] font-mono text-amber-300 flex-1 select-all"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[10px] text-zinc-500 font-mono">
            5% Honest Police Work • 5% Bail Relief Vault • Zero Influence on Winner Selection
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
