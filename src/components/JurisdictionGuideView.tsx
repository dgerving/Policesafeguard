import React, { useState } from 'react';
import { 
  MapPin, Scale, Search, ShieldCheck, AlertCircle, 
  BookOpen, CheckCircle, XCircle, Info, ExternalLink,
  Navigation, RefreshCw, CheckCircle2, HelpCircle, Sparkles,
  ArrowRight, ShieldAlert, ChevronDown, ChevronUp, Volume2,
  DollarSign, Lock, Play
} from 'lucide-react';
import { JURISDICTIONS, US_STATE_LIST } from '../data/jurisdictions';
import { JurisdictionLaw, UserProfile } from '../types';
import { GpsJurisdictionService, GpsLocationResult } from '../services/gpsJurisdictionService';
import { CommercialVideoAdModal } from './CommercialVideoAdModal';

interface JurisdictionGuideViewProps {
  currentJurisdiction: JurisdictionLaw;
  onSelectJurisdiction: (law: JurisdictionLaw) => void;
  onAutoDetectGps?: () => void;
  userProfile?: UserProfile;
  onOpenSubscriptionModal?: () => void;
}

interface LiveWebSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

interface LegalQAResult {
  isLegalForPolice: boolean;
  verdict: string;
  citation: string;
  statuteOrCase: string;
  detailedExplanation: string;
  simplifiedExplanation: string;
  rightsPreservationAdvice: string;
  question: string;
  sourcesConsulted?: string[];
  liveWebSources?: LiveWebSource[];
  isLiveWebGrounded?: boolean;
}

