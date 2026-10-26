import React, { useState, useEffect } from 'react';
import { 
  Gift, Sparkles, CheckCircle2, AlertCircle, X, 
  ArrowRight, ShieldCheck, KeyRound
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

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setErrorMessage(null);
      setSuccessMessage(null);
      setPromoInput('');
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
        setSuccessMessage(result.message || 'Promo code applied successfully!');
        onSuccess(result.updatedProfile);
        loadStatus();
      } else {
        setErrorMessage(result.message || 'Invalid promo code. Please check and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while redeeming code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="promo-code-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-zinc-100 flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Enter Promo Code
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Apply a promotional or gift code to your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          
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
                Promo Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-wider placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !promoInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/50 transition-all disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{isLoading ? 'Verifying...' : 'Apply Code'}</span>
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-end text-xs text-zinc-500">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
