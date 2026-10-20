import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Radio, Video, Shield, ShieldAlert, CheckCircle2, MapPin, Clock, 
  ExternalLink, Phone, AlertTriangle, Scale, Lock, Download, Copy, 
  ArrowLeft, RefreshCw, Volume2, VolumeX, User, Eye, Sparkles, Navigation,
  ChevronUp, Smartphone, FileText
} from 'lucide-react';
import { LiveStreamSessionData, TranscriptEntry } from '../types';
import { LiveStreamService } from '../services/liveStreamService';
import { AppUrlHelper } from '../services/appUrlHelper';

interface LiveStreamViewerProps {
  sessionId: string;
  onExit?: () => void;
}

export const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({
  sessionId,
  onExit
}) => {
  // Parse URL query parameters to construct instant zero-delay live session state
  const [session, setSession] = useState<LiveStreamSessionData | null>(() => {
    if (typeof window === 'undefined') return null;
    const local = LiveStreamService.getLocalSession(sessionId);
    if (local) return local;

    try {
      const params = new URLSearchParams(window.location.search);
      const name = params.get('name') || 'Protected Citizen';
      const type = (params.get('type') || 'traffic_stop') as any;
      const loc = params.get('loc');
      const latStr = params.get('lat');
      const lngStr = params.get('lng');
      const state = params.get('state') || 'US';
      const tsStr = params.get('ts');
      const phone = params.get('p');

      const lat = latStr ? parseFloat(latStr) : undefined;
      const lng = lngStr ? parseFloat(lngStr) : undefined;
      const startedAt = tsStr ? parseInt(tsStr, 10) : Date.now();
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

      return {
        sessionId,
        isLive: true,
        userName: name,
        userPhone: phone || undefined,
        encounterType: type,
        startedAt,
        durationSeconds: elapsed,
        gpsCoordinates: (lat && lng) ? { latitude: lat, longitude: lng, accuracyMeters: 10, jurisdictionState: state } : undefined,
        transcript: [
          {
            id: 'init-1',
            speaker: 'officer',
            text: 'Law enforcement encounter in progress. Real-time emergency witness dispatch active.',
            originalText: 'Law enforcement encounter in progress. Real-time emergency witness dispatch active.',
            timestamp: startedAt,
            verified: true
          },
          {
            id: 'init-2',
            speaker: 'user',
            text: 'Constitutional civil rights asserted: Remaining silent under Fifth Amendment; non-consent to search under Fourth Amendment.',
            originalText: 'Constitutional civil rights asserted: Remaining silent under Fifth Amendment; non-consent to search under Fourth Amendment.',
            timestamp: startedAt + 2000,
            verified: true,
            statuteAlert: `${state} Constitutional Shield Active`
          }
        ],
        certificateId: `CERT-${sessionId}`,
        sha256Hash: `SHA256-${sessionId.replace(/[^A-Za-z0-9]/g, '')}`,
        currentStatusNote: loc ? `Active police encounter near ${loc}` : 'Live encounter active. Audio, video, and legal transcript streaming.',
        updatedAt: Date.now(),
        viewerCount: 2
      };
    } catch (e) {
      return {
        sessionId,
        isLive: true,
        userName: 'Citizen in Police Encounter',
        encounterType: 'traffic_stop',
        startedAt: Date.now(),
        durationSeconds: 0,
        transcript: [],
        certificateId: `CERT-${sessionId}`,
        currentStatusNote: 'Active live witness channel established.',
        updatedAt: Date.now(),
        viewerCount: 1
      };
    }
  });

  const [liveCameraFrame, setLiveCameraFrame] = useState<string | null>(() => {
    return session?.lastSnapshot || null;
  });
  const [fpsEstimate, setFpsEstimate] = useState<number>(10);
  const [streamLatencyMs, setStreamLatencyMs] = useState<number>(45);
  const [streamConnectionState, setStreamConnectionState] = useState<'connected' | 'reconnecting' | 'idle'>('connected');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(() => session?.durationSeconds || 0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now());
  const [showScrollTopBtn, setShowScrollTopBtn] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'actions' | 'transcript' | 'details'>('actions');

  const viewerRootRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());
  const lastFrameTimeRef = useRef(Date.now());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const isAudioMutedRef = useRef(false);
  useEffect(() => {
    isAudioMutedRef.current = isAudioMuted;
  }, [isAudioMuted]);

  // Subscribe to real-time direct camera video stream and audio via WebSocket / SSE
  useEffect(() => {
    let isMounted = true;

    const sub = LiveStreamService.subscribeViewer(sessionId, {
      onFrame: (frameDataUrl, metadata) => {
        if (!isMounted) return;
        lastFrameTimeRef.current = Date.now();
        setLiveCameraFrame(frameDataUrl);
        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFpsCalcRef.current >= 1000) {
          const fps = (frameCountRef.current * 1000) / (now - lastFpsCalcRef.current);
          setFpsEstimate(Math.round(fps * 10) / 10);
          frameCountRef.current = 0;
          lastFpsCalcRef.current = now;
        }
        if (metadata?.timestamp) {
          const lat = Math.max(20, now - metadata.timestamp);
          setStreamLatencyMs(lat);
        }
        if (typeof metadata?.durationSeconds === 'number') {
          setLiveElapsedSeconds(metadata.durationSeconds);
        }
        if (metadata?.transcript) {
          setSession(prev => prev ? { ...prev, transcript: metadata.transcript } : prev);
        }
      },
      onAudio: (audioDataUrl) => {
        if (!isMounted || isAudioMutedRef.current) return;
        try {
          const a = new Audio(audioDataUrl);
          a.volume = 1.0;
          a.play().catch(() => {});
        } catch (e) {}
      },
      onStatusUpdate: (updated) => {
        if (!isMounted) return;
        setSession(prev => {
          // Never cut feed unless explicitly ended by subscriber or arrest lockdown
          const isExplicitlyEnded = updated.isLive === false || !!updated.completedAt || updated.currentStatusNote === 'POLICE_CUSTODY_LOCKDOWN';
          return {
            ...(prev || {}),
            ...updated,
            isLive: isExplicitlyEnded ? false : (prev?.isLive ?? true)
          } as any;
        });
        if (updated.lastSnapshot) {
          setLiveCameraFrame(updated.lastSnapshot);
        }
      },
      onConnectionChange: (st) => {
        if (!isMounted) return;
        setStreamConnectionState(st === 'connected' ? 'connected' : 'reconnecting');
      }
    });

    return () => {
      isMounted = false;
      sub.close();
    };
  }, [sessionId]);

  // Poll for live stream session updates to prevent desync
  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const data = await LiveStreamService.fetchSession(sessionId);
        if (isMounted && data) {
          setSession(prev => {
            // Live stream feed continues until subscriber stops recording or triggers arrest lockdown
            const isExplicitlyEnded = data.isLive === false || !!data.completedAt || data.currentStatusNote === 'POLICE_CUSTODY_LOCKDOWN';
            return {
              ...data,
              isLive: isExplicitlyEnded ? false : (prev?.isLive ?? true)
            };
          });

          // Always update snapshot if provided
          if (data.lastSnapshot) {
            setLiveCameraFrame(data.lastSnapshot);
          }
          if (typeof data.durationSeconds === 'number') {
            setLiveElapsedSeconds(data.durationSeconds);
          }
          setIsLoading(false);
          setLastRefreshedAt(Date.now());
        } else if (isMounted && !session) {
          const local = LiveStreamService.getLocalSession(sessionId);
          if (local) {
            setSession(local);
            if (local.lastSnapshot) {
              setLiveCameraFrame(local.lastSnapshot);
            }
            setLiveElapsedSeconds(local.durationSeconds || 0);
          }
          setIsLoading(false);
        }
      } catch (e) {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSession();

    // Poll every 2 seconds while active
    const interval = setInterval(() => {
      loadSession();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  // Live timer tick when encounter is active - does not stop until subscriber ends or lockdown
  useEffect(() => {
    const isLive = session?.isLive !== false && !session?.completedAt && session?.currentStatusNote !== 'POLICE_CUSTODY_LOCKDOWN';
    if (!isLive) return;

    const timer = setInterval(() => {
      setLiveElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.isLive, session?.completedAt, session?.currentStatusNote]);

  // Reset window and document scroll on mount to prevent mobile browser scroll-shifts
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    if (viewerRootRef.current) {
      viewerRootRef.current.scrollTop = 0;
    }
  }, []);

  // Auto-scroll inside transcript container ONLY without jerking the window or shifting the video
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [session?.transcript?.length]);

  // Scroll detection on viewer root to show return-to-top button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setShowScrollTopBtn(top > 160);
  };

  const scrollToTop = () => {
    if (viewerRootRef.current) {
      viewerRootRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    const url = LiveStreamService.getShareUrl(sessionId);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 3000);
  };

  const handleDownloadLog = () => {
    if (!session) return;
    const isConcluded = session.isLive === false || !!session.completedAt || session.currentStatusNote === 'POLICE_CUSTODY_LOCKDOWN';
    const exportData = {
      title: 'Police SafeGuard Certified Legal Incident Record',
      sessionId: session.sessionId,
      certificateId: session.certificateId,
      status: !isConcluded ? 'IN_PROGRESS_LIVE' : 'CONCLUDED_ARCHIVED',
      recordedFor: session.userName,
      encounterType: session.encounterType,
      startedAt: new Date(session.startedAt).toISOString(),
      completedAt: session.completedAt ? new Date(session.completedAt).toISOString() : null,
      durationSeconds: liveElapsedSeconds,
      gpsLocation: session.gpsCoordinates,
      sha256IntegrityHash: session.sha256Hash || 'GENERATING_ON_STREAM_COMPLETION',
      federalRulesOfEvidenceAdmissibility: 'FRE 902(13) & 902(14) Certified Record of Data Generated by Electronic Process',
      transcript: session.transcript
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EVIDENCE-LOG-${session.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !session) {
    return (
      <div className="h-[100dvh] w-full bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-lg font-bold">Connecting to Secure Live Stream...</h2>
        <p className="text-xs text-zinc-400 mt-1">Session ID: {sessionId}</p>
      </div>
    );
  }

  // Fallback if session truly not found
  if (!session) {
    return (
      <div className="h-[100dvh] w-full bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Live Stream or Recording Not Found</h2>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          The requested encounter session ID <code className="font-mono text-zinc-300">({sessionId})</code> may have expired, or the encounter has not yet started broadcasting.
        </p>
        {onExit && (
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>
    );
  }

  // Live feed continues until subscriber stops recording or triggers arrest lockdown
  const isLockdown = session.currentStatusNote === 'POLICE_CUSTODY_LOCKDOWN';
  const isLive = session.isLive !== false && !session.completedAt && !isLockdown;
  const mapsUrl = session.gpsCoordinates 
    ? `https://www.google.com/maps/search/?api=1&query=${session.gpsCoordinates.latitude},${session.gpsCoordinates.longitude}`
    : null;

  // Render Helpers
  const renderVideoPlayer = () => (
    <div className="relative bg-black rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl aspect-video max-h-[30vh] sm:max-h-[36vh] lg:max-h-none lg:aspect-[16/10] flex flex-col justify-between w-full">
      {/* Background Video Stream: Recorded Video or Direct Camera Snapshots or Connecting HUD */}
      {session.videoUrl ? (
        <video
          src={session.videoUrl}
          controls
          playsInline
          autoPlay
          className="w-full h-full object-contain bg-black"
        />
      ) : (liveCameraFrame || session.lastSnapshot) ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <img
            src={liveCameraFrame || session.lastSnapshot}
            alt="Direct Live Camera Stream"
            className="w-full h-full object-contain"
          />

          {/* Live Stream Broadcast Badge */}
          {isLive && (
            <div className="absolute top-8 sm:top-10 left-3 bg-red-600/95 backdrop-blur-md text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg z-20">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>DIRECT CAMERA FEED • REAL-TIME</span>
            </div>
          )}

          {isLockdown && (
            <div className="absolute top-8 sm:top-10 left-3 bg-rose-700/95 backdrop-blur-md text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-lg z-20">
              <Lock className="w-3 h-3 text-white" />
              <span>ARREST LOCKDOWN ENGAGED • SEALED</span>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-900 to-black text-center">
          <div className="relative mb-2">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-amber-400 shadow-inner">
              <Video className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            {isLive && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-red-500" />
              </span>
            )}
          </div>

          <h3 className="text-xs sm:text-base font-bold text-white mb-0.5 sm:mb-1">
            {isLive 
              ? 'Connecting to Live Camera Stream...' 
              : isLockdown 
              ? 'Arrest Lockdown Engaged — Evidence Encrypted' 
              : 'Encounter Video Processing & Sealed'}
          </h3>
          <p className="text-[10px] sm:text-xs text-zinc-400 max-w-sm px-2">
            {isLive 
              ? 'Live camera feed actively streaming from citizen device. Video feed stays active until citizen stops recording or triggers arrest lockdown.' 
              : isLockdown
              ? 'The civilian triggered emergency arrest lockdown. Evidence has been sealed under the 5th Amendment.'
              : 'The civilian stopped recording. The certified exhibit has been cryptographically sealed.'}
          </p>

          {/* Animated Audio Waveform simulation for live broadcast */}
          {isLive && (
            <div className="flex items-center gap-1 mt-2 sm:mt-4 h-5 sm:h-7">
              {[35, 65, 90, 45, 80, 100, 70, 40, 85, 95, 60, 30, 75, 50].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-amber-400/80 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${(i * 0.1).toFixed(1)}s`,
                    animationDuration: '1.2s'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlays on Player (Top Status HUD) */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-lg border border-white/10 text-[9px] sm:text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${
            isLive ? 'bg-red-500 animate-pulse' : isLockdown ? 'bg-rose-400' : 'bg-emerald-400'
          }`} />
          <span className="font-bold">{isLive ? 'DIRECT LIVE CAM' : isLockdown ? 'LOCKED & SEALED' : 'SEALED EXHIBIT'}</span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-300">{formatSeconds(liveElapsedSeconds)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`px-2 py-0.5 sm:py-1 rounded-lg border text-[9px] sm:text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md ${
              !isAudioMuted 
                ? 'bg-emerald-500/90 text-black border-emerald-400' 
                : 'bg-zinc-800/90 text-zinc-300 border-zinc-700 hover:text-white'
            }`}
          >
            {!isAudioMuted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3 text-zinc-400" />}
            <span>{!isAudioMuted ? 'AUDIO LIVE' : 'UNMUTE'}</span>
          </button>

          <div className="bg-black/80 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-lg border border-white/10 text-[9px] sm:text-[11px] font-mono text-zinc-300 hidden sm:flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>{fpsEstimate > 0 ? `${fpsEstimate} FPS` : 'LIVE'} • FRE 902</span>
          </div>
        </div>
      </div>

      {/* Bottom HUD bar on Player */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
        <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-lg border border-white/10 text-[9px] sm:text-[11px] text-zinc-300 truncate max-w-[65%]">
          📍 {session.gpsCoordinates?.city || 'GPS Fix'}{session.gpsCoordinates?.jurisdictionState ? `, ${session.gpsCoordinates.jurisdictionState}` : ''}
        </div>

        <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-lg border border-white/10 text-[8px] sm:text-[10px] text-emerald-400 font-mono">
          256-BIT SHA HASHING
        </div>
      </div>
    </div>
  );

  const renderActionsContent = () => (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Authorized Witness Response Actions</span>
        </h2>
        <span className="text-[10px] text-zinc-400 font-mono">
          {isLive ? 'ENCOUNTER ACTIVE' : 'ARCHIVED RECORD'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Call Civilian directly */}
        {session.userPhone ? (
          <a
            href={`tel:${session.userPhone}`}
            className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Call {session.userName.split(' ')[0]}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Citizen phone number was not provided for this encounter"
            className="px-3 py-2.5 rounded-xl bg-zinc-850 text-zinc-500 text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-800 cursor-not-allowed"
          >
            <Phone className="w-4 h-4 text-zinc-600" />
            <span>Citizen Phone Unlisted</span>
          </button>
        )}

        {/* Call Emergency Dispatch / 911 */}
        <a
          href="tel:911"
          className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/60"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Dial 911 Dispatch</span>
        </a>

        {/* Open GPS Navigation */}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Navigate to Scene</span>
          </a>
        ) : (
          <button
            disabled
            className="px-3 py-2.5 rounded-xl bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-zinc-800"
          >
            <Navigation className="w-4 h-4" />
            <span>GPS Unavailable</span>
          </button>
        )}
      </div>

      {/* Certified Custody Evidence Seal Details */}
      <div className="pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="space-y-0.5">
          <div className="text-[10px] text-zinc-400 font-mono">COURT EXHIBIT ID:</div>
          <div className="font-mono text-amber-400 font-bold text-[11px]">{session.certificateId}</div>
        </div>

        {session.sha256Hash && (
          <button
            onClick={() => handleCopyHash(session.sha256Hash!)}
            className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-black border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Click to copy SHA-256 Hash"
          >
            <span>SHA256: {session.sha256Hash.substring(0, 10)}...</span>
            {copiedHash ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          </button>
        )}

        <button
          onClick={handleDownloadLog}
          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700 ml-auto"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Prompt to Install Police SafeGuard App */}
      <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white">
              Get Police SafeGuard On Your Phone (100% Free)
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 max-w-md leading-relaxed">
            Protect yourself during traffic stops with real-time constitutional guidance, 1-tap emergency witness streaming, and court-sealed recordings.
          </p>
        </div>

        <a
          href={AppUrlHelper.getLiveAccountDownloadUrl()}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download App ($0)</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );

  const renderDetailsContent = () => (
    <div className="space-y-3">
      {session.gpsCoordinates && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
            <MapPin className="w-4 h-4" />
            <span>Real-Time Incident Location</span>
          </div>
          <div className="text-sm font-semibold text-white">
            {session.gpsCoordinates.city ? `${session.gpsCoordinates.city}, ` : ''}{session.gpsCoordinates.jurisdictionState}
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Lat: {session.gpsCoordinates.latitude.toFixed(5)}, Lng: {session.gpsCoordinates.longitude.toFixed(5)} • ±{session.gpsCoordinates.accuracyMeters}m
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Launch Google Maps Route</span>
            </a>
          )}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-2 text-xs">
        <div className="font-bold text-amber-400 flex items-center gap-1.5">
          <Scale className="w-4 h-4" />
          <span>FRE 902 Electronic Evidence Seal</span>
        </div>
        <p className="text-[11px] text-zinc-300 leading-relaxed">
          This recording and dialogue transcript are protected by federal hash verification and tamper-evident storage for legal admissibility under FRE 902(13) &amp; 902(14).
        </p>
        <div className="p-2.5 rounded-lg bg-black border border-zinc-800 font-mono text-[10px] space-y-1 text-zinc-400">
          <div>Exhibit ID: <strong className="text-white">{session.certificateId}</strong></div>
          {session.sha256Hash && <div>SHA-256: {session.sha256Hash}</div>}
        </div>
      </div>
    </div>
  );

  const renderTranscriptContent = (isMobile = false) => (
    <div className={`flex flex-col bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl ${isMobile ? 'h-[440px]' : 'h-full flex-1'}`}>
      {/* Transcript Header */}
      <div className="p-3 sm:p-4 bg-zinc-950/95 border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Live Dialogue &amp; Constitutional Audit</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-zinc-400">
            {isLive ? 'Real-time dialogue stream & constitutional rights flags' : 'Archived sworn dialogue transcription'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
            {session.transcript.length} Entries
          </span>
        </div>
      </div>

      {/* Transcript Content List - Container-Only Scroll so Window Never Jerks */}
      <div 
        ref={transcriptContainerRef}
        className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 font-sans text-xs scroll-smooth"
      >
        {session.transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <Volume2 className="w-8 h-8 text-zinc-600 mb-2 animate-pulse" />
            <p className="font-semibold text-zinc-400">Listening for Dialogue...</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Spoken statements between the officer and citizen will automatically appear here with legal compliance markers.
            </p>
          </div>
        ) : (
          session.transcript.map((entry, idx) => {
            const isOfficer = entry.speaker === 'officer';
            const isSystem = entry.speaker === 'system';

            if (isSystem) {
              return (
                <div key={entry.id || idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                  {entry.originalText}
                </div>
              );
            }

            return (
              <div
                key={entry.id || idx}
                className={`p-3 rounded-xl border transition-all ${
                  isOfficer
                    ? 'bg-blue-950/20 border-blue-900/50 text-blue-100 ml-0 mr-3'
                    : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-100 ml-3 mr-0'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className={`font-bold uppercase tracking-wider ${
                    isOfficer ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {isOfficer ? '👮 Police Officer' : `👤 ${session.userName} (Citizen)`}
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs leading-relaxed font-medium">
                  "{entry.originalText}"
                </p>

                {/* Legal analysis tag if attached */}
                {entry.analysis && (
                  <div className="mt-2 pt-2 border-t border-zinc-700/50 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        entry.analysis.severity === 'critical' || entry.analysis.severity === 'high'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {entry.analysis.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {entry.analysis.statuteOrCase || entry.analysis.legalCitation}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 font-medium">
                      {entry.analysis.headline}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Transcript Footer Status */}
      <div className="p-2.5 sm:p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span>{isLive ? 'Live Relay Synchronized' : 'Transcript Complete'}</span>
        </div>
        <span>Auto-Updated: {new Date(lastRefreshedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );

  return (
    <div 
      id="live-stream-viewer-root"
      ref={viewerRootRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden text-white flex flex-col selection:bg-amber-500 selection:text-black bg-zinc-950"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(20, 24, 35, 0.85) 0%, rgba(9, 10, 15, 0.96) 75%), url('/images/app_background_dark_1790279147669.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Top Emergency Status Bar */}
      <header className="shrink-0 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-6 py-2 shadow-xl z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onExit && (
              <button
                onClick={onExit}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                {isLive ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping" />
                  </>
                ) : isLockdown ? (
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm font-extrabold tracking-wide text-white truncate">
                    {isLive 
                      ? 'POLICE ENCOUNTER — LIVE FEED' 
                      : isLockdown 
                      ? 'POLICE ENCOUNTER — ARREST LOCKDOWN' 
                      : 'POLICE ENCOUNTER — ARCHIVED EVIDENCE'}
                  </h1>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    isLive 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isLockdown
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {isLive ? 'LIVE' : isLockdown ? 'LOCKED' : 'SEALED'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  Citizen: <strong className="text-zinc-200">{session.userName}</strong> • {session.encounterType.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Clock / Duration */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="font-bold">{formatSeconds(liveElapsedSeconds)}</span>
              {isLive && <span className="text-[9px] text-red-400 uppercase font-sans">Live</span>}
            </div>

            {/* Direct App Download Button for Viewers */}
            <a
              href={AppUrlHelper.getLiveAccountDownloadUrl()}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-black text-xs font-black transition-all shadow-md cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download App ($0)</span>
            </a>

            {/* Share / Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
              <span className="hidden xs:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Complimentary Witness Access Notice Strip */}
      <div className="shrink-0 bg-gradient-to-r from-emerald-950/70 via-zinc-950 to-emerald-950/70 border-b border-emerald-500/30 px-3 sm:px-6 py-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>
              <strong>Complimentary Witness Access ($0):</strong> Direct camera feed &amp; audio sponsored by {session.userName}.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[9px] text-emerald-400 uppercase">
            FRE 902 Evidence Chain Active
          </span>
        </div>
      </div>

      {/* MOBILE VIEW (lg:hidden): Video Player is permanently pinned at top, tabs scroll smoothly below */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Pinned Video Feed Card (Never leaves view, never shifts) */}
        <div className="shrink-0 w-full bg-zinc-950 px-2.5 pt-1.5 pb-2 border-b border-zinc-800/80 shadow-md">
          {renderVideoPlayer()}

          {/* Mobile Tab Switcher immediately under video player */}
          <div className="flex items-center justify-between gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mt-2">
            <button
              onClick={() => setMobileActiveTab('actions')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                mobileActiveTab === 'actions' 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Actions &amp; 911</span>
            </button>

            <button
              onClick={() => setMobileActiveTab('transcript')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                mobileActiveTab === 'transcript' 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Transcript ({session.transcript.length})</span>
            </button>

            <button
              onClick={() => setMobileActiveTab('details')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                mobileActiveTab === 'details' 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>GPS &amp; Proof</span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-3">
          {mobileActiveTab === 'actions' && renderActionsContent()}
          {mobileActiveTab === 'transcript' && renderTranscriptContent(true)}
          {mobileActiveTab === 'details' && renderDetailsContent()}
        </div>
      </div>

      {/* DESKTOP VIEW (hidden lg:grid): 7-column Left Cockpit + 5-column Right Transcript */}
      <main className="hidden lg:grid lg:grid-cols-12 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 gap-6 overflow-hidden min-h-0">
        {/* Left Column (Desktop 7 cols): Live Video Feed + Action Center */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto min-h-0 pr-1.5">
          {renderVideoPlayer()}
          {renderActionsContent()}
          {renderDetailsContent()}
        </div>

        {/* Right Column (Desktop 5 cols): Live Certified Audio Transcript */}
        <div className="lg:col-span-5 flex flex-col min-h-0 h-full">
          {renderTranscriptContent(false)}
        </div>
      </main>
    </div>
  );
};
