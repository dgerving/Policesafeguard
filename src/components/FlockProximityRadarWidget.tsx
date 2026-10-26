import React, { useState, useEffect } from 'react';
import { Camera, Volume2, VolumeX, MapPin, ChevronRight, ShieldAlert } from 'lucide-react';
import { FlockCameraService, FlockCameraLocation } from '../services/flockCameraService';

interface FlockProximityRadarWidgetProps {
  onOpenFullMap?: () => void;
  className?: string;
}

export const FlockProximityRadarWidget: React.FC<FlockProximityRadarWidgetProps> = ({
  onOpenFullMap,
  className = ''
}) => {
  const [nearestCamera, setNearestCamera] = useState<FlockCameraLocation | null>(null);
  const [isAudioAlarm, setIsAudioAlarm] = useState<boolean>(FlockCameraService.getIsAudioAlarmEnabled());

  useEffect(() => {
    const update = () => {
      const loc = FlockCameraService.getUserLocation();
      const cameras = FlockCameraService.getCamerasNear(loc?.lat, loc?.lng, 2);
      if (cameras.length > 0) {
        setNearestCamera(cameras[0]);
      }
      setIsAudioAlarm(FlockCameraService.getIsAudioAlarmEnabled());
    };

    update();
    const unsub = FlockCameraService.subscribe(update);
    return () => unsub();
  }, []);

  if (!nearestCamera || !nearestCamera.distanceFeet) return null;

  const isClose = nearestCamera.distanceFeet <= 1000;
  const isCritical = nearestCamera.distanceFeet <= 450;

  return (
    <div 
      className={`rounded-2xl border backdrop-blur-md transition-all shadow-xl font-mono ${
        isCritical 
          ? 'bg-red-950/80 border-red-500/80 ring-2 ring-red-500/50 shadow-red-950/50 animate-pulse'
          : isClose
          ? 'bg-purple-950/80 border-purple-500/70 shadow-purple-950/40'
          : 'bg-zinc-950/80 border-zinc-800'
      } ${className}`}
    >
      <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2.5">
        
        {/* Radar Icon & Distance */}
        <div 
          onClick={onOpenFullMap}
          className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
            isCritical
              ? 'bg-red-500 text-black border-red-300 font-bold'
              : isClose
              ? 'bg-purple-500 text-white border-purple-400'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}>
            <Camera className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-black truncate">
              <span className={isCritical ? 'text-red-200' : isClose ? 'text-purple-300' : 'text-zinc-200'}>
                {isCritical ? '🚨 FLOCK SURVEILLANCE ZONE' : isClose ? '⚠️ FLOCK ALPR CAMERA' : 'SURVEILLANCE RADAR'}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                isCritical 
                  ? 'bg-red-500 text-black' 
                  : isClose 
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {nearestCamera.distanceFeet.toLocaleString()} FT
              </span>
            </div>

            <div className="text-[10px] text-zinc-400 truncate mt-0.5">
              {nearestCamera.address} • <strong className="text-zinc-300">{nearestCamera.direction}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const next = FlockCameraService.toggleAudioAlarm();
              setIsAudioAlarm(next);
            }}
            className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white cursor-pointer"
            title={isAudioAlarm ? 'Proximity Chime Active' : 'Chime Muted'}
          >
            {isAudioAlarm ? <Volume2 className="w-3 h-3 text-amber-400" /> : <VolumeX className="w-3 h-3 text-zinc-500" />}
          </button>

          {onOpenFullMap && (
            <button
              type="button"
              onClick={onOpenFullMap}
              className="p-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Map</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
