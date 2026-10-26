import { JURISDICTIONS, getJurisdictionByCode } from '../data/jurisdictions';
import { JurisdictionLaw } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GpsLocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  stateCode: string;
  stateName: string;
  city?: string;
  jurisdiction: JurisdictionLaw;
  source: 'network_reverse_geocode' | 'offline_boundary_match' | 'fallback';
}

// State Geographic Centers and Approximate Bounding Boxes for offline matching across all 50 US States
interface StateBoundingBox {
  code: string;
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
}

export const US_STATE_BOUNDS: StateBoundingBox[] = [
  { code: 'AL', name: 'Alabama', minLat: 30.13, maxLat: 35.01, minLng: -88.47, maxLng: -84.89, centerLat: 32.80, centerLng: -86.79 },
  { code: 'AK', name: 'Alaska', minLat: 51.20, maxLat: 71.39, minLng: -179.15, maxLng: -129.98, centerLat: 61.37, centerLng: -152.40 },
  { code: 'AZ', name: 'Arizona', minLat: 31.33, maxLat: 37.00, minLng: -114.81, maxLng: -109.04, centerLat: 33.72, centerLng: -111.43 },
  { code: 'AR', name: 'Arkansas', minLat: 33.00, maxLat: 36.50, minLng: -94.62, maxLng: -89.64, centerLat: 34.96, centerLng: -92.37 },
  { code: 'CA', name: 'California', minLat: 32.53, maxLat: 42.01, minLng: -124.41, maxLng: -114.13, centerLat: 36.11, centerLng: -119.68 },
  { code: 'CO', name: 'Colorado', minLat: 36.99, maxLat: 41.00, minLng: -109.06, maxLng: -102.04, centerLat: 39.05, centerLng: -105.31 },
  { code: 'CT', name: 'Connecticut', minLat: 40.98, maxLat: 42.05, minLng: -73.73, maxLng: -71.79, centerLat: 41.59, centerLng: -72.75 },
  { code: 'DE', name: 'Delaware', minLat: 38.45, maxLat: 39.84, minLng: -75.79, maxLng: -75.05, centerLat: 39.31, centerLng: -75.50 },
  { code: 'FL', name: 'Florida', minLat: 24.52, maxLat: 31.00, minLng: -87.63, maxLng: -80.03, centerLat: 27.76, centerLng: -81.68 },
  { code: 'GA', name: 'Georgia', minLat: 30.36, maxLat: 35.00, minLng: -85.61, maxLng: -80.84, centerLat: 33.04, centerLng: -83.64 },
  { code: 'HI', name: 'Hawaii', minLat: 18.91, maxLat: 22.24, minLng: -160.25, maxLng: -154.81, centerLat: 21.09, centerLng: -157.49 },
  { code: 'ID', name: 'Idaho', minLat: 41.99, maxLat: 49.00, minLng: -117.24, maxLng: -111.04, centerLat: 44.24, centerLng: -114.47 },
  { code: 'IL', name: 'Illinois', minLat: 36.97, maxLat: 42.51, minLng: -91.51, maxLng: -87.50, centerLat: 40.34, centerLng: -88.98 },
  { code: 'IN', name: 'Indiana', minLat: 37.77, maxLat: 41.76, minLng: -88.10, maxLng: -84.78, centerLat: 39.84, centerLng: -86.25 },
  { code: 'IA', name: 'Iowa', minLat: 40.38, maxLat: 43.50, minLng: -96.64, maxLng: -90.14, centerLat: 42.01, centerLng: -93.21 },
  { code: 'KS', name: 'Kansas', minLat: 36.99, maxLat: 40.00, minLng: -102.05, maxLng: -94.59, centerLat: 38.52, centerLng: -96.72 },
  { code: 'KY', name: 'Kentucky', minLat: 36.50, maxLat: 39.15, minLng: -89.57, maxLng: -81.96, centerLat: 37.66, centerLng: -84.67 },
  { code: 'LA', name: 'Louisiana', minLat: 28.92, maxLat: 33.02, minLng: -94.04, maxLng: -88.82, centerLat: 31.16, centerLng: -91.86 },
  { code: 'ME', name: 'Maine', minLat: 42.97, maxLat: 47.46, minLng: -71.08, maxLng: -66.95, centerLat: 44.69, centerLng: -69.38 },
  { code: 'MD', name: 'Maryland', minLat: 37.91, maxLat: 39.72, minLng: -79.49, maxLng: -75.05, centerLat: 39.06, centerLng: -76.80 },
  { code: 'MA', name: 'Massachusetts', minLat: 41.24, maxLat: 42.89, minLng: -73.51, maxLng: -69.93, centerLat: 42.23, centerLng: -71.53 },
  { code: 'MI', name: 'Michigan', minLat: 41.69, maxLat: 48.30, minLng: -90.42, maxLng: -82.41, centerLat: 43.32, centerLng: -84.53 },
  { code: 'MN', name: 'Minnesota', minLat: 43.50, maxLat: 49.38, minLng: -97.24, maxLng: -89.49, centerLat: 45.69, centerLng: -93.90 },
  { code: 'MS', name: 'Mississippi', minLat: 30.17, maxLat: 34.99, minLng: -91.65, maxLng: -88.10, centerLat: 32.74, centerLng: -89.67 },
  { code: 'MO', name: 'Missouri', minLat: 35.99, maxLat: 40.61, minLng: -95.77, maxLng: -89.10, centerLat: 38.45, centerLng: -92.28 },
  { code: 'MT', name: 'Montana', minLat: 44.36, maxLat: 49.00, minLng: -116.05, maxLng: -104.04, centerLat: 46.92, centerLng: -110.45 },
  { code: 'NE', name: 'Nebraska', minLat: 40.00, maxLat: 43.00, minLng: -104.05, maxLng: -95.31, centerLat: 41.12, centerLng: -98.26 },
  { code: 'NV', name: 'Nevada', minLat: 35.00, maxLat: 42.00, minLng: -120.01, maxLng: -114.04, centerLat: 38.31, centerLng: -117.05 },
  { code: 'NH', name: 'New Hampshire', minLat: 42.70, maxLat: 45.31, minLng: -72.56, maxLng: -70.70, centerLat: 43.45, centerLng: -71.56 },
  { code: 'NJ', name: 'New Jersey', minLat: 38.93, maxLat: 41.36, minLng: -75.56, maxLng: -73.89, centerLat: 40.29, centerLng: -74.52 },
  { code: 'NM', name: 'New Mexico', minLat: 31.33, maxLat: 37.00, minLng: -109.05, maxLng: -103.00, centerLat: 34.84, centerLng: -106.24 },
  { code: 'NY', name: 'New York', minLat: 40.50, maxLat: 45.02, minLng: -79.76, maxLng: -71.86, centerLat: 42.16, centerLng: -74.94 },
  { code: 'NC', name: 'North Carolina', minLat: 33.84, maxLat: 36.59, minLng: -84.32, maxLng: -75.46, centerLat: 35.63, centerLng: -79.80 },
  { code: 'ND', name: 'North Dakota', minLat: 45.93, maxLat: 49.00, minLng: -104.05, maxLng: -96.55, centerLat: 47.52, centerLng: -99.78 },
  { code: 'OH', name: 'Ohio', minLat: 38.40, maxLat: 41.98, minLng: -84.82, maxLng: -80.52, centerLat: 40.38, centerLng: -82.76 },
  { code: 'OK', name: 'Oklahoma', minLat: 33.62, maxLat: 37.00, minLng: -103.00, maxLng: -94.43, centerLat: 35.56, centerLng: -96.92 },
  { code: 'OR', name: 'Oregon', minLat: 41.99, maxLat: 46.29, minLng: -124.57, maxLng: -116.46, centerLat: 44.57, centerLng: -122.07 },
  { code: 'PA', name: 'Pennsylvania', minLat: 39.72, maxLat: 42.27, minLng: -80.52, maxLng: -74.69, centerLat: 40.59, centerLng: -77.20 },
  { code: 'RI', name: 'Rhode Island', minLat: 41.15, maxLat: 42.02, minLng: -71.86, maxLng: -71.12, centerLat: 41.68, centerLng: -71.51 },
  { code: 'SC', name: 'South Carolina', minLat: 32.03, maxLat: 35.22, minLng: -83.35, maxLng: -78.54, centerLat: 33.85, centerLng: -80.94 },
  { code: 'SD', name: 'South Dakota', minLat: 42.48, maxLat: 45.95, minLng: -104.06, maxLng: -96.44, centerLat: 44.29, centerLng: -99.43 },
  { code: 'TN', name: 'Tennessee', minLat: 34.98, maxLat: 36.68, minLng: -90.31, maxLng: -81.65, centerLat: 35.74, centerLng: -86.69 },
  { code: 'TX', name: 'Texas', minLat: 25.84, maxLat: 36.50, minLng: -106.65, maxLng: -93.51, centerLat: 31.05, centerLng: -97.56 },
  { code: 'UT', name: 'Utah', minLat: 36.99, maxLat: 42.00, minLng: -114.05, maxLng: -109.04, centerLat: 40.15, centerLng: -111.86 },
  { code: 'VT', name: 'Vermont', minLat: 42.73, maxLat: 45.02, minLng: -73.44, maxLng: -71.46, centerLat: 44.04, centerLng: -72.71 },
  { code: 'VA', name: 'Virginia', minLat: 36.54, maxLat: 39.47, minLng: -83.68, maxLng: -75.24, centerLat: 37.76, centerLng: -78.16 },
  { code: 'WA', name: 'Washington', minLat: 45.54, maxLat: 49.00, minLng: -124.76, maxLng: -116.92, centerLat: 47.40, centerLng: -121.49 },
  { code: 'WV', name: 'West Virginia', minLat: 37.20, maxLat: 40.64, minLng: -82.64, maxLng: -77.72, centerLat: 38.49, centerLng: -80.95 },
  { code: 'WI', name: 'Wisconsin', minLat: 42.49, maxLat: 47.08, minLng: -92.89, maxLng: -86.76, centerLat: 44.26, centerLng: -89.61 },
  { code: 'WY', name: 'Wyoming', minLat: 40.99, maxLat: 45.00, minLng: -111.05, maxLng: -104.05, centerLat: 42.75, centerLng: -107.30 },
  { code: 'DC', name: 'District of Columbia', minLat: 38.79, maxLat: 38.99, minLng: -77.12, maxLng: -76.91, centerLat: 38.89, centerLng: -77.03 }
];

