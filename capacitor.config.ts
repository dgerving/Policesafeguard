import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.policesafeguard.app',
  appName: 'Police SafeGuard',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_shield',
      iconColor: '#3B82F6',
      sound: 'beep.wav',
    },
    Geolocation: {
      // High accuracy for precise state and municipal legal jurisdiction lookup
      enableHighAccuracy: true,
    },
  },
};

export default config;
