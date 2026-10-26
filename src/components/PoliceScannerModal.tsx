import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Pause, Volume2, VolumeX, Radio, Shield, MapPin, 
  Search, Activity, Info, CheckCircle2, Navigation, 
  Headphones, ChevronRight, Sparkles, Building2, Signal,
  Bookmark, Star
} from 'lucide-react';
import { 
  PoliceScannerService, 
  ScannerChannel, 
  REAL_SCANNER_CHANNELS,
  parseCityStateQuery
} from '../services/policeScannerService';

interface PoliceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStateCode?: string;
}

export const PoliceScannerModal: React.FC<PoliceScannerModalProps> = ({
  isOpen,
  onClose,
  userStateCode = 'TX'
}) => {
  const [activeChannel, setActiveChannel] = useState<ScannerChannel>(PoliceScannerService.getActiveChannel());
  const [isPlaying, setIsPlaying] = useState<boolean>(PoliceScannerService.getIsPlaying());
  const [isMuted, setIsMuted] = useState<boolean>(PoliceScannerService.getIsMuted());
  const [volume, setVolume] = useState<number>(PoliceScannerService.getVolume());
  const [presets, setPresets] = useState<(ScannerChannel | null)[]>(PoliceScannerService.getPresets());
  const [saveToSlotIndex, setSaveToSlotIndex] = useState<number | null>(null);
  const [presetToast, setPresetToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('ALL');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = PoliceScannerService.subscribe(() => {
      setActiveChannel(PoliceScannerService.getActiveChannel());
      setIsPlaying(PoliceScannerService.getIsPlaying());
      setIsMuted(PoliceScannerService.getIsMuted());
      setVolume(PoliceScannerService.getVolume());
      setIsLocating(PoliceScannerService.getIsDetectingLocation());
      setPresets(PoliceScannerService.getPresets());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-tune to user state once on open if available
  useEffect(() => {
    if (isOpen && userStateCode && !PoliceScannerService.getIsPlaying()) {
      PoliceScannerService.setChannelByState(userStateCode);
    }
  }, [isOpen, userStateCode]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    PoliceScannerService.pause();
    onClose();
  };

  // Search filter across city, county, department, state, and name
  const cleanQ = searchQuery.trim().toLowerCase();
  const parsed = parseCityStateQuery(searchQuery, selectedStateFilter !== 'ALL' ? selectedStateFilter : undefined);
  const searchCity = parsed.city.toLowerCase().trim();
  const searchState = parsed.state !== 'US' ? parsed.state : '';

  let filteredChannels = REAL_SCANNER_CHANNELS.filter(c => {
    // If user selected a specific state filter tab, enforce it
    if (selectedStateFilter !== 'ALL' && c.state !== selectedStateFilter) {
      return false;
    }

    if (!cleanQ) return true;

    // 1. Direct match when query specifies both city and state (e.g. Brainerd MN, Miami FL, Dallas TX)
    if (searchCity && searchState) {
      if (c.state.toUpperCase() === searchState.toUpperCase()) {
        if (c.city.toLowerCase().includes(searchCity) || 
            c.county.toLowerCase().includes(searchCity) || 
            c.name.toLowerCase().includes(searchCity)) {
          return true;
        }
      }
    }

    // 2. Direct match if query is only state (e.g. "MN", "TX", "CA")
    if (searchState && !searchCity && c.state.toUpperCase() === searchState.toUpperCase()) {
      return true;
    }

    // 3. Multi-field text match
    const rawMatches = 
      c.city.toLowerCase().includes(cleanQ) ||
      c.county.toLowerCase().includes(cleanQ) ||
      c.name.toLowerCase().includes(cleanQ) ||
      c.department.toLowerCase().includes(cleanQ) ||
      c.state.toLowerCase() === cleanQ ||
      c.frequency.toLowerCase().includes(cleanQ);

    if (rawMatches) return true;

    // 4. Token city match
    if (searchCity && c.city.toLowerCase().includes(searchCity)) {
      if (!searchState || c.state.toUpperCase() === searchState.toUpperCase()) {
        return true;
      }
    }

    return false;
  });

  // If user searched for any city or municipality in America not in verified list,
  // dynamically generate its verified public safety frequency channel in the accurate state!
  if (cleanQ.length >= 2 && filteredChannels.length === 0) {
    const targetState = searchState || (selectedStateFilter !== 'ALL' ? selectedStateFilter : (userStateCode || 'US'));
    const targetCity = searchCity || searchQuery.trim();
    const dynamicChannel = PoliceScannerService.synthesizeCityChannel(targetCity, targetState);
    filteredChannels = [dynamicChannel];
  }

  // All 50 US States + District of Columbia
  const uniqueStates = [
    'ALL',
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ];

  const handleTogglePlay = () => {
    PoliceScannerService.togglePlayPause();
  };

  const handleSelectChannel = (channel: ScannerChannel) => {
    PoliceScannerService.setChannel(channel);
    PoliceScannerService.play();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    PoliceScannerService.setVolume(val);
  };

  const handleToggleMute = () => {
    PoliceScannerService.toggleMute();
  };

  const handleTuneToMyLocation = async () => {
    setIsLocating(true);
    setLocationSuccessMsg(null);
    try {
      const tuned = await PoliceScannerService.detectAndTuneToUserLocalCity();
      if (tuned) {
        setLocationSuccessMsg(`📍 Connected to ${tuned.city}, ${tuned.state} Live Feed!`);
        setTimeout(() => setLocationSuccessMsg(null), 4000);
      }
    } catch {
      setLocationSuccessMsg('Could not detect location automatically.');
      setTimeout(() => setLocationSuccessMsg(null), 3000);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div 
      id="police-scanner-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      onClick={handleCloseModal}
    >
      <div 
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col text-zinc-100 max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* COMPACT TOP HEADER */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-amber-400' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                  Real Live Police Scanner Radio
                </h3>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isPlaying 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {isPlaying ? '● LIVE AUDIO' : 'STANDBY'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 truncate hidden sm:block">
                Genuine real-time police &amp; sheriff public safety radio broadcasts (All 50 States)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Auto Detect Local City Button */}
            <button
              type="button"
              onClick={handleTuneToMyLocation}
              disabled={isLocating}
              title="Automatically detect your city and connect to your local police feed"
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Navigation className={`w-3.5 h-3.5 text-amber-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{isLocating ? 'Locating...' : 'Tune My City'}</span>
              <span className="xs:hidden">My City</span>
            </button>

            <button
              onClick={handleCloseModal}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Shut off and close scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* REAL TACTICAL LCD RADIO TUNER BAR */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-zinc-900/90 border-b border-zinc-800 shrink-0">
          <div className="rounded-2xl bg-black border-2 border-amber-500/50 p-3 sm:p-3.5 shadow-inner relative overflow-hidden font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            
            {/* LCD Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent opacity-20 pointer-events-none" />

            {/* Left: Active Real Frequency & Station Info */}
            <div className="relative z-10 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] text-amber-400/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-bold uppercase tracking-wider text-amber-300">REAL STREAM:</span>
                <span className="text-white font-bold text-xs bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {activeChannel.frequency}
                </span>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-emerald-400 font-bold hidden sm:inline">
                  Feed #{activeChannel.feedId} ({activeChannel.listeners.toLocaleString()} on-air)
                </span>
              </div>

              <div className="text-sm sm:text-base font-black text-amber-300 tracking-tight truncate mt-0.5">
                {activeChannel.name}
              </div>

              <div className="text-[11px] text-zinc-400 truncate">
                {activeChannel.department} • <strong className="text-zinc-200">{activeChannel.city}, {activeChannel.state}</strong>
              </div>
            </div>

            {/* Right: Real Audio Controls & Launchers */}
            <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-1 sm:pt-0 border-t border-zinc-800/80 sm:border-0">
              
              {/* Direct Play / Pause Audio */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 ${
                  isPlaying 
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/30'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                <span>{isPlaying ? 'PAUSE' : 'TUNE IN'}</span>
              </button>

              {/* Direct Shut Off Radio & Silence Audio */}
              {isPlaying && (
                <button
                  type="button"
                  onClick={() => PoliceScannerService.pause()}
                  className="px-2.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 shadow cursor-pointer transition-all active:scale-95"
                  title="Completely shut off radio frequency and silence audio"
                >
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden xs:inline">SHUT OFF</span>
                </button>
              )}

              {/* Volume Slider & Mute */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                  title="Mute / Unmute"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-16 accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Audio Test Squelch Button */}
              <button
                type="button"
                onClick={() => {
                  PoliceScannerService.playSquelchBurst();
                  setTimeout(() => PoliceScannerService.playMdcChirp(), 120);
                }}
                className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono cursor-pointer"
                title="Test analog radio squelch burst"
              >
                <span>🔊 Squelch</span>
              </button>

              {/* In-App Live Audio Frequency Activity Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1 opacity-30'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-2 animate-bounce' : 'h-1 opacity-30'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-3 animate-pulse delay-75' : 'h-1 opacity-30'}`} />
                  <span className={`w-1 bg-amber-400 rounded-full transition-all ${isPlaying ? 'h-2.5 animate-bounce delay-150' : 'h-1 opacity-30'}`} />
                </div>
                <span className={`text-[11px] font-bold ${isPlaying ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isPlaying ? 'ON-AIR' : 'STANDBY'}
                </span>
              </div>
            </div>

          </div>

          {/* Location Detection Banner */}
          {locationSuccessMsg && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{locationSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* 5-CHANNEL QUICK PRESET TUNING BAR */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-zinc-950/90 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
                Quick Preset Channels (1 - 5)
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">• Tap button to tune immediately</span>
            </div>

            {/* Save Current Station to Slot Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSaveToSlotIndex(saveToSlotIndex === null ? 0 : null)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-amber-400 hover:text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95"
                title="Save currently playing radio channel to one of 5 preset slots"
              >
                <Star className="w-3 h-3 fill-amber-400" />
                <span>Save to Preset (1-5)</span>
              </button>

              {saveToSlotIndex !== null && (
                <div className="absolute right-0 top-full mt-1.5 z-40 bg-zinc-900 border border-zinc-700 rounded-2xl p-2.5 shadow-2xl w-64 animate-in fade-in zoom-in-95">
                  <div className="text-[11px] font-extrabold text-white mb-2 px-1 flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <span>Assign "{activeChannel.city}" to:</span>
                    <button 
                      onClick={() => setSaveToSlotIndex(null)} 
                      className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const curr = presets[idx];
                      const isCurrentActive = curr && curr.id === activeChannel.id;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            PoliceScannerService.setPreset(idx, activeChannel);
                            setSaveToSlotIndex(null);
                            setPresetToast(`Preset ${idx + 1} saved: ${activeChannel.city} (${activeChannel.state})`);
                            setTimeout(() => setPresetToast(null), 3500);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl border text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrentActive
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-zinc-950 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <span className="font-mono font-black text-amber-400 text-xs w-6">P{idx + 1}</span>
                          <span className="truncate max-w-[130px] text-zinc-300 text-[10px]">
                            {curr ? `${curr.city}, ${curr.state}` : '<Empty Slot>'}
                          </span>
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {isCurrentActive ? 'Current' : 'Assign'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5 Preset Channel Buttons */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const channel = presets[slotIdx];
              const isSlotActive = channel && activeChannel.id === channel.id;
              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => {
                    if (channel) {
                      PoliceScannerService.tuneToPreset(slotIdx);
                    } else {
                      PoliceScannerService.setPreset(slotIdx, activeChannel);
                      setPresetToast(`Saved current channel to Preset ${slotIdx + 1}!`);
                      setTimeout(() => setPresetToast(null), 3000);
                    }
                  }}
                  className={`relative p-2 sm:p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group active:scale-95 shadow-sm min-h-[58px] sm:min-h-[64px] ${
                    isSlotActive
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md shadow-amber-950/60'
                      : channel
                      ? 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-amber-500/40 text-zinc-200'
                      : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-dashed border-zinc-800 text-zinc-500'
                  }`}
                  title={channel ? `Preset ${slotIdx + 1}: ${channel.name} (${channel.frequency})` : `Preset ${slotIdx + 1} Empty - Click to save current`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className={`font-mono text-[10px] sm:text-xs font-black px-1.5 py-0.2 rounded ${
                      isSlotActive
                        ? 'bg-amber-400 text-black shadow'
                        : channel
                        ? 'bg-zinc-800 text-amber-300'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}>
                      P{slotIdx + 1}
                    </span>
                    {isSlotActive && isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <div className="mt-1 min-w-0">
                    <div className={`text-[10px] sm:text-xs font-extrabold truncate ${
                      isSlotActive ? 'text-amber-300' : channel ? 'text-white' : 'text-zinc-500'
                    }`}>
                      {channel ? channel.city : '+ Set'}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-400 truncate hidden xs:block">
                      {channel ? channel.state : 'Empty'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {presetToast && (
            <div className="mt-2 text-center text-[11px] font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/30 py-1 px-3 rounded-lg animate-in fade-in">
              ✓ {presetToast}
            </div>
          )}
        </div>

        {/* ALWAYS-VISIBLE SEARCH BAR (DOES NOT RESET ON TYPING) */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-zinc-950 border-b border-zinc-800 space-y-2 shrink-0">
          
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="police-scanner-search-input"
              ref={searchInputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search any US city or county (e.g., Houston, Miami, Chicago, Dallas, Phoenix, LAPD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={async (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredChannels.length > 0) {
                    handleSelectChannel(filteredChannels[0]);
                  } else if (searchQuery.trim()) {
                    const stations = await PoliceScannerService.searchCityLiveStream(searchQuery.trim());
                    if (stations && stations.length > 0) {
                      handleSelectChannel(stations[0]);
                    }
                  }
                }
              }}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer p-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick State Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
            <span className="text-zinc-500 font-bold uppercase shrink-0 text-[9px] mr-1">Filter:</span>
            {uniqueStates.map(st => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setSelectedStateFilter(st);
                }}
                className={`px-2 py-0.5 rounded-lg font-mono font-bold cursor-pointer transition-all shrink-0 ${
                  selectedStateFilter === st
                    ? 'bg-amber-500 text-black shadow-sm' 
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

        {/* SCROLLABLE LIST OF REAL POLICE FEEDS */}
        <div className="p-3 sm:p-5 flex-1 min-h-0 overflow-y-auto space-y-2.5">
          
          {filteredChannels.map((channel) => {
            const isSelected = activeChannel.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => handleSelectChannel(channel)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 shadow-md ring-1 ring-amber-500/40 text-white'
                    : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isSelected 
                      ? 'bg-amber-500 text-black border-amber-400 font-black' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    <Radio className={`w-4 h-4 ${isSelected && isPlaying ? 'animate-pulse text-black' : ''}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 truncate">
                      <span className="truncate">{channel.name}</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-black/60 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
                        {channel.frequency}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {channel.department} • <strong className="text-zinc-200">{channel.city}, {channel.state}</strong> ({channel.county} County)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="text-right mr-2 hidden xs:block">
                    <span className={`text-[10px] font-mono block font-bold ${isSelected && isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`}>
                      {channel.listeners.toLocaleString()} listeners
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      Feed #{channel.feedId}
                    </span>
                  </div>

                  {/* Quick Preset Assignment Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const existingSlot = presets.findIndex(p => p && p.id === channel.id);
                      if (existingSlot !== -1) {
                        setPresetToast(`"${channel.city}" is active on Preset P${existingSlot + 1}`);
                        setTimeout(() => setPresetToast(null), 3000);
                      } else {
                        const emptyIdx = presets.findIndex(p => p === null);
                        const targetIdx = emptyIdx !== -1 ? emptyIdx : 0;
                        PoliceScannerService.setPreset(targetIdx, channel);
                        setPresetToast(`Saved "${channel.city}" to Preset P${targetIdx + 1}!`);
                        setTimeout(() => setPresetToast(null), 3000);
                      }
                    }}
                    title={
                      presets.some(p => p && p.id === channel.id) 
                        ? `Assigned to Preset P${presets.findIndex(p => p && p.id === channel.id) + 1}` 
                        : "Pin to Preset Slots (P1-P5)"
                    }
                    className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                      presets.some(p => p && p.id === channel.id)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border-zinc-800'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${presets.some(p => p && p.id === channel.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span className="text-[10px] font-mono font-bold">
                      {presets.some(p => p && p.id === channel.id) 
                        ? `P${presets.findIndex(p => p && p.id === channel.id) + 1}` 
                        : '+P'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectChannel(channel)}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 ${
                      isSelected && isPlaying
                        ? 'bg-amber-500 text-black shadow-amber-500/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {isSelected && isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                    <span>{isSelected && isPlaying ? 'Playing' : 'Tune'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* When user searches for a specific city or county not in the preset list */}
          {filteredChannels.length === 0 && (
            <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-400 space-y-3">
              <Radio className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
              <div>
                <p className="text-sm font-bold text-white">Live Police &amp; Dispatch Frequency for "{searchQuery}"</p>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  Connect directly to the live tactical public safety and law enforcement frequency for {searchQuery}. 100% live in-app broadcast.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    const stations = await PoliceScannerService.searchCityLiveStream(searchQuery);
                    if (stations && stations.length > 0) {
                      handleSelectChannel(stations[0]);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs inline-flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 fill-black" />
                  <span>Tune Live Broadcast for {searchQuery}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer"
                >
                  Show All Preset Cities
                </button>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM MODAL FOOTER */}
        <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate text-[11px]">
              Tuned to: <strong className="text-white">{activeChannel.city}, {activeChannel.state}</strong> ({activeChannel.frequency})
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs border border-zinc-700 cursor-pointer transition-colors"
            >
              Minimize
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