export const JurisdictionGuideView: React.FC<JurisdictionGuideViewProps> = ({
  currentJurisdiction,
  onSelectJurisdiction,
  onAutoDetectGps,
  userProfile,
  onOpenSubscriptionModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsLocationResult, setGpsLocationResult] = useState<GpsLocationResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Custom Situation Inquiry State
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [qaResult, setQaResult] = useState<LegalQAResult | null>(null);
  const [isSimplifiedMode, setIsSimplifiedMode] = useState(true);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [pendingQuestionToExecute, setPendingQuestionToExecute] = useState<string | null>(null);

  const isPaid = userProfile?.membershipTier === 'all_encounters_pro' || 
                 userProfile?.membershipTier === 'lifetime_pro' || 
                 userProfile?.membershipTier === 'paid';

  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsError(null);
    try {
      const res = await GpsJurisdictionService.detectPreciseJurisdiction();
      setGpsLocationResult(res);
      if (res.jurisdiction) {
        onSelectJurisdiction(res.jurisdiction);
      }
    } catch (err: any) {
      console.warn('GPS detection failed:', err);
      setGpsError(err?.message || 'Could not acquire precise GPS fix. Please verify location permissions.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const executeQuestionAnalysis = async (q: string) => {
    setIsLoadingQA(true);
    try {
      const res = await fetch('/api/legal/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          stateCode: currentJurisdiction.stateCode,
          stateName: currentJurisdiction.stateName
        })
      });
      const data = await res.json();
      if (data.verdict) {
        setQaResult(data);
      }
    } catch (err) {
      console.warn('Legal analysis query failed:', err);
    } finally {
      setIsLoadingQA(false);
      setPendingQuestionToExecute(null);
    }
  };

  const handleAskQuestion = (qToAsk?: string) => {
    const q = (qToAsk || customQuestion).trim();
    if (!q) return;

    // High-paying video advertisement interstitial triggered specifically after searching for legal advice
    if (!isPaid) {
      setPendingQuestionToExecute(q);
      setIsAdModalOpen(true);
      return;
    }

    executeQuestionAnalysis(q);
  };

  const handleAdFinished = () => {
    setIsAdModalOpen(false);
    if (pendingQuestionToExecute) {
      executeQuestionAnalysis(pendingQuestionToExecute);
    }
  };

  const quickQuestions = [
    'Can police search my locked glove box or trunk without a warrant?',
    'Do I have to step out of the vehicle if the officer orders me to?',
    'Can police force me to give my phone passcode or unlock my phone?',
    'Can an officer order me to stop recording or delete my video footage?',
    'Does a passenger have to provide ID during a routine traffic stop in this state?'
  ];

  const jurisdictionList = Object.values(JURISDICTIONS);
  const filtered = jurisdictionList.filter(j => 
    j.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.stateCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="jurisdiction-guide-container" className="flex flex-col h-full bg-zinc-950/70 text-zinc-100 overflow-y-auto">
      {/* Header with Justice Hall Architectural Backdrop */}
      <div 
        className="relative border-b border-zinc-800 p-5 sm:p-6 overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(9, 10, 15, 0.96) 0%, rgba(20, 18, 25, 0.88) 50%, rgba(9, 10, 15, 0.97) 100%), url('/images/jurisdiction_legal_hall_1790279184263.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                POLICE SAFEGUARD: JURISDICTION REPOSITORY
              </h2>
              <span className="text-[10px] font-bold bg-zinc-900/90 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
                50 STATES &amp; FEDERAL LAW
              </span>
            </div>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              Verified statutory codes and landmark Supreme Court decisions governing traffic stops, police recording, stop-and-identify mandates, and roadside searches.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search state (e.g. Texas, CA)..."
              className="w-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-amber-500 shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1 space-y-6">
        
        {/* SECTION 1: CUSTOM SITUATION LEGALITY INQUIRY (User Requested Feature) */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-850 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                  <span>Is This Legal? Ask Custom Situation</span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Web Research Active
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Ask any scenario in <strong className="text-amber-400">{currentJurisdiction.stateName}</strong>. Connected to the internet searching credible legal databases (Cornell Law, Justia, State Statutes).
                </p>
              </div>
            </div>

            {!isPaid && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ad-Supported (Free Tier)</span>
              </div>
            )}
          </div>

          {/* Question Input Box */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskQuestion();
                }}
                placeholder="Ask any situation (e.g., 'Can police search my locked glove box without a warrant?')..."
                className="w-full bg-zinc-950/90 border border-zinc-700 rounded-2xl pl-4 pr-32 py-3.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleAskQuestion()}
                disabled={isLoadingQA || !customQuestion.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                {isLoadingQA ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Law</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Scenario Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-zinc-400 mr-1">Frequent Situations:</span>
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCustomQuestion(q);
                    handleAskQuestion(q);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-[11px] transition-all cursor-pointer text-left truncate max-w-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Internet Legal Research Progress Banner */}
          {isLoadingQA && (
            <div className="mt-5 p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-emerald-500/10 border-2 border-amber-500/60 shadow-xl space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shrink-0 shadow-md">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Connecting to Internet &amp; Researching Credible Legal Sources...
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Querying Cornell Law School Legal Information Institute, Justia Supreme Court Center, FindLaw, and official {currentJurisdiction.stateName} statutes.
                  </p>
                </div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-1.5 rounded-full w-3/4 animate-pulse" />
              </div>
            </div>
          )}

          {/* Legal Answer Card & Simplified Breakdown */}
          {qaResult && !isLoadingQA && (
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-700/80 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    qaResult.isLegalForPolice
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-red-500/20 text-red-300 border border-red-500/50'
                  }`}>
                    {qaResult.verdict}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Jurisdiction: {currentJurisdiction.stateName} ({currentJurisdiction.stateCode})
                  </span>
                </div>

                {/* Simplify Explanation Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSimplifiedMode(!isSimplifiedMode)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSimplifiedMode
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                  title="Switch between simplified plain English explanation and complete statutory code"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSimplifiedMode ? 'Simplified (Plain English) Active' : 'Switch to Simplified Explanation'}</span>
                </button>
              </div>

              {/* Binding Citation Pill */}
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 px-3 py-2 rounded-xl">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Statute &amp; Precedent: {qaResult.citation}</span>
              </div>

              {/* Explanation Body */}
              {isSimplifiedMode ? (
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Simplified Plain-English Explanation:</span>
                  </h4>
                  <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                    {qaResult.simplifiedExplanation}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Comprehensive Statutory &amp; Constitutional Analysis:
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {qaResult.statuteOrCase}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                    {qaResult.detailedExplanation}
                  </p>
                </div>
              )}

              {/* What to Say Out Loud */}
              <div className="bg-black/60 border border-amber-500/40 p-3.5 rounded-xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Exact Words to Say to Police to Preserve Your Rights:
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    &ldquo;{qaResult.rightsPreservationAdvice}&rdquo;
                  </p>
                </div>
              </div>

              {/* Live Web Sources with Clickable Credible Links */}
              {qaResult.liveWebSources && qaResult.liveWebSources.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Live Credible Sources Searched on the Internet:</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                      Internet Grounded
                    </span>
                  </div>
                  <div className="space-y-2">
                    {qaResult.liveWebSources.map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-900/80 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 truncate">
                            {source.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-amber-400 shrink-0 flex items-center gap-1">
                            <span>{source.domain}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                        {source.snippet && (
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {source.snippet}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ) : qaResult.sourcesConsulted && qaResult.sourcesConsulted.length > 0 ? (
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Credible Legal Authorities Consulted (Live Web Research):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {qaResult.sourcesConsulted.map((source, sIdx) => (
                      <span 
                        key={sIdx} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/90 text-[10px] text-zinc-300 font-medium border border-zinc-700/60"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* SECTION 2: ACTIVE GPS JURISDICTION FOCUS CARD */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-850 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">
                {currentJurisdiction.stateCode}
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                  ACTIVE GPS MONITORED JURISDICTION
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {currentJurisdiction.stateName}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-amber-500/20"
                title="Detect your exact state using precise GPS hardware coordinates"
              >
                <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Acquiring GPS Fix...' : 'Auto-Detect via GPS'}</span>
              </button>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentJurisdiction.stopAndIdentify 
                  ? 'bg-amber-950 border border-amber-600 text-amber-300' 
                  : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
              }`}>
                {currentJurisdiction.stopAndIdentify ? 'Stop-and-Identify State' : 'No General Stop-and-ID Duty'}
              </span>
            </div>
          </div>

          {/* Real-time GPS Location Status Banner */}
          {gpsLocationResult && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>GPS Fix Locked:</strong> {gpsLocationResult.stateName} ({gpsLocationResult.stateCode})
                  {gpsLocationResult.city ? ` • ${gpsLocationResult.city}` : ''}
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                {gpsLocationResult.latitude.toFixed(4)}°, {gpsLocationResult.longitude.toFixed(4)}° • ±{Math.round(gpsLocationResult.accuracyMeters)}m precision
              </div>
            </div>
          )}

          {gpsError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Key Legal Rule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Stop & ID Rule */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-zinc-200">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Stop &amp; Identify Statute:</span>
              </div>
              <p className="font-mono text-amber-300 text-[11px]">
                {currentJurisdiction.stopAndIdentifyStatute}
              </p>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {currentJurisdiction.stopAndIdentifySummary}
              </p>
            </div>

            {/* Police Recording Rule (1st Amendment) */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-zinc-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Right to Record Police &amp; Wiretap Law:</span>
              </div>
              <p className="font-mono text-emerald-300 text-[11px]">
                Audio Consent: {currentJurisdiction.wiretappingConsent.toUpperCase()}
              </p>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {currentJurisdiction.recordingPoliceNotes}
              </p>
            </div>

            {/* Passenger Rights Rule */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-zinc-200">
                <Scale className="w-4 h-4 text-blue-400" />
                <span>Passenger Identification Protections:</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {currentJurisdiction.passengerIdRequirement}
              </p>
            </div>

            {/* Roadside Sobriety & Breathalyzer */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-zinc-200">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Roadside Breath &amp; Sobriety Tests:</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {currentJurisdiction.preliminaryBreathTestRule}
              </p>
            </div>
          </div>

          {/* Statutory References */}
          <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-300">Statutory Citations:</span>
            {currentJurisdiction.relevantStatuteCodes.map((code, idx) => (
              <span key={idx} className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 font-mono text-[10px]">
                {code}
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 3: ALL JURISDICTIONS DIRECTORY */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Browse All 50 State Jurisdictions ({filtered.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((law) => (
              <button
                key={law.stateCode}
                onClick={() => onSelectJurisdiction(law)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  currentJurisdiction.stateCode === law.stateCode
                    ? 'bg-zinc-800 border-amber-500'
                    : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{law.stateName}</span>
                  <span className="font-mono text-xs text-amber-400 font-bold">{law.stateCode}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <span>{law.stopAndIdentify ? 'Stop-and-ID: YES' : 'Stop-and-ID: NO'}</span>
                  <span>•</span>
                  <span>Wiretap: {law.wiretappingConsent}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Commercial Video Ad Modal for free users between questions */}
      <CommercialVideoAdModal
        isOpen={isAdModalOpen}
        onClose={() => {
          setIsAdModalOpen(false);
          if (pendingQuestionToExecute) {
            executeQuestionAnalysis(pendingQuestionToExecute);
          }
        }}
        reason="legal_qa"
        onAdFinished={handleAdFinished}
      />
    </div>
  );
};
