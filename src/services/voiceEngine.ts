import { VoiceOption } from '../types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'standard-system',
    name: 'Standard System Voice',
    gender: 'neutral',
    accent: 'Neutral English',
    description: 'Crisp synthetic text-to-speech engine (Included in Free tier)',
    isPaidOnly: false,
    rate: 1.0,
    pitch: 1.0
  },
  {
    id: 'calm-guardian',
    name: 'Dr. Alicia Vance (Calm Defense)',
    gender: 'female',
    accent: 'Calm & Reassuring (Natural)',
    description: 'Lower anxiety during tense encounters; smooth de-escalation pacing',
    isPaidOnly: true,
    rate: 0.92,
    pitch: 0.95
  },
  {
    id: 'executive-counsel',
    name: 'Marcus Kane (Executive Counsel)',
    gender: 'male',
    accent: 'Authoritative & Clear (Natural)',
    description: 'Firm, articulate constitutional legal delivery in your earpiece',
    isPaidOnly: true,
    rate: 0.96,
    pitch: 0.85
  },
  {
    id: 'bilingual-shield',
    name: 'Elena Ramos (Bilingual Shield)',
    gender: 'female',
    accent: 'Bilingual English/Spanish',
    description: 'Instant translation delivery and dual-language vocal cadence',
    isPaidOnly: true,
    rate: 0.95,
    pitch: 1.05
  },
  {
    id: 'discrete-whisper',
    name: 'Stealth Whisper Mode',
    gender: 'neutral',
    accent: 'Low-Decibel Sub-Vocal',
    description: 'Ultra-quiet subdued pitch designed specifically for covert earpiece use',
    isPaidOnly: true,
    rate: 0.88,
    pitch: 0.75
  }
];

