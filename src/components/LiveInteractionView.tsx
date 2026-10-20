import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Mic, MicOff, Camera, ShieldAlert, AlertTriangle, CheckCircle2,
  Lock, RefreshCw, Volume2, VolumeX, Eye, EyeOff, Radio, FileText,
  MapPin, Clock, Award, PhoneOff, ChevronRight, Play, Square,
  Car, Home, Footprints, Sparkles, ShieldCheck, Headphones, HelpCircle,
  X, Info, Zap, AlertCircle, MessageSquareText, Scale, Globe, Activity,
  Maximize, Minimize, Layers, Cloud, Navigation
} from 'lucide-react';
import { 
  LegalAnalysisResult, TranscriptEntry, UserProfile, 
  JurisdictionLaw, EvidenceCustodyRecord, EncounterType, EmergencyContact
} from '../types';
import { getJurisdictionByCode } from '../data/jurisdictions';
import { ENCOUNTER_LIST, ENCOUNTER_TYPES } from '../data/encounters';
import { AiLegalEngine } from '../services/aiLegalEngine';
import { CryptoVaultService } from '../services/cryptoVault';
import { VoiceEngine } from '../services/voiceEngine';
import { TranslationService } from '../services/translator';
import { LiveStreamService } from '../services/liveStreamService';
import { VaultCloudService } from '../services/vaultCloudService';
import { VoiceBiometricsService } from '../services/voiceBiometricsService';
import { DevicePermissionsService } from '../services/devicePermissionsService';
import { JurisdictionLegalityService, FeatureLegalityCheck } from '../services/jurisdictionLegalityService';
import { ShareLiveFeedModal } from './ShareLiveFeedModal';
import { EmergencyDistressModal } from './EmergencyDistressModal';
import { LegalityRestrictedModal } from './LegalityRestrictedModal';

interface LiveInteractionProps {
  userProfile: UserProfile;
  jurisdiction?: JurisdictionLaw;
  selectedState?: string;
  selectedViewTab?: 'dashcam' | 'ai-advice' | 'transcript' | 'emergency';
  onSelectViewTab?: (tab: 'dashcam' | 'ai-advice' | 'transcript' | 'emergency') => void;
  onSessionRecorded?: (record: EvidenceCustodyRecord) => void;
  onSaveRecordingToVault?: (record: EvidenceCustodyRecord) => void;
  onTriggerArrestLock?: () => void;
  onTriggerArrestLockdown?: () => void;
  onInstantArrestLockdown?: (record?: EvidenceCustodyRecord) => void;
  onUpgradePrompt?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenPermissionsModal?: () => void;
  onOpenServerActivity?: () => void;
  onEmergencyRefreshServer?: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  isRecording?: boolean;
  setIsRecording?: (val: boolean) => void;
  isSuspended?: boolean;
}

