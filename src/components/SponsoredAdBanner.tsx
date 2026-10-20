import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, ShieldCheck, ArrowRight, X, Volume2, Info, Star, DollarSign, Award } from 'lucide-react';
import { HIGH_PAYING_ADS, AdRevenueService, HighValueAdUnit } from '../services/adRevenueService';

interface SponsoredAdBannerProps {
  isPaid: boolean;
  onUpgradePrompt?: () => void;
  variant?: 'card' | 'inline' | 'compact';
  contextTag?: string;
}

export const SponsoredAdBanner: React.FC<SponsoredAdBannerProps> = ({
  isPaid,
  onUpgradePrompt,
  variant = 'card',
  contextTag = 'What-If Legal Scenario Result'
}) => {
  // If user has a paid subscription, ZERO ads are displayed
  if (isPaid) {
    return null;
  }

  const [adIndex, setAdIndex] = useState(0);
  const currentAd: HighValueAdUnit = HIGH_PAYING_ADS[adIndex % HIGH_PAYING_ADS.length];

  useEffect(() => {
    AdRevenueService.recordImpression(currentAd.id);
  }, [currentAd.id]);

  const handleNextAd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdIndex(prev => (prev + 1) % HIGH_PAYING_ADS.length);
  };

  const handleAdClick = () => {
    // Open target search/sponsor in a safe manner
    const link = document.createElement('a');
    link.href = currentAd.targetUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (variant === 'compact') {
    return (
      <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-3 text-xs space-y-2 shadow-md">
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="font-mono uppercase font-black text-amber-400 tracking-wider">
              HIGH-YIELD SPONSOR
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono">{currentAd.network}</span>
          </div>
          {onUpgradePrompt && (
            <button
              onClick={onUpgradePrompt}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Go Ad-Free ($14.99/mo)
            </button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <div className="font-bold text-white text-xs truncate">{currentAd.headline}</div>
            <div className="text-[11px] text-zinc-300 truncate">{currentAd.subheadline}</div>
          </div>
          <button
            onClick={handleAdClick}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>{currentAd.callToAction}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/40 hover:border-amber-400/60 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all relative overflow-hidden group">
      {/* Background ambient glow for premium sponsor visibility */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* Top Banner Tag & Ad Disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5 mb-3.5 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-500/50 text-[10px] font-mono font-black text-amber-300 tracking-wider uppercase flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>TOP-TIER SPONSORED ADVERTISEMENT</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
            • {currentAd.network}
          </span>
        </div>

        {/* Remove Ads Upgrade Button */}
        {onUpgradePrompt && (
          <button
            type="button"
            onClick={onUpgradePrompt}
            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/20 hover:from-amber-500/30 hover:to-amber-400/30 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
            title="Upgrade to Pro for a 100% ad-free experience across the entire app"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Go Ad-Free with Pro ($14.99/mo)</span>
          </button>
        )}
      </div>

      {/* Sponsor Content Body */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wide text-white group-hover:text-amber-300 transition-colors">
              {currentAd.sponsorName}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800/90 text-[9px] font-mono font-bold text-amber-400 border border-zinc-700 uppercase">
              {currentAd.sponsorCategory}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold hidden lg:inline">
              {currentAd.payoutRating}
            </span>
          </div>

          <h5 className="text-sm font-extrabold text-amber-200 leading-snug">
            {currentAd.headline}
          </h5>

          <p className="text-xs font-semibold text-zinc-300">
            {currentAd.subheadline}
          </p>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
            {currentAd.copy}
          </p>

          <div className="text-[10px] text-zinc-500 font-mono pt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{currentAd.adBadging}</span>
          </div>
        </div>

        {/* Action Button & Next Ad Control */}
        <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleAdClick}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer active:scale-95 transition-all"
          >
            <span>{currentAd.callToAction}</span>
            <ExternalLink className="w-4 h-4 text-black" />
          </button>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-[10px] text-zinc-500 font-mono">
            <button
              type="button"
              onClick={handleNextAd}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Rotate Sponsor ({((adIndex + 1) % HIGH_PAYING_ADS.length) + 1}/{HIGH_PAYING_ADS.length}) →
            </button>
            {onUpgradePrompt && (
              <button
                type="button"
                onClick={onUpgradePrompt}
                className="text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
              >
                Hide Ads
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
