import React, { useState } from 'react';
import { 
  Gift, Users, Sparkles, Check, Copy, Share2, ArrowRight, 
  ShieldCheck, CheckCircle2, Star, Zap, Infinity as InfinityIcon, 
  Calendar, Flame, Trophy, ExternalLink, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { ReferralService } from '../services/referralService';
import { ReferralRewardTier, ReferralProgramState } from '../types';

interface ReferralProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (tier: ReferralRewardTier) => void;
}

export const ReferralProgramModal: React.FC<ReferralProgramModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [referralState, setReferralState] = useState<ReferralProgramState>(() => 
    ReferralService.getReferralState()
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'ledger'>('rewards');

  if (!isOpen) return null;

  const stats = ReferralService.getReferralStats(referralState);
  const shareUrl = ReferralService.getShareUrl(referralState.referralCode);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralState.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleShareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Police SafeGuard: AI Rights & Encounter Guide',
        text: `Get real-time constitutional rights guidance, speech translation, and certified evidence recording during police stops. Use my referral code: ${referralState.referralCode}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleClaim = (tier: ReferralRewardTier) => {
    const result = ReferralService.claimReward(tier);
    setReferralState(result.state);
    setClaimFeedback(result.message);
    if (result.success) {
      onRewardClaimed(tier);
    }
    setTimeout(() => setClaimFeedback(null), 5000);
  };

  return (
    <div id="referral-program-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl overflow-hidden text-zinc-100 my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-900 border-b border-zinc-800 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/60 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Gift className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                    Civilian Referral Rewards
                  </h2>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    100% Free Premium
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Refer friends &amp; family to earn a completely Free Premium Subscription to Police SafeGuard
                </p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-zinc-950/80 border border-zinc-800 rounded-2xl p-2.5 px-4">
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Total Referrals</div>
                <div className="text-lg font-black text-amber-400">{stats.totalReferrals}</div>
              </div>
              <div className="w-px h-7 bg-zinc-800" />
              <div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase">Verified Buyers</div>
                <div className="text-lg font-black text-emerald-400">{stats.verifiedCount}</div>
              </div>
            </div>
          </div>

          {/* Referral Link & Code Bar with Working Web URL */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-zinc-400 font-semibold shrink-0">Your Referral Code:</span>
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-amber-300">
                  <span>{referralState.referralCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="hover:text-white cursor-pointer ml-1 p-0.5"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-zinc-700"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Working Link'}</span>
                </button>

                <button
                  onClick={handleShareNative}
                  className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share with Friends</span>
                </button>
              </div>
            </div>

            {/* Direct working web URL preview */}
            <div className="p-2 px-3 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Live Web URL
                </span>
                <span className="text-zinc-300 font-mono truncate select-all">
                  {shareUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-amber-400 hover:text-amber-300 font-bold text-[10px] uppercase shrink-0 cursor-pointer ml-2"
              >
                {copiedLink ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Feedback message banner */}
          {claimFeedback && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{claimFeedback}</span>
            </div>
          )}

          {/* Real Live Account Status Indicator */}
          <div className="mt-3 p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Real Live Referral Program:</strong> Share your official link. When friends enroll, they count automatically toward your Free Monthly, Yearly, and Lifetime defense passes.
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rewards'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Reward Tiers (Monthly, Yearly, Lifetime)</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Referrals Roster ({referralState.referrals.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[62vh] space-y-5 text-xs flex-1">
          
          {/* TAB 1: REWARD TIERS */}
          {activeTab === 'rewards' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Program Rule Explainer Banner */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-zinc-200 text-xs">
                    Equal or Greater Value Rule:
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Refer friends who purchase a subscription of equal or greater value than your desired reward tier. 
                    Refer <strong>10 people</strong> for Free Monthly or Yearly, or <strong>20 people</strong> for Free Lifetime Access!
                  </p>
                </div>
              </div>

              {/* The 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                {/* 1. Monthly Reward Card */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  stats.monthly.isClaimed
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : stats.monthly.canClaim
                    ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/50'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Tier 1 • 10 Referrals
                      </span>
                      {stats.monthly.isClaimed ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-black">
                          CLAIMED
                        </span>
                      ) : stats.monthly.canClaim ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-black animate-pulse">
                          READY TO CLAIM
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="font-black text-white text-base">Free Monthly Premium</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Free All-Encounters Universal Defense ($3.99/mo value)
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-400">Progress:</span>
                        <span className="text-white font-mono">{stats.monthly.count} / {stats.monthly.target} ({stats.monthly.percent}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${stats.monthly.percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
                      <div className="font-semibold text-zinc-300">Qualifying Referral Purchases:</div>
                      <div className="text-zinc-400">{stats.monthly.qualifyingPlans}</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    {stats.monthly.isClaimed ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Claimed on Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaim('monthly')}
                        disabled={!stats.monthly.canClaim}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          stats.monthly.canClaim
                            ? 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-amber-500/20 active:scale-95'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{stats.monthly.canClaim ? 'Claim Free Monthly' : `Need ${stats.monthly.target - stats.monthly.count} More`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Yearly Reward Card */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  stats.yearly.isClaimed
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : stats.yearly.canClaim
                    ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/50'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Tier 2 • 10 Referrals
                      </span>
                      {stats.yearly.isClaimed ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-black">
                          CLAIMED
                        </span>
                      ) : stats.yearly.canClaim ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-black animate-pulse">
                          READY TO CLAIM
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="font-black text-white text-base">Free Yearly Premium</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Free 1-Year All-Encounters License ($25.99/yr value)
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-400">Progress:</span>
                        <span className="text-white font-mono">{stats.yearly.count} / {stats.yearly.target} ({stats.yearly.percent}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${stats.yearly.percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
                      <div className="font-semibold text-zinc-300">Qualifying Referral Purchases:</div>
                      <div className="text-zinc-400">{stats.yearly.qualifyingPlans}</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    {stats.yearly.isClaimed ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Claimed on Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaim('yearly')}
                        disabled={!stats.yearly.canClaim}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          stats.yearly.canClaim
                            ? 'bg-amber-400 hover:bg-amber-300 text-black cursor-pointer shadow-amber-500/20 active:scale-95'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{stats.yearly.canClaim ? 'Claim Free Yearly' : `Need ${stats.yearly.target - stats.yearly.count} More`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Lifetime Reward Card */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  stats.lifetime.isClaimed
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : stats.lifetime.canClaim
                    ? 'bg-emerald-500/10 border-emerald-400 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                    : 'bg-zinc-950 border-zinc-800'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Tier 3 • 20 Referrals
                      </span>
                      {stats.lifetime.isClaimed ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-black">
                          CLAIMED
                        </span>
                      ) : stats.lifetime.canClaim ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-400 text-black animate-pulse">
                          READY TO CLAIM
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="font-black text-white text-base flex items-center gap-1.5">
                        <InfinityIcon className="w-4 h-4 text-emerald-400" />
                        <span>Free Lifetime Access</span>
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Lifetime Unlimited Constitutional Protection ($79.99 value)
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-zinc-400">Progress (20 Required):</span>
                        <span className="text-white font-mono">{stats.lifetime.count} / {stats.lifetime.target} ({stats.lifetime.percent}%)</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${stats.lifetime.percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400 space-y-1 pt-2 border-t border-zinc-800">
                      <div className="font-semibold text-zinc-300">Qualifying Referral Purchases:</div>
                      <div className="text-zinc-400">{stats.lifetime.qualifyingPlans}</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    {stats.lifetime.isClaimed ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Claimed on Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaim('lifetime')}
                        disabled={!stats.lifetime.canClaim}
                        className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          stats.lifetime.canClaim
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-black cursor-pointer shadow-emerald-500/30 active:scale-95'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                        }`}
                      >
                        <InfinityIcon className="w-3.5 h-3.5" />
                        <span>{stats.lifetime.canClaim ? 'Claim Free Lifetime' : `Need ${stats.lifetime.target - stats.lifetime.count} More`}</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Bottom How It Works */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                <div className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Referral Program Rules &amp; Transparency:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-zinc-400">
                  <li className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                    <strong className="text-white block mb-0.5">1. Share Your Code</strong>
                    Friends enter your link when downloading or signing up for Police SafeGuard.
                  </li>
                  <li className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                    <strong className="text-white block mb-0.5">2. Verified Purchases</strong>
                    When they purchase any eligible subscription, your progress bar increments automatically.
                  </li>
                  <li className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
                    <strong className="text-white block mb-0.5">3. Instant 100% Free Access</strong>
                    Click Claim anytime you hit the quota. Your account receives full Pro privileges with zero billing.
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: REFERRALS ROSTER / LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Your Referral Network History</h3>
                  <p className="text-[11px] text-zinc-400">Chronological ledger of friends who joined using your invite code</p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {referralState.referrals.length} Total Users
                </span>
              </div>

              {referralState.referrals.length === 0 ? (
                <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h4 className="text-base font-bold text-white">No Referrals Yet — Ready for Real Citizens</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Share your personal invite link with friends, family, or colleagues. When they download the app and activate any subscription with code <strong className="text-amber-300 font-mono">{referralState.referralCode}</strong>, they will instantly appear here with verified proof!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Invite Link</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {referralState.referrals.map((ref) => {
                    const dateStr = new Date(ref.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    const badgeColor = 
                      ref.planPurchased === 'lifetime' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      ref.planPurchased === 'yearly' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      ref.planPurchased === 'monthly' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700';

                    return (
                      <div key={ref.id} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-200">
                            {ref.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{ref.name}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                {ref.planPurchased.toUpperCase()} (${ref.amount.toFixed(2)})
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              {ref.maskedEmail} • {dateStr}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified Purchase</span>
                          </span>
                          <span className="text-[9px] text-zinc-500 block">
                            Qualifies: {ref.planPurchased === 'lifetime' ? 'Monthly, Yearly, Lifetime' : ref.planPurchased === 'yearly' ? 'Monthly, Yearly' : 'Monthly'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>Referrals never expire. Multiple reward tiers can be earned!</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
