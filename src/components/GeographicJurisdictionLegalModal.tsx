import React, { useState } from 'react';
import { 
  Globe, Scale, MapPin, AlertTriangle, CheckCircle, FileText, X, 
  ShieldAlert, Compass, Navigation, ArrowRight, ShieldCheck
} from 'lucide-react';

interface GeographicJurisdictionLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
}

export const GeographicJurisdictionLegalModal: React.FC<GeographicJurisdictionLegalModalProps> = ({
  isOpen,
  onClose,
  onAgree
}) => {
  const [isChecked, setIsChecked] = useState(true);

  if (!isOpen) return null;

  const handleAcceptAndConfirm = () => {
    localStorage.setItem('police_safeguard_jurisdiction_terms_accepted', 'true');
    localStorage.setItem('police_safeguard_jurisdiction_terms_timestamp', new Date().toISOString());
    localStorage.removeItem('police_protection_jurisdiction_terms_accepted');
    localStorage.removeItem('civicshield_jurisdiction_terms_accepted');
    if (onAgree) {
      onAgree();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-amber-500/60 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-black overflow-hidden ring-1 ring-amber-400/30">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CRITICAL SUBSCRIPTION NOTICE
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">50-STATE &amp; TRAVEL POLICY</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
                GEOGRAPHIC &amp; JURISDICTIONAL FEATURE AVAILABILITY
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

        {/* Scrollable Terms Body with Exact Legal Text */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-zinc-300 space-y-4 leading-relaxed font-sans scroll-smooth">
          
          {/* Main Title Banner */}
          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-black text-amber-300 uppercase tracking-wide text-xs sm:text-sm">
                  IMPORTANT LEGAL NOTICE — GEOGRAPHIC AND JURISDICTIONAL FEATURE AVAILABILITY
                </h3>
                <p className="font-bold text-white uppercase text-[11px] tracking-wider">
                  PLEASE READ CAREFULLY BEFORE PURCHASING A SUBSCRIPTION.
                </p>
                <p className="text-zinc-200 text-xs mt-2 leading-relaxed">
                  By purchasing or activating a subscription to this application (“App”), you acknowledge and agree that certain features, functions, services, content, legal information, AI-assisted guidance, recording capabilities, alerts, translations, jurisdiction-specific information, and other functionality offered through the App may be dependent upon your geographic location, the jurisdiction in which you are physically located, applicable federal, state, local, territorial, or foreign laws and regulations, available technology, and other jurisdiction-specific restrictions.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Feature Availability Is Not Guaranteed In Every Location</span>
            </h4>
            <p className="text-zinc-300">
              Certain features may be unavailable, restricted, disabled, modified, interrupted, or otherwise limited in particular jurisdictions because of applicable laws, regulations, court decisions, governmental requirements, licensing restrictions, technical limitations, or other circumstances outside the control of the App and its developers.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <span>TRAVEL AND CHANGE OF LOCATION</span>
            </h4>
            <p className="text-zinc-300">
              You expressly acknowledge that features available to you in one location may become unavailable or operate differently when you travel to another location.
            </p>
            <div className="p-3 rounded-lg bg-black/50 border border-zinc-800">
              <div className="font-bold text-zinc-200 mb-1 text-[11px]">This may occur during:</div>
              <ul className="list-disc pl-5 space-y-1 text-zinc-300 text-[11px]">
                <li>Interstate travel;</li>
                <li>Travel between states, territories, or jurisdictions;</li>
                <li>International travel;</li>
                <li>Travel through areas having different laws or regulations;</li>
                <li>Temporary changes in your physical location;</li>
                <li>Changes to applicable laws or regulations; or</li>
                <li>Changes to the legal or technical availability of a particular feature.</li>
              </ul>
            </div>
            <p className="text-zinc-300">
              For example, a feature that is legally and technically available in one state may be restricted or unavailable after you enter another state or jurisdiction.
            </p>
            <p className="text-zinc-400 text-[11px] italic">
              The App may use available location information, jurisdictional information, device information, network information, or other technical methods to determine whether particular features should be available. However, you acknowledge that such determinations may not always be instantaneous, accurate, or complete.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>NO GUARANTEE OF CONTINUOUS ACCESS</span>
            </h4>
            <p className="text-zinc-300">
              Your purchase of a subscription does not constitute a guarantee that every feature of the App will be available to you at all times or in every location.
            </p>
            <p className="text-zinc-400 text-[11px]">
              The App and its developers reserve the right, to the extent permitted by applicable law, to restrict, disable, modify, suspend, or discontinue particular features when reasonably necessary to comply with applicable laws, regulations, governmental requirements, court orders, technical requirements, or other legitimate restrictions.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
              <span>USER RESPONSIBILITY</span>
            </h4>
            <p className="text-zinc-300">
              You are solely responsible for determining whether your intended use of the App and its features is lawful in the location where you are physically present.
            </p>
            <p className="text-zinc-300">
              You should not rely solely upon the App, its AI-generated information, or any other information provided through the App to determine your legal rights or obligations.
            </p>
            <p className="text-amber-200 font-semibold text-[11px]">
              Laws can vary substantially between jurisdictions and can change over time. The App is not a substitute for advice from a qualified attorney licensed in the applicable jurisdiction.
            </p>
          </section>

          {/* Section 5 */}
          <section className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>SUBSCRIPTION PURCHASES AND REFUNDS</span>
            </h4>
            <p className="text-zinc-300">
              By purchasing a subscription, you acknowledge that you are purchasing access to a subscription service whose features may vary according to your geographic location and applicable jurisdiction.
            </p>
            <p className="text-zinc-300 font-medium">
              To the fullest extent permitted by applicable law, the inability to access a particular feature because that feature is unavailable, restricted, or prohibited in your location does not, by itself, create an entitlement to a full or partial refund, credit, reimbursement, or reduction of the subscription price.
            </p>
            <p className="text-zinc-300">
              You acknowledge that you are not purchasing a guarantee that every individual feature will be available in every jurisdiction.
            </p>
            <p className="text-zinc-400 text-[11px]">
              Nothing in this agreement is intended to waive, limit, or eliminate any refund, cancellation, consumer-protection, or other legal right that cannot lawfully be waived or limited under applicable law.
            </p>
          </section>

          {/* Section 6 */}
          <section className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>LIMITATION OF LIABILITY</span>
            </h4>
            <p className="text-zinc-300">
              To the fullest extent permitted by applicable law, the App, its owners, operators, developers, employees, contractors, affiliates, and service providers shall not be responsible or liable for the unavailability, restriction, modification, suspension, or discontinuation of a feature resulting from applicable law, jurisdictional restrictions, governmental requirements, technical limitations, changes in your geographic location, interstate or international travel, or circumstances outside the reasonable control of the App or its developers.
            </p>
            <p className="text-zinc-400 text-[11px]">
              You acknowledge that geographic and jurisdictional restrictions are an inherent part of providing certain features of the App and that the availability of such features may change without notice when legally or technically necessary.
            </p>
          </section>

          {/* Acknowledgment & Confirmation Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/60 to-zinc-950 border-2 border-amber-500/60 space-y-2 text-zinc-100">
            <div className="font-black text-amber-300 uppercase tracking-wider text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>FULL ACKNOWLEDGMENT &amp; AGREEMENT</span>
            </div>
            <p className="font-bold text-white text-xs leading-relaxed">
              BY SELECTING “I AGREE” AND/OR PURCHASING A SUBSCRIPTION, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND ACCEPTED THIS NOTICE AND ACKNOWLEDGE THAT FEATURE AVAILABILITY MAY VARY BASED ON YOUR LOCATION AND APPLICABLE JURISDICTION.
            </p>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              You further acknowledge that you are not purchasing a guarantee of access to every feature in every location and that, to the fullest extent permitted by applicable law, geographic or jurisdictional restrictions do not independently entitle you to a full or partial refund.
            </p>
          </div>

        </div>

        {/* Modal Footer with Checkbox & Agree Button */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 space-y-3 shrink-0">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5 rounded text-amber-500 bg-black border-zinc-600 focus:ring-0 cursor-pointer mt-0.5 shrink-0"
            />
            <span className="text-xs font-bold text-white leading-snug">
              I confirm that I have read, understood, and accepted the Geographic &amp; Jurisdictional Feature Availability Terms, and I acknowledge that feature availability varies by location without refund entitlement.
            </span>
          </label>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 cursor-pointer"
            >
              Back to Plans
            </button>

            <button
              type="button"
              disabled={!isChecked}
              onClick={handleAcceptAndConfirm}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isChecked
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>I Agree &amp; Accept Full Terms</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
