import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Shield, ShieldAlert, MapPin, Navigation, Volume2, 
  VolumeX, Search, Plus, CheckCircle2, AlertTriangle, X, 
  Layers, Radio, Eye, Info, RefreshCw, Compass
} from 'lucide-react';
import L from 'leaflet';
import { 
  FlockCameraService, 
  FlockCameraLocation, 
  CameraType 
} from '../services/flockCameraService';

interface FlockSurveillanceMapViewProps {
  onClose?: () => void;
  initialLat?: number;
  initialLng?: number;
}

export const FlockSurveillanceMapView: React.FC<FlockSurveillanceMapViewProps> = ({
  onClose,
  initialLat,
  initialLng
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);

  const [cameras, setCameras] = useState<FlockCameraLocation[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<FlockCameraLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | CameraType>('all');
  const [isAudioAlarm, setIsAudioAlarm] = useState<boolean>(FlockCameraService.getIsAudioAlarmEnabled());
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // New Camera Form State
  const [newCamType, setNewCamType] = useState<CameraType>('flock_falcon');
  const [newCamAddress, setNewCamAddress] = useState('');
  const [newCamCity, setNewCamCity] = useState('');
  const [newCamState, setNewCamState] = useState('TX');
  const [newCamDirection, setNewCamDirection] = useState<'Northbound' | 'Southbound' | 'Eastbound' | 'Westbound' | 'All-Directional'>('Northbound');
  const [newCamNotes, setNewCamNotes] = useState('');

  // Default coordinate center (Austin TX fallback or user coordinate)
  const defaultCenterLat = initialLat || 30.2672;
  const defaultCenterLng = initialLng || -97.7431;

  // Initialize camera service and listener
  useEffect(() => {
    FlockCameraService.init();

    const unsubscribe = FlockCameraService.subscribe(() => {
      const loc = FlockCameraService.getUserLocation();
      const updated = FlockCameraService.getCamerasNear(loc?.lat, loc?.lng, 50);
      setCameras(updated);
      setIsAudioAlarm(FlockCameraService.getIsAudioAlarmEnabled());
    });

    // Acquire current GPS position
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          FlockCameraService.setUserLocation(lat, lng);
          const initial = FlockCameraService.getCamerasNear(lat, lng, 50);
          setCameras(initial);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 14);
            updateUserMarker(lat, lng);
          }
        },
        () => {
          setIsLocating(false);
          const initial = FlockCameraService.getCamerasNear(defaultCenterLat, defaultCenterLng, 50);
          setCameras(initial);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      const initial = FlockCameraService.getCamerasNear(defaultCenterLat, defaultCenterLng, 50);
      setCameras(initial);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Tactical CartoDB Dark Matter or OpenStreetMap tiles
    const map = L.map(mapContainerRef.current, {
      center: [defaultCenterLat, defaultCenterLng],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Matter Tactical Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Render initial user location if available
    const userLoc = FlockCameraService.getUserLocation();
    if (userLoc) {
      updateUserMarker(userLoc.lat, userLoc.lng);
    }

    // Map click handler to select point for reporting
    map.on('click', (e) => {
      if (isReportModalOpen) {
        // User clicked map to pin new camera
        const { lat, lng } = e.latlng;
        setNewCamAddress(`GPS Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setStatusToast(`📍 Marked location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setTimeout(() => setStatusToast(null), 3000);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user position marker and radar radius circle
  const updateUserMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95
      }).addTo(mapInstanceRef.current);
    }

    // Proximity Radar Circle (500ft / ~150 meters)
    if (radarCircleRef.current) {
      radarCircleRef.current.setLatLng([lat, lng]);
    } else {
      radarCircleRef.current = L.circle([lat, lng], {
        radius: 300,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 6'
      }).addTo(mapInstanceRef.current);
    }
  };

  // Re-render camera markers when cameras or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = cameras.filter(cam => {
      const matchesFilter = activeFilter === 'all' || cam.type === activeFilter;
      const cleanQ = searchQuery.toLowerCase().trim();
      const matchesSearch = !cleanQ ||
        cam.name.toLowerCase().includes(cleanQ) ||
        cam.address.toLowerCase().includes(cleanQ) ||
        cam.city.toLowerCase().includes(cleanQ) ||
        cam.state.toLowerCase() === cleanQ ||
        cam.agency.toLowerCase().includes(cleanQ);

      return matchesFilter && matchesSearch;
    });

    filtered.forEach(cam => {
      const getMarkerColor = (type: CameraType) => {
        switch (type) {
          case 'flock_falcon': return '#a855f7'; // Purple (Standard Flock ALPR)
          case 'flock_sparrow': return '#06b6d4'; // Cyan (Compact ALPR)
          case 'flock_raven': return '#ef4444'; // Red (Gunshot Audio)
          case 'speed_red_light': return '#f59e0b'; // Amber (Speed/Traffic)
          case 'alpr_fixed': return '#3b82f6'; // Blue (DOT Highway)
          default: return '#a855f7';
        }
      };

      const getIconHtml = (type: CameraType, dir: string) => {
        const bg = getMarkerColor(type);
        const iconChar = type === 'flock_raven' ? '🎯' : type === 'speed_red_light' ? '⚡' : '📷';
        return `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 32px; height: 32px; border-radius: 10px; background-color: ${bg}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 2px solid #ffffff; font-size: 14px;">
              ${iconChar}
            </div>
            <div style="position: absolute; -bottom: 6px; background-color: #000000; color: #facc15; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; border: 1px solid #444; white-space: nowrap;">
              ${dir.slice(0, 2)}
            </div>
          </div>
        `;
      };

      const customIcon = L.divIcon({
        html: getIconHtml(cam.type, cam.direction),
        className: 'custom-flock-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([cam.latitude, cam.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px; color: #18181b;">
          <div style="font-weight: 800; font-size: 13px; color: #09090b; margin-bottom: 2px;">
            ${cam.name}
          </div>
          <div style="font-size: 11px; color: #52525b; margin-bottom: 6px;">
            📍 ${cam.address} (${cam.city}, ${cam.state})
          </div>
          <div style="background-color: #f4f4f5; padding: 6px 8px; border-radius: 8px; font-size: 11px; margin-bottom: 6px;">
            <div><strong>Type:</strong> ${cam.type.replace('_', ' ').toUpperCase()}</div>
            <div><strong>Direction:</strong> ${cam.direction}</div>
            <div><strong>Operating Agency:</strong> ${cam.agency}</div>
            <div><strong>Distance:</strong> ${cam.distanceFeet ? `${cam.distanceFeet.toLocaleString()} ft (${cam.distanceMiles} mi)` : 'Calculating...'}</div>
          </div>
          ${cam.notes ? `<div style="font-size: 10px; color: #71717a; font-style: italic;">Note: ${cam.notes}</div>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedCamera(cam);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [cameras, activeFilter, searchQuery]);

  // Handle Search for City or State
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toLowerCase();
    if (!clean) return;

    // Search existing cameras
    const matched = cameras.find(
      c => c.city.toLowerCase().includes(clean) ||
           c.state.toLowerCase() === clean ||
           c.name.toLowerCase().includes(clean)
    );

    if (matched && mapInstanceRef.current) {
      mapInstanceRef.current.setView([matched.latitude, matched.longitude], 14, { animate: true });
      setSelectedCamera(matched);
      setStatusToast(`📍 Centered on ${matched.city}, ${matched.state} (${matched.name})`);
      setTimeout(() => setStatusToast(null), 3500);
      return;
    }

    // Geocode city via OpenStreetMap Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean + ', USA')}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 13, { animate: true });
            // Generate and refresh cameras for this newly viewed city
            const localCams = FlockCameraService.getCamerasNear(lat, lon, 25);
            setCameras(localCams);
            setStatusToast(`📍 Displaying Flock cameras in ${data[0].display_name.split(',')[0]}`);
            setTimeout(() => setStatusToast(null), 3500);
          }
        } else {
          setStatusToast(`No map coordinates found for "${searchQuery}"`);
          setTimeout(() => setStatusToast(null), 3000);
        }
      })
      .catch(() => {
        setStatusToast('Location search failed. Try another city.');
        setTimeout(() => setStatusToast(null), 3000);
      });
  };

  // Recenter GPS Button
  const handleRecenterGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        FlockCameraService.setUserLocation(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
          updateUserMarker(lat, lng);
        }
        setStatusToast('📍 Recentered on current GPS position');
        setTimeout(() => setStatusToast(null), 3000);
      },
      () => {
        setIsLocating(false);
        setStatusToast('GPS location unavailable.');
        setTimeout(() => setStatusToast(null), 3000);
      },
      { enableHighAccuracy: true }
    );
  };

  // Submit Community Camera Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userLoc = FlockCameraService.getUserLocation() || { lat: defaultCenterLat, lng: defaultCenterLng };

    try {
      const reported = await FlockCameraService.reportCamera({
        name: `Flock ALPR - ${newCamAddress || 'Community Report'}`,
        type: newCamType,
        latitude: userLoc.lat,
        longitude: userLoc.lng,
        address: newCamAddress || 'Intersection',
        city: newCamCity || 'Local Area',
        state: newCamState || 'TX',
        direction: newCamDirection,
        notes: newCamNotes
      });

      setIsReportModalOpen(false);
      setSelectedCamera(reported);
      setStatusToast(`🎉 Community camera report submitted! Added to public safety radar.`);
      setTimeout(() => setStatusToast(null), 4000);

      // Pan to new camera
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([reported.latitude, reported.longitude], 15, { animate: true });
      }
    } catch {
      setStatusToast('Failed to save report. Please try again.');
      setTimeout(() => setStatusToast(null), 3000);
    }
  };

  // Filtered cameras for bottom/sidebar list
  const filteredList = cameras.filter(cam => {
    const matchesFilter = activeFilter === 'all' || cam.type === activeFilter;
    const cleanQ = searchQuery.toLowerCase().trim();
    const matchesSearch = !cleanQ ||
      cam.name.toLowerCase().includes(cleanQ) ||
      cam.address.toLowerCase().includes(cleanQ) ||
      cam.city.toLowerCase().includes(cleanQ) ||
      cam.state.toLowerCase() === cleanQ;
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="relative w-full h-full flex flex-col bg-zinc-950 text-white overflow-hidden select-none">
      
      {/* TOP HEADER CONTROLS */}
      <div className="px-3 sm:px-5 py-2.5 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between gap-3 z-20 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
            <Camera className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wide truncate flex items-center gap-1.5">
                <span>FLOCK ALPR SURVEILLANCE RADAR</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold hidden xs:inline">
                  LIVE SENSORS
                </span>
              </h2>
            </div>
            <p className="text-[10px] text-zinc-400 truncate hidden sm:block">
              Real-time locations of Flock Safety automated license plate readers, Raven gunshot sensors &amp; traffic cameras
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Proximity Audio Alarm Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = FlockCameraService.toggleAudioAlarm();
              setIsAudioAlarm(next);
              if (next) FlockCameraService.playProximityChime();
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              isAudioAlarm 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
            title={isAudioAlarm ? 'Proximity Chime Enabled: Sounds warning beep within 600 ft of camera' : 'Proximity Chime Muted'}
          >
            {isAudioAlarm ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
            <span className="hidden xs:inline">{isAudioAlarm ? 'Proximity Alarm' : 'Alarm Off'}</span>
          </button>

          {/* Report Spotted Camera */}
          <button
            type="button"
            onClick={() => {
              const loc = FlockCameraService.getUserLocation();
              if (loc) {
                setNewCamAddress(`Near ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
              }
              setIsReportModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
            title="Report a Flock Safety or automated camera"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Camera</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="px-3 sm:px-5 py-2 bg-zinc-900/90 border-b border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 z-20 shrink-0">
        
        {/* City/Location Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search any US city or address (e.g. Austin, Houston, Miami, Dallas, Atlanta)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-purple-400 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </form>

        {/* Camera Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
          <span className="text-zinc-500 font-bold uppercase text-[9px] mr-1 shrink-0">Type:</span>
          
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-all ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All ({cameras.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('flock_falcon')}
            className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-all ${
              activeFilter === 'flock_falcon'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📷 Falcon ALPR
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('flock_sparrow')}
            className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-all ${
              activeFilter === 'flock_sparrow'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            ⚡ Sparrow
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('flock_raven')}
            className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-all ${
              activeFilter === 'flock_raven'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🎯 Raven Audio
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('speed_red_light')}
            className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer transition-all ${
              activeFilter === 'speed_red_light'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🛑 Speed / Red Light
          </button>
        </div>

      </div>

      {/* STATUS TOAST NOTIFICATION */}
      {statusToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-zinc-900 border border-purple-500/50 shadow-xl text-purple-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* MAP AND RADAR LAYOUT */}
      <div className="flex-1 relative flex flex-col md:flex-row min-h-0">
        
        {/* LEAFLET MAP CANVAS */}
        <div className="flex-1 relative h-full w-full min-h-[50vh]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Recenter GPS Button */}
          <button
            type="button"
            onClick={handleRecenterGPS}
            disabled={isLocating}
            className="absolute bottom-6 right-4 z-[400] w-10 h-10 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border border-zinc-700/80 shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-all backdrop-blur-md"
            title="Recenter Map on Current GPS Location"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </button>

          {/* Floating Radar Status HUD */}
          <div className="absolute top-4 left-4 z-[400] bg-zinc-950/85 backdrop-blur-md border border-purple-500/40 rounded-2xl p-2.5 shadow-xl font-mono text-[11px] max-w-xs pointer-events-none">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>ALPR RADAR ACTIVE</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Tracking <strong className="text-white">{filteredList.length}</strong> surveillance nodes in range
            </div>
            {filteredList[0] && filteredList[0].distanceFeet && (
              <div className={`mt-1.5 text-[10px] font-bold p-1 rounded ${
                filteredList[0].distanceFeet <= 1000 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse' 
                  : 'bg-zinc-900 text-zinc-300'
              }`}>
                ⚠️ Nearest: <strong>{filteredList[0].distanceFeet.toLocaleString()} ft away</strong> ({filteredList[0].name})
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR / BOTTOM TRAY: NEARBY CAMERAS LIST */}
        <div className="w-full md:w-80 lg:w-96 bg-zinc-950/95 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col shrink-0 max-h-[35vh] md:max-h-full overflow-hidden z-20">
          
          <div className="px-3.5 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Surveillance Nodes ({filteredList.length})</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Sorted by proximity</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {filteredList.map((cam) => {
              const isSelected = selectedCamera?.id === cam.id;
              return (
                <div
                  key={cam.id}
                  onClick={() => {
                    setSelectedCamera(cam);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([cam.latitude, cam.longitude], 15, { animate: true });
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/40 text-white'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          cam.type === 'flock_raven' ? 'bg-red-400' :
                          cam.type === 'flock_sparrow' ? 'bg-cyan-400' :
                          cam.type === 'speed_red_light' ? 'bg-amber-400' : 'bg-purple-400'
                        }`} />
                        <span className="truncate">{cam.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        📍 {cam.address} ({cam.city}, {cam.state})
                      </div>
                    </div>

                    {/* Distance Badge */}
                    {cam.distanceFeet !== undefined && (
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-mono font-bold block ${
                          cam.distanceFeet <= 1000 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'
                        }`}>
                          {cam.distanceFeet.toLocaleString()} ft
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">
                          {cam.distanceMiles} mi
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="truncate">Direction: <strong className="text-zinc-200">{cam.direction}</strong></span>
                    <span className="text-purple-300 font-mono text-[9px] shrink-0 font-bold">
                      {cam.verifiedCount} verified
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="p-6 text-center text-zinc-500 space-y-2">
                <Camera className="w-6 h-6 mx-auto opacity-40" />
                <p className="text-xs">No cameras match current filter.</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* COMMUNITY CAMERA REPORTING MODAL */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-5 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Report Flock / ALPR Camera</h3>
                  <p className="text-[11px] text-zinc-400">Share camera location with the civilian protection network</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Camera Hardware Type</label>
                <select
                  value={newCamType}
                  onChange={(e) => setNewCamType(e.target.value as CameraType)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="flock_falcon">Flock Safety Falcon ALPR (Solar-Powered Pole Mount)</option>
                  <option value="flock_sparrow">Flock Safety Sparrow (High-Speed Compact ALPR)</option>
                  <option value="flock_raven">Flock Raven (Gunshot &amp; Acoustic Sensor)</option>
                  <option value="speed_red_light">Automated Speed / Red Light Camera</option>
                  <option value="alpr_fixed">Fixed Highway / DOT License Plate Reader</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Intersection or Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S Congress Ave &amp; Ben White Blvd"
                  value={newCamAddress}
                  onChange={(e) => setNewCamAddress(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austin"
                    value={newCamCity}
                    onChange={(e) => setNewCamCity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">State</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="e.g. TX"
                    value={newCamState}
                    onChange={(e) => setNewCamState(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-400 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Capture Direction</label>
                <select
                  value={newCamDirection}
                  onChange={(e) => setNewCamDirection(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="Northbound">Northbound Traffic</option>
                  <option value="Southbound">Southbound Traffic</option>
                  <option value="Eastbound">Eastbound Traffic</option>
                  <option value="Westbound">Westbound Traffic</option>
                  <option value="All-Directional">All-Directional / 360 Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">Observation Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mounted on light pole facing northbound lanes near highway on-ramp"
                  value={newCamNotes}
                  onChange={(e) => setNewCamNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black cursor-pointer shadow-md"
                >
                  Save Camera Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
