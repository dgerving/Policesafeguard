import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Shield, Video, 
  MapPin, Radio, Lock, FileText, CheckCircle2, AlertTriangle, 
  Download, Copy, Check, Sparkles, ExternalLink, ShieldCheck,
  Phone, User, CreditCard, ChevronRight, Eye, Camera, Mic,
  Sliders, MessageSquare, Compass, ShieldAlert, Award, RefreshCw,
  Share2, Zap, AlertCircle
} from 'lucide-react';

interface AppMarketingVideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStripePortal?: () => void;
}

interface DemoScene {
  id: number;
  timeStart: number;
  timeEnd: number;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  featureKey: 'voice' | 'copilot' | 'ocr' | 'distress' | 'vault' | 'pricing';
  narration: string;
  captions: string;
}

const DEMO_SCENES_120S: DemoScene[] = [
  {
    id: 1,
    timeStart: 0,
    timeEnd: 20,
    title: "Instant Traffic Stop Activation & Voice Command Launcher",
    subtitle: "Hands-free voice launch, instant Austin TX GPS lock & state statutes loaded",
    badge: "FEATURE 1 • VOICE ACTIVATION & GPS HUD",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
    featureKey: 'voice',
    narration: "When flashing red and blue lights appear in your rearview mirror, every single second counts. With Police SafeGuard, Jane Doe speaks a hands-free voice command: 'SafeGuard, Traffic Stop'. Instantly, the app activates the traffic stop dashboard, pinpoints her exact GPS coordinates in Austin Texas, and automatically arms her with state-specific constitutional rights under Texas Penal Code.",
    captions: "Jane Doe activates hands-free: 'SafeGuard, Traffic Stop' • GPS locked in Austin, TX • Texas Penal Code loaded."
  },
  {
    id: 2,
    timeStart: 20,
    timeEnd: 40,
    title: "Dual Stealth Camera & Real-Time AI Legal Copilot",
    subtitle: "Front & rear stealth recording, live speech transcription & AI rights prompts",
    badge: "FEATURE 2 • REAL-TIME AI RIGHTS SHIELD",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    featureKey: 'copilot',
    narration: "Dual stealth cameras engage silently, streaming video to encrypted cloud custody. When Officer Vance approaches the driver side window and asks: 'Driver, do you know how fast you were going?', SafeGuard's audio analyzer transcribes the officer's question in real-time, instantly whispering legal protection: 'Politely state you exercise your Fifth Amendment right to remain silent.'",
    captions: "Officer asks: 'Do you know how fast you were going?' • AI Copilot: 'Invoke Fifth Amendment. Do not guess speed.'"
  },
  {
    id: 3,
    timeStart: 40,
    timeEnd: 60,
    title: "Officer Badge OCR Scanner & Miranda Warning Auditor",
    subtitle: "Automatic badge #4829 scanning, search consent refusals & custody compliance",
    badge: "FEATURE 3 • OFFICER OCR & MIRANDA AUDITOR",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    featureKey: 'ocr',
    narration: "SafeGuard's camera scanner automatically locks onto Officer Vance's badge number 4829 and Austin Police patrol unit 204. When asked to search the trunk, SafeGuard displays the unequivocal refusal: 'I do not consent to any searches under the Fourth Amendment.' Meanwhile, our Miranda auditor continuously tracks whether constitutional warnings were given before questioning.",
    captions: "Badge #4829 Verified • Fourth Amendment search refusal recorded • Miranda warning: Not read."
  },
  {
    id: 4,
    timeStart: 60,
    timeEnd: 80,
    title: "1-Touch Silent Distress SOS & Witness Broadcast",
    subtitle: "Live video stream link & real-time GPS telemetry dispatched to family & attorney",
    badge: "FEATURE 4 • EMERGENCY SOS BROADCAST",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    featureKey: 'distress',
    narration: "With one silent tap, an encrypted emergency distress broadcast is dispatched to Jane's emergency contact, Marcus Doe, and her attorney, Sarah Jenkins. They receive an instant secure live streaming link and real-time GPS coordinates, ensuring Jane is never isolated or without an active witness.",
    captions: "🚨 SOS Broadcast Active: Dispatched to Marcus Doe ((512) 555-0194) and Legal Counsel with live GPS pin."
  },
  {
    id: 5,
    timeStart: 80,
    timeEnd: 100,
    title: "Zero-Knowledge Cryptographic Evidence Vault",
    subtitle: "Immutable SHA-256 digital fingerprint prevents evidence tampering or device seizure loss",
    badge: "FEATURE 5 • TAMPER-PROOF EVIDENCE VAULT",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    featureKey: 'vault',
    narration: "Even if your phone is confiscated, powered down, or damaged, your evidence is completely indestructible. The entire encounter is sealed with a zero-knowledge cryptographic SHA-256 digital fingerprint, certified for court chain-of-custody, and locked in your private custody vault ready for your legal defense team.",
    captions: "Vault Sealed • SHA-256 Hash: 7f83b165...9069 • Certified tamper-proof court evidence."
  },
  {
    id: 6,
    timeStart: 100,
    timeEnd: 120,
    title: "In-App Stripe Subscriptions & Community Pledges",
    subtitle: "30-Day Free Trial ($14.99/mo), Annual ($49.99/yr), Lifetime ($79.99) & Dual 5% Pledges",
    badge: "FEATURE 6 • IN-APP STRIPE CHECKOUT & PLEDGES",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    featureKey: 'pricing',
    narration: "Subscribe seamlessly right inside the app with our live Stripe payment portal. Try 30 days 100% free with our monthly plan at $14.99, choose our annual plan for $49.99, or claim a lifetime pass for $79.99. Plus, five percent of every subscription is donated to honest police officer wellness, and five percent goes to our Bail Relief Vault. Protect your family and know your rights.",
    captions: "Live Stripe Checkout • 30-Day Free Trial ($14.99/mo) • Annual ($49.99/yr) • Lifetime ($79.99) • Dual 5% Pledges."
  }
];