export class GpsJurisdictionService {
  /**
   * Safe baseline fallback when geolocation is unavailable or denied
   */
  public static getFallbackJurisdiction(): GpsLocationResult {
    const defaultState = 'CA';
    const jurisdiction = getJurisdictionByCode(defaultState);
    return {
      latitude: 36.11,
      longitude: -119.68,
      accuracyMeters: 50000,
      stateCode: defaultState,
      stateName: jurisdiction.stateName,
      city: 'California',
      jurisdiction,
      source: 'fallback'
    };
  }

  /**
   * Performs precise GPS detection using browser geolocation with high accuracy,
   * then resolves the exact US state via reverse geocoding with offline geometric fallback.
   * Silent-fails safely to default baseline instead of throwing and crashing on startup.
   */
  public static async detectPreciseJurisdiction(): Promise<GpsLocationResult> {
    if (typeof window === 'undefined') {
      return this.getFallbackJurisdiction();
    }

    // 1. Check if running on Capacitor Native platform
    try {
      if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 15000
          });
          if (position?.coords) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy || 10;
            return await this.resolveLocationAndJurisdiction(lat, lng, accuracy);
          }
        } catch (nativeErr) {
          console.warn('Native Capacitor GPS check deferred, checking browser API:', nativeErr);
        }
      }
    } catch {
      // Gracefully continue to browser geolocation
    }

    // 2. Browser Geolocation with high accuracy and safe fallback
    return new Promise((resolve) => {
      if (!navigator || !navigator.geolocation) {
        return resolve(this.getFallbackJurisdiction());
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy || 10;
            const result = await this.resolveLocationAndJurisdiction(lat, lng, accuracy);
            resolve(result);
          } catch {
            resolve(this.getFallbackJurisdiction());
          }
        },
        (err) => {
          console.info('Browser geolocation inactive or denied; continuing with default jurisdiction:', err.message);
          resolve(this.getFallbackJurisdiction());
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        }
      );
    });
  }

  /**
   * Resolves reverse geocoded state with high-precision 50-state geometric fallback
   */
  private static async resolveLocationAndJurisdiction(lat: number, lng: number, accuracy: number): Promise<GpsLocationResult> {
    try {
      // 1. Attempt client reverse geocode for exact state and city
      const reverseGeocode = await this.reverseGeocodeCoordinates(lat, lng);
      if (reverseGeocode && reverseGeocode.stateCode) {
        const jurisdiction = getJurisdictionByCode(reverseGeocode.stateCode);
        return {
          latitude: lat,
          longitude: lng,
          accuracyMeters: accuracy,
          stateCode: reverseGeocode.stateCode,
          stateName: jurisdiction.stateName,
          city: reverseGeocode.city,
          jurisdiction,
          source: 'network_reverse_geocode'
        };
      }
    } catch (e) {
      console.warn('Network reverse geocoding deferred, using offline boundary match:', e);
    }

    // 2. Offline fallback: Match coordinates against precise 50-state geometric bounds
    const matched = this.matchCoordinatesToState(lat, lng);
    const stateCode = matched ? matched.code : 'CA';
    const jurisdiction = getJurisdictionByCode(stateCode);

    return {
      latitude: lat,
      longitude: lng,
      accuracyMeters: accuracy,
      stateCode,
      stateName: jurisdiction.stateName,
      jurisdiction,
      source: 'offline_boundary_match'
    };
  }

  /**
   * Reverse geocodes coordinates to state code using free client reverse geocoding API
   */
  private static async reverseGeocodeCoordinates(lat: number, lng: number): Promise<{ stateCode?: string; city?: string } | null> {
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const sub = (data.principalSubdivisionCode || '').toUpperCase();
        const city = data.city || data.locality || '';
        if (sub.startsWith('US-')) {
          const code = sub.replace('US-', '').trim();
          if (JURISDICTIONS[code]) {
            return { stateCode: code, city };
          }
        }
      }
    } catch {}

    // Secondary backup: OpenStreetMap Nominatim reverse
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
      const res = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000) 
      });
      if (res.ok) {
        const data = await res.json();
        const stateName = (data.address?.state || '').toLowerCase();
        const city = data.address?.city || data.address?.town || data.address?.county || '';
        const found = US_STATE_BOUNDS.find(s => s.name.toLowerCase() === stateName);
        if (found) {
          return { stateCode: found.code, city };
        }
      }
    } catch {}

    return null;
  }

  /**
   * Matches latitude & longitude against all 50 states bounds using distance to state center
   */
  public static matchCoordinatesToState(lat: number, lng: number): StateBoundingBox | null {
    // 1. Direct bounding box check
    const candidates = US_STATE_BOUNDS.filter(s => 
      lat >= s.minLat && lat <= s.maxLat && lng >= s.minLng && lng <= s.maxLng
    );

    if (candidates.length === 1) {
      return candidates[0];
    }

    if (candidates.length > 1) {
      // Pick the state whose geometric center is closest to user coordinates
      let closest = candidates[0];
      let minDistance = Infinity;

      for (const s of candidates) {
        const d = Math.pow(lat - s.centerLat, 2) + Math.pow(lng - s.centerLng, 2);
        if (d < minDistance) {
          minDistance = d;
          closest = s;
        }
      }
      return closest;
    }

    // 2. Proximity fallback: Find closest US state center
    let closestState = US_STATE_BOUNDS[0];
    let minDistance = Infinity;
    for (const s of US_STATE_BOUNDS) {
      const d = Math.pow(lat - s.centerLat, 2) + Math.pow(lng - s.centerLng, 2);
      if (d < minDistance) {
        minDistance = d;
        closestState = s;
      }
    }

    return closestState;
  }
}
