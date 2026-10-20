import React from 'react';
import { ShieldAlert, Scale, AlertTriangle, X, CheckCircle2, BookOpen, ExternalLink } from 'lucide-react';
import { FeatureLegalityCheck } from '../services/jurisdictionLegalityService';

interface LegalityRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  check: FeatureLegalityCheck | null;
}

export const LegalityRestrictedModal: React.FC<LegalityRestrictedModalProps> = ({
  isOpen,
  onClose,
  check
}) => {
  if (!isOpen || !check) return null;

  return (
    <div 
      id="legality-restricted-modal" 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-zinc-900 border border-red-500/60 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-zinc-100 flex flex-col my-auto shadow-red-950/40">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-red-900/60 bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 shadow-inner shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/50">
                  LEGAL COMPLIANCE DENIAL
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {check.stateCode}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
                Feature Denied Under State Law
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          
          {/* Feature and Citation Callout */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-medium">Attempted Feature:</span>
              <span className="text-white font-bold">{check.featureName}</span>
            </div>
            <div className="flex items-start justify-between text-zinc-400 pt-1.5 border-t border-zinc-850 gap-2">
              <span className="text-[11px] font-medium shrink-0">Controlling Statute:</span>
              <span className="text-amber-300 font-mono font-bold text-right text-[11px]">
                {check.statuteCitation}
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-red-300 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Scale className="w-3.5 h-3.5 text-red-400" />
              <span>Why This Feature is Denied in {check.stateName}:</span>
            </h4>
            <p className="text-zinc-300 text-xs leading-relaxed bg-red-950/20 p-3 rounded-xl border border-red-500/20">
              {check.reason}
            </p>
          </div>

          {/* Legal Guidance */}
          <div className="space-y-1 text-zinc-400">
            <p className="text-[11px] leading-relaxed">
              {check.legalGuidance}
            </p>
          </div>

          {/* Lawful Alternative Enforced */}
          {check.mandatoryAlternative && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1 text-emerald-200">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Police SafeGuard Lawful Safeguard:</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                {check.mandatoryAlternative}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Acknowledge &amp; Use Lawful Protection
          </button>
        </div>

      </div>
    </div>
  );
};
