import { DevicePermissionsState } from '../types';
import { MobileNativeBridge } from './mobileNativeBridge';

const STORAGE_KEY = 'police_protection_permissions';

export interface DevicePermissionsDetail extends DevicePermissionsState {
  allGranted: boolean;
  cameraError?: string;
  micError?: string;
  locationError?: string;
}

export class DevicePermissionsService {
  /**
   * Retrieves stored permissions from localStorage
   */
  static getStoredPermissions(): DevicePermissionsState | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored permissions', e);
    }
    return null;
  }

  /**
   * Stores granted permissions in localStorage so they persist across sessions
   */
  static saveStoredPermissions(perms: DevicePermissionsState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
    } catch (e) {
      console.warn('Failed to persist permissions to storage', e);
    }
  }

  /**
   * Checks whether the user has already configured/stored permissions
   */
  static hasGrantedPermissions(): boolean {
    const stored = this.getStoredPermissions();
    if (!stored) return false;
    // As long as the user has prompted once, their preference is remembered
    return Boolean(stored.hasPrompted);
  }

  /**
   * Checks real-time browser permission status using navigator.permissions where available
   */
  static async queryCurrentPermissions(): Promise<DevicePermissionsState> {
    const stored = this.getStoredPermissions() || {
      camera: false,
      microphone: false,
      location: false,
      notifications: false,
      hasPrompted: false
    };

    if (typeof window === 'undefined' || !navigator.permissions) {
      return stored;
    }

    const result: DevicePermissionsState = { ...stored };

    // Query Geolocation
    try {
      const geoStatus = await navigator.permissions.query({ name: 'geolocation' });
      if (geoStatus.state === 'granted') result.location = true;
    } catch (e) {}

    // Query Camera (Chrome/Edge/Firefox where supported)
    try {
      const camStatus = await navigator.permissions.query({ name: 'camera' as any });
      if (camStatus.state === 'granted') result.camera = true;
    } catch (e) {}

    // Query Microphone
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
      if (micStatus.state === 'granted') result.microphone = true;
    } catch (e) {}

    // Query Notifications
    try {
      if ('Notification' in window) {
        result.notifications = Notification.permission === 'granted';
      }
    } catch (e) {}

    return result;
  }

  /**
   * Requests microphone access individually with precise error categorization
   */
  static async requestMicrophoneOnly(): Promise<{ success: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { success: false, error: 'MediaDevices API is not supported in this browser.' };
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const tracks = stream.getAudioTracks();
      const isActive = tracks.length > 0 && tracks[0].readyState === 'live';
      tracks.forEach(t => t.stop());

      const current = this.getStoredPermissions() || {
        camera: false,
        microphone: false,
        location: false,
        notifications: false,
        hasPrompted: true
      };
      current.microphone = true;
      current.hasPrompted = true;
      current.grantedAt = Date.now();
      this.saveStoredPermissions(current);

      return { success: isActive };
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      let errorMsg = 'Microphone access denied or unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone is blocked by your browser. Click the lock or settings icon in your browser address bar and set Microphone to "Allow".';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No physical microphone hardware detected on your computer or headset.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Microphone is currently locked or in use by another application (Zoom, Meet, or another tab).';
      } else if (err.name === 'SecurityError') {
        errorMsg = 'Microphone blocked by security policy. Open directly over HTTPS.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Requests camera access individually with precise error categorization
   */
  static async requestCameraOnly(): Promise<{ success: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { success: false, error: 'MediaDevices API is not supported in this browser.' };
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      stream.getTracks().forEach(t => t.stop());

      const current = this.getStoredPermissions() || {
        camera: false,
        microphone: false,
        location: false,
        notifications: false,
        hasPrompted: true
      };
      current.camera = true;
      current.hasPrompted = true;
      current.grantedAt = Date.now();
      this.saveStoredPermissions(current);

      return { success: true };
    } catch (err: any) {
      console.warn('Camera permission request error:', err);
      let errorMsg = 'Camera access denied or unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera is blocked by your browser. Click the lock icon in your address bar and set Camera to "Allow".';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera hardware found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is in use by another program.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Requests all necessary device permissions in sequence upon startup
   */
  static async requestAllPermissions(): Promise<DevicePermissionsDetail> {
    const detail: DevicePermissionsDetail = {
      camera: false,
      microphone: false,
      location: false,
      notifications: false,
      hasPrompted: true,
      allGranted: false,
      grantedAt: Date.now()
    };

    // 0. If running inside native iOS/Android Capacitor wrapper, use native hardware bridges
    if (MobileNativeBridge.isNative()) {
      try {
        detail.camera = await MobileNativeBridge.requestCameraPermission();
        detail.location = await MobileNativeBridge.requestLocationPermission();
        detail.notifications = await MobileNativeBridge.requestNotificationPermission();
      } catch (nativeErr: any) {
        console.warn('Native permission request fallback:', nativeErr);
      }
    }

    // 1. Request Microphone cleanly
    const micResult = await this.requestMicrophoneOnly();
    detail.microphone = micResult.success;
    if (!micResult.success) {
      detail.micError = micResult.error;
    }

    // 2. Request Camera cleanly
    if (!detail.camera) {
      const camResult = await this.requestCameraOnly();
      detail.camera = camResult.success;
      if (!camResult.success) {
        detail.cameraError = camResult.error;
      }
    }

    // 3. Request Geolocation (for State Jurisdiction & Emergency Witness GPS)
    if (!detail.location && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              detail.location = true;
              resolve();
            },
            (geoErr) => {
              console.warn('Geolocation permission error:', geoErr);
              detail.locationError = geoErr.message;
              resolve();
            },
            { timeout: 7000, enableHighAccuracy: true }
          );
        });
      } catch (e) {}
    }

    // 4. Request Notifications (for Witness alerts & background status)
    if (!detail.notifications && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          detail.notifications = true;
        } else if (Notification.permission !== 'denied') {
          const status = await Notification.requestPermission();
          detail.notifications = status === 'granted';
        }
      } catch (e) {}
    }

    detail.allGranted = detail.camera && detail.microphone && detail.location;
    detail.grantedAt = Date.now();

    // Store in localStorage so user is not prompted again
    this.saveStoredPermissions(detail);

    return detail;
  }

  /**
   * Resets stored permissions (e.g. for testing or re-authorizing)
   */
  static resetPermissions(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }
}
