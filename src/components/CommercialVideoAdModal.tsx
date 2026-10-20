import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, X, Shield, ExternalLink, 
  Sparkles, CheckCircle2, DollarSign, Clock, ArrowRight, Video
} from 'lucide-react';
import { AdRevenueService, HIGH_PAYING_ADS, HighValueAdUnit } from '../services/adRevenueService';

interface CommercialVideoAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'signout' | 'legal_qa' | 'simulation_question' | 'general';
  onAdFinished?: () => void;
}

export const CommercialVideoAdModal: React.FC<CommercialVideoAdModalProps> = ({
  isOpen,
  onClose,
  reason = 'general',
  onAdFinished
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<any>(null);

  const activeAd: HighValueAdUnit = HIGH_PAYING_ADS[currentAdIndex % HIGH_PAYING_ADS.length];

  useEffect(() => {
    if (!isOpen) return;

    // Pick random high value ad
    const randIdx = Math.floor(Math.random() * HIGH_PAYING_ADS.length);
    setCurrentAdIndex(randIdx);
    setSecondsRemaining(5);
    setCanSkip(false);
    setIsPlaying(true);

    // Record impression in background
    fetch('/api/ads/record-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adType: 'commercial_video',
        adId: HIGH_PAYING_ADS[randIdx].id,
        eCPM: 145.00
      })
    }).catch(() => {});

    AdRevenueService.recordImpression(HIGH_PAYING_ADS[randIdx].id);

    // 5-second countdown timer
    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinishOrSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
    if (onAdFinished) onAdFinished();
  };

  const getReasonLabel = () => {
    if (reason === 'signout') return 'Account Sign Out Commercial Sponsor';
    if (reason === 'legal_qa') return 'Sponsored Legal Inquiry Answer';
    if (reason === 'simulation_question') return 'Encounter Simulation Sponsor';
    return 'High-Yield Programmatic Video Commercial';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none">
      <div 
        className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col relative text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-300 uppercase tracking-wider truncate">
              {getReasonLabel()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Skip Button (active after countdown) */}
            {canSkip ? (
              <button
                onClick={handleFinishOrSkip}
                className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="px-2.5 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                <span>Skip in {secondsRemaining}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Commercial Canvas / Cinematic Player */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 overflow-hidden flex items-center justify-center">
          {/* Background Ambient Picture */}
          <div 
            className="absolute inset-0 opacity-40 bg-cover bg-center transition-all duration-700 scale-105"
            style={{
              backgroundImage: `radial-gradient(circle at center, rgba(15,23,42,0.6) 0%, rgba(0,0,0,0.95) 100%), url('/images/jurisdiction_legal_hall_1790279184263.jpg')`
            }}
          />

          {/* Animated Video Commercial Center Card */}
          <div className="relative z-10 p-6 text-center max-w-md mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeAd.sponsorCategory}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
              {activeAd.headline}
            </h3>

            <p className="text-xs sm:text-sm text-amber-200/90 font-medium leading-relaxed drop-shadow">
              {activeAd.subheadline}
            </p>

            {/* Video Progress Bar */}
            <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden mt-4 border border-zinc-700/50">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Video Controls Overlay */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 z-20">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono">
              <Video className="w-3 h-3 text-amber-400" />
              <span>COMMERCIAL BROADCAST • 1080P HD</span>
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white border border-white/10 cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Commercial Details & Call to Action Body */}
        <div className="p-4 sm:p-5 bg-zinc-950 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeAd.sponsorName}</span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {activeAd.copy}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-800">
            <a
              href={activeAd.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>{activeAd.callToAction}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-500 block">
                {activeAd.adBadging}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