export class VoiceEngine {
  private static cachedVoices: SpeechSynthesisVoice[] = [];
  private static hasInitVoices = false;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  private static get synth(): SpeechSynthesis | null {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis;
    }
    return null;
  }

  static initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      try {
        const v = this.synth?.getVoices() || [];
        if (v && v.length > 0) {
          this.cachedVoices = v;
        }
      } catch (e) {}
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    }
  }

  static getSystemVoices(): SpeechSynthesisVoice[] {
    this.initVoices();
    try {
      const live = this.synth?.getVoices() || [];
      if (live.length > 0) {
        this.cachedVoices = live;
      }
    } catch (e) {}
    return this.cachedVoices;
  }

  static unlockAudio() {
    if (typeof window === 'undefined') return;
    try {
      this.initVoices();
      if (this.synth) {
        if (this.synth.paused) {
          this.synth.resume();
        }
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play an inaudible 1ms buffer to prime browser audio hardware
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (e) {}
  }

  static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Evaluates if spoken speech contains an emergency arrest, police custody, or phone seizure voice trigger.
   * Matches both citizen statements ("I am being arrested", "arrest mode", "lock my phone")
   * and officer commands ("you are under arrest", "hands behind your back", "give me your phone").
   */
  static isArrestCommand(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').trim();
    
    // Exact or phrase triggers
    const directTriggers = [
      'arrrst',
      'arrrst mode',
      'arrrest',
      'arrrest mode',
      'arest',
      'arest mode',
      'arres',
      'arres mode',
      'arrest',
      'arrested',
      'under arrest',
      'being arrested',
      'im being arrested',
      "i'm being arrested",
      'i am being arrested',
      'they are arresting me',
      'he is arresting me',
      'she is arresting me',
      'officer is arresting me',
      'police is arresting me',
      'im under arrest',
      "i'm under arrest",
      'i am under arrest',
      'you are under arrest',
      "you're under arrest",
      'place you under arrest',
      'placing you under arrest',
      'arrest mode',
      'arrest lockdown',
      'police arrest',
      'custody mode',
      'police custody',
      'custody lock',
      'taking my phone',
      'taking the phone',
      'take my phone',
      'take the phone',
      'took my phone',
      'seize my phone',
      'seizing my phone',
      'seized my phone',
      'officer taking phone',
      'police taking phone',
      'give me that phone',
      'give me the phone',
      'give me your phone',
      'hand me that phone',
      'hand over the phone',
      'hand over your phone',
      'handcuff',
      'handcuffs',
      'cuff him',
      'cuff her',
      'cuff me',
      'hands behind your back',
      'hands behind back',
      'put your hands behind',
      'lock phone',
      'lock my phone',
      'lock device',
      'lock my device',
      'lockdown',
      'police lockdown',
      'screen lock',
      'device screen lock',
      'lock screen',
      'lock the screen',
      'timeout screen',
      'time out screen',
      'screen timeout',
      'sleep screen',
      'turn off screen',
      'black out screen',
      'blackout screen',
      'code red',
      'duress lock',
      'seal evidence',
      'seal all evidence',
      'emergency arrest',
      'fifth amendment lock',
      '5th amendment lock'
    ];

    if (directTriggers.some(pattern => lower.includes(pattern))) {
      return true;
    }

    // Regex check for phonetic matches of arrest/arrrst/arrrest mode
    if (/\ba+r{1,4}[eao]{0,2}s{1,3}t\s*(mode|lockdown|now)?\b/i.test(lower)) {
      return true;
    }

    return false;
  }

  static createRecognition(onResult: (text: string, isFinal: boolean) => void, onError?: (err: any) => void): any {
    if (!this.isSpeechRecognitionSupported()) return null;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        onResult(final.trim(), true);
      } else if (interim) {
        onResult(interim.trim(), false);
      }
    };

    rec.onerror = (e: any) => {
      if (onError) onError(e);
    };

    // Default safe onend to ensure recognition never enters an automated restart loop
    rec.onend = () => {};

    return rec;
  }

  /**
   * Speaks advice privately to the user.
   * If whisper mode is active, dampens volume and pitch.
   */
  static speakAdvice(text: string, voiceOptionId: string, whisperMode = false, onEnd?: () => void) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }
    this.initVoices();

    const selectedVoice = AVAILABLE_VOICES.find(v => v.id === voiceOptionId) || AVAILABLE_VOICES[0];
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose browser voice that matches gender/accent if available
    const systemVoices = this.getSystemVoices();
    if (systemVoices && systemVoices.length > 0) {
      if (selectedVoice.id === 'calm-guardian') {
        const female = systemVoices.find(v => 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('samantha') || 
           v.name.toLowerCase().includes('victoria') || 
           v.name.toLowerCase().includes('zira') || 
           v.name.toLowerCase().includes('karen') || 
           v.name.toLowerCase().includes('ava') || 
           v.name.toLowerCase().includes('cora') || 
           v.name.toLowerCase().includes('jenny') || 
           v.name.toLowerCase().includes('f0') ||
           v.name.toLowerCase().includes('woman')) && 
          v.lang.startsWith('en')
        );
        if (female) {
          utterance.voice = female;
        } else {
          const enVoices = systemVoices.filter(v => v.lang.startsWith('en'));
          if (enVoices.length > 1) utterance.voice = enVoices[1];
        }
      } else if (selectedVoice.id === 'executive-counsel') {
        const male = systemVoices.find(v => 
          (v.name.toLowerCase().includes('male') || 
           v.name.toLowerCase().includes('david') || 
           v.name.toLowerCase().includes('daniel') || 
           v.name.toLowerCase().includes('alex') || 
           v.name.toLowerCase().includes('fred') || 
           v.name.toLowerCase().includes('mark') || 
           v.name.toLowerCase().includes('george') || 
           v.name.toLowerCase().includes('guy') ||
           v.name.toLowerCase().includes('man')) && 
          v.lang.startsWith('en')
        );
        if (male) {
          utterance.voice = male;
        } else {
          const enVoices = systemVoices.filter(v => v.lang.startsWith('en'));
          if (enVoices.length > 0) utterance.voice = enVoices[0];
        }
      } else if (selectedVoice.id === 'bilingual-shield') {
        const spanish = systemVoices.find(v => 
          v.lang.startsWith('es') || 
          v.name.toLowerCase().includes('monica') || 
          v.name.toLowerCase().includes('paulina') ||
          v.name.toLowerCase().includes('diego') ||
          v.name.toLowerCase().includes('jorge') ||
          v.name.toLowerCase().includes('mexic')
        );
        if (spanish) utterance.voice = spanish;
      } else if (selectedVoice.id === 'discrete-whisper') {
        const soft = systemVoices.find(v => v.name.toLowerCase().includes('soft') || v.name.toLowerCase().includes('whisper') || v.lang.startsWith('en'));
        if (soft) utterance.voice = soft;
      }
    }

    if (selectedVoice.id === 'calm-guardian') {
      utterance.pitch = whisperMode ? 0.95 : 1.25;
      utterance.rate = whisperMode ? 0.85 : 0.94;
    } else if (selectedVoice.id === 'executive-counsel') {
      utterance.pitch = whisperMode ? 0.60 : 0.74;
      utterance.rate = whisperMode ? 0.88 : 0.95;
    } else if (selectedVoice.id === 'bilingual-shield') {
      utterance.pitch = whisperMode ? 0.80 : 1.08;
      utterance.rate = whisperMode ? 0.88 : 0.96;
    } else if (selectedVoice.id === 'discrete-whisper') {
      utterance.pitch = 0.65;
      utterance.rate = 0.82;
    } else {
      utterance.pitch = whisperMode ? 0.80 : selectedVoice.pitch;
      utterance.rate = whisperMode ? 0.85 : selectedVoice.rate;
    }

    utterance.volume = whisperMode ? 0.35 : 0.95;

    this.activeUtterance = utterance;
    if (typeof window !== 'undefined') {
      (window as any)._activeUtterance = utterance;
    }

    const words = text.split(/\s+/).length;
    const maxDurationMs = Math.max(8000, (words / 1.5) * 1000 + 5000);
    let keepAliveTimer: any = null;
    let safetyTimer: any = null;

    const cleanup = () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      this.activeUtterance = null;
    };

    utterance.onend = () => {
      cleanup();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      cleanup();
      if (onEnd) onEnd();
    };

    safetyTimer = setTimeout(() => {
      cleanup();
      if (onEnd) onEnd();
    }, maxDurationMs);

    const executeSpeak = () => {
      try {
        if (this.synth) {
          if (this.synth.paused) this.synth.resume();
          this.synth.speak(utterance);
          if (this.synth.paused) this.synth.resume();

          keepAliveTimer = setInterval(() => {
            if (this.synth && this.synth.speaking) {
              this.synth.pause();
              this.synth.resume();
            } else {
              clearInterval(keepAliveTimer);
            }
          }, 8000);
        }
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        cleanup();
        if (onEnd) onEnd();
      }
    };

    if (this.synth.speaking || this.synth.pending) {
      try { this.synth.cancel(); } catch {}
      setTimeout(executeSpeak, 50);
    } else {
      executeSpeak();
    }
  }

  /**
   * Firmly and loudly reads out loud addressing the officer through the device speaker.
   * Maximum volume (1.0), deliberate authoritative pace, clear delivery.
   */
  static speakAloudToOfficer(text: string, voiceOptionId = 'standard-system', onEnd?: () => void) {
    if (!this.synth) {
      this.playAudibleAlertChime();
      if (onEnd) onEnd();
      return;
    }
    this.initVoices();

    const selectedVoice = AVAILABLE_VOICES.find(v => v.id === voiceOptionId) || AVAILABLE_VOICES[0];
    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;
    if (typeof window !== 'undefined') {
      (window as any)._activeUtterance = utterance;
    }

    const systemVoices = this.getSystemVoices();
    if (systemVoices && systemVoices.length > 0) {
      const enVoice = systemVoices.find(v => v.lang.startsWith('en')) || systemVoices[0];
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.volume = 1.0; // Maximum volume for addressing officer directly
    utterance.pitch = 1.0;
    utterance.rate = 0.93; // Clear, assertive, court-grade pace

    const words = text.split(/\s+/).length;
    const maxDurationMs = Math.max(8000, (words / 1.5) * 1000 + 5000);
    let keepAliveTimer: any = null;
    let safetyTimer: any = null;

    const cleanup = () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      this.activeUtterance = null;
    };

    utterance.onend = () => {
      cleanup();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      cleanup();
      this.playAudibleAlertChime();
      if (onEnd) onEnd();
    };

    safetyTimer = setTimeout(() => {
      cleanup();
      if (onEnd) onEnd();
    }, maxDurationMs);

    const executeSpeak = () => {
      try {
        if (this.synth) {
          if (this.synth.paused) this.synth.resume();
          this.synth.speak(utterance);
          if (this.synth.paused) this.synth.resume();

          keepAliveTimer = setInterval(() => {
            if (this.synth && this.synth.speaking) {
              this.synth.pause();
              this.synth.resume();
            } else {
              clearInterval(keepAliveTimer);
            }
          }, 8000);
        }
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
        cleanup();
        this.playAudibleAlertChime();
        if (onEnd) onEnd();
      }
    };

    if (this.synth.speaking || this.synth.pending) {
      try { this.synth.cancel(); } catch {}
      setTimeout(executeSpeak, 50);
    } else {
      executeSpeak();
    }
  }

  /**
   * Audible tone chime played through Web Audio API to alert officer and confirm audio channel
   */
  static playAudibleAlertChime() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3); // A4
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  /**
   * Publicly announces out loud through the device speaker that the interaction is being recorded.
   * Deliberately speaks at maximum volume (1.0) and un-whispered so the officer and surrounding area
   * are legally notified, satisfying all-party consent laws and establishing First Amendment rights.
   */
  static announceRecordingOutLoud(options?: {
    customText?: string;
    onStart?: () => void;
    onEnd?: () => void;
  }) {
    if (!this.synth) return;
    this.initVoices();
    try {
      this.synth.cancel();
      if (this.synth.paused) this.synth.resume();
    } catch {}

    const text = options?.customText || 
      'Attention: This interaction is being recorded with audio and video for mutual safety, constitutional protection, and official legal documentation under applicable state and federal laws.';

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;
    if (typeof window !== 'undefined') {
      (window as any)._activeUtterance = utterance;
    }

    const systemVoices = this.getSystemVoices();
    if (systemVoices && systemVoices.length > 0) {
      const enVoice = systemVoices.find(v => v.lang.startsWith('en')) || systemVoices[0];
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.volume = 1.0; // Clear and loud for police officer / external notice
    utterance.pitch = 1.0;
    utterance.rate = 0.92; // Deliberate, clear, authoritative pacing

    if (options?.onStart) utterance.onstart = options.onStart;
    utterance.onend = () => {
      this.activeUtterance = null;
      if (options?.onEnd) options.onEnd();
    };
    utterance.onerror = () => {
      this.activeUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    try {
      if (this.synth) {
        if (this.synth.paused) this.synth.resume();
        this.synth.speak(utterance);
        if (this.synth.paused) this.synth.resume();
      }
    } catch {}
  }

  static previewVoice(voiceId: string, whisperMode = false) {
    const voice = AVAILABLE_VOICES.find(v => v.id === voiceId) || AVAILABLE_VOICES[0];
    const previewPhrases: Record<string, string> = {
      'standard-system': 'Standard system voice calibrated. Ready to protect your constitutional rights.',
      'calm-guardian': 'Hello, I am Dr. Alicia Vance. Stay calm, breathe, and let me guide you through this encounter.',
      'executive-counsel': 'Marcus Kane here. Stand on your Fourth and Fifth Amendment rights. Do not consent to any searches.',
      'bilingual-shield': 'Elena Ramos activa. Derechos protegidos en inglés y español. Immediate constitutional translation ready.',
      'discrete-whisper': 'Whisper mode active. Sub-vocal audio routed privately to your earpiece.'
    };
    const sample = previewPhrases[voiceId] || 'This is a sample of your chosen AI legal counsel voice.';
    this.speakAdvice(sample, voiceId, whisperMode);
  }

  static stopSpeaking() {
    this.activeUtterance = null;
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }

  static stopAudio() {
    this.stopSpeaking();
  }
}

export const voiceEngine = VoiceEngine;
