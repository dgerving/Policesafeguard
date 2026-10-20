import { Capacitor } from '@capacitor/core';
import { Camera, CameraPermissionType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

export interface NativePlatformInfo {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
}

export class MobileNativeBridge {
  public static getPlatformInfo(): NativePlatformInfo {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    return { isNative, platform };
  }

  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public static getPlatform(): 'ios' | 'android' | 'web' {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }

  /**
   * Requests camera permission natively on iOS/Android or via web
   */
  public static async requestCameraPermission(): Promise<boolean> {
    if (this.isNative()) {
      try {
        const status = await Camera.requestPermissions({ permissions: ['camera'] });
        return status.camera === 'granted';
      } catch (e) {
        console.warn('Native camera permission request fallback:', e);
      }
    }
    // Web fallback
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Requests microphone permission cleanly via standard media devices
   */
  public static async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        return true;
      } catch (e) {
        console.warn('Microphone permission request error:', e);
        return false;
      }
    }
    return false;
  }

  /**
   * Requests geolocation permission natively or via web
   */
  public static async requestLocationPermission(): Promise<boolean> {
    if (this.isNative()) {
      try {
        const status = await Geolocation.requestPermissions();
        return status.location === 'granted';
      } catch (e) {
        console.warn('Native location permission request fallback:', e);
      }
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    }
    return false;
  }

  /**
   * Requests local notifications permission
   */
  public static async requestNotificationPermission(): Promise<boolean> {
    if (this.isNative()) {
      try {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      } catch (e) {
        console.warn('Native notification permission fallback:', e);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Schedules a native or web notification (e.g. "Active Stop Recording in Progress")
   */
  public static async sendLocalNotification(title: string, body: string, id = 1): Promise<void> {
    if (this.isNative()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id,
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: 'ic_stat_shield',
              iconColor: '#3B82F6',
            },
          ],
        });
        return;
      } catch (e) {
        console.warn('Native notification schedule error:', e);
      }
    }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/pwa-192x192.png' });
      } catch (e) {}
    }
  }

  /**
   * Secure cross-platform persistent storage
   */
  public static async setItem(key: string, value: string): Promise<void> {
    if (this.isNative()) {
      try {
        await Preferences.set({ key, value });
        return;
      } catch (e) {}
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  public static async getItem(key: string): Promise<string | null> {
    if (this.isNative()) {
      try {
        const { value } = await Preferences.get({ key });
        if (value !== null) return value;
      } catch (e) {}
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }
}
