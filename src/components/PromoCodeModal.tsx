import React, { useState, useEffect } from 'react';
import { 
  Gift, Sparkles, CheckCircle2, AlertCircle, X, 
  ShieldCheck, Infinity as InfinityIcon, ArrowRight, 
  Copy, Check, Lock, Radio, Scale, ShieldAlert
} from 'lucide-react';
import { UserProfile } from '../types';
import { PromoService, PromoCodeStatus } from '../services/promoService';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSuccess: (updatedProfile: UserProfile) => void;
}

export const PromoCodeModal: React.FC<PromoCodeModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSuccess
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [status, setStatus] = useState<PromoCodeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAlreadyLifetime = userProfile.membershipTier === 'lifetime_pro';

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const data = await PromoService.getStatus();
      setStatus(data);
    } catch (e) {
      console.warn('Failed to load promo status', e);
    }
  };

  if (!isOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) {
      setErrorMessage('Please enter a promo code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await PromoService.redeem(promoInput, userProfile);
      if (result.success && result.updatedProfile) {
        setSuccessMessage(result.message);
        onSuccess(result.updatedProfile);
        loadStatus();
      } else {
        setErrorMessage(result.message || 'Failed to redeem promo code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while redeeming code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="promo-code-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-amber-500/50 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-amber-950/40 text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Redeem Promo Code
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black uppercase">
                  VIP Gift
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Unlock full lifetime membership &amp; unlimited protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Ambassador & VIP Gift Pass Information Banner (No example code shown) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-zinc-950 to-amber-500/5 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Redeem Ambassador or Promotional Gift Pass</span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              If you were provided an ambassador code or promotional gift pass, enter your code below to activate <strong>100% Free Lifetime Pro Membership</strong> with unlimited defense credits.
            </p>
          </div>

          {/* Current Membership Notice */}
          {isAlreadyLifetime ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Lifetime Pro Membership Active
                </span>
                <span className="text-[11px] text-emerald-300">
                  Your account is permanently unlocked with all premium features and unlimited defense credits.
                </span>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Promo Input Form */}
          <form onSubmit={handleApplyPromo} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
                Enter Promo Code:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter promo or gift code..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-wider placeholder-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !promoInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/50 transition-all disabled:opacity-40"
            >
              <span>{isLoading ? 'Verifying Code...' : 'REDEEM LIFETIME PRO ACCESS'}</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>

          {/* Lifetime Pro Features Included */}
          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              What Lifetime Pro Unlocks ($0 Forever):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <InfinityIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Unlimited Defense Credits</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <Radio className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Live Cloud Video Streaming</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>AES-256 Encrypted Vault</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>50-State Statutory Legal AI</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Official Ambassador Grant System</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
