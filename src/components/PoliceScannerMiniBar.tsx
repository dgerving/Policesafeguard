import React, { useState, useEffect } from 'react';
import { Radio, Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { PoliceScannerService, ScannerChannel } from '../services/policeScannerService';

interface PoliceScannerMiniBarProps {
  onOpenFullModal: () => void;
}

export const PoliceScannerMiniBar: React.FC<PoliceScannerMiniBarProps> = ({
  onOpenFullModal
}) => {
  const [activeChannel, setActiveChannel] = useState<ScannerChannel>(PoliceScannerService.getActiveChannel());
  const [isPlaying, setIsPlaying] = useState<boolean>(PoliceScannerService.getIsPlaying());
  const [isMuted, setIsMuted] = useState<boolean>(PoliceScannerService.getIsMuted());
  const [presets, setPresets] = useState<(ScannerChannel | null)[]>(PoliceScannerService.getPresets());

  useEffect(() => {
    const unsubscribe = PoliceScannerService.subscribe(() => {
      setActiveChannel(PoliceScannerService.getActiveChannel());
      setIsPlaying(PoliceScannerService.getIsPlaying());
      setIsMuted(PoliceScannerService.getIsMuted());
      setPresets(PoliceScannerService.getPresets());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Only render if scanner is currently playing or was actively tuned
  if (!isPlaying) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-40 max-w-md w-[calc(100vw-24px)] sm:w-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-zinc-950/95 border-2 border-amber-500/60 rounded-2xl p-2.5 sm:p-3 shadow-2xl shadow-black/80 backdrop-blur-md flex flex-col gap-2 text-xs">
        
        {/* Top: Station Info & Audio Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Radio Station info */}
          <div 
            onClick={onOpenFullModal}
            className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shrink-0 shadow">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                <span className="font-mono text-[10px] text-amber-400 font-bold">{activeChannel.frequency}</span>
                <span className="text-[10px] bg-red-600/30 text-red-300 px-1.5 py-0.2 rounded font-black uppercase text-[9px]">LIVE</span>
              </div>
              <div className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                {activeChannel.name}
              </div>
            </div>
          </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => PoliceScannerService.togglePlayPause()}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer border border-zinc-800"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            type="button"
            onClick={() => PoliceScannerService.toggleMute()}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer border border-zinc-800"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={onOpenFullModal}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black cursor-pointer font-bold"
            title="Expand Full Scanner"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => PoliceScannerService.pause()}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            title="Stop & Close Scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom: 5 Quick Preset Switcher Chips */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
        <span className="text-[10px] font-mono text-zinc-500 font-bold px-0.5">PRESETS:</span>
        <div className="grid grid-cols-5 gap-1 flex-1">
          {[0, 1, 2, 3, 4].map((idx) => {
            const ch = presets[idx];
            const isMatch = ch && ch.id === activeChannel.id;
            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (ch) {
                    PoliceScannerService.tuneToPreset(idx);
                  } else {
                    onOpenFullModal();
                  }
                }}
                className={`py-1 px-1 rounded-lg text-center font-mono text-[10px] font-black transition-all cursor-pointer truncate ${
                  isMatch
                    ? 'bg-amber-400 text-black shadow-sm ring-1 ring-amber-300'
                    : ch
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800'
                    : 'bg-zinc-900/40 text-zinc-600 border border-dashed border-zinc-850'
                }`}
                title={ch ? `P${idx + 1}: ${ch.city} (${ch.frequency})` : `P${idx + 1}: Empty`}
              >
                P{idx + 1}{ch ? ` ${ch.city.slice(0, 3)}` : ''}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  </div>
);
};
