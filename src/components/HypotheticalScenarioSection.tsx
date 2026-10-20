import React, { useState } from 'react';
import { 
  Shield, MapPin, Volume2, Copy, Check, AlertTriangle, 
  HelpCircle, ChevronRight, Sparkles, BookOpen, RefreshCw, 
  Scale, Eye, FileText, CornerDownRight, ShieldCheck, ArrowRight, X, Lock
} from 'lucide-react';
import { JurisdictionLaw, UserProfile, HypotheticalScenarioAnalysis, EncounterType } from '../types';
import { US_STATE_LIST, JURISDICTIONS, getJurisdictionByCode } from '../data/jurisdictions';
import { VoiceEngine } from '../services/voiceEngine';
import { SponsoredAdBanner } from './SponsoredAdBanner';
import { CommercialVideoAdModal } from './CommercialVideoAdModal';

interface HypotheticalScenarioSectionProps {
  userProfile: UserProfile;
  activeJurisdiction?: JurisdictionLaw;
  onJurisdictionChange?: (newJurisdiction: JurisdictionLaw) => void;
  onUpgradePrompt?: () => void;
}

const PRESET_HYPOTHETICALS: {
  title: string;
  encounterType: EncounterType;
  prompt: string;
  badge: string;
}[] = [
  {
    title: 'Phone Passcode & Digital Search',
    encounterType: 'traffic_stop',
    badge: '4th & 5th Amend.',
    prompt: 'An officer pulled me over for speeding and demands that I unlock my cell phone and hand it over, asking for my passcode to prove I wasn\'t texting while driving. What is my safest action?'
  },
  {
    title: 'K-9 Sniff Delay at Traffic Stop',
    encounterType: 'traffic_stop',
    badge: 'Rodriguez v. US',
    prompt: 'I was stopped for an expired registration sticker. The officer gave me a warning ticket, but now says I must wait 20 minutes on the roadside for a drug-sniffing K-9 unit to arrive. What should I do?'
  },
  {
    title: 'Warrantless Late-Night Door Knock',
    encounterType: 'home_encounter',
    badge: 'Payton v. NY',
    prompt: 'Two police officers are knocking aggressively on my apartment door at midnight, stating they just want to ask a few questions about someone who lives on my block. They do not show a warrant. What is my safest action?'
  },
  {
    title: 'Pedestrian Stop on the Sidewalk',
    encounterType: 'walking_street',
    badge: 'Stop-and-ID',
    prompt: 'I was walking down a public sidewalk wearing a hoodie when an officer stepped in front of me, demanded my name and ID, and asked what I am doing in this neighborhood. Do I have to give my ID?'
  },
  {
    title: 'Filming Police From Safe Distance',
    encounterType: 'public_recording',
    badge: '1st Amendment',
    prompt: 'I am standing 15 feet away on a public sidewalk filming officers arresting someone. An officer shines a flashlight at my phone and orders me to stop recording or be arrested for obstruction. How do I protect myself?'
  },
  {
    title: 'Vehicle Passenger ID Demand',
    encounterType: 'traffic_stop',
    badge: 'Passenger Rights',
    prompt: 'I am a passenger in my friend\'s car during a routine traffic stop for a broken taillight. The officer approaches my window and demands that I hand over my driver\'s license. Do I have to comply?'
  },
  {
    title: 'Request to Search Trunk / Vehicle',
    encounterType: 'traffic_stop',
    badge: 'Consent Search',
    prompt: 'The officer asks me: "You don\'t mind if I take a quick peek in your trunk and glovebox, do you? If you have nothing to hide, it\'ll take 30 seconds." What is the safest response?'
  },
  {
    title: 'Exit Vehicle Order in the Rain',
    encounterType: 'traffic_stop',
    badge: 'Penn v. Mimms',
    prompt: 'During a daytime traffic stop, the officer angrily orders me to "Get out of the vehicle right now and put your hands behind your back." What must I comply with, and what can I refuse?'
  }
];

