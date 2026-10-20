import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Camera, Mic, MapPin, Bell, CheckCircle2, 
  AlertTriangle, Lock, RefreshCw, X, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { DevicePermissionsService, DevicePermissionsDetail } from '../services/devicePermissionsService';
import { DevicePermissionsState } from '../types';

interface DevicePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated?: (perms: DevicePermissionsState) => void;
}

export const DevicePermissionsModal: React.FC<DevicePermissionsModalProps> = ({
  isOpen,
  onClose,
  onPermissionsUpdated
}) => {
  const [permissions, setPermissions] = useState<DevicePermissionsState>(() => {
    return DevicePermissionsService.getStoredPermissions() || {
      camera: false,
      microphone: false,
      location: false,
      notifications: false,
      hasPrompted: false
    };
  });

  const [isRequesting, setIsRequesting] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [isRequestingCam, setIsRequestingCam] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(true);

  // Check current permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      DevicePermissionsService.queryCurrentPermissions().then(perms => {
        setPermissions(perms);
      });
      setMicError(null);
      setCamError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGrantMicOnly = async () => {
    setIsRequestingMic(true);
    setMicError(null);
    setStatusMessage('Requesting microphone access from browser...');
    try {
      const res = await DevicePermissionsService.requestMicrophoneOnly();
      if (res.success) {
        setPermissions(prev => ({ ...prev, microphone: true }));
        setStatusMessage('✅ Microphone access verified and enabled!');
        onPermissionsUpdated?.({ ...permissions, microphone: true });
        setMicError(null);
      } else {
        setMicError(res.error || 'Microphone access denied.');
        setStatusMessage('⚠️ Could not access microphone. See unblock instructions below.');
      }
    } catch (e: any) {
      setMicError(e.message || 'Microphone error');
    } finally {
      setIsRequestingMic(false);
    }
  };

  const handleGrantCamOnly = async () => {
    setIsRequestingCam(true);
    setCamError(null);
    setStatusMessage('Requesting camera access from browser...');
    try {
      const res = await DevicePermissionsService.requestCameraOnly();
      if (res.success) {
        setPermissions(prev => ({ ...prev, camera: true }));
        setStatusMessage('✅ Camera access verified and enabled!');
        onPermissionsUpdated?.({ ...permissions, camera: true });
        setCamError(null);
      } else {
        setCamError(res.error || 'Camera access denied.');
      }
    } catch (e: any) {
      setCamError(e.message || 'Camera error');
    } finally {
      setIsRequestingCam(false);
    }
  };

  const handleEnableVirtualAudio = () => {
    const updated = {
      ...permissions,
      microphone: true,
      hasPrompted: true
    };
    setPermissions(updated);
    DevicePermissionsService.saveStoredPermissions(updated);
    onPermissionsUpdated?.(updated);
    setMicError(null);
    setStatusMessage('Virtual Audio Simulator Mode enabled! Visual responses and manual cues active.');
  };

  const handleGrantAll = async () => {
    setIsRequesting(true);
    setStatusMessage('Prompting your browser for Camera, Microphone, and Location access...');
    try {
      const detail: DevicePermissionsDetail = await DevicePermissionsService.requestAllPermissions();
      setPermissions(detail);

      if (rememberDevice) {
        DevicePermissionsService.saveStoredPermissions(detail);
      }

      onPermissionsUpdated?.(detail);

      if (detail.camera && detail.microphone) {
        setStatusMessage('✅ All essential permissions successfully verified and saved!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage('⚠️ Some permissions were declined or restricted by your browser. You can still use the app with virtual fallbacks.');
      }
    } catch (e: any) {
      console.error('Permissions request error:', e);
      setStatusMessage('Device permission prompt closed. Fallbacks active.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkipOrContinue = () => {
    // Save current state with hasPrompted true so user is not prompted again
    const updated: DevicePermissionsState = {
      ...permissions,
      hasPrompted: true,
      grantedAt: Date.now()
    };
    DevicePermissionsService.saveStoredPermissions(updated);
    onPermissionsUpdated?.(updated);
    onClose();
  };

  const areEssentialGranted = permissions.camera && permissions.microphone;

  return (
    <div 
      id="device-permissions-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-zinc-100 my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Device Hardware &amp; Sensor Access
                </h3>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  COURT EVIDENCE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Saved locally on this device — no repetitive prompts on future launches
              </p>
            </div>
          </div>
          <button
            onClick={handleSkipOrContinue}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs">
          
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-300 leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Constitutional Legal Security:</strong> Police SafeGuard requires camera, microphone, and GPS access to capture timestamped, tamper-evident FRE 902 court records and broadcast live streams to your emergency witnesses during police encounters.
            </div>
          </div>

          {/* 4 Permission Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* 1. Camera */}
            <div className={`p-3 rounded-xl border transition-all ${
              permissions.camera 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Camera className={`w-4 h-4 ${permissions.camera ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="font-bold text-white text-xs">HD Camera</span>
                </div>
                {permissions.camera ? (
                  <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GRANTED
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleGrantCamOnly}
                    disabled={isRequestingCam}
                    className="text-[10px] font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    {isRequestingCam ? 'Checking...' : 'Allow Camera'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Continuous dashcam/encounter video recording &amp; live witness feed streaming.
              </p>
              {camError && (
                <p className="text-[10px] text-red-400 mt-1 font-mono">{camError}</p>
              )}
            </div>

            {/* 2. Microphone */}
            <div className={`p-3 rounded-xl border transition-all ${
              permissions.microphone 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                : micError ? 'bg-red-950/20 border-red-500/50' : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Mic className={`w-4 h-4 ${permissions.microphone ? 'text-emerald-400' : micError ? 'text-red-400' : 'text-amber-400'}`} />
                  <span className="font-bold text-white text-xs">Microphone</span>
                </div>
                {permissions.microphone ? (
                  <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GRANTED
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleGrantMicOnly}
                    disabled={isRequestingMic}
                    className="text-[10px] font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    {isRequestingMic ? 'Checking...' : 'Allow Mic'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Dual officer/citizen audio transcription and hands-free voice AI commands.
              </p>
              {micError && (
                <p className="text-[10px] text-red-400 mt-1 font-mono">{micError}</p>
              )}
            </div>

            {/* 3. Location / GPS */}
            <div className={`p-3 rounded-xl border transition-all ${
              permissions.location 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${permissions.location ? 'text-emerald-400' : 'text-cyan-400'}`} />
                  <span className="font-bold text-white text-xs">Precise GPS</span>
                </div>
                {permissions.location ? (
                  <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GRANTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Auto-detects active state laws and attaches tamper-proof GPS to court exhibits.
              </p>
            </div>

            {/* 4. Safety Notifications */}
            <div className={`p-3 rounded-xl border transition-all ${
              permissions.notifications 
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm' 
                : 'bg-zinc-950 border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Bell className={`w-4 h-4 ${permissions.notifications ? 'text-emerald-400' : 'text-purple-400'}`} />
                  <span className="font-bold text-white text-xs">Alerts</span>
                </div>
                {permissions.notifications ? (
                  <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GRANTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    OPTIONAL
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Witness connection status updates and cloud evidence vault backup alerts.
              </p>
            </div>

          </div>

          {/* Microphone Troubleshooting & Unblock Guide */}
          {!permissions.microphone && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-zinc-300 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Mic className="w-4 h-4" />
                  <span>Microphone Permission Assistance</span>
                </div>
                <button
                  type="button"
                  onClick={handleEnableVirtualAudio}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-semibold border border-zinc-700 cursor-pointer"
                >
                  Use Virtual Audio Mode
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-400 leading-relaxed">
                <p className="font-semibold text-zinc-300">
                  If your browser blocked the microphone, follow these 2 quick steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>In your browser's top address bar (next to the web address), click the <strong>Lock (🔒)</strong> or <strong>Site Settings</strong> icon.</li>
                  <li>Change <strong>Microphone</strong> from <em>Block</em> to <strong>Allow</strong>, then tap the <strong>"Allow Mic"</strong> button above.</li>
                </ol>
                <p className="text-[10px] text-zinc-400 pt-0.5">
                  No microphone plugged in? Click <span className="text-amber-300 font-semibold">"Use Virtual Audio Mode"</span> to test all legal rights guidance with touch controls.
                </p>
              </div>
            </div>
          )}

          {/* Status Message feedback */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-200 text-xs flex items-center gap-2 animate-in fade-in">
              <RefreshCw className={`w-4 h-4 text-amber-400 shrink-0 ${isRequesting ? 'animate-spin' : ''}`} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Remember Permissions checkbox */}
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none text-zinc-300">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-700 focus:ring-amber-400 cursor-pointer"
            />
            <span className="text-xs">
              Store granted permissions permanently so they are not asked on every launch
            </span>
          </label>

        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkipOrContinue}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            {areEssentialGranted ? 'Done / Close' : 'Continue With Fallbacks'}
          </button>

          <button
            type="button"
            onClick={handleGrantAll}
            disabled={isRequesting}
            className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>AUTHORIZING DEVICE ACCESS...</span>
              </>
            ) : areEssentialGranted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>ALL PERMISSIONS GRANTED • CONTINUE</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>GRANT ALL PERMISSIONS NOW (1-TAP)</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
