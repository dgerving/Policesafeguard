import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, ShieldCheck, Scale, Award, Heart, CheckCircle2, 
  ExternalLink, Building2, Users, DollarSign, X, ArrowUpRight,
  TrendingUp, Sparkles, AlertCircle
} from 'lucide-react';
import { VETTED_LAW_ENFORCEMENT_CHARITIES, CharityService } from '../services/charityService';
import { CharityImpactData } from '../types';

interface LawEnforcementCharityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenBailVault?: () => void;
}

export const LawEnforcementCharityModal: React.FC<LawEnforcementCharityModalProps> = ({
  isOpen,
  onClose,
  onOpenSubscriptionModal,
  onOpenBailVault
}) => {
  const [impactData, setImpactData] = useState<CharityImpactData | null>(null);

  useEffect(() => {
    if (isOpen) {
      CharityService.fetchImpactData().then(setImpactData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-blue-500/50 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-black overflow-hidden ring-1 ring-blue-400/30">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950 via-zinc-950 to-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-amber-400 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30 shrink-0">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  5% CHARITY COMMITMENT
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">501(c)(3) PARTNERS</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
                SUPPORTING LEGITIMATE LAW ENFORCEMENT &amp; HONEST POLICE WORK
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-zinc-300 space-y-5 leading-relaxed font-sans scroll-smooth">
          
          {/* Mission Hero Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-950/50 via-zinc-900/90 to-zinc-950 border-2 border-blue-500/40 text-zinc-200 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 shrink-0">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-white text-sm sm:text-base uppercase tracking-wide">
                  Our Dual Ethos: Eliminating Bad Practices While Backing Honest Police
                </h3>
                <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
                  <strong>Police SafeGuard</strong> is designed to help eliminate unfair, unjust, or dishonest practices used by less-than-honest police officials. However, protecting civil rights does not mean being anti-police.
                </p>
                <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
                  The developers and subscribers of this app firmly recognize, respect, and support legitimate law enforcement. Every day, thousands of honest police officers risk their lives to protect communities with fairness and honor. To turn our appreciation into concrete support, <strong>5% of every subscription, renewal, lifetime pass, and credit purchase is donated directly to reputable law enforcement charities, alongside a matching 5% pledged to the Bail Relief Vault for wrongfully accused citizens.</strong>
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/80">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Pledge Percentage</div>
                <div className="text-lg sm:text-xl font-black text-blue-400 font-mono">5.0%</div>
                <div className="text-[9px] text-zinc-500">Every Single Purchase</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Total Donated to Date</div>
                <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                  ${(impactData?.totalDonatedDollars ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[9px] text-zinc-500">To Verified 501(c)(3)s</div>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Subscriber Orders</div>
                <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                  {(impactData?.totalTransactionsCount ?? 0).toLocaleString()}
                </div>
                <div className="text-[9px] text-zinc-500">Citizens Giving Back</div>
              </div>
            </div>
          </div>

          {/* Dual 5% Companion Banner */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Companion 5% Bail Relief Vault Active
                </div>
                <p className="text-[11px] text-zinc-300">
                  Every purchase also pledges 5% into the Bail Relief Vault to help families of wrongfully accused or falsely imprisoned individuals.
                </p>
              </div>
            </div>
            {onOpenBailVault && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBailVault();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs cursor-pointer shrink-0 transition-colors"
              >
                View Bail Vault
              </button>
            )}
          </div>

          {/* Section: Exact 5% Plan Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Transparent 5% Contribution Breakdown By Plan</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Police SafeGuard Pro (Monthly)</span>
                  <span className="font-mono text-amber-400">$14.99/mo</span>
                </div>
                <div className="text-base font-black text-emerald-400 font-mono">
                  $0.75 Donated (5%)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Matches $0.75 deposited to the Wrongful Accusation Bail Relief Vault.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Police SafeGuard Pro (Yearly)</span>
                  <span className="font-mono text-amber-400">$49.99/yr</span>
                </div>
                <div className="text-base font-black text-emerald-400 font-mono">
                  $2.50 Donated (5%)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Matches $2.50 deposited to the Wrongful Accusation Bail Relief Vault.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-amber-500/40 space-y-1 bg-amber-500/5">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Lifetime Pass</span>
                  <span className="font-mono text-amber-400">$79.99</span>
                </div>
                <div className="text-base font-black text-amber-300 font-mono">
                  $4.00 Donated (5%)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Substantial contribution directly aiding officers killed in the line of duty.
                </div>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 italic px-1">
              *All defense credit packs ($4.99 to $49.99) also allocate exactly 5% to our vetted police charity fund and 5% to the Bail Relief Vault.
            </div>
          </div>

          {/* Section: Vetted Beneficiaries */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Vetted Law Enforcement Beneficiaries (501(c)(3) Non-Profits)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VETTED_LAW_ENFORCEMENT_CHARITIES.map((charity) => (
                <div 
                  key={charity.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex flex-col justify-between space-y-2 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                        {charity.allocationPercentage}% of Fund
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {charity.taxExemptStatus}
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-xs mt-1">
                      {charity.name}
                    </h5>
                    <div className="text-[11px] text-amber-300/90 font-medium">
                      {charity.tagline}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug pt-1">
                      {charity.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Category: {charity.category.replace('_', ' ')}
                    </span>
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Official Site</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Live Transparency Stream */}
          <div className="space-y-2">
            <h4 className="font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Recent Subscriber Donations (10% Ledger)</span>
            </h4>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden divide-y divide-zinc-900">
              {(impactData?.recentPledges ?? []).map((pledge) => (
                <div key={pledge.id} className="p-2.5 flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-zinc-200">{pledge.plan}</div>
                      <div className="text-[10px] text-zinc-500">Allocated to: {pledge.partnerName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400">
                      +${pledge.donationAmount.toFixed(2)}
                    </span>
                    <div className="text-[9px] text-zinc-500">10% Pledged</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Every subscription helps protect civil liberties and supports honest officers.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 cursor-pointer"
            >
              Close
            </button>

            {onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscriptionModal();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>View Plans &amp; Contribute (10%)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