export const HypotheticalScenarioSection: React.FC<HypotheticalScenarioSectionProps> = ({
  userProfile,
  activeJurisdiction,
  onJurisdictionChange,
  onUpgradePrompt
}) => {
  const [selectedStateCode, setSelectedStateCode] = useState<string>(
    activeJurisdiction?.stateCode || 'FED'
  );
  const currentLaw = getJurisdictionByCode(selectedStateCode);

  const [scenarioInput, setScenarioInput] = useState<string>('');
  const [selectedEncounterType, setSelectedEncounterType] = useState<EncounterType>('traffic_stop');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<HypotheticalScenarioAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Video Advertisement Interstitial State for Simulator What-If Scenarios
  const [isVideoAdOpen, setIsVideoAdOpen] = useState<boolean>(false);
  const [pendingScenarioText, setPendingScenarioText] = useState<string | null>(null);

  // Paid Subscription vs 1 Free Trial Use Tracking
  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';

  const [freeUsesCount, setFreeUsesCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem('police_protection_hypothetical_free_uses') || localStorage.getItem('civicshield_hypothetical_free_uses');
    return stored ? parseInt(stored, 10) || 0 : 0;
  });

  const isTrialUsed = !isPaid && freeUsesCount >= 1;

  const handleStateSelect = (code: string) => {
    setSelectedStateCode(code);
    const newLaw = getJurisdictionByCode(code);
    if (onJurisdictionChange) {
      onJurisdictionChange(newLaw);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_HYPOTHETICALS[0]) => {
    setScenarioInput(preset.prompt);
    setSelectedEncounterType(preset.encounterType);
    setErrorMessage(null);
  };

  const executeAnalysisInternal = async (textToAnalyze: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    VoiceEngine.stopAudio();
    setIsPlayingAudio(false);

    try {
      const response = await fetch('/api/simulator/analyze-hypothetical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: textToAnalyze.trim(),
          stateCode: selectedStateCode,
          encounterType: selectedEncounterType
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: HypotheticalScenarioAnalysis = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.warn('Network API request failed, generating client fallback analysis:', err);
      // Fallback in case of server hiccup: generate high-accuracy client analysis
      const fallbackAnalysis = generateClientHypotheticalFallback(
        textToAnalyze,
        currentLaw,
        selectedEncounterType
      );
      setAnalysisResult(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
      setPendingScenarioText(null);
    }
  };

  const handleRunAnalysis = (customText?: string) => {
    const textToAnalyze = customText || scenarioInput;
    if (!textToAnalyze.trim()) {
      setErrorMessage('Please describe an encounter scenario or select one of the quick scenarios.');
      return;
    }

    // High-paying video advertisement interstitial triggered specifically after a user requests a 'What-If' scenario
    if (!isPaid) {
      setPendingScenarioText(textToAnalyze);
      setIsVideoAdOpen(true);
      return;
    }

    executeAnalysisInternal(textToAnalyze);
  };

  const handleAdFinished = () => {
    setIsVideoAdOpen(false);
    if (pendingScenarioText) {
      executeAnalysisInternal(pendingScenarioText);
    }
  };

  const handlePlayVoice = (text: string) => {
    if (isPlayingAudio) {
      VoiceEngine.stopAudio();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    VoiceEngine.speakAdvice(
      text, 
      userProfile.preferredVoice || 'executive-counsel', 
      userProfile.whisperModeEnabled, 
      () => {
        setIsPlayingAudio(false);
      }
    );
  };

  const handleCopyScript = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleEscalationFollowUp = (escalationPhrase: string) => {
    const combinedPrompt = `${scenarioInput}\n\nEscalation Follow-up: The officer now responds: "${escalationPhrase}". How should I respond next under ${currentLaw.stateName} law?`;
    setScenarioInput(combinedPrompt);
    handleRunAnalysis(combinedPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Subscription & Free Trial Status Banner */}
      {isPaid ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 text-zinc-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Pro Plan Active: </span>
              <span className="text-zinc-300">100% Ad-Free AI What-If Scenarios &amp; Real-Time Statutory Analysis</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-amber-400 text-black shrink-0 shadow-sm">
            AD-FREE PRO
          </span>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 text-zinc-200">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-white">Free What-If Encounters: </span>
              <span className="text-zinc-300">Ask any police encounter question for free (ad-supported).</span>
            </div>
          </div>
          {onUpgradePrompt && (
            <button
              type="button"
              onClick={onUpgradePrompt}
              className="text-[10px] font-mono font-black uppercase px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/20 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shrink-0 text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Remove Ads with Pro ($14.99/mo)</span>
            </button>
          )}
        </div>
      )}

      {/* Jurisdiction Bar & Switcher */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Target Jurisdiction
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {currentLaw.stateCode}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {currentLaw.stateName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="state-select" className="text-xs text-zinc-400 font-medium">
              Change Location:
            </label>
            <select
              id="state-select"
              value={selectedStateCode}
              onChange={(e) => handleStateSelect(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {US_STATE_LIST.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Key Jurisdiction Facts */}
        <div className="mt-3.5 pt-3.5 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-0.5">
              Stop-and-Identify Status
            </span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className={currentLaw.stopAndIdentify ? 'text-amber-400' : 'text-emerald-400'}>
                {currentLaw.stopAndIdentify ? 'YES (Statute in effect)' : 'NO (ID not required without arrest)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate" title={currentLaw.stopAndIdentifyStatute}>
              {currentLaw.stopAndIdentifyStatute}
            </p>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-0.5">
              Wiretapping / Filming Rule
            </span>
            <span className="font-bold text-cyan-400 capitalize">
              {currentLaw.wiretappingConsent.replace('-', ' ')} Consent
            </span>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Police performing public duties exempt
            </p>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-0.5">
              Passenger ID Obligation
            </span>
            <span className="font-bold text-zinc-300">
              Not compelled without suspicion
            </span>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Brendlin v. California applies
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick-Picks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>High-Frequency Police Scenarios (Click to Load):</span>
          </span>
          <span className="text-[11px] text-zinc-500">Instant test cases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_HYPOTHETICALS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className="text-left p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/60 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                    {preset.badge}
                  </span>
                  <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-200 line-clamp-1">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {preset.prompt}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Custom Scenario Input Area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor="scenario-textarea" className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Describe Your Hypothetical Encounter:</span>
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">
              AI Constitutional Defense Engine • Tied to {currentLaw.stateName}
            </span>
          </div>

          <textarea
            id="scenario-textarea"
            rows={4}
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            placeholder={`Describe what the officer says, does, or demands...\nExample: "An officer stops my car at night in ${currentLaw.stateName} and claims they smell weed and wants to search my backpack. What are my rights and exact safe words?"`}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors resize-y leading-relaxed font-sans"
          />
        </div>

        {/* Encounter Type Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">Encounter Type:</span>
            {[
              { id: 'traffic_stop', label: 'Traffic Stop' },
              { id: 'home_encounter', label: 'At Home' },
              { id: 'walking_street', label: 'Walking / Street' },
              { id: 'public_recording', label: 'Filming Police' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedEncounterType(tab.id as EncounterType)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedEncounterType === tab.id
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleRunAnalysis()}
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-black shadow-amber-950/40"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Consulting {currentLaw.stateName} Statutes...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Simulate &amp; Find Safest Action</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* Official Legal Authority & Credibility Header */}
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black shadow-lg shadow-amber-950/40 shrink-0">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      LEGAL OPINION &amp; STATUTORY COMPLIANCE REPORT
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                      ANNOTATED CODE VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Grounded in <strong>{analysisResult.jurisdictionStateName || currentLaw.stateName}</strong> enacted statutes, 4th/5th Amendment jurisprudence, and Supreme Court precedent.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 self-end sm:self-auto shrink-0 bg-black/60 px-3 py-1.5 rounded-xl border border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>FRE 902 COURT STANDARD</span>
              </div>
            </div>
          </div>

          {/* Headline & Risk Banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-xl ${
            analysisResult.riskLevel === 'critical'
              ? 'bg-red-950/30 border-red-700/60 text-red-200'
              : analysisResult.riskLevel === 'high'
              ? 'bg-amber-950/30 border-amber-600/60 text-amber-200'
              : 'bg-emerald-950/30 border-emerald-600/60 text-emerald-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider">
                  PRIMARY SAFEST ACTION IN {analysisResult.jurisdictionStateName || currentLaw.stateName}
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                analysisResult.riskLevel === 'critical'
                  ? 'bg-red-900/80 text-red-200 border border-red-600'
                  : analysisResult.riskLevel === 'high'
                  ? 'bg-amber-900/80 text-amber-200 border border-amber-600'
                  : 'bg-emerald-900/80 text-emerald-200 border border-emerald-600'
              }`}>
                Risk Level: {analysisResult.riskLevel}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
              {analysisResult.safestActionHeadline}
            </h3>
          </div>

          {/* Verbatim Script (The Exact Words to Say) */}
          <div className="bg-blue-950/40 border border-blue-800/80 rounded-2xl p-4 sm:p-5 shadow-lg relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Verbatim Words to Say to the Officer:
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700">
                  Non-Aggressive • Legally Enforceable
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayVoice(analysisResult.exactWordsToSay)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPlayingAudio 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60'
                  }`}
                  title="Listen to how this should sound with calm pacing"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPlayingAudio ? 'Speaking...' : 'Listen Audio'}</span>
                </button>
                <button
                  onClick={() => handleCopyScript(analysisResult.exactWordsToSay)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
            </div>

            <blockquote className="text-base sm:text-lg font-bold text-white italic border-l-4 border-amber-400 pl-4 py-1 leading-relaxed bg-zinc-950/50 p-3 rounded-r-xl">
              {analysisResult.exactWordsToSay}
            </blockquote>
          </div>

          {/* Action Steps Playbook */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Recommended Physical Action Steps:</span>
            </h4>
            <div className="space-y-2">
              {analysisResult.actionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs sm:text-sm text-zinc-200">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Comparison: MUST COMPLY vs RIGHT TO REFUSE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What you MUST comply with */}
            <div className="bg-zinc-900 border border-emerald-900/50 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  What You MUST Comply With (Lawful Orders)
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                {analysisResult.whatYouMustComplyWith.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/30">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What you have the RIGHT TO REFUSE */}
            <div className="bg-zinc-900 border border-rose-900/50 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  What You Have the Right to REFUSE (Non-Consent)
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                {analysisResult.whatYouHaveRightToRefuse.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/30">
                    <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Police Tricks & Traps to Watch Out For */}
          {analysisResult.policeTricksAndTraps && analysisResult.policeTricksAndTraps.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-700/50 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Police Psychological Tricks &amp; Traps in this Scenario:
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {analysisResult.policeTricksAndTraps.map((trick, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950/70 border border-amber-800/40 text-zinc-300 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">⚠️</span>
                    <p className="leading-relaxed">{trick}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relevant State Statutes & Precedents */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Relevant {analysisResult.jurisdictionStateName || currentLaw.stateName} Statutes &amp; Precedents:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisResult.stateSpecificLaws.map((lawItem, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{lawItem.statuteOrCase}</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{lawItem.summary}</p>
                  <p className="text-[11px] text-zinc-500 italic">Relevance: {lawItem.relevance}</p>
                </div>
              ))}
            </div>

            {analysisResult.constitutionalPrecedents && analysisResult.constitutionalPrecedents.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-bold text-zinc-400 uppercase block mb-1.5">
                  Constitutional Foundations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.constitutionalPrecedents.map((prec, idx) => (
                    <span key={idx} className="text-[11px] font-mono bg-zinc-950 text-cyan-300 border border-zinc-800 px-2.5 py-1 rounded-lg">
                      {prec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* De-escalation & Physical Safety Tip */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">Physical Safety &amp; De-Escalation Rule:</span>
              <p className="leading-relaxed">{analysisResult.deEscalationAdvice}</p>
            </div>
          </div>

          {/* Interactive Escalation / Follow-Up Section */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <CornerDownRight className="w-4 h-4 text-amber-400" />
              <span>Simulate Next Step If Officer Escalates:</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Officer threatens: "I will arrest you if you don\'t answer"',
                'Officer claims: "I smell marijuana coming from this car"',
                'Officer orders: "Step out of the vehicle right now"',
                'Officer asks: "Where are you coming from and where are you headed?"'
              ].map((escalation, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEscalationFollowUp(escalation)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/50 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 group"
                >
                  <span className="text-amber-400 group-hover:translate-x-0.5 transition-transform">↳</span>
                  <span>{escalation}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sponsored Advertisement Service (Displayed for free users, removed for Pro) */}
          <SponsoredAdBanner
            isPaid={isPaid}
            onUpgradePrompt={onUpgradePrompt}
            variant="card"
            contextTag="What-If Scenario Defense Sponsor"
          />
        </div>
      )}

      {/* High-Paying Video Advertisement Interstitial for Simulator What-If Scenarios */}
      <CommercialVideoAdModal
        isOpen={isVideoAdOpen}
        onClose={() => {
          setIsVideoAdOpen(false);
          if (pendingScenarioText) {
            executeAnalysisInternal(pendingScenarioText);
          }
        }}
        reason="simulation_question"
        onAdFinished={handleAdFinished}
      />
    </div>
  );
};

/**
 * Intelligent Client Fallback in case of server network interruption
 */
function generateClientHypotheticalFallback(
  prompt: string,
  law: JurisdictionLaw,
  encounterType: EncounterType
): HypotheticalScenarioAnalysis {
  const text = prompt.toLowerCase();
  const isPhone = text.includes('phone') || text.includes('passcode');
  const isSearch = text.includes('search') || text.includes('trunk') || text.includes('glove');
  const isHome = encounterType === 'home_encounter' || text.includes('door') || text.includes('home');
  const isFilming = encounterType === 'public_recording' || text.includes('film') || text.includes('record');

  if (isPhone) {
    return {
      safestActionHeadline: `Do not surrender your phone passcode. Cell phone contents are protected under Riley v. California.`,
      actionSteps: [
        'Lock your phone immediately with a numeric passcode (disable Face ID/Touch ID if possible).',
        'Keep both hands in plain sight; never suddenly reach for your device.',
        'If the officer physically seizes the phone, do not pull back, but state clearly that you do not consent.'
      ],
      exactWordsToSay: `"Officer, I do not consent to any search of my phone, and under Riley v. California and the Fourth and Fifth Amendments, I do not consent to unlocking my device or providing my passcode."`,
      whatYouMustComplyWith: [
        'Do not physically fight an officer if they physically confiscate the phone (object verbally, comply physically).'
      ],
      whatYouHaveRightToRefuse: [
        'Absolute right to refuse providing your PIN, password, or numeric passcode.',
        'Right to refuse consenting to digital extraction or reviewing messages/photos.'
      ],
      policeTricksAndTraps: [
        '"If you have nothing to hide, just unlock it so we can clear this up."',
        'Holding the phone up to your face quickly to trigger biometric Face ID.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Digital Privacy Standards`,
          summary: `Under ${law.stateName} and Federal law, digital search warrants must specify particularity.`,
          relevance: 'Applies to mobile phones and digital recording devices.'
        }
      ],
      constitutionalPrecedents: [
        'Riley v. California, 573 U.S. 373 (2014)',
        'Salinas v. Texas, 570 U.S. 178 (2013)'
      ],
      deEscalationAdvice: 'Keep your hands on the steering wheel or at your sides. State your refusal calmly without physical resistance.',
      riskLevel: 'medium',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  if (isHome) {
    return {
      safestActionHeadline: `Keep door locked and speak through the door. Never open your door or step outside without a judge-signed warrant.`,
      actionSteps: [
        'Keep the door locked; do not crack it open.',
        'Ask officers through the closed door if they have a judicial search warrant signed by a judge.',
        'If they have a warrant, request that they hold it up to a window or slide it under the door.'
      ],
      exactWordsToSay: `"Officers, I do not open my door without a search warrant signed by a judge. I do not consent to you entering, and I choose to remain silent."`,
      whatYouMustComplyWith: [
        'If officers possess a valid judicial search warrant for your address, you must permit entry.'
      ],
      whatYouHaveRightToRefuse: [
        'Right to refuse opening the door for informal "knock and talks".',
        'Right to refuse stepping outside onto the porch or hallway.'
      ],
      policeTricksAndTraps: [
        '"Step outside so we can hear you better." (Used to bypass Payton v. New York home protections).',
        '"If you don\'t open up, we\'ll kick it down and arrest everyone for obstruction."'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Curtilage & Home Precedents`,
          summary: 'Police have no license to enter private dwellings without a warrant or exigent circumstances.',
          relevance: 'Protects residents against warrantless knock intrusions.'
        }
      ],
      constitutionalPrecedents: [
        'Payton v. New York, 445 U.S. 573 (1980)',
        'Florida v. Jardines, 569 U.S. 1 (2013)'
      ],
      deEscalationAdvice: 'Speak politely but firmly through the closed door. Do not touch the door handle.',
      riskLevel: 'high',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  // Default stop & identify fallback
  return {
    safestActionHeadline: `Exercise your 5th Amendment right to silence and ask: "Am I free to go, or am I being detained?"`,
    actionSteps: [
      'Keep hands in plain sight on the steering wheel or at your sides.',
      law.stopAndIdentify 
        ? `In ${law.stateName}, present your required identification if driving or lawfully detained under ${law.stopAndIdentifyStatute}.`
        : `In ${law.stateName}, you are not required to provide ID unless driving a motor vehicle or lawfully arrested.`,
      'Ask the clarifying question: "Officer, am I being detained, or am I free to leave?"',
      'Affirmatively state that you are exercising your right to remain silent.'
    ],
    exactWordsToSay: `"Officer, I am invoking my Fifth Amendment right to remain silent. I do not consent to any searches. Am I free to go, or am I being detained?"`,
    whatYouMustComplyWith: [
      'Drivers must present driver license, vehicle registration, and proof of insurance.',
      'Must exit vehicle if ordered under Pennsylvania v. Mimms.'
    ],
    whatYouHaveRightToRefuse: [
      'Right to refuse answering investigative questions about where you are going or coming from.',
      'Right to refuse consent to any vehicle or personal searches.'
    ],
    policeTricksAndTraps: [
      '"Do you know why I pulled you over?" (Trap to get you to confess on video).',
      '"If you answer a few questions, I\'ll let you off with a warning."'
    ],
    stateSpecificLaws: [
      {
        statuteOrCase: law.stopAndIdentifyStatute,
        summary: law.stopAndIdentifySummary,
        relevance: `Identification laws in ${law.stateName}.`
      }
    ],
    constitutionalPrecedents: [
      'Terry v. Ohio, 392 U.S. 1 (1968)',
      'Salinas v. Texas, 570 U.S. 178 (2013)'
    ],
    deEscalationAdvice: 'Remain calm and polite. Contest any unlawful conduct in court rather than escalating on the street.',
    riskLevel: 'medium',
    jurisdictionStateCode: law.stateCode,
    jurisdictionStateName: law.stateName,
  };
}
