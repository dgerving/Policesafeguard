import React, { useState } from 'react';
import { 
  Play, RotateCcw, Award, CheckCircle, XCircle, AlertTriangle, 
  HelpCircle, Shield, Volume2, ChevronRight, BookOpen, UserCheck,
  Sparkles, ArrowRight, MapPin, Scale, ShieldCheck, ShieldAlert,
  Grid, Search, Filter, Layers, X
} from 'lucide-react';
import { SIMULATION_SCENARIOS } from '../data/simulations';
import { SimulationScenario, SimulationOption, UserProfile, JurisdictionLaw } from '../types';
import { VoiceEngine } from '../services/voiceEngine';
import { TranslationService } from '../services/translator';
import { JurisdictionLegalityService, FeatureLegalityCheck } from '../services/jurisdictionLegalityService';
import { HypotheticalScenarioSection } from './HypotheticalScenarioSection';
import { US_STATE_LIST, JURISDICTIONS } from '../data/jurisdictions';
import { LegalityRestrictedModal } from './LegalityRestrictedModal';
import { SponsoredAdBanner } from './SponsoredAdBanner';

interface SimulatorViewProps {
  userProfile: UserProfile;
  jurisdiction?: JurisdictionLaw;
  onUpgradePrompt?: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ 
  userProfile, 
  jurisdiction, 
  onUpgradePrompt 
}) => {
  const [simulatorTab, setSimulatorTab] = useState<'interactive' | 'hypothetical'>('interactive');
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(SIMULATION_SCENARIOS[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogDifficultyFilter, setCatalogDifficultyFilter] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');

  // Allow simulator to be tailored to any US state or the user's active GPS jurisdiction
  const [simStateCode, setSimStateCode] = useState<string>(
    jurisdiction?.stateCode || userProfile.homeState || 'TX'
  );
  const [legalityDeniedCheck, setLegalityDeniedCheck] = useState<FeatureLegalityCheck | null>(null);

  // Paid Subscription vs 1 Free Trial Use Tracking for Hypothetical Encounter Simulator
  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';

  const freeUsesCount = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('police_protection_hypothetical_free_uses') || localStorage.getItem('civicshield_hypothetical_free_uses') || '0', 10) 
    : 0;
  const isTrialUsed = !isPaid && freeUsesCount >= 1;

  const filteredScenarios = SIMULATION_SCENARIOS.filter(sc => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'traffic') return sc.category.toLowerCase().includes('traffic') || sc.category.toLowerCase().includes('search') || sc.category.toLowerCase().includes('dui') || sc.category.toLowerCase().includes('passenger') || sc.category.toLowerCase().includes('checkpoint');
    if (categoryFilter === 'home') return sc.category.toLowerCase().includes('home');
    if (categoryFilter === 'street') return sc.category.toLowerCase().includes('pedestrian') || sc.category.toLowerCase().includes('street');
    if (categoryFilter === 'filming') return sc.category.toLowerCase().includes('recording') || sc.category.toLowerCase().includes('filming') || sc.category.toLowerCase().includes('amendment');
    return true;
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [userSelections, setUserSelections] = useState<{
    stepNumber: number;
    chosenOption: SimulationOption;
  }[]>([]);
  const [isScenarioFinished, setIsScenarioFinished] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentStep = selectedScenario.steps[currentStepIndex];

  const activeStateCode = simStateCode || jurisdiction?.stateCode || 'FED';
  const resolvedState = JURISDICTIONS[activeStateCode];
  const activeStateName = resolvedState?.stateName || jurisdiction?.stateName || activeStateCode;
  const compliance = JurisdictionLegalityService.getStateComplianceSummary(activeStateCode);

  // Play officer audio using speech synthesis
  const handlePlayOfficerVoice = (text: string) => {
    setIsPlayingAudio(true);
    VoiceEngine.speakAdvice(text, 'executive-counsel', false, () => {
      setIsPlayingAudio(false);
    });
  };

  // Handle user response selection and enforce statutory legality denials
  const handleSelectOption = (option: SimulationOption) => {
    // Check if the chosen option represents an unlawful act in the active jurisdiction
    const textLower = (option.label + ' ' + option.spokenStatement + ' ' + (option.feedback || '')).toLowerCase();
    let deniedFeature: any = null;

    if (textLower.includes("don't have to show you anything") || 
        (textLower.includes("refuse") && (textLower.includes("license") || textLower.includes("documents")))) {
      deniedFeature = 'refuse_all_identification';
    } else if (compliance.stopAndIdentify && selectedScenario.id.includes('street') && 
               (textLower.includes("silent") && textLower.includes("name") || textLower.includes("not giving my name"))) {
      deniedFeature = 'refuse_pedestrian_id_in_stop_and_id';
    } else if (compliance.dutyToInformFirearms && (selectedScenario.id.includes('firearm') || selectedScenario.id.includes('felony')) &&
               (textLower.includes("keep quiet") || textLower.includes("do not mention") || textLower.includes("conceal"))) {
      deniedFeature = 'withhold_firearm_declaration_duty';
    } else if (compliance.twoPartyWiretap && (textLower.includes("silent") && textLower.includes("recording") || textLower.includes("without telling"))) {
      deniedFeature = 'stealth_unannounced_recording';
    } else if (textLower.includes("not getting out") || textLower.includes("refuse to exit") || textLower.includes("physically block") || textLower.includes("fight")) {
      deniedFeature = 'disobey_mimms_exit_order';
    } else if (textLower.includes("refuse") && textLower.includes("blood") && textLower.includes("fight")) {
      deniedFeature = 'refuse_post_arrest_chemical_test';
    }

    if (deniedFeature) {
      const check = JurisdictionLegalityService.checkFeatureLegality(deniedFeature, activeStateCode, activeStateName);
      if (!check.isLegal) {
        setLegalityDeniedCheck(check);
      }
    }

    const updatedSelections = [
      ...userSelections,
      { stepNumber: currentStep.stepNumber, chosenOption: option }
    ];
    setUserSelections(updatedSelections);
    setScore(prev => Math.max(0, Math.min(100, prev + option.scoreDelta)));

    if (currentStepIndex < selectedScenario.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsScenarioFinished(true);
    }
  };

  // Reset simulator
  const handleRestart = (scenario = selectedScenario) => {
    setSelectedScenario(scenario);
    setCurrentStepIndex(0);
    setScore(100);
    setUserSelections([]);
    setIsScenarioFinished(false);
  };

  return (
    <div id="simulator-container" className="flex flex-col h-full bg-transparent text-zinc-100 overflow-y-auto">
      {/* Top Header & Mode Toggle Tabs with Cinematic Photo Background */}
      <div 
        className="relative border-b border-zinc-800 p-5 sm:p-6 overflow-hidden shadow-2xl"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(9, 10, 15, 0.96) 0%, rgba(20, 18, 25, 0.88) 50%, rgba(9, 10, 15, 0.97) 100%), url('/images/police_stop_simulator_1790279159525.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                POLICE ENCOUNTERS SIMULATOR &amp; WHAT-IF ENGINE
              </h2>
              <span className="text-[10px] font-bold bg-zinc-900/90 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full shadow-sm">
                ALL ENCOUNTERS (FREE)
              </span>
            </div>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              Practice real-world police interactions safely, or describe any hypothetical encounter to discover the safest action grounded in your state's laws.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950/90 border border-zinc-800 shrink-0 shadow-lg backdrop-blur-sm">
            <button
              onClick={() => setSimulatorTab('interactive')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                simulatorTab === 'interactive'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Interactive Scenarios</span>
            </button>
            <button
              onClick={() => setSimulatorTab('hypothetical')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                simulatorTab === 'hypothetical'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Hypothetical</span>
              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                simulatorTab === 'hypothetical' 
                  ? 'bg-black text-amber-300' 
                  : isPaid 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isTrialUsed
                  ? 'bg-amber-500 text-black'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isPaid ? 'PRO UNLIMITED' : isTrialUsed ? 'PRO ONLY' : '1 FREE TRIAL'}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-bar for Interactive Scenarios Mode */}
        {simulatorTab === 'interactive' && (
          <div className="max-w-5xl mx-auto mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">Filter:</span>
              {[
                { id: 'all', label: 'All Encounters' },
                { id: 'traffic', label: 'Traffic Stops' },
                { id: 'home', label: 'At Home' },
                { id: 'street', label: 'Walking & Street' },
                { id: 'filming', label: 'Public Filming' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCategoryFilter(tab.id);
                    const matching = SIMULATION_SCENARIOS.filter(sc => {
                      if (tab.id === 'all') return true;
                      if (tab.id === 'traffic') return sc.category.toLowerCase().includes('traffic') || sc.category.toLowerCase().includes('search') || sc.category.toLowerCase().includes('dui') || sc.category.toLowerCase().includes('passenger') || sc.category.toLowerCase().includes('checkpoint');
                      if (tab.id === 'home') return sc.category.toLowerCase().includes('home');
                      if (tab.id === 'street') return sc.category.toLowerCase().includes('pedestrian') || sc.category.toLowerCase().includes('street');
                      if (tab.id === 'filming') return sc.category.toLowerCase().includes('recording') || sc.category.toLowerCase().includes('filming') || sc.category.toLowerCase().includes('amendment');
                      return true;
                    });
                    if (matching.length > 0 && !matching.some(m => m.id === selectedScenario.id)) {
                      handleRestart(matching[0]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    categoryFilter === tab.id
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scenario Selector & Browse Catalog Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCatalogModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Browse complete catalog of 23 complex simulation scenarios"
              >
                <Grid className="w-3.5 h-3.5 text-amber-400" />
                <span>Browse All ({SIMULATION_SCENARIOS.length})</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Scenario:</span>
                <select
                  value={selectedScenario.id}
                  onChange={(e) => {
                    const found = SIMULATION_SCENARIOS.find(s => s.id === e.target.value);
                    if (found) handleRestart(found);
                  }}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-amber-500 max-w-[200px] sm:max-w-xs truncate cursor-pointer"
                >
                  {filteredScenarios.map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.title} ({sc.difficulty})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col">
        {simulatorTab === 'hypothetical' ? (
          /* HYPOTHETICAL SCENARIOS SECTION */
          <HypotheticalScenarioSection 
            userProfile={userProfile}
            activeJurisdiction={jurisdiction}
            onUpgradePrompt={onUpgradePrompt}
          />
        ) : (
          /* INTERACTIVE PRACTICE SCENARIOS */
          <>
            {/* Quick banner to switch to hypothetical engine */}
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Have a specific "What If" question? Ask our <strong>Hypothetical Scenario Simulator</strong> for safe words and laws in your state.
                </span>
              </div>
              <button
                onClick={() => setSimulatorTab('hypothetical')}
                className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider shrink-0 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Ask What-If</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {!isScenarioFinished ? (
              <div className="space-y-6">
                {/* Scenario Header Card with Realistic POV Background */}
                <div 
                  className="relative rounded-2xl p-5 sm:p-6 border border-zinc-800 shadow-xl overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(9, 10, 15, 0.94) 0%, rgba(18, 20, 28, 0.88) 50%, rgba(9, 10, 15, 0.95) 100%), url('/images/police_stop_simulator_1790279159525.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {/* Subtle rim light accent */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span>{selectedScenario.category}</span>
                      <span className="text-zinc-500">•</span>
                      <span>Step {currentStepIndex + 1} of {selectedScenario.steps.length}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Readiness Score:</span>
                      <span className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg border shadow-sm ${
                        score >= 80 
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
                          : score >= 60 
                          ? 'bg-amber-950/80 border-amber-500/60 text-amber-300' 
                          : 'bg-red-950/80 border-red-500/60 text-red-300'
                      }`}>
                        {score}%
                      </span>
                    </div>
                  </div>

                  <h3 className="relative z-10 text-lg sm:text-2xl font-black text-white mb-2 tracking-tight">
                    {selectedScenario.title}
                  </h3>
                  <p className="relative z-10 text-xs sm:text-sm text-zinc-200 leading-relaxed mb-3.5 max-w-3xl">
                    {selectedScenario.description}
                  </p>
                  <div className="relative z-10 text-[11px] font-mono text-zinc-300 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-inner">
                    <span className="text-amber-400 font-semibold">Context: </span>
                    {selectedScenario.initialContext}
                  </div>
                </div>

                {/* Jurisdiction-Tailored Legal Rules Banner with State Selector */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white text-xs block">
                          Tailored to Active Jurisdiction: {activeStateName} ({activeStateCode})
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Enforcing local state statutes and landmark circuit court precedents
                        </span>
                      </div>
                    </div>

                    {/* Interactive State Switcher for Simulation */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[10px] text-zinc-400 font-semibold uppercase">Change State:</span>
                      <select
                        value={simStateCode}
                        onChange={(e) => setSimStateCode(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
                        title="Simulate this exact encounter under different state laws"
                      >
                        {US_STATE_LIST.map(st => (
                          <option key={st.code} value={st.code} className="bg-zinc-900 text-white">
                            {st.code} - {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Statutory Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {compliance.twoPartyWiretap ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/40">
                        ⚠️ All-Party Consent Wiretap State (Audible Notice Required)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        ✅ One-Party Consent Recording State
                      </span>
                    )}

                    {compliance.dutyToInformFirearms ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">
                        🚨 Affirmative Duty to Inform on Firearms
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        ℹ️ No Duty to Inform Unless Asked
                      </span>
                    )}

                    {compliance.stopAndIdentify && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40">
                        📋 Stop-and-Identify Statute Active
                      </span>
                    )}

                    {compliance.distanceBufferLaw && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40">
                        📏 Minimum {compliance.distanceBufferLaw}ft Distance Buffer Law
                      </span>
                    )}
                  </div>

                  {/* Scenario-Specific State Law Insight */}
                  {selectedScenario.id === 'sim-odor-vehicle-search' && (
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] leading-relaxed">
                      {['NY', 'CA', 'MN', 'NJ', 'MD', 'VA'].includes(activeStateCode) ? (
                        <div className="text-emerald-300 flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>State Odor Protection Active in {activeStateName}:</strong> Under {activeStateCode} statutory reforms, law enforcement is strictly barred from using the odor of cannabis alone as probable cause to search your motor vehicle.
                          </span>
                        </div>
                      ) : (
                        <div className="text-amber-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Automobile Exception Plain Smell in {activeStateName}:</strong> In this state, cannabis odor alone gives officers lawful probable cause under Carroll v. United States to search passenger and trunk compartments without a warrant.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedScenario.id.includes('firearm') || selectedScenario.id.includes('felony')) && (
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] leading-relaxed">
                      {compliance.dutyToInformFirearms ? (
                        <div className="text-rose-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Duty to Inform Mandate in {activeStateName}:</strong> You must immediately declare any concealed firearm upon initial contact. Remaining silent about weapons in {activeStateName} is an arrestable offense.
                          </span>
                        </div>
                      ) : (
                        <div className="text-zinc-300 flex items-start gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>No Affirmative Duty in {activeStateName}:</strong> You have no legal obligation to volunteer information about legally owned weapons unless specifically asked by the officer.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Officer Dialogue Bubble with Audio Playback */}
                <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-4 sm:p-5 relative shadow-lg">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                        👮
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Patrol Officer</h4>
                        <span className="text-[10px] text-blue-300">Speaking to Driver</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlayOfficerVoice(currentStep.officerStatement)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isPlayingAudio ? 'bg-blue-600 text-white' : 'bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingAudio ? 'Speaking...' : 'Play Officer Voice'}</span>
                    </button>
                  </div>

                  <blockquote className="text-base sm:text-lg font-medium text-white italic border-l-4 border-blue-500 pl-4 py-1 leading-relaxed">
                    "{currentStep.officerStatement}"
                  </blockquote>

                  {userProfile.nativeLanguage !== 'en' && (
                    isPaid ? (
                      <p className="text-xs text-blue-300/90 font-medium mt-2 pl-4 flex items-center gap-1.5">
                        <span>🌐 Translation: {TranslationService.translateText(currentStep.officerStatement, userProfile.nativeLanguage)}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 mt-2 pl-4 flex items-center gap-2">
                        <span>🌐 12-Language Speech Translator requires a Paid Tier</span>
                        <button
                          onClick={onUpgradePrompt}
                          className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          Unlock Pro (3-Day Free Trial)
                        </button>
                      </p>
                    )
                  )}
                </div>

                {/* Simulated Live On-Screen AI Bot Legal Commentary Card */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        POLICE SAFEGUARD AI LEGAL ADVISORY
                      </span>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      currentStep.aiCommentary.category === 'MUST_COMPLY' 
                        ? 'bg-emerald-600 text-white' 
                        : currentStep.aiCommentary.category === 'RIGHT_TO_REFUSE'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {currentStep.aiCommentary.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white mb-1.5">
                    {currentStep.aiCommentary.headline}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 mb-3 leading-relaxed">
                    {currentStep.aiCommentary.explanation}
                  </p>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-300 space-y-1">
                    <div className="font-semibold text-amber-300">
                      Landmark Precedent: {currentStep.aiCommentary.legalCitation}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {currentStep.aiCommentary.statuteOrCase}
                    </div>
                  </div>
                </div>

                {/* Interactive User Choices */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Your Response to the Officer:</span>
                    <span className="text-[11px] text-zinc-500 font-normal">Choose the safest constitutional action</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {currentStep.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(option)}
                        className="text-left p-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500 text-zinc-200 hover:text-white transition-all duration-200 cursor-pointer flex items-start gap-3 group shadow-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-zinc-800 group-hover:bg-amber-500 group-hover:text-black text-zinc-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-zinc-100 group-hover:text-amber-200 leading-snug">
                            {option.label}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Simulation Completed Summary & Score Card */
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="text-center py-4 border-b border-zinc-800">
                  <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center mx-auto mb-3">
                    <Award className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    Scenario Simulation Completed
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    {selectedScenario.title}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-3 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded-xl">
                    <span className="text-xs text-zinc-400">Final Constitutional Score:</span>
                    <span className={`text-xl font-black font-mono ${
                      score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {score}%
                    </span>
                  </div>
                </div>

                {/* Step-by-Step Decision Audit */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Encounter Step Decision Audit &amp; Analysis
                  </h4>
                  <div className="space-y-3">
                    {userSelections.map((sel, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border space-y-2 ${
                          sel.chosenOption.isBestPractice 
                            ? 'bg-emerald-950/30 border-emerald-800/60' 
                            : 'bg-rose-950/30 border-rose-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {sel.chosenOption.isBestPractice ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-white">
                              Step {sel.stepNumber}: {sel.chosenOption.isBestPractice ? 'Constitutional Best Practice' : 'Risky / Sub-Optimal Action'}
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${
                            sel.chosenOption.scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {sel.chosenOption.scoreDelta > 0 ? `+${sel.chosenOption.scoreDelta}` : sel.chosenOption.scoreDelta} pts
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-zinc-200 mb-1">
                          Your Choice: "{sel.chosenOption.spokenStatement}"
                        </p>
                        <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
                          {sel.chosenOption.feedback}
                        </p>
                        <div className="text-[11px] font-mono text-amber-300/90 bg-black/40 px-2.5 py-1.5 rounded border border-white/5">
                          Governing Law: {sel.chosenOption.citation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sponsored Partner Banner (Shown for free users, removed for Pro) */}
                <SponsoredAdBanner
                  isPaid={isPaid}
                  onUpgradePrompt={onUpgradePrompt}
                  variant="card"
                  contextTag="Completed Encounter Audit Sponsor"
                />

                {/* Restart & Action Buttons */}
                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleRestart()}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry This Scenario</span>
                  </button>
                  
                  <button
                    onClick={() => setSimulatorTab('hypothetical')}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Ask a Hypothetical Scenario</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* State Legality Denial Alert Modal */}
      <LegalityRestrictedModal
        isOpen={!!legalityDeniedCheck}
        onClose={() => setLegalityDeniedCheck(null)}
        check={legalityDeniedCheck}
      />

      {/* Full 23-Scenario Interactive Catalog Modal */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Encounter Scenario Vault</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                      {SIMULATION_SCENARIOS.length} Scenarios
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    High-stakes simulations modeled on real traffic stops, warrantless searches, and Supreme Court precedents.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar & Search */}
            <div className="p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearchQuery}
                  onChange={(e) => setCatalogSearchQuery(e.target.value)}
                  placeholder="Search scenarios, laws, or topics..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Difficulty Filter Chips */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Level:</span>
                {(['all', 'Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setCatalogDifficultyFilter(diff)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      catalogDifficultyFilter === diff
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {diff === 'all' ? 'All Levels' : diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenarios Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {(() => {
                const filtered = SIMULATION_SCENARIOS.filter((sc) => {
                  if (catalogDifficultyFilter !== 'all' && sc.difficulty !== catalogDifficultyFilter) {
                    return false;
                  }
                  if (catalogSearchQuery.trim()) {
                    const q = catalogSearchQuery.toLowerCase();
                    const inTitle = sc.title.toLowerCase().includes(q);
                    const inDesc = sc.description.toLowerCase().includes(q);
                    const inCat = sc.category.toLowerCase().includes(q);
                    const inSteps = sc.steps.some(step => 
                      (step.officerStatement || '').toLowerCase().includes(q) ||
                      step.options.some(opt => 
                        opt.label.toLowerCase().includes(q) || 
                        opt.citation?.toLowerCase().includes(q)
                      )
                    );
                    return inTitle || inDesc || inCat || inSteps;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500">
                      <AlertTriangle className="w-8 h-8 text-amber-500/60 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-zinc-300">No scenarios match your search filter</p>
                      <button
                        onClick={() => {
                          setCatalogSearchQuery('');
                          setCatalogDifficultyFilter('all');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filtered.map((sc) => {
                      const isCurrent = sc.id === selectedScenario.id;
                      const diffColors = 
                        sc.difficulty === 'Beginner'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : sc.difficulty === 'Intermediate'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                      return (
                        <div
                          key={sc.id}
                          className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                            isCurrent
                              ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                          }`}
                        >
                          <div>
                            {/* Top Badges */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                                {sc.category}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColors}`}>
                                  {sc.difficulty}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                  {sc.steps.length} Steps
                                </span>
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                              {sc.title}
                            </h4>

                            {/* Description */}
                            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-3">
                              {sc.description}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                            {isCurrent ? (
                              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                                <span>Currently Loaded</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-zinc-500">
                                Step-by-step interactive test
                              </span>
                            )}

                            <button
                              onClick={() => {
                                handleRestart(sc);
                                setIsCatalogModalOpen(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-amber-400 text-black shadow-sm'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
                              }`}
                            >
                              <span>{isCurrent ? 'Restart' : 'Launch'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400">
              <span>Showing {SIMULATION_SCENARIOS.length} scenarios customized to constitutional legal standards.</span>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