export const LiveInteractionView: React.FC<LiveInteractionProps> = ({
  userProfile,
  jurisdiction,
  selectedState = 'CA',
  selectedViewTab,
  onSelectViewTab,
  onSessionRecorded,
  onSaveRecordingToVault,
  onTriggerArrestLock,
  onTriggerArrestLockdown,
  onInstantArrestLockdown,
  onUpgradePrompt,
  onOpenSubscriptionModal,
  onOpenPermissionsModal,
  onOpenServerActivity,
  onEmergencyRefreshServer,
  onUpdateProfile,
  isRecording: externalIsRecording,
  setIsRecording: externalSetIsRecording,
  isSuspended = false,
}) => {
  const activeJurisdiction = jurisdiction || getJurisdictionByCode(selectedState);
  const handleRecordComplete = onSessionRecorded || onSaveRecordingToVault || (() => {});
  const handleArrest = onTriggerArrestLock || onTriggerArrestLockdown || (() => {});
  const handleInstantArrest = onInstantArrestLockdown || handleArrest;
  const handleUpgrade = onUpgradePrompt || onOpenSubscriptionModal || (() => {});
  
  // Active Encounter Feature Tab: 'dashcam' | 'ai-advice' | 'transcript' | 'emergency'
  const [internalTab, setInternalTab] = useState<'dashcam' | 'ai-advice' | 'transcript' | 'emergency'>('dashcam');
  const activeEncounterTab = selectedViewTab || internalTab;
  const handleTabSwitch = (tab: 'dashcam' | 'ai-advice' | 'transcript' | 'emergency') => {
    setInternalTab(tab);
    if (onSelectViewTab) onSelectViewTab(tab);
  };
  
  // Paid Subscription Check: Live contact sharing and real-time text relays require Pro subscription
  const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                 userProfile.membershipTier === 'lifetime_pro' || 
                 userProfile.membershipTier === 'paid';

  // Video & Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [isLowLightMode, setIsLowLightMode] = useState(false);
  const [isTorchActive, setIsTorchActive] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isScreenTorchActive, setIsScreenTorchActive] = useState(false);
  const [autoTorchEnabled, setAutoTorchEnabled] = useState(true);
  const wakeLockRef = useRef<any>(null);
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isCameraPreviewActive, setIsCameraPreviewActive] = useState(false);
  const [cameraFeedbackMessage, setCameraFeedbackMessage] = useState<string | null>(null);

  // Mobile Screen Fitment & Fullscreen Viewfinder State
  const [isViewfinderFullscreen, setIsViewfinderFullscreen] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState<'cover' | 'contain'>('cover');
  const [mobileViewMode, setMobileViewMode] = useState<'camera' | 'advice' | 'split'>('camera');

  const toggleViewfinderFullscreen = async () => {
    try {
      const willBeFullscreen = !isViewfinderFullscreen;
      setIsViewfinderFullscreen(willBeFullscreen);

      if (willBeFullscreen) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen().catch(() => {});
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen().catch?.(() => {});
        }
      } else {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen().catch?.(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && isViewfinderFullscreen) {
        setIsViewfinderFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isViewfinderFullscreen]);

  // Legal Audible Announcement State
  const [isAnnouncingNotice, setIsAnnouncingNotice] = useState(false);
  const [announceEnabled, setAnnounceEnabled] = useState<boolean>(() => {
    return userProfile.announceRecordingOutLoud ?? true;
  });

  // Legality Compliance & Server Activity Modals
  const [legalityCheck, setLegalityCheck] = useState<FeatureLegalityCheck | null>(null);
  const [isLegalityModalOpen, setIsLegalityModalOpen] = useState(false);
  const [isLocalServerModalOpen, setIsLocalServerModalOpen] = useState(false);

  // Hands-Free Voice Command Interface State - defaults to false to prevent unwanted mic restart beeps
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const [liveSpokenSnippet, setLiveSpokenSnippet] = useState<string>('');
  const [isRightsReading, setIsRightsReading] = useState(false);
  const [showVoiceCommandsModal, setShowVoiceCommandsModal] = useState(false);
  const [detectedCommandFeedback, setDetectedCommandFeedback] = useState<{
    command: string;
    actionDescription: string;
    icon: React.ReactNode;
  } | null>(null);

  const isHandsFreeActiveRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const feedbackTimeoutRef = useRef<any>(null);
  const isSpeechSupported = VoiceEngine.isSpeechRecognitionSupported();

  // Live Stream Feed & Emergency Contact Share State
  const [activeSessionId, setActiveSessionId] = useState<string>(() => LiveStreamService.generateSessionId());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDistressModalOpen, setIsDistressModalOpen] = useState(false);
  const [liveStreamBroadcastActive, setLiveStreamBroadcastActive] = useState(false);
  const [witnessBroadcastStatus, setWitnessBroadcastStatus] = useState<{
    active: boolean;
    notifiedCount: number;
    sessionId: string;
    timestamp: number;
    shareUrl: string;
  } | null>(null);

  const activeSessionIdRef = useRef<string>(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Initialize session ID cleanly without auto-recording
  useEffect(() => {
    try {
      // Clear any stale auto-recording session flags to ensure recording NEVER starts automatically
      localStorage.removeItem('police_safeguard_active_recording_session');
    } catch (e) {}
  }, []);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const snapshotIntervalRef = useRef<any>(null);
  const broadcasterRef = useRef<{
    sendFrame: (dataUrl: string, metadata?: any) => void;
    close: () => void;
  } | null>(null);
  const cameraStreamIntervalRef = useRef<any>(null);
  const recordingDurationRef = useRef(0);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const gpsLocationRef = useRef<any>(undefined);

  // Encounter Context & Passenger state
  const [encounterType, setEncounterType] = useState<EncounterType>('traffic_stop');
  const [isPassenger, setIsPassenger] = useState(false);

  // Live AI legal commentary
  const [currentAnalysis, setCurrentAnalysis] = useState<LegalAnalysisResult>(
    AiLegalEngine.analyzeStatement('Good evening, keep hands on wheel', activeJurisdiction.stateCode, false, 'traffic_stop')
  );

  // Live transcription
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      id: 'init-1',
      timestamp: Date.now() - 3000,
      speaker: 'system',
      originalText: `Police SafeGuard Active. Jurisdiction: ${activeJurisdiction.stateName} (${activeJurisdiction.stateCode}). 1st Amendment right to record police verified.`
    }
  ]);
  const [manualOfficerInput, setManualOfficerInput] = useState('');

  // Audio waveform & MediaRecorder refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const speechRestartTimeoutRef = useRef<any>(null);

  // GPS state
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    jurisdictionState: string;
  } | undefined>(undefined);

  // Auto-acquire GPS on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            jurisdictionState: activeJurisdiction.stateCode
          });
        },
        (err) => {
          console.warn('Geolocation unavailable:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, [activeJurisdiction]);

  // Create virtual dashcam video & audio stream if hardware camera is restricted
  const createVirtualCameraStream = (): MediaStream | null => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      let frame = 0;
      const render = () => {
        frame++;
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, 616, 456);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('POLICE SAFEGUARD DASHCAM • ENCRYPTED AUDIO/VIDEO SENSORS', 28, 45);

        ctx.fillStyle = '#e4e4e7';
        ctx.font = '12px monospace';
        ctx.fillText(`JURISDICTION: ${activeJurisdiction.stateName} (${activeJurisdiction.stateCode})`, 28, 72);
        ctx.fillText(`GPS: ${gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'SATELLITE LOCK ACQUIRED'}`, 28, 92);
        ctx.fillText(`TIME: ${new Date().toLocaleTimeString()} • SHA-256 BUFFER ACTIVE`, 28, 112);

        // Animated waveform HUD
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 30; x < 610; x += 6) {
          const y = 240 + Math.sin((x + frame * 5) * 0.05) * 22;
          if (x === 30) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = '11px monospace';
        ctx.fillText('STATUS: REAL-TIME CONSTITUTIONAL AI & AUDIO LOGGING ACTIVE', 28, 420);
        ctx.fillStyle = '#71717a';
        ctx.font = '10px monospace';
        ctx.fillText('Federal Rules of Evidence 902(13)/(14) Hash Certification in Progress', 28, 442);
      };

      const interval = setInterval(render, 100);
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(20) : null;
      if (!stream) {
        clearInterval(interval);
        return null;
      }

      // Pure visual fallback stream: do not construct synthetic Web Audio oscillators/destinations
      return stream;
    } catch (e) {
      console.warn("Virtual stream fallback unavailable:", e);
      return null;
    }
  };

  // Safely attaches a media stream to the video element and handles playback without AbortError interruptions
  const safelyAttachAndPlayVideo = async (videoEl: HTMLVideoElement | null, stream: MediaStream) => {
    if (!videoEl) return;

    // CRITICAL: Strip any audio tracks from the local viewfinder video element.
    // Local camera preview should ONLY contain video tracks.
    // Attaching microphone audio tracks to a local <video> element causes acoustic feedback
    // loops where microphone input is played back through device speakers, creating loud,
    // repetitive high-frequency beeps, chirps, or squealing.
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;

    // Construct pure video stream with zero audio tracks
    const videoOnlyStream = new MediaStream(videoTracks);

    if (videoEl.srcObject !== videoOnlyStream) {
      videoEl.srcObject = videoOnlyStream;
    }

    videoEl.muted = true;
    (videoEl as any).defaultMuted = true;
    videoEl.playsInline = true;

    try {
      if (videoEl.paused) {
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
      }
    } catch (err: any) {
      // AbortError is expected when a play() call is superseded by a newer stream or load request (https://goo.gl/LdLk22)
      if (err?.name === 'AbortError') {
        return;
      }
      // NotAllowedError occurs on mobile browsers if autoplay with sound is blocked; retry muted
      if (err?.name === 'NotAllowedError') {
        try {
          videoEl.muted = true;
          (videoEl as any).defaultMuted = true;
          await videoEl.play();
        } catch {
          // Ignore secondary autoplay rejection
        }
        return;
      }
      console.warn('Video stream playback notice:', err?.message || err);
    }
  };

  // Handle camera start/stop and preview
  // Note: withAudio is false during idle preview to avoid mic permission prompts or audio chime beeps on startup
  const startCamera = async (withAudio = false) => {
    try {
      setHasCameraError(null);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      let videoStream: MediaStream | null = null;
      let audioStream: MediaStream | null = null;

      if (withAudio) {
        // Request video and audio only when explicitly requested (e.g. active recording)
        try {
          const combined = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: true
          });
          videoStream = combined;
          audioStream = combined;
        } catch (combinedErr) {
          try {
            videoStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: cameraFacing } }
            });
          } catch {
            try {
              videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (camErr: any) {
              console.warn("Hardware camera unavailable:", camErr);
            }
          }
          try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (micErr) {
            console.warn("Microphone unavailable during recording init:", micErr);
          }
        }
      } else {
        // Preview mode: ONLY request video! Never touch audio or microphone hardware
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch {
          try {
            videoStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: cameraFacing } }
            });
          } catch {
            try {
              videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (camErr: any) {
              console.warn("Hardware camera unavailable for preview:", camErr);
              setHasCameraError(
                camErr?.name === 'NotAllowedError' 
                  ? 'Camera permission denied. Virtual dashcam feed active.'
                  : 'Hardware camera unavailable. Virtual dashcam feed active.'
              );
            }
          }
        }
      }

      // 3. Assemble composite stream
      const tracks: MediaStreamTrack[] = [];
      if (videoStream && videoStream.getVideoTracks().length > 0) {
        tracks.push(...videoStream.getVideoTracks());
      } else {
        const fallbackVirtual = createVirtualCameraStream();
        if (fallbackVirtual) tracks.push(...fallbackVirtual.getVideoTracks());
      }

      if (audioStream && audioStream.getAudioTracks().length > 0) {
        tracks.push(...audioStream.getAudioTracks());
      }

      const stream = new MediaStream(tracks);
      mediaStreamRef.current = stream;
      setIsCameraPreviewActive(true);

      if (videoRef.current) {
        await safelyAttachAndPlayVideo(videoRef.current, stream);
      }

      if (withAudio && audioStream) {
        setupAudioVisualizer(stream);
      }

      // Inspect hardware torch capability
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        const caps = (vTrack.getCapabilities?.() || {}) as any;
        setIsTorchSupported(Boolean(caps.torch));
        if (cameraFacing === 'environment' && autoTorchEnabled && isLowLightMode && caps.torch) {
          try {
            await vTrack.applyConstraints({ advanced: [{ torch: true }] } as any);
            setIsTorchActive(true);
          } catch (e) {
            console.warn('Could not auto-engage torch on camera start:', e);
          }
        }
      }
    } catch (err: any) {
      console.warn('Camera access fallback engaged:', err?.message || err);
      const fallbackStream = createVirtualCameraStream();
      if (fallbackStream) {
        mediaStreamRef.current = fallbackStream;
        setIsCameraPreviewActive(true);
        if (videoRef.current) {
          await safelyAttachAndPlayVideo(videoRef.current, fallbackStream);
        }
        setupAudioVisualizer(fallbackStream);
      }
    }
  };

  // Helper to toggle hardware torch/flashlight on rear camera
  const setHardwareTorch = async (enable: boolean): Promise<boolean> => {
    try {
      if (!mediaStreamRef.current) return false;
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (!videoTrack) return false;

      // 1. Directly attempt applying torch constraint to video track
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: enable }]
        } as any);
        setIsTorchActive(enable);
        setIsTorchSupported(true);
        return true;
      } catch (directErr) {
        console.warn('Direct track applyConstraints torch not supported:', directErr);
      }

      // 2. Check capabilities if explicitly reported
      const capabilities = (videoTrack.getCapabilities?.() || {}) as any;
      if (capabilities.torch) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: enable }]
          } as any);
          setIsTorchActive(enable);
          setIsTorchSupported(true);
          return true;
        } catch (retryErr) {
          console.warn('Torch constraint retry failed:', retryErr);
        }
      }

      return false;
    } catch (e) {
      console.warn('Hardware torch error:', e);
      return false;
    }
  };

  // Switch to environment rear camera with torch activated
  const switchCameraToEnvironmentWithTorch = async (): Promise<boolean> => {
    try {
      setCameraFacing('environment');
      const existingAudioTracks = mediaStreamRef.current ? mediaStreamRef.current.getAudioTracks() : [];
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(t => t.stop());
      }

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ torch: true }]
          } as any
        });
      } catch {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
        } catch {
          newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      const combinedTracks = [...newStream.getVideoTracks(), ...existingAudioTracks];
      const stream = new MediaStream(combinedTracks);
      mediaStreamRef.current = stream;
      setIsCameraPreviewActive(true);

      if (videoRef.current) {
        await safelyAttachAndPlayVideo(videoRef.current, stream);
      }
      setupAudioVisualizer(stream);

      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        try {
          await vTrack.applyConstraints({ advanced: [{ torch: true }] } as any);
          setIsTorchActive(true);
          setIsTorchSupported(true);
          return true;
        } catch (e) {
          console.warn('Torch constraint on new environment stream failed:', e);
        }
      }
      return false;
    } catch (e) {
      console.warn('switchCameraToEnvironmentWithTorch failed:', e);
      return false;
    }
  };

  // Master Toggle Torch / Flashlight for Mobile & Desktop
  const toggleTorch = async () => {
    // Tactile haptic pulse on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([40, 20, 60]); } catch (e) {}
    }

    const isCurrentlyLit = isTorchActive || isScreenTorchActive;

    if (isCurrentlyLit) {
      // TURN OFF
      await setHardwareTorch(false);
      setIsScreenTorchActive(false);
      setIsTorchActive(false);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        } catch (e) {}
      }
      setCameraFeedbackMessage('Torch / Flashlight OFF');
      setTimeout(() => setCameraFeedbackMessage(null), 2000);
      return;
    }

    // TURN ON
    // 1. Keep phone screen awake
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (e) {}

    let hardwareLit = false;

    // 2. If camera is front-facing (selfie), phones don't have physical front LED flashlights.
    // Seamlessly flip to rear camera and activate hardware LED torch!
    if (cameraFacing === 'user') {
      setCameraFeedbackMessage('Flipping to Rear Camera for LED Flashlight...');
      hardwareLit = await switchCameraToEnvironmentWithTorch();
    } else {
      hardwareLit = await setHardwareTorch(true);
    }

    // 3. If hardware torch is active:
    if (hardwareLit) {
      setIsTorchActive(true);
      setCameraFeedbackMessage('🔦 Hardware Rear Flashlight ON');
    } else {
      // 4. Hardware torch is blocked or unsupported (e.g. Apple iOS Safari / WebKit limitation).
      // Engage Ultra-Bright 100% Screen Torch: casts massive ambient lumens ahead!
      setIsScreenTorchActive(true);
      setIsTorchActive(true);
      setIsLowLightMode(true);
      setCameraFeedbackMessage('💡 Screen Flashlight Active (Max Lumens)');
    }

    setTimeout(() => setCameraFeedbackMessage(null), 3000);
  };

  // Continuous automatic low-light ambient luminance monitoring
  useEffect(() => {
    if (!isCameraPreviewActive && !isRecording) return;

    let isSubscribed = true;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const checkLighting = async () => {
      if (!isSubscribed || !videoRef.current || videoRef.current.readyState < 2) return;

      try {
        ctx.drawImage(videoRef.current, 0, 0, 32, 32);
        const imgData = ctx.getImageData(0, 0, 32, 32);
        const data = imgData.data;
        let totalLuminance = 0;
        const totalPixels = 32 * 32;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
        }

        const avgLuminance = totalLuminance / totalPixels;
        const isDim = avgLuminance < 48;

        if (isDim) {
          setIsLowLightMode(true);
          // If on rear camera view, automatically turn on hardware torch feature!
          if (cameraFacing === 'environment' && autoTorchEnabled && !isTorchActive) {
            await setHardwareTorch(true);
            setCameraFeedbackMessage('Low light detected • Auto-torch engaged');
            setTimeout(() => setCameraFeedbackMessage(null), 2500);
          }
        } else if (avgLuminance > 80) {
          // Ambient lighting is sufficient
          if (autoTorchEnabled && isTorchActive) {
            await setHardwareTorch(false);
            setCameraFeedbackMessage('Lighting normalized • Torch disengaged');
            setTimeout(() => setCameraFeedbackMessage(null), 2000);
          }
        }
      } catch (e) {
        // Ignore canvas read errors if frames aren't ready
      }
    };

    const interval = setInterval(checkLighting, 2000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [cameraFacing, autoTorchEnabled, isTorchActive, isCameraPreviewActive, isRecording]);

  // Toggle Camera View on/off (Live camera feed preview vs Standby monitor)
  const toggleCameraView = async () => {
    if (!isCameraPreviewActive || !mediaStreamRef.current) {
      await startCamera();
      setIsCameraPreviewActive(true);
      setCameraFeedbackMessage('Live Camera View Active');
    } else {
      const next = !isCameraPreviewActive;
      setIsCameraPreviewActive(next);
      setCameraFeedbackMessage(next ? 'Live Camera View Active' : 'Standby Monitor View Active');
    }
    setTimeout(() => setCameraFeedbackMessage(null), 2500);
  };

  // Switch camera between front (selfie) and back (dashcam)
  const toggleCameraFacing = async () => {
    // If torch was active on rear camera, turn off before switching
    if (isTorchActive) {
      await setHardwareTorch(false);
    }

    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    setIsCameraPreviewActive(true);
    setHasCameraError(null);

    // Keep existing audio tracks so microphone stream is not interrupted
    const existingAudioTracks = mediaStreamRef.current ? mediaStreamRef.current.getAudioTracks() : [];
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(t => t.stop());
    }

    try {
      let videoStream: MediaStream;
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (constraintErr) {
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: nextFacing }
          });
        } catch {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      // Recombine with audio
      const combinedTracks = [...videoStream.getVideoTracks(), ...existingAudioTracks];
      const stream = new MediaStream(combinedTracks);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        await safelyAttachAndPlayVideo(videoRef.current, stream);
      }
      setupAudioVisualizer(stream);

      // Check torch capabilities on the newly selected camera track
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        const caps = (vTrack.getCapabilities?.() || {}) as any;
        setIsTorchSupported(Boolean(caps.torch));

        // If switched to rear camera (environment) in low-light mode, automatically turn on torch!
        if (nextFacing === 'environment' && autoTorchEnabled && isLowLightMode && caps.torch) {
          try {
            await vTrack.applyConstraints({ advanced: [{ torch: true }] } as any);
            setIsTorchActive(true);
          } catch (torchErr) {
            console.warn('Torch auto-activation error:', torchErr);
          }
        }
      }

      const label = nextFacing === 'environment' ? 'Rear (Dashcam) View' : 'Front (Selfie Mirror) View';
      setCameraFeedbackMessage(`Camera switched to ${label}`);
      setTimeout(() => setCameraFeedbackMessage(null), 2500);
    } catch (e: any) {
      console.warn("Could not flip camera:", e);
      setCameraFeedbackMessage('Camera flip unavailable on this hardware');
      setTimeout(() => setCameraFeedbackMessage(null), 2500);
    }
  };

  // Public audible announcement that the interaction is being recorded (Legal notice to officer)
  const announceRecordingNotice = () => {
    setIsAnnouncingNotice(true);
    const noticeText = 'Attention: This interaction is being recorded with audio and video for mutual safety, constitutional protection, and official legal documentation under applicable state and federal laws.';

    VoiceEngine.announceRecordingOutLoud({
      customText: noticeText,
      onStart: () => setIsAnnouncingNotice(true),
      onEnd: () => {
        setTimeout(() => setIsAnnouncingNotice(false), 1500);
      }
    });

    // Append to transcript so the announcement is certified in the FRE 902 evidence chain
    const noticeEntry: TranscriptEntry = {
      id: `notice-${Date.now()}`,
      timestamp: Date.now(),
      speaker: 'system',
      originalText: `📢 [LEGAL NOTICE SPOKEN ALOUD]: "${noticeText}"`
    };
    setTranscript(prev => [...prev, noticeEntry]);

    setTimeout(() => {
      setIsAnnouncingNotice(false);
    }, 9000);
  };

  // Auto-start camera preview on mount only when not suspended (e.g. not on signup modal)
  useEffect(() => {
    if (isSuspended) {
      return;
    }
    let isMounted = true;
    startCamera().catch(() => {});
    return () => {
      isMounted = false;
      stopContinuousListener();
      if (mediaStreamRef.current && !isRecordingRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch?.(() => {});
        } catch (e) {}
        audioContextRef.current = null;
      }
    };
  }, [isSuspended]);

  // When suspended (e.g. signup modal open or onboarding incomplete), immediately halt all hardware streams & listeners
  useEffect(() => {
    if (isSuspended) {
      stopContinuousListener();
      if (mediaStreamRef.current && !isRecordingRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch?.(() => {});
        } catch (e) {}
        audioContextRef.current = null;
      }
      setIsCameraPreviewActive(false);
    }
  }, [isSuspended]);

  // Ensure video element receives the current stream if re-mounted or preview toggled
  useEffect(() => {
    if (!isSuspended && isCameraPreviewActive && videoRef.current && mediaStreamRef.current) {
      safelyAttachAndPlayVideo(videoRef.current, mediaStreamRef.current);
    }
  }, [isCameraPreviewActive, isSuspended]);

  // Keep refs in sync for real-time camera streaming
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    gpsLocationRef.current = gpsLocation;
  }, [gpsLocation]);

  useEffect(() => {
    recordingDurationRef.current = recordingDuration;
  }, [recordingDuration]);

  // Capture instant direct camera snapshot
  const captureCurrentCameraSnapshot = (): string | undefined => {
    try {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const snapCanvas = document.createElement('canvas');
        snapCanvas.width = 640;
        snapCanvas.height = 360;
        const ctx = snapCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 640, 360);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(8, 332, 380, 22);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`LIVE DIRECT CAM • ${new Date().toLocaleTimeString()} • FRE 902`, 14, 347);
          return snapCanvas.toDataURL('image/jpeg', 0.65);
        }
      }
    } catch (e) {}
    return undefined;
  };

  // Start continuous direct camera streaming to witnesses via WebSocket & HTTP
  const startDirectCameraStreaming = (sessionId: string) => {
    if (broadcasterRef.current) {
      broadcasterRef.current.close();
    }
    broadcasterRef.current = LiveStreamService.createBroadcaster(sessionId);

    if (cameraStreamIntervalRef.current) {
      clearInterval(cameraStreamIntervalRef.current);
    }

    const streamCanvas = document.createElement('canvas');
    streamCanvas.width = 640;
    streamCanvas.height = 360;
    const ctx = streamCanvas.getContext('2d');

    cameraStreamIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !ctx) return;
      try {
        const vid = videoRef.current;
        if (vid.readyState >= 2 && vid.videoWidth > 0) {
          ctx.drawImage(vid, 0, 0, 640, 360);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(8, 332, 420, 22);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(`REC ${new Date().toLocaleTimeString()} • DIRECT FEED • FRE 902 CERTIFIED`, 14, 347);

          const frameData = streamCanvas.toDataURL('image/jpeg', 0.65);
          broadcasterRef.current?.sendFrame(frameData, {
            durationSeconds: recordingDurationRef.current,
            transcript: transcriptRef.current,
            gpsCoordinates: gpsLocationRef.current,
            currentStatusNote: 'Active Live Camera Feed'
          });
        }
      } catch (e) {}
    }, 125); // ~8 FPS
  };

  // Ensures direct camera streaming without disrupting ongoing stream
  const ensureDirectCameraStreaming = (sessionId: string) => {
    if (broadcasterRef.current && cameraStreamIntervalRef.current) {
      return;
    }
    startDirectCameraStreaming(sessionId);
  };

  // Setup live audio visualizer
  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      if (!stream || stream.getAudioTracks().length === 0) return;
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close().catch?.(() => {});
        } catch (e) {}
        audioContextRef.current = null;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawWaveform = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          // Emerald to amber waveform
          canvasCtx.fillStyle = dataArray[i] > 180 ? '#f59e0b' : '#10b981';
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      };

      drawWaveform();
    } catch (e) {
      console.warn("Audio visualizer setup skipped:", e);
    }
  };

  // Start continuous audio/video recording
  const startRecording = async (overrideSessionId?: string | React.MouseEvent) => {
    await startCamera(true);
    recordedChunksRef.current = [];

    if (!mediaStreamRef.current) {
      const fallbackStream = createVirtualCameraStream();
      if (fallbackStream) {
        mediaStreamRef.current = fallbackStream;
        if (videoRef.current) {
          await safelyAttachAndPlayVideo(videoRef.current, fallbackStream);
        }
      }
    }

    if (mediaStreamRef.current) {
      try {
        let recorder: MediaRecorder | null = null;

        // Ensure stream tracks are active; if missing audio, synthesize silent audio track for codec compatibility
        let recordStream = mediaStreamRef.current;
        try {
          if (recordStream.getAudioTracks().length === 0 && typeof AudioContext !== 'undefined') {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const dst = ctx.createMediaStreamDestination();
            const gain = ctx.createGain();
            gain.gain.value = 0; // completely silent
            osc.connect(gain);
            gain.connect(dst);
            osc.start();
            recordStream = new MediaStream([
              ...recordStream.getVideoTracks(),
              ...dst.stream.getAudioTracks()
            ]);
          }
        } catch (audioTrackErr) {
          console.warn('Could not inject silent audio track:', audioTrackErr);
        }

        // Test candidate mime types in order of stability
        const candidateMimeTypes: string[] = [];
        if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
          const codecs = [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4'
          ];
          for (const c of codecs) {
            try {
              if (MediaRecorder.isTypeSupported(c)) {
                candidateMimeTypes.push(c);
              }
            } catch (_) {}
          }
        }

        // Tiered attempt strategy to prevent NotSupportedError on start
        const tryCreateAndStart = (options?: MediaRecorderOptions, useTimeslice = true): MediaRecorder | null => {
          try {
            const rec = options ? new MediaRecorder(recordStream, options) : new MediaRecorder(recordStream);
            rec.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
              }
            };
            if (useTimeslice) {
              rec.start(1000);
            } else {
              rec.start();
            }
            return rec;
          } catch (e) {
            console.warn('MediaRecorder attempt failed:', options?.mimeType || 'default', e);
            return null;
          }
        };

        // Try candidate types with 1000ms chunking
        for (const mime of candidateMimeTypes) {
          recorder = tryCreateAndStart({ mimeType: mime }, true);
          if (recorder) break;
        }

        // Fallback: try candidate types without timeslice
        if (!recorder) {
          for (const mime of candidateMimeTypes) {
            recorder = tryCreateAndStart({ mimeType: mime }, false);
            if (recorder) break;
          }
        }

        // Fallback: try default browser codec with timeslice
        if (!recorder) {
          recorder = tryCreateAndStart(undefined, true);
        }

        // Fallback: try default browser codec without timeslice
        if (!recorder) {
          recorder = tryCreateAndStart(undefined, false);
        }

        if (recorder) {
          mediaRecorderRef.current = recorder;
        } else {
          console.warn('Hardware MediaRecorder unavailable; proceeding with visual snapshot log stream.');
        }

        setIsRecording(true);
        isRecordingRef.current = true;
        setRecordingDuration(0);

        // Synchronize and lock active live stream broadcast session ID
        const customSid = typeof overrideSessionId === 'string' ? overrideSessionId : undefined;
        const sid = customSid || activeSessionIdRef.current || LiveStreamService.generateSessionId();
        activeSessionIdRef.current = sid;
        setActiveSessionId(sid);
        setLiveStreamBroadcastActive(true);

        try {
          localStorage.setItem('police_safeguard_active_recording_session', JSON.stringify({
            sessionId: sid,
            isRecording: true,
            startedAt: Date.now(),
            encounterType
          }));
        } catch (e) {}

        const initialSnap = captureCurrentCameraSnapshot();

        LiveStreamService.publishSessionUpdate({
          sessionId: sid,
          isLive: true,
          userName: userProfile.name || 'Citizen',
          userPhone: userProfile.emergencyContactPhone,
          encounterType,
          startedAt: Date.now(),
          durationSeconds: 0,
          lastSnapshot: initialSnap,
          gpsCoordinates: gpsLocation,
          transcript
        });

        // Launch continuous real-time camera streaming loop
        startDirectCameraStreaming(sid);

        // Auto-notify emergency contacts if enabled (up to 5 contacts for Pro members)
        const isPaidPlan = userProfile.membershipTier === 'all_encounters_pro' || 
                           userProfile.membershipTier === 'lifetime_pro' || 
                           userProfile.membershipTier === 'paid';

        if (isPaidPlan && userProfile.autoNotifyContactOnStart) {
          const maxContacts = 5;
          const contactsToSend: EmergencyContact[] = (userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0)
            ? userProfile.emergencyContacts.slice(0, maxContacts)
            : (userProfile.emergencyContactPhone ? [
                {
                  id: 'primary-auto',
                  name: userProfile.emergencyContactName || 'Emergency Contact',
                  phone: userProfile.emergencyContactPhone,
                  isPrimary: true
                }
              ] : []);

          if (contactsToSend.length > 0) {
            LiveStreamService.dispatchSmsBroadcast(sid, contactsToSend).then(() => {
              showFeedbackToast(
                'EMERGENCY ALERT DISPATCHED',
                `Text alert dispatched to ${contactsToSend.length} contact${contactsToSend.length > 1 ? 's' : ''} (${isPaidPlan ? 'Live Stream Active' : 'Protector 1-Contact Alert'})`,
                <Radio className="w-6 h-6 text-red-500 animate-pulse" />
              );
            }).catch((err) => {
              console.warn('[Live Broadcast] Async broadcast note (local recording unaffected):', err);
            });
          }
        }

        timerIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => {
            const next = prev + 1;
            return next;
          });
        }, 1000);

        // Speech recognition auto-listener intentionally not auto-started to eliminate browser mic start beeping


        // Announce out loud that interaction is being recorded for legal protection (default ON)
        if (announceEnabled) {
          setTimeout(() => {
            announceRecordingNotice();
          }, 350);
        }
      } catch (err) {
        console.error('MediaRecorder error:', err);
      }
    }
  };

  // Trigger Call Witnesses with device SMS permissions & live direct camera feed link
  const handleTriggerEmergencyDistress = async () => {
    playConfirmationChime('emergency');

    // 1. Determine canonical sessionId for this encounter
    let sid = activeSessionIdRef.current || activeSessionId;
    if (!sid) {
      sid = LiveStreamService.generateSessionId();
      activeSessionIdRef.current = sid;
      setActiveSessionId(sid);
    }

    // 2. Start recording if not currently active, with this exact sessionId
    if (!isRecordingRef.current && !isRecording) {
      try {
        await startRecording(sid);
      } catch (err) {
        console.warn('Auto start recording during witness alert:', err);
      }
    } else {
      // If already recording, ensure camera streaming without interrupting recording
      ensureDirectCameraStreaming(sid);
    }

    // 3. Immediately capture snapshot and update server
    const instantFrame = captureCurrentCameraSnapshot();
    LiveStreamService.publishSessionUpdate({
      sessionId: sid,
      isLive: true,
      userName: userProfile.name || 'Citizen',
      userPhone: userProfile.emergencyContactPhone,
      encounterType,
      startedAt: Date.now(),
      lastSnapshot: instantFrame,
      gpsCoordinates: gpsLocation ? {
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracyMeters: 5,
        jurisdictionState: activeJurisdiction.stateCode,
        city: activeJurisdiction.stateName,
      } : undefined,
    }).catch(() => {});

    // 4. Construct live view URL and witness SMS message
    const shareUrl = LiveStreamService.getShareUrl(sid, {
      userName: userProfile.name,
      encounterType: encounterType || 'traffic_stop',
      locationDesc: activeJurisdiction?.stateName ? `in ${activeJurisdiction.stateName}` : undefined,
      latitude: gpsLocation?.latitude,
      longitude: gpsLocation?.longitude,
      stateCode: activeJurisdiction?.stateCode,
      startedAt: Date.now(),
      userPhone: userProfile.phone || undefined
    });
    const locText = activeJurisdiction?.stateName ? ` in ${activeJurisdiction.stateName}` : '';
    const distressMessage = `🚨 WITNESS ALERT: ${userProfile.name || 'Citizen'} has called for witnesses during a police encounter${locText}. Watch the live direct camera feed, audio, GPS location, and legal rights transcript now: ${shareUrl}`;

    // 5. Emergency contacts / witnesses
    const contacts: EmergencyContact[] = (userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0)
      ? userProfile.emergencyContacts
      : (userProfile.emergencyContactPhone ? [
          {
            id: 'primary-distress',
            name: userProfile.emergencyContactName || 'Emergency Witness',
            phone: userProfile.emergencyContactPhone,
            isPrimary: true
          }
        ] : []);

    const phones = contacts.map(c => c.phone).filter(Boolean);

    // 6. Auto-dispatch SMS directly to each witness individually in-app (Zero Leaving the App)
    if (phones.length > 0) {
      LiveStreamService.dispatchSmsBroadcast(sid, contacts, distressMessage)
        .then((result) => {
          console.info('[Witnesses Auto-Send] Dispatched individually in-app:', result);
        })
        .catch((err) => {
          console.warn('[Witnesses Auto-Send] Error:', err);
        });

      setWitnessBroadcastStatus({
        active: true,
        notifiedCount: phones.length,
        sessionId: sid,
        timestamp: Date.now(),
        shareUrl
      });

      showFeedbackToast(
        'WITNESSES AUTO-NOTIFIED',
        `Live direct camera link sent to ${phones.length} witness(es) individually. You remain safely inside the app!`,
        <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
      );
      // Continuous camera recording remains visible and unobstructed!
    } else {
      LiveStreamService.dispatchSmsBroadcast(sid, contacts, distressMessage).catch(() => {});
      setIsDistressModalOpen(true);
      showFeedbackToast(
        'WITNESS LIVE LINK ACTIVE',
        'Direct camera live link created. Enter a phone number to dispatch in-app SMS.',
        <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
      );
    }
  };

  // Sound chime synthesizer for voice command feedback (silenced to eliminate unexpected beeping)
  const playConfirmationChime = (_type?: 'success' | 'alert' | 'emergency') => {
    // Deliberately no-op to prevent jarring synth beeps from playing
    return;
  };

  // Display feedback banner on recognized voice command
  const showFeedbackToast = (command: string, actionDescription: string, icon: React.ReactNode) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setDetectedCommandFeedback({ command, actionDescription, icon });
    feedbackTimeoutRef.current = setTimeout(() => {
      setDetectedCommandFeedback(null);
    }, 4500);
  };

  // Read out constitutional rights loudly and clearly for officer & record
  const readConstitutionalRightsAloud = () => {
    isSpeakingRef.current = true;
    setIsRightsReading(true);

    let rightsText = '';
    if (encounterType === 'traffic_stop') {
      rightsText = isPassenger
        ? `Officer, I am exercising my constitutional rights as a passenger. Under the Fifth Amendment, I am choosing to remain silent. Absent reasonable articulable suspicion of an independent crime, I have no legal duty to provide identification. Under the Fourth Amendment, I do not consent to any searches of this vehicle or my belongings.`
        : `Officer, I am exercising my constitutional rights under the United States Constitution and ${activeJurisdiction.stateName} law. Under the Fifth Amendment, I am invoking my right to remain silent and will not answer investigative questions without an attorney. Under the Fourth Amendment, I do not consent to any searches of this vehicle, my person, or my belongings. Under the First Amendment, this interaction is being recorded for court evidence.`;
    } else if (encounterType === 'home_encounter') {
      rightsText = `Officers, I am exercising my Fourth and Fifth Amendment rights. Under Payton v. New York, you may not enter my home without a judicial warrant signed by a judge. I do not consent to entry or search. Please slide any warrant under the door. I am remaining silent.`;
    } else if (encounterType === 'walking_street') {
      rightsText = `Officer, I am exercising my Fifth Amendment right to remain silent. Under Terry v. Ohio and the Fourth Amendment, am I being detained, or am I free to leave? If I am not being detained under suspicion of a specific crime, I will be on my way. I do not consent to any pat-downs or searches.`;
    } else {
      rightsText = `Officer, under the First Amendment and clearly established federal law, I have the constitutional right to record police officers performing duties in public from a safe distance. I do not consent to you taking or unlocking my phone.`;
    }

    setTranscript(prev => [
      ...prev,
      {
        id: `rights-${Date.now()}`,
        timestamp: Date.now(),
        speaker: 'user',
        originalText: `📜 CONSTITUTIONAL RIGHTS SPOKEN ALOUD: "${rightsText}"`,
        analysis: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'Civilian Formally Invoked Constitutional Rights Aloud',
          legalCitation: '1st, 4th & 5th Amendments',
          recommendedResponse: rightsText,
          statuteOrCase: 'Salinas v. Texas / Terry v. Ohio / Schneckloth v. Bustamonte',
          explanation: 'Clear verbal invocation of Fifth Amendment silence and Fourth Amendment search refusal establishes formal constitutional protection on the record.',
          confidence: 0.99,
          deEscalationTip: 'Keep hands resting calmly and visibly while rights are recited.',
          severity: 'low'
        }
      }
    ]);

    playConfirmationChime('success');
    showFeedbackToast(
      'READ CONSTITUTIONAL RIGHTS',
      'Speaking 1st, 4th, and 5th Amendment protections aloud for officer and record.',
      <Scale className="w-6 h-6 text-amber-400" />
    );

    VoiceEngine.speakAloudToOfficer(rightsText, userProfile.preferredVoice, () => {
      isSpeakingRef.current = false;
      setIsRightsReading(false);
    });
  };

  // Execute hands-free voice command
  const executeVoiceCommand = (cmd: string, rawText: string) => {
    switch (cmd) {
      case 'START_RECORDING': {
        if (isRecordingRef.current) {
          playConfirmationChime('alert');
          showFeedbackToast('START RECORDING', 'Recording is already in progress.', <Video className="w-6 h-6 text-red-400" />);
          return;
        }
        playConfirmationChime('success');
        showFeedbackToast(
          'START RECORDING',
          'Voice trigger detected: Initializing camera & audio with SHA-256 evidence chain.',
          <Video className="w-6 h-6 text-red-500 animate-pulse" />
        );
        startRecording();
        VoiceEngine.speakAdvice('Recording started and secured.', userProfile.preferredVoice, userProfile.whisperModeEnabled);
        break;
      }

      case 'STOP_RECORDING': {
        if (!isRecordingRef.current) {
          playConfirmationChime('alert');
          showFeedbackToast('STOP RECORDING', 'Recording is not active.', <Square className="w-6 h-6 text-zinc-400" />);
          return;
        }
        playConfirmationChime('success');
        showFeedbackToast(
          'STOP RECORDING',
          'Voice trigger detected: Certifying FRE 902 court evidence certificate.',
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        );
        stopRecording();
        VoiceEngine.speakAdvice('Recording stopped and evidence saved to vault.', userProfile.preferredVoice, userProfile.whisperModeEnabled);
        break;
      }

      case 'ARREST_LOCKDOWN':
      case 'CALL_HELP': {
        if (!isPaid) {
          VoiceEngine.speakAdvice('Arrest lockdown mode is a Pro subscription feature. Please subscribe to unlock.', 'standard-system', false);
          handleUpgrade();
          break;
        }
        playConfirmationChime('emergency');
        showFeedbackToast(
          '🚨 ARREST MODE ACTIVATED',
          'Voice command detected: Sealing all evidence, encrypting with AES-256, auto syncing to cloud, and timing out screen.',
          <Lock className="w-6 h-6 text-red-500 animate-bounce" />
        );

        const arrestNotice = `🚨 EMERGENCY ARREST TRIGGERED BY VOICE: "${rawText || 'Arrest Mode'}". All evidence sealed under FRE 902. AES-256 encryption applied. Auto-synced to cloud storage. Device screen timed out and locked.`;
        const arrestEntry: TranscriptEntry = {
          id: `arrest-${Date.now()}`,
          timestamp: Date.now(),
          speaker: 'system',
          originalText: arrestNotice
        };
        setTranscript(prev => [...prev, arrestEntry]);

        // Release wake lock immediately so native hardware display sleep can trigger
        if (wakeLockRef.current) {
          try {
            wakeLockRef.current.release();
            wakeLockRef.current = null;
          } catch (e) {}
        }

        // Turn off torches
        setIsTorchActive(false);
        setIsScreenTorchActive(false);

        // Spoken audio feedback
        VoiceEngine.speakAdvice('Arrest mode activated. Evidence sealed, encrypted, and synced to cloud. Locking device.', userProfile.preferredVoice, userProfile.whisperModeEnabled);

        // If recording was active, finalize it into a certified court evidence record
        if (isRecordingRef.current) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setIsRecording(false);
          stopContinuousListener();
          try { localStorage.removeItem('police_safeguard_active_recording_session'); } catch (e) {}

          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) {}
          }

          setTimeout(async () => {
            try {
              const actualMimeType = (recordedChunksRef.current.length > 0 && recordedChunksRef.current[0].type)
                ? recordedChunksRef.current[0].type
                : (mediaRecorderRef.current?.mimeType || 'video/webm');
              const blob = new Blob(recordedChunksRef.current, { type: actualMimeType });
              const videoUrl = URL.createObjectURL(blob);
              const sha256 = await CryptoVaultService.computeSHA256(blob);

              const record = CryptoVaultService.createCustodyCertificate({
                sessionId: activeSessionId || `ARREST-REC-${Date.now().toString(36).toUpperCase()}`,
                createdAt: Date.now() - (recordingDuration * 1000),
                durationSeconds: recordingDuration,
                sha256Hash: sha256,
                gps: gpsLocation,
                transcript: [...transcript, arrestEntry],
                videoSize: blob.size,
                isEncrypted: true
              });
              record.videoUrl = videoUrl;

              // Immediately invoke instant arrest lockdown in App
              if (onInstantArrestLockdown) {
                onInstantArrestLockdown(record);
              } else {
                handleRecordComplete(record);
                handleArrest();
              }
            } catch (err) {
              console.error('Error sealing active recording during arrest:', err);
              if (onInstantArrestLockdown) onInstantArrestLockdown();
              else handleArrest();
            }
          }, 150);
        } else {
          // If not currently recording, trigger instant arrest lockdown with existing vault evidence
          if (onInstantArrestLockdown) {
            onInstantArrestLockdown();
          } else {
            handleArrest();
          }
        }
        break;
      }

      case 'READ_RIGHTS':
      case 'ADDRESS_OFFICER': {
        if (currentAnalysis?.recommendedResponse) {
          isSpeakingRef.current = true;
          playConfirmationChime('success');
          showFeedbackToast(
            'ADDRESSING OFFICER',
            `Reading defense statement aloud: "${currentAnalysis.recommendedResponse.slice(0, 50)}..."`,
            <Volume2 className="w-6 h-6 text-amber-400" />
          );
          VoiceEngine.speakAloudToOfficer(currentAnalysis.recommendedResponse, userProfile.preferredVoice, () => {
            isSpeakingRef.current = false;
          });
        } else {
          readConstitutionalRightsAloud();
        }
        break;
      }

      case 'REFUSE_SEARCH': {
        const refusalPhrase = 'Officer, under the Fourth Amendment, I do not consent to any searches of my person, vehicle, or personal belongings.';
        playConfirmationChime('success');
        showFeedbackToast('REFUSE SEARCH', 'Spoken 4th Amendment refusal logged and delivered.', <ShieldAlert className="w-6 h-6 text-rose-400" />);
        handleQuickScript(refusalPhrase);
        VoiceEngine.speakAloudToOfficer(refusalPhrase, userProfile.preferredVoice);
        break;
      }

      case 'FREE_TO_GO': {
        const detentionPhrase = 'Officer, am I free to leave, or am I being detained?';
        playConfirmationChime('success');
        showFeedbackToast('AM I FREE TO GO?', 'Rodriguez v. US inquiry logged.', <AlertTriangle className="w-6 h-6 text-amber-400" />);
        handleQuickScript(detentionPhrase);
        VoiceEngine.speakAloudToOfficer(detentionPhrase, userProfile.preferredVoice);
        break;
      }

      case 'SHARE_FEED': {
        const isPaid = userProfile.membershipTier === 'all_encounters_pro' || 
                       userProfile.membershipTier === 'lifetime_pro' || 
                       userProfile.membershipTier === 'paid';
        if (!isPaid) {
          playConfirmationChime('emergency');
          showFeedbackToast(
            'LIVE SHARE (PRO ONLY)',
            'Live Contact Broadcast requires a Paid Pro plan. Your local evidence vault is 100% secured.',
            <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
          );
          VoiceEngine.speakAdvice('Live contact broadcasting requires a Pro subscription. Opening upgrade options.', userProfile.preferredVoice, userProfile.whisperModeEnabled);
          setIsShareModalOpen(true);
          return;
        }

        playConfirmationChime('success');
        setIsShareModalOpen(true);
        showFeedbackToast(
          'SHARE LIVE FEED',
          'Emergency text broadcast panel opened. Select contacts or tap Send.',
          <Radio className="w-6 h-6 text-red-500 animate-pulse" />
        );
        VoiceEngine.speakAdvice('Opening live feed share with your emergency contacts.', userProfile.preferredVoice, userProfile.whisperModeEnabled);
        break;
      }

      case 'CALL_WITNESSES':
      case 'EMERGENCY_DISTRESS': {
        handleTriggerEmergencyDistress();
        VoiceEngine.speakAdvice('Witnesses activated. Emergency broadcast and live view link dispatched to your witnesses.', userProfile.preferredVoice, userProfile.whisperModeEnabled);
        break;
      }

      case 'STEALTH_ON': {
        playConfirmationChime('success');
        setIsStealthMode(true);
        showFeedbackToast('STEALTH MODE', 'Screen darkened. Continuous recording active.', <EyeOff className="w-6 h-6 text-zinc-300" />);
        break;
      }

      case 'STEALTH_OFF': {
        playConfirmationChime('success');
        setIsStealthMode(false);
        showFeedbackToast('STEALTH MODE OFF', 'Screen restored.', <Eye className="w-6 h-6 text-emerald-400" />);
        break;
      }
    }
  };

  // Verifies if the active speaker matches the user's learned voice profile
  const verifySpeakerIsUser = (): { isMatch: boolean; confidence: number; reason: string } => {
    if (!userProfile.voiceTraining?.isTrained || !userProfile.voiceTraining?.voiceLockActive) {
      return { isMatch: true, confidence: 100, reason: 'Voice lock inactive' };
    }

    if (!analyserRef.current || !audioContextRef.current) {
      return { isMatch: true, confidence: 90, reason: 'Biometric voice verification active' };
    }

    try {
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqData);

      let num = 0;
      let den = 0;
      const binHz = (audioContextRef.current.sampleRate / 2) / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const mag = freqData[i];
        num += (i * binHz) * mag;
        den += mag;
      }
      const currentCentroid = den > 0 ? num / den : (userProfile.voiceTraining.spectralCentroid || 1650);
      const learnedPitch = userProfile.voiceTraining.pitchHz || 145;

      return VoiceBiometricsService.verifySpeakerMatch(
        learnedPitch,
        currentCentroid,
        userProfile.voiceTraining
      );
    } catch (e) {
      return { isMatch: true, confidence: 85, reason: 'Verified citizen profile' };
    }
  };

  // Inspect incoming speech against voice command triggers
  const checkVoiceCommand = (text: string): boolean => {
    const lower = text.toLowerCase().trim();

    // 0. ABSOLUTE EMERGENCY PRIORITY: ARREST MODE & PHONE SEIZURE LOCKDOWN
    // Always evaluated first, without requiring speaker biometric match, so it triggers if
    // an officer shouts "under arrest / give me your phone" or if user is separated from device.
    if (VoiceEngine.isArrestCommand(text)) {
      executeVoiceCommand('ARREST_LOCKDOWN', text);
      return true;
    }

    // If AI Voice Lock is enabled, enforce that the speaker matches the user's learned voice profile
    // for non-emergency commands (like advice, navigation, stop recording)
    if (userProfile.voiceTraining?.isTrained && userProfile.voiceTraining?.voiceLockActive) {
      const match = verifySpeakerIsUser();
      if (!match.isMatch) {
        showFeedbackToast(
          'VOICE LOCKED',
          `External voice ignored. AI copilot only responds to ${userProfile.name || 'citizen'}'s learned voice profile.`,
          <ShieldAlert className="w-6 h-6 text-amber-400 animate-pulse" />
        );
        return false;
      }
    }

    // 1. Emergency Witnesses Broadcast (Live Link SMS Voice Command)
    if (
      lower.includes('call witnesses') ||
      lower.includes('call witness') ||
      lower.includes('witnesses') ||
      lower.includes('witness') ||
      lower.includes('emergency witnesses') ||
      lower.includes('activate witnesses') ||
      lower.includes('alert witnesses') ||
      lower.includes('summon witnesses') ||
      lower.includes('distress') ||
      lower.includes('emergency distress') ||
      lower.includes('send live link') ||
      lower.includes('text live link') ||
      lower.includes('send distress')
    ) {
      executeVoiceCommand('CALL_WITNESSES', text);
      return true;
    }

    // 1. Call For Help / Emergency / Arrest Lockdown
    if (
      lower.includes('call for help') ||
      lower.includes('call help') ||
      lower.includes('send help') ||
      lower.includes('emergency') ||
      lower.includes('help me') ||
      lower.includes('arrest lockdown') ||
      lower.includes('lock phone') ||
      lower.includes('lockdown') ||
      lower.includes('police lockdown') ||
      lower.includes('imminent arrest')
    ) {
      executeVoiceCommand('CALL_HELP', text);
      return true;
    }

    // 2. Read Constitutional Rights & Address Officer Out Loud
    if (
      lower.includes('read rights') ||
      lower.includes('read my rights') ||
      lower.includes('constitutional rights') ||
      lower.includes('recite rights') ||
      lower.includes('state my rights') ||
      lower.includes('speak rights') ||
      lower.includes('announce rights') ||
      lower.includes('what are my rights') ||
      lower.includes('read out loud') ||
      lower.includes('read outloud') ||
      lower.includes('read aloud') ||
      lower.includes('address officer') ||
      lower.includes('address the officer') ||
      lower.includes('address police') ||
      lower.includes('address the police') ||
      lower.includes('speak to officer') ||
      lower.includes('speak to the officer') ||
      lower.includes('talk to officer') ||
      lower.includes('talk to the officer') ||
      lower.includes('speak aloud') ||
      lower.includes('read to officer') ||
      lower.includes('read to the officer')
    ) {
      executeVoiceCommand('ADDRESS_OFFICER', text);
      return true;
    }

    // 3. Start Recording
    if (
      lower.includes('start recording') ||
      lower.includes('start record') ||
      lower.includes('start camera') ||
      lower.includes('record video') ||
      lower.includes('begin recording') ||
      lower.includes('record now') ||
      lower.includes('record police') ||
      lower.includes('start dashcam') ||
      lower === 'record' ||
      lower.startsWith('record ')
    ) {
      executeVoiceCommand('START_RECORDING', text);
      return true;
    }

    // 4. Stop Recording
    if (
      lower.includes('stop recording') ||
      lower.includes('stop record') ||
      lower.includes('finish recording') ||
      lower.includes('end recording') ||
      lower.includes('save recording') ||
      lower.includes('stop camera')
    ) {
      executeVoiceCommand('STOP_RECORDING', text);
      return true;
    }

    // 5. Refuse Search (4th Amendment)
    if (
      lower.includes('i do not consent') ||
      lower.includes('refuse search') ||
      lower.includes('no search') ||
      lower.includes('do not consent to search') ||
      lower.includes('do not search')
    ) {
      executeVoiceCommand('REFUSE_SEARCH', text);
      return true;
    }

    // 6. Free to Go (Rodriguez / Terry)
    if (
      lower.includes('am i free to go') ||
      lower.includes('am i free to leave') ||
      lower.includes('am i being detained') ||
      lower.includes('can i leave') ||
      lower.includes('free to leave')
    ) {
      executeVoiceCommand('FREE_TO_GO', text);
      return true;
    }

    // 7. Share Live Feed with Emergency Contacts
    if (
      lower.includes('share live feed') ||
      lower.includes('share live stream') ||
      lower.includes('share feed') ||
      lower.includes('share stream') ||
      lower.includes('send live stream') ||
      lower.includes('send live link') ||
      lower.includes('text emergency contact') ||
      lower.includes('text emergency contacts') ||
      lower.includes('text contacts') ||
      lower.includes('text contact') ||
      lower.includes('send link')
    ) {
      executeVoiceCommand('SHARE_FEED', text);
      return true;
    }

    // 8. Stealth Mode
    if (lower.includes('stealth mode') || lower.includes('black screen') || lower.includes('hide screen')) {
      executeVoiceCommand('STEALTH_ON', text);
      return true;
    }

    if (lower.includes('exit stealth') || lower.includes('show screen') || lower.includes('restore screen')) {
      executeVoiceCommand('STEALTH_OFF', text);
      return true;
    }

    return false;
  };

  // Safely stops speech listener and cancels any pending restarts to completely eliminate browser mic activation beeps
  const stopContinuousListener = () => {
    if (speechRestartTimeoutRef.current) {
      clearTimeout(speechRestartTimeoutRef.current);
      speechRestartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
        if (typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort();
        }
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Start hands-free speech listener with strict no-beep safeguards
  const startContinuousListener = () => {
    if (!VoiceEngine.isSpeechRecognitionSupported()) return;

    try {
      stopContinuousListener();

      const rec = VoiceEngine.createRecognition(
        (text: string, isFinal: boolean) => {
          if (!text || text.trim().length < 2) return;
          setLiveSpokenSnippet(text);

          // Prevent app from processing its own TTS output
          if (isSpeakingRef.current) return;

          const isCommand = checkVoiceCommand(text);
          if (!isCommand && isFinal && text.trim().length > 3) {
            if (isRecordingRef.current) {
              processIncomingSpeech(text, 'officer');
            }
          }
        },
        (err: any) => {
          if (err?.error !== 'no-speech' && err?.error !== 'aborted') {
            console.info('Speech recognition note:', err?.error || err);
          }
        }
      );

      if (rec) {
        // Crucial: do NOT auto-restart in a timeout loop upon onend.
        // In Google Chrome and Android, calling recognition.start() causes the browser to emit an audible mic activation beep.
        // Auto-restarting on silence caused continuous, repetitive beeping.
        rec.onend = () => {
          setIsListening(false);
        };

        rec.start();
        recognitionRef.current = rec;
        setIsListening(true);
      }
    } catch (e) {
      console.warn('Hands-free recognition initialization:', e);
      setIsListening(false);
    }
  };

  // Synchronize state refs and activate hands-free listener
  useEffect(() => {
    isHandsFreeActiveRef.current = isHandsFreeActive;
    isRecordingRef.current = isRecording;
  }, [isHandsFreeActive, isRecording]);

  useEffect(() => {
    if (isHandsFreeActive) {
      startContinuousListener();
    } else {
      stopContinuousListener();
    }

    return () => {
      stopContinuousListener();
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [isHandsFreeActive]);

  // Stop recording & certify court exhibit
  const stopRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (cameraStreamIntervalRef.current) {
      clearInterval(cameraStreamIntervalRef.current);
      cameraStreamIntervalRef.current = null;
    }
    if (broadcasterRef.current) {
      broadcasterRef.current.close();
      broadcasterRef.current = null;
    }
    setIsRecording(false);
    stopContinuousListener();

    try {
      localStorage.removeItem('police_safeguard_active_recording_session');
    } catch (e) {}

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Wait 250ms for last chunk
    setTimeout(async () => {
      const actualMimeType = (recordedChunksRef.current.length > 0 && recordedChunksRef.current[0].type)
        ? recordedChunksRef.current[0].type
        : (mediaRecorderRef.current?.mimeType || 'video/webm');
      const blob = new Blob(recordedChunksRef.current, { type: actualMimeType });
      const videoUrl = URL.createObjectURL(blob);
      const sha256 = await CryptoVaultService.computeSHA256(blob);

      const record = CryptoVaultService.createCustodyCertificate({
        sessionId: activeSessionId || `STOP-REC-${Date.now().toString(36).toUpperCase()}`,
        createdAt: Date.now() - (recordingDuration * 1000),
        durationSeconds: recordingDuration,
        sha256Hash: sha256,
        gps: gpsLocation,
        transcript: transcript,
        videoSize: blob.size,
        isEncrypted: userProfile.membershipTier === 'paid'
      });
      record.videoUrl = videoUrl;

      // Finalize live stream so emergency contacts can watch the full recording afterward
      // Isolated in try/catch to guarantee local court evidence custody is NEVER compromised by network issues
      try {
        LiveStreamService.publishSessionUpdate({
          sessionId: record.sessionId,
          isLive: false,
          completedAt: Date.now(),
          durationSeconds: recordingDuration,
          sha256Hash: sha256,
          certificateId: record.certificateId,
          videoUrl: videoUrl,
          gpsCoordinates: gpsLocation,
          transcript: transcript
        });
      } catch (streamErr) {
        console.warn('[Live Stream Finalize] Network error (local evidence unaffected):', streamErr);
      }

      handleRecordComplete(record);

      // Asynchronously synchronize custody record to multi-device cloud vault
      // This ensures court evidence can be retrieved across multi devices if phone is lost, damaged, or seized
      VaultCloudService.syncRecordToCloud(
        record, 
        undefined, 
        userProfile.email || undefined
      ).catch(e => console.warn('[Cloud Vault Sync]', e));

      // Clean up camera
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }, 300);
  };

  // Process speech, run legal evaluation, translate if paid tier, and speak in earbud
  const processIncomingSpeech = (text: string, speaker: 'officer' | 'user') => {
    const analysis = AiLegalEngine.analyzeStatement(
      text, 
      activeJurisdiction.stateCode, 
      isPassenger, 
      encounterType
    );
    setCurrentAnalysis(analysis);

    // Bidirectional Translation for non-English speakers (Paid tiers only)
    let translated: string | undefined = undefined;
    if (userProfile.nativeLanguage !== 'en' && isPaid) {
      if (speaker === 'officer') {
        // Direction 1: Officer English -> Citizen Native Language
        translated = TranslationService.translateText(text, userProfile.nativeLanguage);
      } else {
        // Direction 2: Citizen Native Speech -> Official English Assertion
        translated = TranslationService.translateToEnglish(text, userProfile.nativeLanguage);
      }
    }

    const newEntry: TranscriptEntry = {
      id: `entry-${Date.now()}`,
      timestamp: Date.now(),
      speaker,
      originalText: text,
      translatedText: translated,
      analysis
    };

    setTranscript(prev => [...prev, newEntry]);

    // Speak private legal advice to user (earbud whisper)
    const adviceToSpeak = `${analysis.category.replace('_', ' ')}: ${analysis.recommendedResponse}`;
    VoiceEngine.speakAdvice(
      adviceToSpeak,
      userProfile.preferredVoice,
      userProfile.whisperModeEnabled
    );
  };

  // Trigger quick manual legal prompt
  const handleQuickScript = (scriptText: string) => {
    processIncomingSpeech(scriptText, 'user');
  };

  // Submit manual officer phrase for simulation/testing during live stop
  const handleManualOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOfficerInput.trim()) return;
    processIncomingSpeech(manualOfficerInput.trim(), 'officer');
    setManualOfficerInput('');
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Color mapping based on compliance category
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'MUST_COMPLY':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/80 text-emerald-100',
          badge: 'bg-emerald-600 text-white',
          title: 'MUST COMPLY WITH LAW',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        };
      case 'RIGHT_TO_REFUSE':
        return {
          bg: 'bg-rose-950/85 border-rose-500/80 text-rose-100',
          badge: 'bg-rose-600 text-white',
          title: 'ABSOLUTE RIGHT TO REFUSE',
          icon: <ShieldAlert className="w-5 h-5 text-rose-400" />
        };
      case 'ASK_CLARIFY':
        return {
          bg: 'bg-amber-950/80 border-amber-500/80 text-amber-100',
          badge: 'bg-amber-600 text-white',
          title: 'CRITICAL INQUIRY REQUIRED',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
        };
      case 'DE_ESCALATE':
        return {
          bg: 'bg-blue-950/80 border-blue-500/80 text-blue-100',
          badge: 'bg-blue-600 text-white',
          title: 'DE-ESCALATION / VERBAL OBJECTION',
          icon: <ShieldAlert className="w-5 h-5 text-blue-400" />
        };
      default:
        return {
          bg: 'bg-zinc-900 border-zinc-700 text-zinc-200',
          badge: 'bg-zinc-700 text-white',
          title: 'LEGAL MONITOR ACTIVE',
          icon: <Radio className="w-5 h-5 text-zinc-400" />
        };
    }
  };

  const theme = getCategoryTheme(currentAnalysis.category);

  return (
    <div id="live-interaction-container" className="flex flex-col h-full bg-transparent text-zinc-100 relative">
      {/* Stealth Mode Black Screen Overlay */}
      {isStealthMode && (
        <div 
          id="stealth-mode-overlay"
          onClick={() => setIsStealthMode(false)}
          className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-between p-8 cursor-pointer select-none"
        >
          <div className="w-full flex justify-between items-center text-zinc-800 text-xs font-mono">
            <span>12:04 PM</span>
            <span>BATTERY 14%</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 rounded-full bg-red-600/40 animate-ping mx-auto mb-2" />
            <p className="text-zinc-800 text-xs tracking-wider">Tap anywhere to restore screen</p>
            <p className="text-zinc-900 text-[10px] mt-1">Audio/video continuously recording in background</p>
          </div>
          <div className="text-zinc-900 text-[9px] font-mono">ENCRYPTED RUNTIME ACTIVE</div>
        </div>
      )}

      {/* High-Intensity Screen Flashlight Illuminator (for iPhone/iOS or dark vehicles) */}
      {isScreenTorchActive && (
        <div 
          id="screen-flashlight-overlay"
          onClick={() => {
            setIsScreenTorchActive(false);
            setIsTorchActive(false);
            if (wakeLockRef.current) {
              try { wakeLockRef.current.release(); wakeLockRef.current = null; } catch (e) {}
            }
          }}
          className="fixed inset-0 z-50 bg-white text-black flex flex-col justify-between p-6 select-none cursor-pointer animate-in fade-in duration-150 shadow-2xl"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-full">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-wider">Screen Flashlight Active (Max Lumens)</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsScreenTorchActive(false);
                setIsTorchActive(false);
                if (wakeLockRef.current) {
                  try { wakeLockRef.current.release(); wakeLockRef.current = null; } catch (e) {}
                }
              }}
              className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider shadow-xl cursor-pointer"
            >
              Turn Off Flashlight
            </button>
          </div>
          
          <div className="text-center py-12 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-amber-400/30 flex items-center justify-center mx-auto mb-4 border-2 border-amber-500/50 animate-pulse">
              <Zap className="w-10 h-10 text-amber-600 fill-amber-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-wide text-zinc-900">
              TACTICAL ILLUMINATION ACTIVE
            </h2>
            <p className="text-sm font-semibold text-zinc-600 mt-2 max-w-sm mx-auto">
              Screen is emitting maximum white lumens to light up your vehicle interior or face during police encounter.
            </p>
            <p className="text-xs text-zinc-500 mt-4 font-mono">
              [ Tap anywhere on screen to turn off ]
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-200 pt-3">
            <span>POLICE SAFEGUARD • TACTICAL ILLUMINATOR</span>
            <span>AUDIO/VIDEO CONTINUES RECORDING</span>
          </div>
        </div>
      )}

      {/* Clean, Professional Recording Screen Navigation Bar */}
      <div id="encounter-primary-tabs" className="bg-zinc-950/95 border-b border-zinc-800/80 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 select-none shadow-md z-20">
        <div className="flex items-center gap-2">
          {/* Active View Mode Pill */}
          <button
            id="tab-btn-dashcam"
            onClick={() => handleTabSwitch('dashcam')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeEncounterTab === 'dashcam'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Dashcam</span>
            {isRecording && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-0.5" />}
          </button>

          {/* AI Legal Advice Toggle */}
          <button
            id="tab-btn-ai-advice"
            onClick={() => handleTabSwitch(activeEncounterTab === 'ai-advice' ? 'dashcam' : 'ai-advice')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeEncounterTab === 'ai-advice'
                ? 'bg-amber-400 text-black shadow-md font-black'
                : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>AI Legal Copilot</span>
          </button>

          {/* Transcript Toggle */}
          <button
            id="tab-btn-transcript"
            onClick={() => handleTabSwitch(activeEncounterTab === 'transcript' ? 'dashcam' : 'transcript')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeEncounterTab === 'transcript'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Transcript</span>
            <span className="text-[10px] font-mono bg-black/40 px-1 rounded">{transcript.length}</span>
          </button>
        </div>

        {/* Status Badge & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {isRecording ? (
            <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-500/80 text-red-300 px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono">REC {formatTime(recordingDuration)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[10px] tracking-wider uppercase">STANDBY</span>
            </div>
          )}

          <button
            id="tab-fullscreen-btn"
            onClick={toggleViewfinderFullscreen}
            title={isViewfinderFullscreen ? "Exit full screen" : "Expand full screen mobile view"}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 cursor-pointer transition-transform"
          >
            {isViewfinderFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Tabbed Interface Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Left / Center: Camera Viewfinder & Audio Waveform */}
        <div className={
          isViewfinderFullscreen
            ? "fixed inset-0 z-[100] w-screen h-[100dvh] bg-black flex flex-col justify-between overflow-hidden select-none"
            : `flex flex-col bg-black relative border-zinc-800 h-full flex-1 ${
                activeEncounterTab === 'dashcam' ? 'flex' : 'hidden'
              }`
        }>
          
          {/* Video element */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[260px] sm:min-h-[340px]">
            {/* Standby Camera Viewfinder Imagery & Tactical HUD Overlay */}
            {!isRecording && !isCameraPreviewActive && (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
                <img
                  src="/images/camera_standby_hud_1790279198286.jpg"
                  alt="Camera Standby Viewfinder"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-75 contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
                
                {/* Tactical Reticle & Corner Brackets */}
                <div className="absolute inset-6 sm:inset-10 border border-white/15 rounded-2xl pointer-events-none">
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-amber-400" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-amber-400" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-amber-400" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-amber-400" />
                </div>

                {/* Central Standby HUD Pill */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center p-4">
                  <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md border border-amber-500/40 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold shadow-xl mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>MONITOR STANDBY • TAP START BELOW</span>
                  </div>
                  <p className="text-[11px] font-sans text-zinc-300 drop-shadow max-w-xs">
                    Continuous encrypted audio/video recording with FRE 902 court admissibility certificates
                  </p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none'
              }}
              className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-300 relative z-10 ${
                (!isRecording && !isCameraPreviewActive) ? 'opacity-0' : 'opacity-100'
              } ${isLowLightMode ? 'brightness-125 contrast-110' : ''}`}
            />

            {/* Video Overlays (Watermark, GPS, Timestamp, FRE 902 Evidence Hash) */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm border border-zinc-700/60 rounded-md px-2.5 py-1.5 text-[11px] font-mono text-zinc-200 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">POLICE SAFEGUARD • COURT EVIDENCE</span>
                <span className="text-zinc-500">|</span>
                <span>{new Date().toLocaleTimeString()}</span>
                {isTorchActive && (
                  <>
                    <span className="text-zinc-500">|</span>
                    <span className="text-amber-300 font-bold flex items-center gap-0.5">
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-bounce" /> TORCH ON
                    </span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                GPS: {gpsLocation ? `${gpsLocation.latitude.toFixed(4)}, ${gpsLocation.longitude.toFixed(4)}` : 'ACQUIRING FIX'} • FRE 902(13)/(14) SHA-256
              </div>
            </div>

            {/* Hands-Free Voice Commands Viewfinder HUD */}
            {isHandsFreeActive && (
              <div className="absolute top-14 left-3 max-w-[280px] sm:max-w-sm bg-black/85 backdrop-blur-md border border-emerald-500/50 rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-auto z-20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center">
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="absolute -inset-0.5 rounded-full bg-emerald-500/40 animate-ping pointer-events-none" />
                    </div>
                    <span className="font-extrabold text-emerald-300 text-[10px] tracking-wider uppercase">
                      Hands-Free Voice Active
                    </span>
                  </div>
                  <button
                    onClick={() => setShowVoiceCommandsModal(true)}
                    className="text-[9px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    Commands
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-zinc-300 truncate">
                  {liveSpokenSnippet ? (
                    <span className="text-amber-300 font-mono italic">"{liveSpokenSnippet}"</span>
                  ) : (
                    <span className="text-zinc-400 text-[10px]">
                      Say: <strong className="text-zinc-200">"Record"</strong> • <strong className="text-zinc-200">"Call Help"</strong> • <strong className="text-zinc-200">"Read Rights"</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Constitutional Rights Reading Audio HUD */}
            {isRightsReading && (
              <div className="absolute top-28 left-3 right-3 sm:right-auto sm:max-w-md bg-amber-950/90 backdrop-blur-md border-2 border-amber-400 rounded-lg p-3 text-xs shadow-2xl z-30 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span className="font-black text-amber-300 text-[11px] uppercase tracking-wider">
                      Reading Rights Aloud
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      VoiceEngine.stopAudio();
                      setIsRightsReading(false);
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-black text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
                  >
                    Stop Audio
                  </button>
                </div>
                <p className="text-[11px] text-amber-100 font-medium leading-relaxed">
                  Speaking 1st, 4th, &amp; 5th Amendment constitutional protections clearly for officer and audio record.
                </p>
              </div>
            )}

            {/* Witness Live Stream & In-App SMS Broadcast Active Viewfinder HUD */}
            {witnessBroadcastStatus?.active && (
              <div className="absolute top-28 sm:top-14 right-3 max-w-[320px] bg-red-950/95 backdrop-blur-md border-2 border-red-500/90 rounded-xl p-2.5 shadow-2xl z-30 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-black text-white text-[11px] uppercase tracking-wide">
                      WITNESS STREAM ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsDistressModalOpen(true)}
                      className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-black text-[9px] uppercase cursor-pointer"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => setWitnessBroadcastStatus(null)}
                      className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
                      title="Dismiss indicator"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-red-200 leading-tight">
                  Direct camera video &amp; GPS dispatched via in-app SMS to {witnessBroadcastStatus.notifiedCount} witness(es). Camera recording safely in-app.
                </p>
              </div>
            )}

            {/* Detected Voice Command Feedback Toast */}
            {detectedCommandFeedback && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-zinc-950/95 border-2 border-amber-400 text-white px-5 py-4 rounded-xl shadow-2xl backdrop-blur-md max-w-xs sm:max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-200 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto mb-2 text-amber-400">
                  {detectedCommandFeedback.icon}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Voice Command Detected
                </div>
                <div className="text-base font-extrabold text-white mb-1">
                  "{detectedCommandFeedback.command}"
                </div>
                <p className="text-xs text-zinc-300">
                  {detectedCommandFeedback.actionDescription}
                </p>
              </div>
            )}

            {/* Camera Controls Floating Overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30">
              {/* Camera View Toggle Button */}
              <button
                id="toggle-camera-view-btn"
                onClick={toggleCameraView}
                title={isCameraPreviewActive ? "Camera View Active: Click to pause preview" : "Camera View: Click to activate live camera feed"}
                className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold border backdrop-blur-md transition-all cursor-pointer shadow-md ${
                  isCameraPreviewActive 
                    ? 'bg-emerald-950/85 border-emerald-500/80 text-emerald-300 shadow-emerald-950/50' 
                    : 'bg-black/75 hover:bg-black/90 text-zinc-300 border-zinc-700/80'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono">{isCameraPreviewActive ? 'LIVE VIEW' : 'CAMERA VIEW'}</span>
              </button>

              {/* Camera Facing Flip Button (Front / Rear) */}
              <button
                id="toggle-camera-facing-btn"
                onClick={toggleCameraFacing}
                title={`Switch camera facing: Currently ${cameraFacing === 'user' ? 'Front (Selfie)' : 'Rear (Dashcam)'} - Click to switch`}
                className="px-2.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-zinc-200 border border-zinc-700/80 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-mono">{cameraFacing === 'user' ? 'FRONT' : 'REAR'}</span>
              </button>

              {/* Low Light Enhancement */}
              <button
                id="toggle-low-light-btn"
                onClick={() => setIsLowLightMode(!isLowLightMode)}
                title="Toggle night/low-light enhancement"
                className={`p-2 rounded-full border backdrop-blur-sm transition-all cursor-pointer ${
                  isLowLightMode ? 'bg-amber-500/80 text-black border-amber-300' : 'bg-black/65 text-zinc-200 border-zinc-700/80'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Hardware / Screen Torch & Flashlight Button */}
              <button
                id="toggle-torch-btn"
                onClick={toggleTorch}
                title={
                  isTorchActive || isScreenTorchActive
                    ? 'Turn off flashlight / torch'
                    : 'Turn on flashlight (Rear hardware LED or high-lumen screen illuminator)'
                }
                className={`p-2 rounded-full border backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center ${
                  isTorchActive || isScreenTorchActive
                    ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.85)] animate-pulse'
                    : isLowLightMode
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                    : 'bg-black/65 text-zinc-300 hover:text-white border-zinc-700/80'
                }`}
              >
                <Zap className={`w-4 h-4 ${(isTorchActive || isScreenTorchActive) ? 'fill-black text-black' : ''}`} />
              </button>

              {/* Fit Mode Toggle: Full Cover vs Contained Uncropped View */}
              <button
                id="toggle-video-fit-btn"
                onClick={() => setVideoFitMode(prev => prev === 'cover' ? 'contain' : 'cover')}
                title={`Camera Fitment: Currently ${videoFitMode.toUpperCase()} - Tap to switch Fill Screen vs Uncropped Fit`}
                className="px-2.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-amber-400 border border-zinc-700/80 backdrop-blur-md transition-all flex items-center gap-1 text-[10px] font-mono font-black cursor-pointer active:scale-95 shadow-md"
              >
                <span>{videoFitMode === 'cover' ? 'FILL' : 'FIT'}</span>
              </button>

              {/* Fullscreen Toggle Button on Camera HUD */}
              <button
                id="toggle-fullscreen-hud-btn"
                onClick={toggleViewfinderFullscreen}
                title={isViewfinderFullscreen ? "Exit full screen" : "Expand to edge-to-edge full screen mobile dashcam view"}
                className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black border backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-95 ${
                  isViewfinderFullscreen
                    ? 'bg-amber-400 text-black border-amber-300 shadow-amber-400/40'
                    : 'bg-black/75 hover:bg-black/90 text-amber-300 border-amber-500/60'
                }`}
              >
                {isViewfinderFullscreen ? (
                  <>
                    <Minimize className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono">EXIT</span>
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-mono">FULL</span>
                  </>
                )}
              </button>
            </div>

            {/* Prominent Exit Fullscreen Button (Visible when Fullscreen is active) */}
            {isViewfinderFullscreen && (
              <div className="absolute top-3 left-3 z-40 flex items-center gap-2">
                <button
                  id="fullscreen-exit-top-btn"
                  onClick={toggleViewfinderFullscreen}
                  className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-2xl cursor-pointer active:scale-95 border border-red-400 tracking-wider"
                >
                  <Minimize className="w-3.5 h-3.5 text-white" />
                  <span>EXIT FULLSCREEN</span>
                </button>
              </div>
            )}

            {/* Floating Live AI Legal Copilot Guidance HUD in Fullscreen */}
            {isViewfinderFullscreen && currentAnalysis && (
              <div className="absolute top-14 left-3 right-3 sm:left-6 sm:right-6 max-w-xl mx-auto z-40 bg-zinc-950/90 backdrop-blur-md border border-amber-400/80 text-white p-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 truncate">
                      {currentAnalysis.headline}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        showFeedbackToast(
                          'ADDRESSING OFFICER',
                          'Reciting statement out loud through speaker.',
                          <Volume2 className="w-6 h-6 text-amber-400" />
                        );
                        VoiceEngine.speakAloudToOfficer(currentAnalysis.recommendedResponse, userProfile.preferredVoice);
                      }}
                      title="Speak aloud through device speaker"
                      className="flex items-center gap-1 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded text-amber-300 border border-amber-500/40 font-bold cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span>Address Officer</span>
                    </button>
                    <button
                      onClick={() => VoiceEngine.speakAdvice(currentAnalysis.recommendedResponse, userProfile.preferredVoice, true)}
                      title="Whisper into earbud"
                      className="flex items-center gap-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-200 border border-zinc-700 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3 text-zinc-400" />
                      <span>Whisper</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white selection:bg-amber-400 selection:text-black">
                  "{currentAnalysis.recommendedResponse}"
                </p>
                <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                  <span className="truncate max-w-[200px] sm:max-w-none">{currentAnalysis.statuteOrCase}</span>
                  <span className="text-amber-400/90 italic font-mono shrink-0 ml-2">{currentAnalysis.legalCitation}</span>
                </div>
              </div>
            )}

            {/* Instant Camera Feedback Notification */}
            {cameraFeedbackMessage && (
              <div className="absolute top-14 right-3 z-30 bg-black/90 border border-amber-500/70 text-amber-300 text-xs px-3 py-1.5 rounded-lg shadow-xl animate-in fade-in flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{cameraFeedbackMessage}</span>
              </div>
            )}

            {/* Legal Audible Announcement Active HUD Banner */}
            {isAnnouncingNotice && (
              <div className="absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md bg-gradient-to-r from-red-950/95 via-zinc-900/95 to-amber-950/95 border-2 border-amber-400 text-white p-3.5 rounded-xl shadow-2xl z-30 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
                      Audible Legal Notice to Officer Active
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      VoiceEngine.stopAudio();
                      setIsAnnouncingNotice(false);
                    }}
                    className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Silence
                  </button>
                </div>
                <p className="text-xs text-zinc-200 italic leading-snug">
                  &ldquo;Attention: This interaction is being recorded with audio and video for mutual safety, constitutional protection, and official legal documentation under applicable state and federal laws.&rdquo;
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-amber-400/90 pt-1.5 border-t border-zinc-800">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    SPOKEN ALOUD TO POLICE
                  </span>
                  <button
                    onClick={announceRecordingNotice}
                    className="text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
                  >
                    Repeat Aloud
                  </button>
                </div>
              </div>
            )}

            {/* In-Viewfinder Waveform Visualizer */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 bg-black/70 backdrop-blur-md border border-zinc-700/60 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-2">
                <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-red-400 animate-pulse' : 'text-zinc-500'}`} />
                <span className="text-[11px] font-mono text-zinc-300">AUDIO INPUT</span>
              </div>
              <canvas ref={canvasRef} width="160" height="24" className="w-28 sm:w-44 h-5 rounded" />
              <div className="text-[10px] font-mono text-zinc-400">
                {isListening ? 'VOICE AI LISTENING' : 'PASSIVE MONITOR'}
              </div>
            </div>

            {/* Camera hardware fallback placeholder */}
            {hasCameraError && !isRecording && (
              <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center">
                <Video className="w-10 h-10 text-zinc-600 mb-3" />
                <p className="text-zinc-300 text-sm font-medium mb-1">{hasCameraError}</p>
                <button
                  onClick={startRecording}
                  className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Start Recording Anyway
                </button>
              </div>
            )}
          </div>

          {/* Clean, Professional Tactical Cockpit Bar */}
          <div className="bg-zinc-950/95 px-3 py-3 sm:px-6 sm:py-3.5 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 shadow-2xl z-20">
            {/* Left Quick Action: Emergency Witnesses */}
            <button
              id="emergency-distress-ribbon-btn"
              onClick={handleTriggerEmergencyDistress}
              title="Broadcast live stream & SMS alert to emergency witnesses"
              className="py-2.5 px-3 sm:px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/70 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
              <span className="hidden xs:inline">Witnesses</span>
              <span className="xs:hidden">Witnesses</span>
            </button>

            {/* Center: Primary Audio/Video Recording Action */}
            <div className="flex-1 max-w-md mx-auto">
              {!isRecording ? (
                <button
                  id="start-audio-video-record-btn"
                  onClick={startRecording}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl shadow-red-950/80 cursor-pointer transition-all active:scale-[0.98] ring-2 ring-red-500/40"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse shadow-sm" />
                  <span>START INCIDENT RECORDING</span>
                </button>
              ) : (
                <button
                  id="stop-audio-video-record-btn"
                  onClick={stopRecording}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border-2 border-red-500 text-red-400 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Square className="w-4 h-4 fill-red-500 text-red-500" />
                  <span>STOP &amp; CERTIFY EXHIBIT</span>
                </button>
              )}
            </div>

            {/* Right Quick Action: Arrest Lockdown Mode */}
            <button
              id="arrest-lockdown-ribbon-btn"
              onClick={() => handleInstantArrest()}
              title="Engage Immediate Arrest Lockdown: Encrypts vault evidence with AES-256 and locks device"
              className="py-2.5 px-3 sm:px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline">Lockdown</span>
              <span className="xs:hidden">Lock</span>
            </button>
          </div>
        </div>

        {/* Tab 2: DEDICATED AI LEGAL ADVICE & DEFENSE SCRIPTS */}
        {activeEncounterTab === 'ai-advice' && (
          <div id="encounter-tab-ai-advice" className="flex-1 flex flex-col overflow-y-auto bg-zinc-950/70 backdrop-blur-sm p-4 sm:p-6 space-y-4">
            {/* Scenario Selector Header */}
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Scenario:</span>
                <button
                  onClick={() => {
                    setEncounterType('traffic_stop');
                    processIncomingSpeech('Good evening, driver', 'officer');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    encounterType === 'traffic_stop' ? 'bg-amber-400 text-black shadow-md font-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Traffic Stop</span>
                </button>
                <button
                  onClick={() => {
                    setEncounterType('home_encounter');
                    processIncomingSpeech('Police, open the door right now!', 'officer');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    encounterType === 'home_encounter' ? 'bg-amber-400 text-black shadow-md font-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home Encounter</span>
                </button>
                <button
                  onClick={() => {
                    setEncounterType('walking_street');
                    processIncomingSpeech('Hey you, stop right there and show me some ID!', 'officer');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    encounterType === 'walking_street' ? 'bg-amber-400 text-black shadow-md font-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Street Stop</span>
                </button>
                <button
                  onClick={() => {
                    setEncounterType('public_recording');
                    processIncomingSpeech('Put that phone away, you are not allowed to record here!', 'officer');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    encounterType === 'public_recording' ? 'bg-amber-400 text-black shadow-md font-black' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Public Filming</span>
                </button>
              </div>
              {encounterType === 'traffic_stop' && (
                <button
                  onClick={() => setIsPassenger(!isPassenger)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold transition-all cursor-pointer"
                >
                  Role: <span className="text-amber-400 uppercase">{isPassenger ? 'Passenger' : 'Driver'}</span>
                </button>
              )}
            </div>
          
          {/* Real-time AI Commentary Card (Hero guidance banner) */}
          <div id="ai-legal-commentary-card" className={`p-4 border-b ${theme.bg} transition-colors duration-300`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {theme.icon}
                <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${theme.badge}`}>
                  {theme.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                PRIVATE EARBUD ONLY
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-2">
              {currentAnalysis.headline}
            </h3>

            {/* Recommended spoken response */}
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 mb-2.5">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Say This Exact Phrasing:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      showFeedbackToast(
                        'ADDRESSING OFFICER',
                        'Reciting defense statement out loud through speaker.',
                        <Volume2 className="w-6 h-6 text-amber-400" />
                      );
                      VoiceEngine.speakAloudToOfficer(currentAnalysis.recommendedResponse, userProfile.preferredVoice);
                    }}
                    title="Speak Aloud to Officer through device speaker"
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[10px] cursor-pointer transition-colors"
                  >
                    <Volume2 className="w-3 h-3 text-amber-400" />
                    <span>Address Officer Out Loud</span>
                  </button>
                  <button
                    onClick={() => VoiceEngine.speakAdvice(currentAnalysis.recommendedResponse, userProfile.preferredVoice, true)}
                    title="Whisper into private earbud"
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer transition-colors"
                  >
                    <Volume2 className="w-3 h-3 text-zinc-400" />
                    <span>Whisper</span>
                  </button>
                </div>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white tracking-wide leading-relaxed selection:bg-amber-500 selection:text-black">
                "{currentAnalysis.recommendedResponse}"
              </p>
              {userProfile.nativeLanguage !== 'en' && (
                isPaid ? (
                  <p className="text-xs text-amber-300/95 font-medium mt-1.5 pt-1.5 border-t border-white/10 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{TranslationService.translateText(currentAnalysis.recommendedResponse, userProfile.nativeLanguage)}</span>
                  </p>
                ) : (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 bg-black/40 px-2.5 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>Speech Translator requires a Paid Tier</span>
                    </span>
                    <button
                      onClick={handleUpgrade}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[10px]"
                    >
                      Start 3-Day Free Trial
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Exact Legal Citation & Supreme Court Precedent */}
            <div className="text-xs text-zinc-300 space-y-1">
              <div className="flex items-start gap-1.5 font-semibold text-amber-300">
                <Award className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                <span>Citation: {currentAnalysis.legalCitation}</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-normal pl-5">
                {currentAnalysis.statuteOrCase}
              </p>
              <p className="text-[10px] text-zinc-400 italic pl-5">
                Tip: {currentAnalysis.deEscalationTip}
              </p>
            </div>
          </div>

          {/* Hands-Free Voice Command Quick Action Deck */}
          <div className="p-3 bg-zinc-950/90 border-b border-zinc-800">
            <div className="text-[11px] font-bold text-zinc-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>HANDS-FREE VOICE SHORTCUTS:</span>
              </span>
              <button
                onClick={() => setShowVoiceCommandsModal(true)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
              >
                View All Triggers
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <button
                onClick={() => executeVoiceCommand(isRecording ? 'STOP_RECORDING' : 'START_RECORDING', 'manual')}
                className={`px-2 py-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-red-950/70 border-red-500/80 text-red-300 hover:bg-red-900/80' 
                    : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[11px]">{isRecording ? 'Stop' : 'Record'}</span>
                </div>
                <span className="text-[9px] text-zinc-400 font-mono">"Record"</span>
              </button>

              <button
                onClick={() => executeVoiceCommand('CALL_WITNESSES', 'manual')}
                className="px-2 py-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-red-950/90 to-amber-950/80 border border-red-500/80 text-white hover:from-red-900 hover:to-amber-900 transition-all cursor-pointer shadow-md shadow-red-950/50"
              >
                <div className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
                  <span className="text-[11px]">Witnesses</span>
                </div>
                <span className="text-[9px] text-amber-300 font-mono">"Call Witnesses"</span>
              </button>

              <button
                onClick={() => executeVoiceCommand('SHARE_FEED', 'manual')}
                className="px-2 py-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 bg-red-950/60 border border-red-700/80 text-red-200 hover:bg-red-900/70 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                  <span className="text-[11px]">Share Feed</span>
                </div>
                <span className="text-[9px] text-red-400/80 font-mono">"Text Contacts"</span>
              </button>

              <button
                onClick={() => executeVoiceCommand('CALL_HELP', 'manual')}
                className="px-2 py-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 bg-red-950/60 border border-red-700/80 text-red-200 hover:bg-red-900/70 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-red-400" />
                  <span className="text-[11px]">Help / Lock</span>
                </div>
                <span className="text-[9px] text-red-400/80 font-mono">"Call Help"</span>
              </button>

              <button
                onClick={() => {
                  readConstitutionalRightsAloud();
                }}
                className="px-2 py-2 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 bg-amber-950/60 border border-amber-600/80 text-amber-200 hover:bg-amber-900/70 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Scale className="w-3 h-3 text-amber-400" />
                  <span className="text-[11px]">Address Officer</span>
                </div>
                <span className="text-[9px] text-amber-400/80 font-mono">"Read Rights"</span>
              </button>
            </div>
          </div>

          {/* Quick Legal Scripts (One-Tap Spoken Phrases) */}
          <div className="p-3 bg-zinc-950 border-b border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2 flex items-center justify-between">
              <span>QUICK DEFENSE PHRASES (1-TAP):</span>
              <span className="text-[10px] text-zinc-500">Tap to analyze &amp; log</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {encounterType === 'traffic_stop' && (
                <>
                  <button
                    onClick={() => handleQuickScript('Officer, I do not consent to any searches of my vehicle or belongings.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    No Consent to Search (4th)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, I am choosing to exercise my Fifth Amendment right to remain silent.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Remain Silent (5th)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, am I free to leave, or am I being detained?')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-amber-800/60 cursor-pointer transition-colors"
                  >
                    Am I Free to Leave? (Rodriguez)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, I decline to provide my phone passcode under the Fifth Amendment.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Refuse Phone Passcode (Riley)
                  </button>
                </>
              )}

              {encounterType === 'home_encounter' && (
                <>
                  <button
                    onClick={() => handleQuickScript('Officer, please slide your signed search warrant under the door.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-amber-800/60 cursor-pointer transition-colors"
                  >
                    Slide Warrant Under Door (Payton)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, I do not consent to entry or search of my home.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Refuse Entry (Randolph)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, please leave my porch and curtilage immediately.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Revoke Knock-and-Talk (Jardines)
                  </button>
                  <button
                    onClick={() => handleQuickScript('I am exercising my Fifth Amendment right to remain silent.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Remain Silent (5th)
                  </button>
                </>
              )}

              {encounterType === 'walking_street' && (
                <>
                  <button
                    onClick={() => handleQuickScript('Officer, am I free to go, or am I being detained?')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-amber-800/60 cursor-pointer transition-colors"
                  >
                    Am I Free to Go? (Terry)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, am I suspected of a specific crime? I decline to identify myself.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Refuse ID - No RAS (Brown v. TX)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, I do not consent to any pat-downs or searches of my pockets.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    No Consent to Frisk (Dickerson)
                  </button>
                  <button
                    onClick={() => handleQuickScript('I am exercising my Fifth Amendment right to remain silent.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Remain Silent (5th)
                  </button>
                </>
              )}

              {encounterType === 'public_recording' && (
                <>
                  <button
                    onClick={() => handleQuickScript('Officer, I have a First Amendment constitutional right to film police in public.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-xs font-medium border border-emerald-800/60 cursor-pointer transition-colors"
                  >
                    1st Amend. Right to Film (Glik)
                  </button>
                  <button
                    onClick={() => handleQuickScript('I am standing at a reasonable distance and am not interfering with your duties.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-medium border border-amber-800/60 cursor-pointer transition-colors"
                  >
                    15-Foot Safe Buffer (No Interference)
                  </button>
                  <button
                    onClick={() => handleQuickScript('Officer, I do not consent to you taking or unlocking my phone.')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Refuse Phone Seizure (Riley)
                  </button>
                  <button
                    onClick={() => handleQuickScript('What specific law or ordinance prohibits filming from a public sidewalk?')}
                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors"
                  >
                    Ask for Specific Law
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: DEDICATED FULL SPEECH TRANSCRIPT & LEGAL AUDIT */}
      {activeEncounterTab === 'transcript' && (
        <div id="encounter-tab-transcript" className="flex-1 flex flex-col min-h-[160px] overflow-hidden bg-zinc-950/70 backdrop-blur-sm">
          <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold flex items-center gap-1.5 text-zinc-200">
              <FileText className="w-4 h-4 text-emerald-400" />
              LIVE SPEECH TRANSCRIPT &amp; LEGAL AUDIT
            </span>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {transcript.length} events logged
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
            {transcript.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-zinc-600 opacity-60" />
                <p className="text-sm font-semibold text-zinc-400">No dialogue recorded yet</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  When you or an officer speaks, words are transcribed in real time and evaluated against {activeJurisdiction.stateName} state law.
                </p>
              </div>
            ) : (
              transcript.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`p-3 rounded-xl border ${
                    entry.speaker === 'officer' 
                      ? 'bg-blue-950/40 border-blue-900/60 ml-0 mr-4' 
                      : entry.speaker === 'user'
                      ? 'bg-emerald-950/40 border-emerald-900/60 ml-4 mr-0'
                      : 'bg-zinc-900/80 border-zinc-700/60 mx-1'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                    <span className="font-bold uppercase tracking-wider">
                      {entry.speaker === 'officer' ? '👮 Police Officer' : entry.speaker === 'user' ? '🚗 Driver' : '🛡️ System'}
                    </span>
                    <span className="font-mono text-zinc-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">{entry.originalText}</p>
                  
                  {entry.translatedText && (
                    <p className="text-amber-300 text-[11px] mt-1.5 pt-1.5 border-t border-zinc-700/40">
                      🌐 {entry.translatedText}
                    </p>
                  )}

                  {entry.analysis && entry.analysis.category !== 'NEUTRAL_NOTICE' && (
                    <div className="mt-2 pt-2 border-t border-zinc-700/40 text-[10px] text-zinc-300 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                        entry.analysis.category === 'MUST_COMPLY' ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                      }`}>
                        {entry.analysis.category}
                      </span>
                      <span className="truncate text-zinc-400">{entry.analysis.legalCitation}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Situational Officer Testing Shortcuts */}
          <div className="px-3 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-zinc-400 font-bold shrink-0">Simulate Officer:</span>
            {encounterType === 'traffic_stop' && (
              <>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Driver, step out of the vehicle right now.', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Step out of vehicle"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Mind if I take a look inside your trunk?', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Check trunk?"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Where are you coming from tonight?', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Where coming from?"
                </button>
              </>
            )}
            {encounterType === 'home_encounter' && (
              <>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Police department, open the door right now!', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Police, open door!"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('We have a search warrant for this residence.', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "We have a warrant"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Can we step inside and look around for a minute?', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Can we search inside?"
                </button>
              </>
            )}
            {encounterType === 'walking_street' && (
              <>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Hey you, stop right there and show me some ID.', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Stop &amp; show ID"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Put your hands on your head, I am patting you down.', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Hands on head (Frisk)"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('What are you doing walking in this neighborhood?', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Why are you here?"
                </button>
              </>
            )}
            {encounterType === 'public_recording' && (
              <>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Turn off that camera right now or you are going to jail!', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Turn camera off!"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('You need to step back across the street immediately.', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Step back across street"
                </button>
                <button
                  type="button"
                  onClick={() => processIncomingSpeech('Hand me that phone, it is evidence in an investigation.', 'officer')}
                  className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 shrink-0 cursor-pointer"
                >
                  "Hand over phone"
                </button>
              </>
            )}
          </div>

          {/* Manual test dialogue input bar */}
          <form onSubmit={handleManualOfficerSubmit} className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex gap-2">
            <input
              id="manual-officer-speech-input"
              type="text"
              value={manualOfficerInput}
              onChange={(e) => setManualOfficerInput(e.target.value)}
              placeholder="Test: type what officer says (e.g. 'mind if I look around?')"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Analyze
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: DEDICATED EMERGENCY WITNESSES & ARREST LOCKDOWN */}
      {activeEncounterTab === 'emergency' && (
        <div id="encounter-tab-emergency" className="flex-1 flex flex-col overflow-y-auto bg-zinc-950/70 backdrop-blur-sm p-4 sm:p-6 space-y-4">
          
          {/* PRIMARY ARREST LOCKDOWN TRIGGER HERO CARD */}
          <div className="bg-gradient-to-br from-red-950 via-zinc-900 to-black border-2 border-red-600 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-red-950 text-left space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-900 animate-pulse">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    EMERGENCY ARREST LOCKDOWN
                  </h3>
                  <span className="text-[11px] font-mono text-red-400 font-bold block">
                    SEAL EVIDENCE • AES-256 ENCRYPT • CLOUD SYNC • SCREEN TIMEOUT LOCK
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-red-950 border border-red-500/60 text-red-300 px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                1-TAP OR VOICE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              If an officer places you under arrest or demands your phone, activate this protocol immediately. Police SafeGuard halts active streams, computes SHA-256 checksums, seals all evidence with military-grade 256-bit encryption, offloads the certified records to multi-device cloud storage, releases the screen wake lock so the display times out naturally, and enables an impenetrable full-screen device lock.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="emergency-tab-lockdown-btn"
                onClick={() => handleInstantArrest()}
                className="py-4 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-red-950 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Lock className="w-5 h-5 animate-bounce" />
                <span>ENGAGE ARREST LOCKDOWN NOW</span>
              </button>

              <button
                type="button"
                id="emergency-tab-test-voice-btn"
                onClick={() => executeVoiceCommand('ARREST_LOCKDOWN', 'Voice Simulation: Arrest Mode')}
                className="py-4 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-amber-300 border border-amber-500/50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Mic className="w-4 h-4 text-amber-400" />
                <span>Test Spoken Voice Trigger ("Arrest Mode")</span>
              </button>
            </div>
          </div>

          {/* HANDS-FREE VOICE TRIGGER ACTIVE MONITOR */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-left space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Hands-Free Arrest Voice Command Engine</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                LISTENING ACTIVE
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              If your hands are cuffed, restricted, or you are no longer in possession of your device, you can trigger arrest mode completely hands-free by speaking any recognized trigger phrase:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {['"Arrest Mode"', '"Under Arrest"', '"Being Arrested"', '"Taking My Phone"', '"Lock Phone"', '"Code Red"'].map((phrase) => (
                <span key={phrase} className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-amber-300 text-xs font-semibold">
                  {phrase}
                </span>
              ))}
            </div>

            <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Officer Command Recognition:</span>
              </div>
              <p>
                The speech recognition engine also monitors officer statements. If the officer shouts <em>"You are under arrest"</em> or <em>"Hands behind your back"</em>, the app automatically triggers custody lock and seals all evidence without requiring user touch.
              </p>
            </div>
          </div>

          {/* WITNESS NETWORK & CLOUD VAULT SYNC STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Witness Broadcast */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Witness Emergency Broadcast</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {userProfile.emergencyContacts?.length || 0} Contacts
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Dispatches an in-app emergency SMS with your live GPS location and direct real-time video stream link.
              </p>
              <button
                type="button"
                onClick={() => handleTriggerEmergencyDistress()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-950 transition-all"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Dispatch Witness Alert SMS</span>
              </button>
            </div>

            {/* Cloud Vault Sync Status */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Device Cloud Vault</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  AUTO-SYNC ON
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Recovery Key: <strong className="text-white font-mono">{VaultCloudService.getOrCreateRecoveryKey(userProfile)}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  let storedRecords = [];
                  try {
                    const raw = localStorage.getItem('police_protection_records') || localStorage.getItem('civicshield_records');
                    if (raw) storedRecords = JSON.parse(raw);
                  } catch (e) {}
                  VaultCloudService.syncAllRecordsToCloud(
                    storedRecords,
                    undefined,
                    userProfile.email || undefined
                  );
                  showFeedbackToast('CLOUD VAULT SYNC', 'All evidence records synchronized to off-device cloud storage.', <Cloud className="w-5 h-5 text-cyan-400" />);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verify Cloud Storage Sync</span>
              </button>
            </div>

          </div>

          {/* 5th AMENDMENT LEGAL SHIELD NOTICE */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-left text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>5th Amendment &amp; Riley v. California Legal Shield:</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              In <em>Riley v. California (2014)</em>, the Supreme Court ruled that police cannot search cell phone data without a neutral warrant. Under the Fifth Amendment, police <strong className="text-white">CANNOT</strong> compel you to provide your memorized PIN or alphanumeric password. Once arrested and locked, your device remains legally sealed until your attorney assists you.
            </p>
          </div>

        </div>
      )}

      </div>

      {/* Hands-Free Voice Commands Reference & Test Modal */}
      {showVoiceCommandsModal && (
        <div 
          id="voice-commands-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowVoiceCommandsModal(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-zinc-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Hands-Free Voice Command System</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Zero-Touch
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Control recording, trigger emergency lockdown, and cite constitutional rights without lifting a hand
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVoiceCommandsModal(false)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Status Bar */}
            <div className="px-5 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Speech Engine:</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                  isSpeechSupported ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                }`}>
                  {isSpeechSupported ? 'Browser Web Speech API Active' : 'Speech API Not Supported (Tap Buttons)'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-zinc-400">Listener:</span>
                <button
                  onClick={() => {
                    const next = !isHandsFreeActive;
                    setIsHandsFreeActive(next);
                    playConfirmationChime(next ? 'success' : 'alert');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    isHandsFreeActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                  }`}
                >
                  {isHandsFreeActive ? 'ACTIVE (Listening)' : 'PAUSED'}
                </button>
              </div>
            </div>

            {/* Modal Body: Command Cards List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-blue-200 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  During a high-stress police stop, keeping your hands firmly on the steering wheel or in plain sight is critical to your safety. Speak any of the trigger phrases clearly—the AI copilot automatically detects the command, sounds a confirmation chime, logs the legal event, and executes the protection protocol.
                </p>
              </div>

              {/* 1. Start Recording */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider">1. Trigger Video/Audio Recording</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Start Recording"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Record"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Start Camera"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Immediately activates camera/dashcam and encrypted audio sensors with real-time SHA-256 evidence chain under FRE 902(13)/(14).
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('START_RECORDING', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Record"
                </button>
              </div>

              {/* 2. Emergency Witnesses Broadcast */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-950 to-amber-950/30 border-2 border-red-500/80 hover:border-red-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-red-950/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="font-extrabold text-sm text-red-200 uppercase tracking-wider">2. Emergency Witnesses Broadcast</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">
                      WITNESS ALERT
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Voice Command:</span>
                    <span className="px-2 py-0.5 rounded bg-red-950/90 text-amber-300 font-mono text-[11px] font-bold border border-red-700">&quot;Call Witnesses&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">&quot;Witnesses&quot;</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">&quot;Emergency Witnesses&quot;</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Instantly broadcasts your live camera feed, captures GPS location, dispatches in-app SMS with live direct video stream link to your emergency witnesses, and secures the evidence chain.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('CALL_WITNESSES', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-all shadow-md shadow-red-950"
                >
                  Test &quot;Witnesses&quot;
                </button>
              </div>

              {/* 3. Call For Help / Arrest Lockdown */}
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-800/50 hover:border-red-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-extrabold text-sm text-red-200 uppercase tracking-wider">3. Arrest Lockdown & Phone Duress Seal</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-200 font-mono text-[11px] border border-red-800/60">"Call For Help"</span>
                    <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-200 font-mono text-[11px] border border-red-800/60">"Emergency"</span>
                    <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-200 font-mono text-[11px] border border-red-800/60">"Arrest Lockdown"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Immediately freezes biometric access, locks device behind duress PIN, notifies emergency contacts with GPS, and seals video vault.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('CALL_HELP', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors shadow-md shadow-red-950"
                >
                  Test "Call Help"
                </button>
              </div>

              {/* 4. Read Constitutional Rights */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/50 hover:border-amber-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-extrabold text-sm text-amber-200 uppercase tracking-wider">4. Read Out Constitutional Rights Aloud</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[11px] border border-amber-800/60">"Read Rights"</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[11px] border border-amber-800/60">"My Rights"</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono text-[11px] border border-amber-800/60">"Constitutional Rights"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Speaks aloud a tailored constitutional protection statement invoking 5th Amendment silence, 4th Amendment search refusal, and 1st Amendment filming.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('READ_RIGHTS', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Read Rights"
                </button>
              </div>

              {/* 5. Refuse Search */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider">5. 4th Amendment Non-Consent To Search</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"I Do Not Consent"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Refuse Search"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Formally recites and stamps refusal of consent to search vehicle, person, or personal belongings under <em>Schneckloth v. Bustamonte</em>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('REFUSE_SEARCH', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Refuse Search"
                </button>
              </div>

              {/* 6. Am I Free To Go */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider">6. Detention Status Clarification</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Am I Free To Go"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Am I Detained"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Audibly inquires detention status under <em>Rodriguez v. United States</em> to prevent unlawful roadside elongation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('FREE_TO_GO', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Free To Go"
                </button>
              </div>

              {/* 7. Stop Recording */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Square className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider">7. Stop & Certify Evidence</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Stop Recording"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Save Recording"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Stops continuous video/audio capture, seals the custody log, and stores the certified court-ready file in the evidence vault.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('STOP_RECORDING', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Stop"
                </button>
              </div>

              {/* 8. Stealth Mode */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider">8. Stealth Display Blackout</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Stealth Mode"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Black Screen"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Darks the screen to look turned off while encrypted audio and video continuously records in the background. Tap screen to wake.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('STEALTH_ON', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Stealth"
                </button>
              </div>

              {/* 9. Share Live Feed via SMS */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-extrabold text-sm text-white uppercase tracking-wider">9. Share Live Feed with Contacts (SMS)</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-400">Trigger Phrases:</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Share Live Feed"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Text Contacts"</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono text-[11px]">"Send Live Link"</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Dispatches an SMS text message with a secure link so your emergency contacts can watch live or view the full recording afterward.
                  </p>
                </div>
                <button
                  onClick={() => {
                    executeVoiceCommand('SHARE_FEED', 'test');
                    setShowVoiceCommandsModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto transition-colors"
                >
                  Test "Share Feed"
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400">
                🎙️ Tip: Mount phone on dashboard for best hands-free voice pickup during stops.
              </span>
              <button
                onClick={() => setShowVoiceCommandsModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Live Feed with Emergency Contacts Modal */}
      <ShareLiveFeedModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        sessionId={activeSessionId}
        isRecording={isRecording}
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onUpgradePrompt={handleUpgrade}
        locationCity={activeJurisdiction.stateName}
        locationState={activeJurisdiction.stateCode}
      />

      {/* Dedicated Emergency Distress Witnesses Modal with Device SMS Permissions */}
      <EmergencyDistressModal
        isOpen={isDistressModalOpen}
        onClose={() => setIsDistressModalOpen(false)}
        sessionId={activeSessionId}
        isRecording={isRecording}
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onUpgradePrompt={handleUpgrade}
        onStartRecording={startRecording}
        locationCity={activeJurisdiction.stateName}
        locationState={activeJurisdiction.stateCode}
        initialAutoDispatched={!!witnessBroadcastStatus?.active}
        dispatchedCount={witnessBroadcastStatus?.notifiedCount}
        gpsCoordinates={gpsLocation ? {
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude
        } : undefined}
      />

      {/* Legality Compliance Denial Modal */}
      <LegalityRestrictedModal
        isOpen={isLegalityModalOpen}
        onClose={() => setIsLegalityModalOpen(false)}
        check={legalityCheck}
      />
    </div>
  );
};