export const AppMarketingVideoDemoModal: React.FC<AppMarketingVideoDemoModalProps> = ({
  isOpen,
  onClose,
  onOpenStripePortal
}) => {
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'interactive'>('interactive');
  const [durationMode, setDurationMode] = useState<60 | 120>(120);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedMarketingCopy, setCopiedMarketingCopy] = useState(false);
  const [interactiveFeature, setInteractiveFeature] = useState<'voice' | 'copilot' | 'ocr' | 'distress' | 'vault' | 'pricing'>('voice');
  
  // Interactive feature simulation states
  const [isVoiceTriggerFired, setIsVoiceTriggerFired] = useState(false);
  const [simulatedOfficerQuestion, setSimulatedOfficerQuestion] = useState<'speed' | 'search' | 'weapons'>('speed');
  const [isOcrScanRunning, setIsOcrScanRunning] = useState(false);
  const [isDistressDispatched, setIsDistressDispatched] = useState(false);
  const [isVaultHashed, setIsVaultHashed] = useState(false);

  // Natural Voice Selection & SpeechSynthesis Management
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lastTickTimeRef = useRef<number>(Date.now());
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const totalDuration = durationMode;

  // Determine active scene based on currentTime
  const currentSceneIdx = Math.min(
    Math.floor((currentTime / totalDuration) * DEMO_SCENES_120S.length),
    DEMO_SCENES_120S.length - 1
  );
  const activeScene = DEMO_SCENES_120S[currentSceneIdx];

  // Helper to load natural voices reliably across Chrome, Safari, Edge, Firefox
  const populateVoices = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      // Filter out low-quality/robotic synthesizers (like espeak, compact) if natural voices are present
      const qualityVoices = voices.filter(v => 
        !v.name.toLowerCase().includes('espeak') && 
        !v.name.toLowerCase().includes('compact')
      );
      const voicePool = qualityVoices.length > 0 ? qualityVoices : voices;
      setAvailableVoices(voicePool);
      
      // Select best human-sounding natural voice with warm conversational tone
      if (!selectedVoiceName) {
        const preferred = voicePool.find(v => 
          v.lang.startsWith('en') && (
            v.name.includes('Natural') || 
            v.name.includes('Google US English') ||
            v.name.includes('Samantha') || 
            v.name.includes('Jenny') ||
            v.name.includes('Aria') ||
            v.name.includes('Guy') ||
            v.name.includes('Ava') ||
            v.name.includes('Daniel')
          )
        ) || voicePool.find(v => v.lang === 'en-US') || voicePool.find(v => v.lang.startsWith('en'));
        
        if (preferred) {
          setSelectedVoiceName(preferred.name);
        }
      }
    }
  };

  useEffect(() => {
    populateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Web Audio sound generator for crisp, cinematic auditory chimes
  const playSoundEffect = (type: 'swoosh' | 'ping' | 'beep' | 'lock' | 'chime' | 'shutter' | 'siren') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'swoosh') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'ping') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'lock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.setValueAtTime(750, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'shutter') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(200, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'siren') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.2);
        osc.frequency.linearRampToValueAtTime(650, now + 0.4);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (e) {
      // AudioContext unavailable
    }
  };

  // Speak narration with natural human cadence, rate, and pitch
  const speakTextNaturally = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isMuted) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Natural human cadence settings: 0.93 rate provides natural, articulate conversational delivery
    utterance.rate = 0.93;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(v => v.name === selectedVoiceName) ||
        voices.find(v => v.lang.startsWith('en') && (
          v.name.includes('Natural') || 
          v.name.includes('Google') || 
          v.name.includes('Samantha') || 
          v.name.includes('Jenny') ||
          v.name.includes('Aria') ||
          v.name.includes('Guy')
        )) ||
        voices.find(v => v.lang === 'en-US') ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Scene transition watcher for narration playback in walkthrough mode
  const prevSceneIdRef = useRef<number>(-1);
  useEffect(() => {
    if (!isOpen || activeTab !== 'walkthrough' || !isPlaying || isMuted) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (activeScene.id !== prevSceneIdRef.current) {
      prevSceneIdRef.current = activeScene.id;
      playSoundEffect('swoosh');
      speakTextNaturally(activeScene.narration);
    }
  }, [activeScene.id, isOpen, isPlaying, isMuted, activeTab, selectedVoiceName, durationMode]);

  // Main playback timer for walkthrough mode
  useEffect(() => {
    if (!isOpen || activeTab !== 'walkthrough') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    lastTickTimeRef.current = Date.now();

    const interval = setInterval(() => {
      if (!isPlaying) {
        lastTickTimeRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const deltaSec = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setCurrentTime(prev => {
        const next = prev + deltaSec;
        if (next >= totalDuration) {
          setIsPlaying(false);
          playSoundEffect('chime');
          return totalDuration;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, totalDuration, activeTab]);

  const handleTogglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setIsPlaying(true);
      prevSceneIdRef.current = -1;
    } else {
      setIsPlaying(!isPlaying);
      if (isPlaying) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }
    }
  };

  const handleRewind = () => {
    setCurrentTime(0);
    prevSceneIdRef.current = -1;
    setIsPlaying(true);
    playSoundEffect('ping');
  };

  const handleSeekScene = (scene: DemoScene) => {
    const targetTime = durationMode === 60 ? (scene.timeStart / 2) : scene.timeStart;
    setCurrentTime(targetTime);
    prevSceneIdRef.current = -1;
    setIsPlaying(true);
    playSoundEffect('ping');
  };

  const handleTestVoicePreview = () => {
    playSoundEffect('chime');
    speakTextNaturally("This is the natural, crystal-clear voiceover for Police SafeGuard. Designed to keep you calm, informed, and constitutionally protected in every police encounter.");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyMarketingCopy = () => {
    const copyText = `POLICE SAFEGUARD — CIVILIAN CONSTITUTIONAL SHIELD & LEGAL COPILOT
========================================================================
Never face a traffic stop or police encounter unprepared. Police SafeGuard gives you real-time constitutional protection:

🛡️ KEY FEATURES EXPLORED:
1. Hands-Free Voice Trigger: Say 'SafeGuard, Traffic Stop' to instantly lock Austin, TX GPS and load state statutes.
2. Real-Time AI Rights Shield: Dual front/rear stealth cloud recording with live speech transcription and constitutional Fifth Amendment whisper prompts.
3. Officer Badge OCR: Automatic badge #4829 scanner and Miranda Warning audit verification.
4. 1-Touch Emergency SOS: Dispatches encrypted live stream link & GPS pin to family & legal counsel.
5. Zero-Knowledge Cryptographic Vault: SHA-256 evidence sealing tamper-proof for court admissibility.
6. Transparent Community Pledges: 5% donated to honest police officer wellness & 5% to the Bail Relief Vault.

💳 SUBSCRIPTION PLANS:
• Monthly Pro: $14.99/mo with a 30-Day Free Trial (Auto-billed recurring monthly until canceled).
• Annual Pro: $49.99/yr (Immediate coverage, auto-renews annually, no free trial).
• Lifetime Pass: $79.99 one-time (Guaranteed perpetual access, limited to 100 slots).

🔗 Live at: https://PoliceSafeGuard.com`;

    navigator.clipboard.writeText(copyText);
    setCopiedMarketingCopy(true);
    setTimeout(() => setCopiedMarketingCopy(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-5xl max-h-[95vh] rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-950/40 via-zinc-900 to-amber-950/30 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md shadow-amber-950/50">
              <Shield className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Police SafeGuard • Feature-By-Feature Live Demonstration
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider">
                  Live Showcase
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Fictitious demo data (Austin, TX • Jane M. Doe) • Natural AI voiceover • Full feature exploration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarketingCopy}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              title="Copy marketing transcript"
            >
              {copiedMarketingCopy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMarketingCopy ? 'Copied Transcript!' : 'Copy Script'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode & Voice Control Bar */}
        <div className="bg-zinc-900/90 px-3 sm:px-4 py-2 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          
          {/* Dual Exploration Mode Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-[11px] font-semibold mr-1">Mode:</span>
            <div className="flex bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('walkthrough');
                  setIsPlaying(true);
                  prevSceneIdRef.current = -1;
                }}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'walkthrough'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>🎬 Auto Walkthrough ({durationMode}s)</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setActiveTab('interactive');
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                }}
                className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'interactive'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>📱 Explore Features Hands-On</span>
              </button>
            </div>
          </div>

          {/* Voiceover Engine Selector (Natural Human Voices) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800 text-[11px]">
              <span className="text-amber-400 font-bold">Voice:</span>
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  speakTextNaturally("Natural voice profile updated. Audio narrator is ready.");
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[210px] truncate"
              >
                {availableVoices.filter(v => v.lang.startsWith('en')).map((v, i) => (
                  <option key={i} value={v.name} className="bg-zinc-900 text-white">
                    {v.name.replace(/Microsoft |Google |Apple /g, '')} ({v.lang})
                  </option>
                ))}
                {availableVoices.length === 0 && (
                  <option value="" className="bg-zinc-900 text-white">Natural Studio Voice (Auto)</option>
                )}
              </select>

              <button
                type="button"
                onClick={handleTestVoicePreview}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[10px] shrink-0"
                title="Hear a quick voice sample"
              >
                Test Voice
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-800"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice Active'}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-4">
          
          {/* TAB 1: AUTO WALKTHROUGH MODE */}
          {activeTab === 'walkthrough' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Video Player Display */}
              <div className="relative rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl p-3 sm:p-5 flex flex-col items-center">
                
                {/* Scene Chapter Banner */}
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${activeScene.badgeColor}`}>
                    <Sparkles className="w-3 h-3" />
                    {activeScene.badge}
                  </span>
                  
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                    {isSpeaking && (
                      <span className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Natural Voice Narrating
                      </span>
                    )}
                    <span>Austin, TX • Jane M. Doe</span>
                  </div>
                </div>

                {/* Smartphone Device Mockup Frame */}
                <div className="w-full max-w-md rounded-[2.5rem] bg-zinc-900 border-4 border-zinc-800 shadow-2xl overflow-hidden flex flex-col ring-1 ring-zinc-700/50">
                  
                  {/* Status Bar */}
                  <div className="bg-black text-white px-5 py-2 flex items-center justify-between text-[11px] font-mono shrink-0">
                    <span className="font-bold">9:41 AM</span>
                    <div className="w-24 h-4 bg-zinc-950 rounded-full flex items-center justify-center gap-1.5 border border-zinc-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">CLOUD STREAM</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* App Screen Content dynamically changes based on active scene */}
                  <div className="bg-zinc-950 p-4 min-h-[390px] flex flex-col justify-between text-zinc-100 relative">
                    
                    {/* SCENE 1: Instant Activation & Voice Trigger */}
                    {activeScene.id === 1 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border-2 border-red-500 shadow-lg shadow-red-950/50 animate-pulse">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                              EMERGENCY TRAFFIC STOP LAUNCHED
                            </span>
                            <span className="text-[10px] font-mono font-bold text-white bg-red-500/30 px-1.5 py-0.5 rounded">00:14</span>
                          </div>
                          <div className="text-xs font-bold text-white">Voice Command Triggered:</div>
                          <div className="text-[11px] font-mono text-emerald-400 font-semibold italic">"SafeGuard, Traffic Stop"</div>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-medium">Driver:</span>
                            <span className="font-bold text-white font-mono">Jane M. Doe (Austin, TX)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-medium">Driver License:</span>
                            <span className="font-mono text-zinc-300">Texas DL #48920194</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-medium">GPS Telemetry:</span>
                            <span className="text-amber-400 font-mono font-bold">30.2672° N, 97.7431° W (Travis Co.)</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200 space-y-1">
                          <div className="font-bold text-amber-300 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Texas Penal Code § 38.02 (Duty to ID)
                          </div>
                          <p className="text-zinc-300 leading-tight">
                            Drivers must surrender DL/insurance upon lawful traffic stop. Passengers are NOT required to identify unless lawfully arrested.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SCENE 2: Real-Time AI Rights Shield */}
                    {activeScene.id === 2 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="relative h-28 rounded-2xl bg-zinc-900 border border-zinc-700 overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-2">
                            <div className="flex justify-between items-center text-[9px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-red-600 font-bold text-white uppercase">LIVE FEED</span>
                              <span className="text-zinc-300">STEALTH REC • 1080P</span>
                            </div>
                            <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              AUDIO WAVEFORM ACTIVE (48.2 dB)
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-red-400">Officer Speech Detected:</span>
                            <span className="text-[10px] font-mono text-zinc-500">Live Transcribed</span>
                          </div>
                          <p className="text-zinc-200 font-mono italic text-[11px] bg-black/60 p-2 rounded-lg border border-zinc-800">
                            "Driver, do you know how fast you were going back there?"
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Legal Guidance (Fifth Amendment Protection)</span>
                          </div>
                          <p className="text-zinc-200 text-[11px] leading-tight font-medium">
                            "Officer, I am exercising my right to remain silent under the Fifth Amendment. I do not answer questions regarding speed."
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SCENE 3: Officer Badge OCR & Miranda Auditor */}
                    {activeScene.id === 3 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="p-3 rounded-xl bg-zinc-900 border border-indigo-500/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                              <Camera className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Officer Badge OCR Scanner Locked</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-mono font-bold">
                              OCR MATCH 99.4%
                            </span>
                          </div>

                          <div className="p-2 bg-black/70 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Officer Name:</span>
                              <span className="text-white font-bold">Officer J. Vance</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Badge Number:</span>
                              <span className="text-amber-400 font-bold">#4829</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Department:</span>
                              <span>Austin Police Dept (Patrol 204)</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-[10px] space-y-1">
                          <div className="font-bold text-red-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              Miranda Warning Compliance Status
                            </span>
                            <span className="font-mono text-red-400 font-black">NOT GIVEN</span>
                          </div>
                          <p className="text-zinc-300 leading-tight">
                            Officer has not recited Miranda warnings. Any custodial interrogation statements are inadmissible under Miranda v. Arizona.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-200">
                          <div className="font-bold text-amber-300 mb-0.5">Fourth Amendment Search Refusal:</div>
                          <p className="text-zinc-300 italic">"Officer, I do not consent to any search of this vehicle, my passengers, or my personal effects."</p>
                        </div>
                      </div>
                    )}

                    {/* SCENE 4: Emergency SOS Broadcast */}
                    {activeScene.id === 4 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="p-3 rounded-2xl bg-red-950/80 border-2 border-red-500 shadow-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-white">
                              <Radio className="w-4 h-4 text-red-400 animate-ping" />
                              <span>DISTRESS SOS BROADCAST DISPATCHED</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold">
                              ACTIVE
                            </span>
                          </div>
                          <p className="text-[11px] text-red-200 leading-tight">
                            Silent emergency distress packet dispatched over encrypted cellular network to verified witnesses.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                          <span className="text-[10px] font-bold uppercase text-zinc-400 block">Witness Dispatch Recipients:</span>
                          
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-zinc-800">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-teal-400" />
                                <div>
                                  <div className="font-bold text-white">Marcus Doe (Emergency Contact)</div>
                                  <div className="text-[10px] text-zinc-400">(512) 555-0194 • Live Stream Dispatched</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">DELIVERED</span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-zinc-800">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                <div>
                                  <div className="font-bold text-white">Sarah Jenkins, Esq. (Legal Counsel)</div>
                                  <div className="text-[10px] text-zinc-400">Jenkins Law PLLC • Live Telemetry Active</div>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">DELIVERED</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SCENE 5: Tamper-Proof Cryptographic Vault */}
                    {activeScene.id === 5 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                              <Lock className="w-4 h-4 text-purple-400" />
                              <span>Zero-Knowledge Tamper-Proof Vault</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-mono font-black">
                              SEALED
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-tight">
                            Digital evidence cannot be destroyed, confiscated, or altered. Sealed with client-side SHA-256 fingerprint.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-500">Cryptographic Hash:</span>
                            <span className="text-emerald-400 font-bold">SHA-256 Verified</span>
                          </div>
                          <div className="p-2 rounded bg-black border border-zinc-800 font-mono text-[9px] text-zinc-300 break-all select-all">
                            7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-400 pt-1 font-mono">
                            <span>Chain of Custody: Complete</span>
                            <span>Court Admissible: Yes</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 flex items-center justify-between">
                          <span>Evidence Auto-Synced to Dual Cloud Nodes</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                    )}

                    {/* SCENE 6: In-App Stripe Checkout & Community Pledges */}
                    {activeScene.id === 6 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                              <span>Live Stripe In-App Subscription</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                              30-Day Free Trial
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-tight">
                            Enroll in $14.99/mo with 30-day free trial, choose $49.99/yr annual pro, or claim a $79.99 lifetime access pass.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                            <div className="text-[9px] text-zinc-400 font-mono uppercase">Monthly</div>
                            <div className="font-black text-white text-xs">$14.99/mo</div>
                            <div className="text-[8px] text-emerald-400 font-bold mt-0.5">30-Day Free Trial</div>
                          </div>
                          <div className="p-2 rounded-xl bg-zinc-900 border border-indigo-500/50">
                            <div className="text-[9px] text-indigo-400 font-mono uppercase">Annual</div>
                            <div className="font-black text-white text-xs">$49.99/yr</div>
                            <div className="text-[8px] text-amber-400 font-bold mt-0.5">Auto-Renews</div>
                          </div>
                          <div className="p-2 rounded-xl bg-zinc-900 border border-amber-500/50">
                            <div className="text-[9px] text-amber-400 font-mono uppercase">Lifetime</div>
                            <div className="font-black text-amber-300 text-xs">$79.99</div>
                            <div className="text-[8px] text-zinc-400 font-bold mt-0.5">100 Slots</div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[10px] text-blue-200 space-y-1">
                          <div className="font-bold text-blue-300">Dual 5% Community Impact:</div>
                          <p className="text-zinc-300 leading-tight">
                            5% pledged to honest police training & officer wellness • 5% pledged to Bail Relief Vault.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Universal Teleprompter Captions Bar */}
                    <div className="mt-auto pt-3 border-t border-zinc-800">
                      <div className="bg-black/80 p-2.5 rounded-xl border border-zinc-800 text-center">
                        <span className="text-[9px] uppercase tracking-wider text-amber-400 font-mono font-bold block mb-0.5">
                          CAPTION • {activeScene.title}
                        </span>
                        <p className="text-xs text-white font-medium leading-relaxed">
                          "{activeScene.captions}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Scrubber & Player Controls */}
                <div className="w-full max-w-xl mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="font-bold text-white">{formatTime(currentTime)}</span>
                    <div className="flex gap-1.5">
                      {DEMO_SCENES_120S.map((scene) => (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => handleSeekScene(scene)}
                          className={`w-5 h-2 rounded-full transition-all cursor-pointer ${
                            scene.id === activeScene.id
                              ? 'bg-amber-400 w-8'
                              : scene.id < activeScene.id
                              ? 'bg-emerald-500'
                              : 'bg-zinc-800'
                          }`}
                          title={scene.title}
                        />
                      ))}
                    </div>
                    <span>{formatTime(totalDuration)}</span>
                  </div>

                  {/* Scrubber Range Slider */}
                  <input
                    type="range"
                    min={0}
                    max={totalDuration}
                    step={0.5}
                    value={currentTime}
                    onChange={(e) => {
                      setCurrentTime(parseFloat(e.target.value));
                      prevSceneIdRef.current = -1;
                    }}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />

                  {/* Playback Button Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRewind}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Restart Video"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="py-2 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-950/60"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
                        <span>{isPlaying ? 'Pause' : 'Play Walkthrough'}</span>
                      </button>
                    </div>

                    {/* Scene Quick Jump Dropdown */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-500 text-[11px] hidden sm:inline">Chapter:</span>
                      <select
                        value={activeScene.id}
                        onChange={(e) => {
                          const chosen = DEMO_SCENES_120S.find(s => s.id === parseInt(e.target.value, 10));
                          if (chosen) handleSeekScene(chosen);
                        }}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer"
                      >
                        {DEMO_SCENES_120S.map((s) => (
                          <option key={s.id} value={s.id}>
                            Scene {s.id}: {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE FEATURE-BY-FEATURE HANDS-ON EXPLORER */}
          {activeTab === 'interactive' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Feature Navigator Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { 
                    key: 'voice', 
                    label: '1. Voice & HUD', 
                    icon: Mic, 
                    color: 'text-red-400',
                    narration: "Feature 1: Hands-Free Voice Command Launcher and Texas GPS HUD. Speak 'SafeGuard Traffic Stop' to activate constitutional protection without touching your phone."
                  },
                  { 
                    key: 'copilot', 
                    label: '2. AI Rights Copilot', 
                    icon: MessageSquare, 
                    color: 'text-amber-400',
                    narration: "Feature 2: Real-Time AI Constitutional Rights Copilot. Transcribes officer questioning and delivers Fifth Amendment legal guidance straight to your earbud."
                  },
                  { 
                    key: 'ocr', 
                    label: '3. Badge OCR', 
                    icon: Camera, 
                    color: 'text-indigo-400',
                    narration: "Feature 3: Officer Badge OCR Scanner. Automatically identifies badge numbers, patrol unit markings, and logs Fourth Amendment search refusals."
                  },
                  { 
                    key: 'distress', 
                    label: '4. SOS Dispatch', 
                    icon: Radio, 
                    color: 'text-teal-400',
                    narration: "Feature 4: One-touch silent distress dispatch. Immediately texts encrypted live stream video and your GPS pin to your emergency contacts."
                  },
                  { 
                    key: 'vault', 
                    label: '5. SHA Vault', 
                    icon: Lock, 
                    color: 'text-purple-400',
                    narration: "Feature 5: Zero-Knowledge Evidence Vault. Generates immutable SHA-256 digital custody certificates ready for courtroom presentation."
                  },
                  { 
                    key: 'pricing', 
                    label: '6. In-App Stripe', 
                    icon: CreditCard, 
                    color: 'text-emerald-400',
                    narration: "Feature 6: In-App Stripe Payments. Enjoy a 30-day free trial at $14.99 monthly, choose Annual Pro for $49.99, or claim lifetime access for $79.99 with dual 5% community pledges."
                  }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setInteractiveFeature(item.key as any);
                      playSoundEffect('ping');
                      speakTextNaturally(item.narration);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      interactiveFeature === item.key
                        ? 'bg-amber-400/15 border-amber-400 shadow-md ring-1 ring-amber-400/40 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="font-extrabold text-[11px] leading-tight truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Hands-On Interactive Stage for selected feature */}
              <div className="p-4 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4">
                
                {/* INTERACTIVE 1: Voice Trigger & HUD */}
                {interactiveFeature === 'voice' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold">
                          <Mic className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Hands-Free Voice Command Launcher</h4>
                          <p className="text-[11px] text-zinc-400">Trigger legal protection without touching the phone</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsVoiceTriggerFired(!isVoiceTriggerFired);
                          playSoundEffect(isVoiceTriggerFired ? 'ping' : 'siren');
                          if (!isVoiceTriggerFired) {
                            speakTextNaturally("SafeGuard Traffic Stop engaged. GPS locked in Austin, Texas. Texas Penal Code section 38.02 loaded.");
                          }
                        }}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                          isVoiceTriggerFired
                            ? 'bg-red-500 text-white shadow-lg shadow-red-950/60'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{isVoiceTriggerFired ? 'Reset Trigger' : 'Simulate Voice Trigger: "SafeGuard, Traffic Stop"'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">Traffic Stop HUD Status</span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Voice Recognition:</span>
                          <span className={`font-mono font-bold ${isVoiceTriggerFired ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {isVoiceTriggerFired ? 'TRIGGERED ("SafeGuard, Traffic Stop")' : 'LISTENING IN BACKGROUND'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">GPS Coordinates:</span>
                          <span className="font-mono text-amber-400 font-bold">30.2672° N, 97.7431° W</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400">Jurisdiction:</span>
                          <span className="text-white font-bold">Austin, TX (Travis County)</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Texas Penal Code § 38.02 Loaded</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          Under Texas law, drivers are required to display driver license and proof of financial responsibility upon a lawful traffic stop. Passengers are not required to provide identification unless lawfully arrested.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE 2: Real-Time AI Legal Copilot */}
                {interactiveFeature === 'copilot' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Real-Time Speech Transcription & Legal Whisper Shield</h4>
                          <p className="text-[11px] text-zinc-400">Transcribes police speech and provides instant 5th Amendment responses</p>
                        </div>
                      </div>

                      <div className="flex gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSimulatedOfficerQuestion('speed');
                            playSoundEffect('ping');
                            speakTextNaturally("Fifth Amendment guidance: Politely state you exercise your right to remain silent, and do not guess your speed.");
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            simulatedOfficerQuestion === 'speed' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Q1: Speeding
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimulatedOfficerQuestion('search');
                            playSoundEffect('ping');
                            speakTextNaturally("Fourth Amendment guidance: State clearly, Officer, I do not consent to any searches.");
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            simulatedOfficerQuestion === 'search' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Q2: Car Search
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimulatedOfficerQuestion('weapons');
                            playSoundEffect('ping');
                            speakTextNaturally("Officer safety protocol: Keep your hands visible on the steering wheel, and inform calmly if you are a licensed concealed carrier.");
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                            simulatedOfficerQuestion === 'weapons' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Q3: Weapons
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-red-400 block font-mono">Officer Speech Audio Stream:</span>
                        <div className="p-2.5 rounded-xl bg-black border border-zinc-800 font-mono text-xs text-white">
                          {simulatedOfficerQuestion === 'speed' && '"Driver, do you know how fast you were going in that 45 mph zone?"'}
                          {simulatedOfficerQuestion === 'search' && '"Do you mind if I take a quick look in your backseat and trunk?"'}
                          {simulatedOfficerQuestion === 'weapons' && '"Are there any firearms or prohibited weapons in this vehicle today?"'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-emerald-400 block flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Recommended Constitutional Response (1-Tap Speak or Read Aloud):
                        </span>
                        <p className="text-xs text-emerald-200 font-semibold leading-relaxed">
                          {simulatedOfficerQuestion === 'speed' && '"Officer, I am exercising my right to remain silent under the Fifth Amendment. I do not answer roadside questions regarding my speed."'}
                          {simulatedOfficerQuestion === 'search' && '"Officer, I respectfully decline and do not consent to any searches of my person, passenger, or vehicle under the Fourth Amendment."'}
                          {simulatedOfficerQuestion === 'weapons' && '"Officer, my hands are clearly visible on the steering wheel. I have no unlawful weapons. May I reach into my glovebox for my registration?"'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE 3: Officer Badge OCR & Miranda Auditor */}
                {interactiveFeature === 'ocr' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Officer Badge OCR & Miranda Compliance Auditor</h4>
                          <p className="text-[11px] text-zinc-400">Automated optical recognition and custodial rights tracking</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOcrScanRunning(true);
                          playSoundEffect('shutter');
                          setTimeout(() => {
                            setIsOcrScanRunning(false);
                            playSoundEffect('ping');
                            speakTextNaturally("Officer Badge number 4829 scanned. Officer J. Vance, Austin Police Department. Miranda warning compliance check: Not read.");
                          }, 900);
                        }}
                        disabled={isOcrScanRunning}
                        className="py-2 px-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isOcrScanRunning ? 'Scanning Optical Badge...' : 'Run Live Badge Scanner'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-indigo-500/40 space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-indigo-300 block">Optical Character Recognition Output</span>
                        <div className="p-2.5 rounded-xl bg-black border border-zinc-800 font-mono text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Badge Number:</span>
                            <span className="text-amber-400 font-bold">#4829</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Officer Name:</span>
                            <span className="text-white font-bold">Officer J. Vance</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Agency:</span>
                            <span>Austin Police Department</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Patrol Unit:</span>
                            <span className="text-zinc-300">Unit #204</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-red-300">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Miranda Warning Auditor
                          </span>
                          <span className="font-mono text-red-400 font-black">NON-COMPLIANT</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          SafeGuard's continuous audio auditor verifies that standard Miranda warnings were not read prior to custodial questions. If officer detains citizen, un-Mirandized statements are inadmissible in criminal proceedings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE 4: 1-Touch Emergency Distress SOS */}
                {interactiveFeature === 'distress' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Silent Emergency Distress SOS Broadcast</h4>
                          <p className="text-[11px] text-zinc-400">One-touch dispatch with live video link and GPS telemetry</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDistressDispatched(!isDistressDispatched);
                          playSoundEffect(isDistressDispatched ? 'ping' : 'siren');
                          if (!isDistressDispatched) {
                            speakTextNaturally("Emergency distress signal dispatched to emergency contacts with encrypted live video streaming URL.");
                          }
                        }}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                          isDistressDispatched
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/60'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>{isDistressDispatched ? 'Dispatched (Tap to Reset)' : 'Send Silent Emergency SOS'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block font-mono">Simulated Emergency SMS Packet:</span>
                      
                      <div className="p-3 rounded-xl bg-black/80 border border-zinc-800 font-mono text-xs space-y-1.5 text-zinc-200">
                        <div className="text-red-400 font-bold">🚨 POLICE SAFEGUARD DISTRESS ALERT:</div>
                        <p className="text-[11px] text-zinc-300 leading-snug">
                          Jane Doe is currently in a police encounter in Austin, TX. Watch live video feed & GPS telemetry in real-time:
                        </p>
                        <div className="text-teal-400 underline text-[11px] font-bold">
                          https://PoliceSafeGuard.com/live/stream_tx_jane_4829
                        </div>
                        <div className="text-[10px] text-zinc-500 pt-1">
                          Dispatched to: Marcus Doe (Family) & Sarah Jenkins (Legal Counsel)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE 5: Zero-Knowledge Cryptographic Vault */}
                {interactiveFeature === 'vault' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Zero-Knowledge Cryptographic Evidence Vault</h4>
                          <p className="text-[11px] text-zinc-400">SHA-256 evidence fingerprinting immune to tampering</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsVaultHashed(true);
                          playSoundEffect('lock');
                          speakTextNaturally("Cryptographic evidence sealed. SHA-256 fingerprint verified and stored in cloud vault.");
                        }}
                        className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isVaultHashed ? 'Hash Re-Sealed' : 'Seal Encounter Fingerprint'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-mono">Digital Signature Algorithm:</span>
                        <span className="text-emerald-400 font-bold font-mono">SHA-256 (NIST Certified)</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black border border-zinc-800 font-mono text-[10px] text-purple-300 break-all select-all">
                        {isVaultHashed 
                          ? '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069' 
                          : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        If police confiscate or power down the device, the remote vault maintains an unaltered, certified chain of custody report ready for defense attorneys and court filing.
                      </p>
                    </div>
                  </div>
                )}

                {/* INTERACTIVE 6: In-App Stripe Checkout & Pricing */}
                {interactiveFeature === 'pricing' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Live Stripe Subscriptions & Community Pledges</h4>
                          <p className="text-[11px] text-zinc-400">Direct in-app checkout, 30-day free trial, and dual 5% charity contributions</p>
                        </div>
                      </div>

                      {onOpenStripePortal && (
                        <button
                          type="button"
                          onClick={() => {
                            playSoundEffect('ping');
                            onOpenStripePortal();
                          }}
                          className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/60"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Open Live Payment Modal</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Monthly Pro Defense</span>
                        <div className="text-xl font-black text-white">$14.99<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                        <p className="text-[11px] text-zinc-400">
                          Includes <strong>30-day free trial ($0.00 today)</strong>. Auto-bills recurring monthly on Day 30 until canceled. Cancel anytime in 1 click.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold">Annual Pro Defense</span>
                        <div className="text-xl font-black text-white">$49.99<span className="text-xs font-normal text-zinc-400">/yr</span></div>
                        <p className="text-[11px] text-zinc-300">
                          Immediate coverage. <strong>No free trial</strong>. Auto-renews annually at $49.99/year until canceled.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Early Access Lifetime Pass</span>
                        <div className="text-xl font-black text-amber-300">$79.99<span className="text-xs font-normal text-zinc-400"> Once</span></div>
                        <p className="text-[11px] text-zinc-300">
                          One-time charge. Never bills again. Guaranteed perpetual access across all encounters. Limited to 100 slots.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-blue-300 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-400" />
                          <span>Dual 5% Community Pledge Model</span>
                        </div>
                        <p className="text-zinc-300 text-[11px] mt-0.5">
                          5% of every payment supports honest police wellness charities, and 5% funds the Wrongful Accusation Bail Relief Vault.
                        </p>
                      </div>
                      <span className="text-amber-400 font-mono font-bold text-xs shrink-0 pl-2">10% Total Pledged</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info Bar */}
        <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <span>Police SafeGuard v2.4</span>
            <span>•</span>
            <span>Stripe Payments Active</span>
            <span>•</span>
            <span className="text-amber-400">Annual $49.99/yr • Lifetime $79.99</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenStripePortal && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  onOpenStripePortal();
                }}
                className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-black font-extrabold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-md shadow-amber-950/60 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Start 30-Day Free Trial ($14.99/mo)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="py-2 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Close Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
