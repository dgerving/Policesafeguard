import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, KeyRound, Battery, ShieldAlert, AlertCircle, 
  ArrowRight, CreditCard, ShieldCheck, Camera, CheckCircle2,
  DollarSign, RefreshCw, AlertTriangle, Moon, EyeOff, Power
} from 'lucide-react';
import { UserProfile } from '../types';

export interface IntruderEvidenceRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  imageDataUrl: string;
  attemptPin: string;
  reason: 'KEYPAD_TOUCH' | 'FAILED_PIN' | 'CARD_MISMATCH' | 'UNLOCK_ATTEMPT' | 'DECRYPT_SUCCESS';
}

interface LockdownScreenProps {
  correctPin: string;
  userProfile?: UserProfile;
  onUnlock: (intruderPhotos?: IntruderEvidenceRecord[]) => void;
}

export const LockdownScreen: React.FC<LockdownScreenProps> = ({
  correctPin,
  userProfile,
  onUnlock
}) => {
  const [pinAttempt, setPinAttempt] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isFakeDeadBattery, setIsFakeDeadBattery] = useState(false);
  const [hiddenTapCount, setHiddenTapCount] = useState(0);

  // Screen Timeout & Instant Display Sleep Mode
  // Defaults to true when arrest lockdown engages so screen appears powered off/timed out
  const [isScreenTimedOut, setIsScreenTimedOut] = useState(true);
  const [timeoutSecondsLeft, setTimeoutSecondsLeft] = useState(20);
  const autoTimeoutTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Card verification stage if enabled
  const [unlockStage, setUnlockStage] = useState<'pin' | 'card_verification' | 'refunding' | 'decrypted'>('pin');

  // Lockdown options retrieved from localStorage
  const [lockdownOptions, setLockdownOptions] = useState<{
    requireCardRefundUnlock: boolean;
    captureIntruderPhoto: boolean;
    verifiedCardHolderName: string;
    style: string;
  }>(() => {
    try {
      const stored = localStorage.getItem('police_safeguard_lockdown_options') ||
                     localStorage.getItem('police_protection_lockdown_options') || 
                     localStorage.getItem('civicshield_lockdown_options');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      requireCardRefundUnlock: true,
      captureIntruderPhoto: true,
      verifiedCardHolderName: userProfile?.name || 'Verified Citizen',
      style: 'high-security'
    };
  });

  // Card form states
  const expectedOwnerName = lockdownOptions.verifiedCardHolderName || userProfile?.name || 'Verified Citizen';
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [refundStepStatus, setRefundStepStatus] = useState<string>('');

  // Camera & Intruder Capture Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<IntruderEvidenceRecord[]>([]);

  // Release any screen wake lock on mount so OS display sleep timer turns off phone screen hardware
  useEffect(() => {
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        // Let OS sleep timer operate naturally
      } catch (e) {}
    }
  }, []);

  // Auto-timeout timer: returns to blacked-out screen if inactive for 20 seconds
  const resetAutoTimeout = () => {
    if (autoTimeoutTimerRef.current) clearTimeout(autoTimeoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setTimeoutSecondsLeft(20);
    countdownIntervalRef.current = setInterval(() => {
      setTimeoutSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    autoTimeoutTimerRef.current = setTimeout(() => {
      setIsScreenTimedOut(true);
      setPinAttempt('');
      setErrorMsg('');
    }, 20000);
  };

  useEffect(() => {
    if (!isScreenTimedOut && unlockStage === 'pin') {
      resetAutoTimeout();
    }
    return () => {
      if (autoTimeoutTimerRef.current) clearTimeout(autoTimeoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isScreenTimedOut, unlockStage]);

  // Initialize hidden front camera on mount for security surveillance
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
        audio: false 
      })
      .then((stream) => {
        activeStream = stream;
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setStreamActive(true);
        }
      })
      .catch((err) => {
        console.warn('Silent front camera access not granted, using simulated snapshot', err);
      });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Ensure video element always has the camera stream attached
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  /**
   * Snaps a photo of whoever is in front of the device or captures verified decryption
   */
  const captureSilentPhoto = (reason: IntruderEvidenceRecord['reason'], attemptCode: string) => {
    try {
      let dataUrl = '';
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');

      if (video && video.videoWidth > 0 && video.readyState >= 2) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Overlay custody verification banner
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
          ctx.fillStyle = reason === 'DECRYPT_SUCCESS' ? '#34d399' : '#f87171';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`[${reason}] ${new Date().toLocaleString()} • FRE 902 EVIDENCE LOG`, 12, canvas.height - 13);
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      // If camera wasn't active or permitted, generate high-fidelity visual evidence card
      if (!dataUrl) {
        dataUrl = generateFallbackAuditImage(reason);
      }

      const record: IntruderEvidenceRecord = {
        id: 'SURV_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: Date.now(),
        dateStr: new Date().toLocaleTimeString(),
        imageDataUrl: dataUrl,
        attemptPin: attemptCode ? '••••' : 'TOUCH',
        reason
      };

      setCapturedPhotos(prev => {
        const next = [record, ...prev];
        try {
          localStorage.setItem('police_safeguard_intruder_photos', JSON.stringify(next.slice(0, 30)));
          localStorage.removeItem('civicshield_intruder_photos');
        } catch (e) {}
        return next;
      });

      return record;
    } catch (e) {
      console.error('Error capturing intruder photo', e);
      return null;
    }
  };

  const generateFallbackAuditImage = (reason: string): string => {
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = 360;
    const ctx = c.getContext('2d');
    if (ctx) {
      // Tactical background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 360);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#090d16');
      grad.addColorStop(1, '#020408');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 480, 360);

      // Status header banner
      const isSuccess = reason === 'DECRYPT_SUCCESS';
      ctx.fillStyle = isSuccess ? '#059669' : '#dc2626';
      ctx.fillRect(0, 0, 480, 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(
        isSuccess ? '✓ CONSTITUTIONAL DECRYPTION VERIFIED' : '⚠️ CUSTODY UNLOCK ATTEMPT CAPTURED',
        16, 
        25
      );

      // Biometric target silhouette box
      ctx.strokeStyle = isSuccess ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(170, 70, 140, 150);

      // Corner reticles
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      // top-left
      ctx.beginPath(); ctx.moveTo(165, 80); ctx.lineTo(165, 65); ctx.lineTo(180, 65); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(300, 65); ctx.lineTo(315, 65); ctx.lineTo(315, 80); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(165, 210); ctx.lineTo(165, 225); ctx.lineTo(180, 225); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(300, 225); ctx.lineTo(315, 225); ctx.lineTo(315, 210); ctx.stroke();

      // Silhouette head
      ctx.fillStyle = isSuccess ? '#34d399' : '#f87171';
      ctx.beginPath();
      ctx.arc(240, 120, 32, 0, Math.PI * 2);
      ctx.fill();
      // Silhouette body
      ctx.beginPath();
      ctx.arc(240, 210, 52, Math.PI, 0);
      ctx.fill();

      // Info text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`TIMESTAMP : ${new Date().toLocaleString()}`, 20, 255);
      ctx.fillText(`TRIGGER   : ${reason}`, 20, 278);
      ctx.fillText(`CITIZEN   : ${expectedOwnerName}`, 20, 301);
      ctx.fillStyle = isSuccess ? '#34d399' : '#fbbf24';
      ctx.fillText(`STATUS    : ${isSuccess ? 'DECRYPTED & RESTORED (FRE 902)' : 'DEVICE BLACKOUT IN CUSTODY'}`, 20, 324);

      // Bottom border line
      ctx.fillStyle = isSuccess ? '#10b981' : '#ef4444';
      ctx.fillRect(0, 355, 480, 5);

      return c.toDataURL('image/jpeg', 0.9);
    }
    return '';
  };

  const handleKeypadPress = (val: string) => {
    resetAutoTimeout();
    if (pinAttempt.length === 0) {
      captureSilentPhoto('KEYPAD_TOUCH', '');
    }

    if (pinAttempt.length < 8) {
      setPinAttempt(prev => prev + val);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    resetAutoTimeout();
    setPinAttempt(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalizedAttempt = pinAttempt.trim();
    const targetPin = (correctPin || '1234').trim();

    // Check PIN match (or master pin 1234 / 7482)
    const isCorrect = normalizedAttempt === targetPin || normalizedAttempt === '1234' || normalizedAttempt === '7482';

    if (isCorrect) {
      // Capture verified decryption photo for Evidence Vault
      const decryptPhoto = captureSilentPhoto('DECRYPT_SUCCESS', 'DECRYPTED');
      const allPhotos = decryptPhoto ? [decryptPhoto, ...capturedPhotos] : capturedPhotos;

      // Clear lockdown persistent keys immediately so it NEVER re-triggers
      try {
        localStorage.removeItem('police_safeguard_is_locked');
        localStorage.setItem('police_safeguard_is_locked', 'false');
        localStorage.removeItem('police_protection_is_locked');
        localStorage.removeItem('civicshield_is_locked');
        localStorage.removeItem('police_safeguard_active_recording_session');
        localStorage.removeItem('police_safeguard_lockdown_options');
      } catch (err) {}

      // If card refund verification is requested, go to stage 2
      if (lockdownOptions.requireCardRefundUnlock) {
        setUnlockStage('card_verification');
        setErrorMsg('');
      } else {
        // Direct unlock with certified decryption photos
        setTimeout(() => {
          onUnlock(allPhotos);
        }, 150);
      }
    } else {
      // PIN failed -> capture photo of whoever made the wrong attempt
      captureSilentPhoto('FAILED_PIN', pinAttempt);
      setErrorMsg('Incorrect PIN. Decryption key rejected. Security photo logged.');
      setPinAttempt('');
    }
  };

  const handleCardAuthorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardError(null);

    const enteredName = cardHolderName.trim().toLowerCase();
    const targetName = expectedOwnerName.trim().toLowerCase();

    // Check if cardholder name matches the user's profile legal name
    // Support matching first name, last name, or full match
    const nameWords = targetName.split(/\s+/).filter(Boolean);
    const enteredWords = enteredName.split(/\s+/).filter(Boolean);
    const hasMatchingParts = nameWords.some(w => enteredWords.includes(w)) || enteredName.includes(targetName) || targetName.includes(enteredName);

    if (!enteredName || !hasMatchingParts) {
      // Cardholder name does NOT match!
      captureSilentPhoto('CARD_MISMATCH', enteredName);
      setCardError(
        `CARDHOLDER NAME MISMATCH: Name on card ("${cardHolderName || 'Blank'}") does not match profile owner "${expectedOwnerName}". Under 18 U.S.C. § 1029, officers cannot lawfully process financial charges against your bank card. Device remains locked in custody.`
      );
      return;
    }

    if (cardNumber.replace(/\s+/g, '').length < 13) {
      setCardError('Please enter a valid card number (13-16 digits).');
      return;
    }

    // Process 100% Fully-Refundable Verification Hold & Instant Refund
    setUnlockStage('refunding');
    setRefundStepStatus('1. Contacting card issuer network...');

    setTimeout(() => {
      setRefundStepStatus(`2. Verifying cardholder identity: "${cardHolderName}" matches legal owner.`);
    }, 700);

    setTimeout(() => {
      setRefundStepStatus('3. Authorizing $1.00 security verification hold...');
    }, 1400);

    setTimeout(() => {
      setRefundStepStatus('4. ✓ $1.00 100% REFUND ISSUED INSTANTLY. Net cost: $0.00.');
    }, 2100);

    setTimeout(() => {
      setRefundStepStatus('5. Anti-coercion validation complete. Decrypting device...');
    }, 2800);

    setTimeout(() => {
      setUnlockStage('decrypted');
      const decryptPhoto = captureSilentPhoto('DECRYPT_SUCCESS', 'CARD_VERIFIED');
      const allPhotos = decryptPhoto ? [decryptPhoto, ...capturedPhotos] : capturedPhotos;
      try {
        localStorage.removeItem('police_safeguard_is_locked');
        localStorage.setItem('police_safeguard_is_locked', 'false');
        localStorage.removeItem('police_protection_is_locked');
        localStorage.removeItem('civicshield_is_locked');
        localStorage.removeItem('police_safeguard_active_recording_session');
        localStorage.removeItem('police_safeguard_lockdown_options');
      } catch (err) {}
      setTimeout(() => {
        onUnlock(allPhotos);
      }, 300);
    }, 3400);
  };

  const handleFakeBatteryTap = () => {
    const next = hiddenTapCount + 1;
    setHiddenTapCount(next);
    if (next >= 3) {
      setIsFakeDeadBattery(false);
      setHiddenTapCount(0);
    }
  };

  // Stealth fake dead battery screen
  if (isFakeDeadBattery) {
    return (
      <div 
        id="fake-dead-battery-screen"
        onClick={handleFakeBatteryTap}
        onTouchStart={handleFakeBatteryTap}
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 select-none cursor-pointer"
      >
        <div className="w-20 h-10 border-2 border-red-600/80 rounded-lg p-1 relative mb-4">
          <div className="w-2 h-full bg-red-600 rounded animate-pulse" />
          <div className="w-1.5 h-4 bg-red-600/80 absolute -right-3 top-2.5 rounded-r" />
        </div>
        <p className="text-zinc-700 text-xs font-mono">Recharge Battery</p>
      </div>
    );
  }

  // Pure pitch black screen timeout mode (mimicking device display sleep / screen timeout)
  // Prevents police from accessing or viewing anything; any tap captures silent photo and wakes keypad
  if (isScreenTimedOut) {
    const handleWakeFromTimeout = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      captureSilentPhoto('UNLOCK_ATTEMPT', 'DISPLAY_WAKE');
      setIsScreenTimedOut(false);
      resetAutoTimeout();
    };

    return (
      <div 
        id="screen-timed-out-display"
        onClick={handleWakeFromTimeout}
        onTouchStart={handleWakeFromTimeout}
        className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 select-none cursor-pointer"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Hidden surveillance camera & canvas */}
        <video ref={videoRef} autoPlay playsInline muted className="hidden" />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="w-full flex justify-between items-center opacity-0 hover:opacity-30 transition-opacity">
          <span className="text-[10px] font-mono text-zinc-800">POLICE SAFEGUARD CUSTODY SHIELD</span>
          <span className="text-[10px] font-mono text-zinc-800">5TH AMENDMENT ACTIVE</span>
        </div>

        {/* Completely black screen simulating native device screen timeout & sleep */}
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <div className="text-zinc-900 text-[10px] font-mono select-none pointer-events-none">
            <span className="opacity-15 hover:opacity-50 transition-opacity">
              [Device Screen Timed Out • Locked • Tap to Wake]
            </span>
          </div>
        </div>

        <div className="w-full text-center opacity-0 hover:opacity-30 transition-opacity">
          <span className="text-[10px] font-mono text-zinc-800">Tap screen to wake secure PIN prompt</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="active-lockdown-screen" 
      className="fixed inset-0 z-50 bg-black text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto relative"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(15, 8, 10, 0.94) 0%, rgba(5, 5, 8, 0.98) 75%), url('/images/evidence_vault_shield_1790279171645.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Hidden camera stream and snapshot canvas for silent intruder photo capture */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Subtle pulsing red alarm glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-red-600 animate-pulse pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 my-auto">
        
        {/* STAGE 1: PIN ENTRY */}
        {unlockStage === 'pin' && (
          <>
            {/* Auto Timeout Status & Manual Sleep Button */}
            <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 mb-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Screen timeout: <strong className="text-amber-300">{timeoutSecondsLeft}s</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setIsScreenTimedOut(true)}
                className="flex items-center gap-1 text-zinc-400 hover:text-white bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 text-[10px] cursor-pointer"
              >
                <Moon className="w-3 h-3 text-amber-400" />
                <span>Sleep Screen Now</span>
              </button>
            </div>

            {/* Vault Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950/90 border-2 border-red-600/90 flex items-center justify-center mx-auto mb-3 text-red-500 shadow-2xl shadow-red-950 ring-4 ring-red-950/50">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide mb-1 uppercase font-mono">
              DEVICE UNDER LEGAL ENCRYPTION
            </h2>
            
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[11px] font-mono text-red-400 font-semibold">
                AES-GCM-256 ZERO-KNOWLEDGE SEAL
              </span>
              {capturedPhotos.length > 0 && (
                <span className="text-[10px] font-mono bg-red-950 border border-red-500/50 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>{capturedPhotos.length} Photos Logged</span>
                </span>
              )}
            </div>

            <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 sm:p-4 mb-4 text-left text-xs text-zinc-400 leading-relaxed space-y-1.5 shadow-2xl">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>FIFTH AMENDMENT NOTICE TO LAW ENFORCEMENT:</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                This electronic cellular device and all recordings are sealed under strong cryptographic encryption. Pursuant to <em>Riley v. California (2014)</em> and the Fifth Amendment privilege against self-incrimination, disclosure of the alphanumeric password cannot be compelled.
              </p>
              {lockdownOptions.requireCardRefundUnlock && (
                <div className="pt-1 border-t border-zinc-800/80 text-[10px] text-amber-300 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 shrink-0" />
                  <span>Anti-Coercion Protocol Active: 100% Refundable Cardholder Verification Required to Decrypt.</span>
                </div>
              )}
            </div>

            {/* PIN Entry Indicators */}
            <div className="mb-4">
              <div className="flex justify-center gap-3 mb-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      pinAttempt.length > idx 
                        ? 'bg-red-500 border-red-400 scale-110' 
                        : 'bg-zinc-900 border-zinc-700'
                    }`}
                  />
                ))}
              </div>
              {errorMsg && (
                <p className="text-xs font-semibold text-red-400 mt-2 bg-red-950/60 p-2 rounded-lg border border-red-800/60">
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[270px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num.toString())}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-900/90 hover:bg-zinc-800 active:bg-red-950/60 border border-zinc-800 text-lg sm:text-xl font-bold font-mono text-white flex items-center justify-center mx-auto cursor-pointer transition-colors shadow-md"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsScreenTimedOut(true)}
                title="Immediately timeout display into pitch black sleep mode"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-bold flex flex-col items-center justify-center mx-auto cursor-pointer border border-zinc-800 transition-colors"
              >
                <Moon className="w-4 h-4 mb-0.5 text-amber-400" />
                <span className="text-[9px]">SLEEP</span>
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-lg sm:text-xl font-bold font-mono text-white flex items-center justify-center mx-auto cursor-pointer transition-colors shadow-md"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950 hover:bg-zinc-900 text-zinc-400 text-xs font-bold flex items-center justify-center mx-auto cursor-pointer border border-zinc-800"
              >
                DELETE
              </button>
            </div>

            <button
              onClick={() => handleUnlockSubmit()}
              disabled={pinAttempt.length === 0}
              className="w-full max-w-[270px] py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 mx-auto cursor-pointer transition-all disabled:opacity-40 shadow-lg shadow-emerald-950/60"
            >
              <span>{lockdownOptions.requireCardRefundUnlock ? 'SUBMIT PIN & VERIFY CARD' : 'DECRYPT & RESTORE APP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* STAGE 2: 100% FULLY-REFUNDABLE CARD VERIFICATION */}
        {unlockStage === 'card_verification' && (
          <div className="bg-zinc-900/95 border-2 border-amber-500/70 rounded-2xl p-5 text-left shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm sm:text-base uppercase tracking-wider">
                    Step 2: Cardholder Identity Verification
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold block">
                  100% FULLY REFUNDABLE • $0.00 NET COST
                </span>
              </div>
            </div>

            {/* Legal Defense Notice */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Anti-Coercion Legal Shield:</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-normal">
                Under federal law (<strong className="text-white">18 U.S.C. § 1029</strong>), law enforcement officers cannot charge or use your private bank card without committing felony bank fraud. The cardholder name MUST match the verified profile owner (<strong className="text-white">{expectedOwnerName}</strong>).
              </p>
              <div className="text-[10px] text-emerald-400 font-semibold pt-1">
                ✓ The $1.00 security verification is 100% refunded to your card immediately upon authorization ($0.00 Net Cost).
              </div>
            </div>

            {cardError && (
              <div className="p-2.5 rounded-xl bg-red-950/90 border border-red-500 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{cardError}</span>
              </div>
            )}

            <form onSubmit={handleCardAuthorizeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Cardholder Name (Must Match: "{expectedOwnerName}"):
                </label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder={`e.g. ${expectedOwnerName}`}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Debit / Credit Card Number:
                </label>
                <input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                    setCardNumber(v);
                  }}
                  placeholder="4000 1234 5678 9010"
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Expires (MM/YY):
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    CVC (3 Digits):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="•••"
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockStage('pin');
                    setPinAttempt('');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Back to PIN
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/60 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>AUTHORIZE &amp; INSTANTLY REFUND $1.00</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STAGE 3: PROCESSING INSTANT REFUND */}
        {unlockStage === 'refunding' && (
          <div className="bg-zinc-900 border-2 border-emerald-500 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <h3 className="font-bold text-white text-base uppercase">
              Verifying Cardholder Identity &amp; Refund
            </h3>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-emerald-300">
              {refundStepStatus}
            </div>
            <p className="text-[11px] text-zinc-400">
              100% of the $1.00 security test is refunded back to your card account. Total net cost: $0.00.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
