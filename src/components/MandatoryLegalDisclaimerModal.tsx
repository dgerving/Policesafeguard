import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Scale, Lock, BookOpen } from 'lucide-react';

interface MandatoryLegalDisclaimerModalProps {
  isOpen: boolean;
  onAgree: () => void;
  canDismiss?: boolean;
  onClose?: () => void;
}

export const MandatoryLegalDisclaimerModal: React.FC<MandatoryLegalDisclaimerModalProps> = ({
  isOpen,
  onAgree,
  canDismiss = false,
  onClose,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (!isChecked) return;
    localStorage.setItem('police_safeguard_legal_disclaimer_accepted', 'true');
    localStorage.setItem('police_safeguard_legal_disclaimer_timestamp', new Date().toISOString());
    localStorage.removeItem('civicshield_legal_disclaimer_accepted');
    onAgree();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-black overflow-hidden ring-1 ring-amber-400/30">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-md shadow-amber-500/30 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MANDATORY LEGAL NOTICE
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">FRE 902 NOTICE</span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
                END-USER LEGAL DISCLAIMER &amp; SAFETY ACKNOWLEDGMENT
              </h2>
            </div>
          </div>

          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>

        {/* Scrollable Terms Content */}
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-zinc-300 space-y-4 leading-relaxed font-sans scroll-smooth"
        >
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-300 uppercase tracking-wide mb-0.5">PLEASE READ CAREFULLY BEFORE USING THIS APPLICATION</strong>
              <span>
                By creating an account, selecting “I Agree,” checking the acknowledgment box, or otherwise accessing or using this application (the “App”), you acknowledge that you have read, understood, and agreed to the following terms and disclaimers. You must acknowledge and accept this notice before using the App for the first time.
              </span>
            </div>
          </div>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>1. INFORMATIONAL PURPOSES ONLY</span>
            </h3>
            <p>
              The App, including any artificial intelligence (“AI”), automated features, information, suggestions, explanations, translations, alerts, or other content provided through the App, is provided for general informational and educational purposes only.
            </p>
            <p>
              The App is not a law firm, attorney, law-enforcement agency, emergency service, or government agency, and the App does not establish an attorney-client relationship between you and the App owner, its developers, operators, employees, contractors, or affiliates.
            </p>
            <p className="text-zinc-400">
              Information provided by the App should not be considered individualized legal advice or a substitute for advice from a qualified attorney who is licensed to practice in the applicable jurisdiction.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>2. USER'S RESPONSIBILITY TO COMPLY WITH LAWFUL ORDERS</span>
            </h3>
            <p>
              You remain solely responsible for your own conduct and decisions during any interaction with law enforcement or any other governmental authority.
            </p>
            <p className="font-semibold text-white">
              Nothing provided by this App should ever be used as justification to resist, obstruct, interfere with, flee from, evade, or attempt to resist an arrest or other lawful law-enforcement action.
            </p>
            <p>
              You should not rely on information provided by the App or its AI to refuse, resist, or disregard a demand, command, instruction, detention, arrest, search, identification request, or other action by a law-enforcement officer.
            </p>
            <p className="text-zinc-400">
              If you believe that an officer has violated your rights or acted unlawfully, you should prioritize your immediate safety and address the matter through appropriate legal channels after the encounter, including consulting a qualified attorney when appropriate.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              3. NO GUARANTEE REGARDING ARREST OR LAW-ENFORCEMENT OUTCOMES
            </h3>
            <p>
              The App does not guarantee, promise, or represent that its use will prevent, stop, avoid, reduce, or otherwise affect an arrest, detention, citation, search, seizure, investigation, prosecution, or other law-enforcement action.
            </p>
            <p className="text-zinc-400">
              An arrest or other law-enforcement action may occur regardless of whether the App is being used and regardless of any information, guidance, warning, or suggestion provided by the App.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              4. AI MAY PROVIDE INCORRECT OR OUTDATED INFORMATION
            </h3>
            <p>
              You expressly acknowledge that artificial intelligence systems may produce information that is incorrect, incomplete, misleading, outdated, inapplicable to your particular circumstances, or inconsistent with applicable law.
            </p>
            <p>
              Laws and legal procedures may also vary between jurisdictions and may change over time.
            </p>
            <p className="text-zinc-400">
              Accordingly, you agree that you will not treat an AI-generated response as authoritative legal instruction and will not rely solely upon information provided by the App when making decisions that could affect your safety, liberty, property, or legal rights.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              5. NO SUPPORT FOR ILLEGAL ACTIVITY
            </h3>
            <p>
              The App does not support, promote, encourage, facilitate, or condone illegal activity or unlawful conduct.
            </p>
            <p>
              The App is intended solely to provide informational and educational assistance concerning interactions with law enforcement and general awareness of potential legal rights and responsibilities.
            </p>
            <p className="text-zinc-400">
              Nothing within the App should be interpreted as encouragement or authorization to violate any law, obstruct law enforcement, resist arrest, flee from an officer, evade lawful detention, interfere with an investigation, destroy evidence, provide false information, or harm any person.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              6. CIVIL-RIGHTS AWARENESS DOES NOT AUTHORIZE RESISTANCE
            </h3>
            <p>
              The App may provide information intended to help users understand or recognize potential civil-rights issues during interactions with law enforcement.
            </p>
            <p className="font-semibold text-white">
              Awareness of a potential civil-rights violation does not authorize the user to physically resist, flee, threaten, obstruct, or otherwise interfere with law enforcement.
            </p>
            <p className="text-zinc-400">
              Users should prioritize their immediate physical safety and address suspected violations through appropriate legal procedures following the encounter.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              7. USER'S DECISIONS AND CONDUCT
            </h3>
            <p>
              You acknowledge and agree that you are solely responsible for your own actions, decisions, statements, conduct, and responses during any interaction with law enforcement or any other person or governmental authority.
            </p>
            <p>
              The App does not control your behavior and cannot determine what actions you ultimately take.
            </p>
            <p className="text-zinc-400">
              You expressly agree that you will not rely upon the App, its AI, or any information generated by the App as a basis for engaging in conduct that could result in injury, arrest, criminal charges, civil liability, or other legal consequences.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              8. LIMITATION OF LIABILITY
            </h3>
            <p>
              To the maximum extent permitted by applicable law, the makers, owners, developers, operators, employees, contractors, affiliates, and service providers of the App shall not be responsible or liable for any arrest, detention, search, seizure, citation, criminal charge, prosecution, injury, death, property damage, civil liability, loss, or other consequence arising from or relating to an end user's decisions, actions, omissions, statements, or conduct during or following an interaction with law enforcement.
            </p>
            <p className="text-zinc-400">
              This limitation applies regardless of whether the end user claims that the App, its AI, or information provided through the App instructed, encouraged, influenced, suggested, or contributed to the user's decision or conduct.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              9. NO GUARANTEE OF ACCURACY
            </h3>
            <p>
              The App does not guarantee that any information, legal explanation, AI response, translation, recording, alert, recommendation, or other content will be accurate, complete, current, applicable to the user's jurisdiction, or appropriate to the user's particular circumstances.
            </p>
            <p className="text-zinc-400 font-semibold">
              You acknowledge that you use the App at your own risk.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              10. EMERGENCY SITUATIONS
            </h3>
            <p>
              The App is not a substitute for emergency services, law enforcement, medical professionals, attorneys, or other qualified professionals.
            </p>
            <p className="text-zinc-400">
              In an emergency or situation involving an immediate threat to life or physical safety, users should contact the appropriate emergency service or seek immediate assistance rather than relying solely upon the App or its AI.
            </p>
          </section>

          <section className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-[11px]">
              11. EVIDENCE &amp; COURT ADMISSIBILITY STANDARDS (FRE 901/902)
            </h3>
            <p>
              The App generates contemporaneous digital audiovisual recordings, cryptographic SHA-256 integrity digests, timestamped records, and chain-of-custody logs structured to meet technical foundation requirements under Federal Rules of Evidence 901(b)(9) (process producing accurate result), FRE 902(13) (certified electronic records), and FRE 902(14) (certified digital data).
            </p>
            <p className="text-zinc-400">
              Technical certification verifies cryptographic integrity and tamper-evidence, but does NOT guarantee judicial admissibility. Legal admissibility in any court proceeding is determined by the presiding judge in accordance with applicable state or federal rules of evidence, relevance, judicial discretion, and local court procedures. The App makes no warranty that any recording will be admitted into evidence.
            </p>
          </section>

          <section className="space-y-2 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-100">
            <h3 className="font-black text-amber-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>12. ACKNOWLEDGMENT AND ACCEPTANCE</span>
            </h3>
            <p className="font-bold text-white">
              By selecting “I AGREE”, you acknowledge and confirm that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-zinc-300">
              <li>You have read and understood this Disclaimer.</li>
              <li>You understand that the App provides informational and educational assistance only.</li>
              <li>You understand that AI-generated information may be incorrect, incomplete, or outdated.</li>
              <li>You understand that you are solely responsible for your own decisions and actions.</li>
              <li>You will not use information from the App as justification to resist, flee from, obstruct, or interfere with law enforcement.</li>
              <li>You understand that the App does not guarantee that an arrest or other law-enforcement action will be prevented.</li>
              <li>You understand that the App does not support, promote, or condone illegal activity.</li>
              <li>You understand that cryptographic FRE 902 certification verifies technical data integrity but judicial admissibility remains within the judge's discretion.</li>
              <li>You understand that awareness of your potential legal rights does not authorize you to physically resist or interfere with law enforcement.</li>
              <li>You understand that the App is not a substitute for a qualified attorney or emergency services.</li>
              <li>You accept responsibility for your use of the App and the consequences of your own decisions and actions, subject to rights that cannot legally be waived or limited under applicable law.</li>
            </ul>
          </section>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 uppercase text-center">
            BY SELECTING “I AGREE,” YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND ACCEPTED THIS DISCLAIMER AND AGREE TO BE BOUND BY ITS TERMS TO THE MAXIMUM EXTENT PERMITTED BY LAW.
          </div>
        </div>

        {/* Mandatory Agreement Checkbox & Confirm Button Footer */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-zinc-800 space-y-3 shrink-0">
          <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 cursor-pointer hover:border-amber-400 transition-colors">
            <input
              type="checkbox"
              id="mandatory-disclaimer-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5 rounded text-amber-500 bg-black border-zinc-600 focus:ring-0 cursor-pointer mt-0.5 shrink-0"
            />
            <span className="text-xs font-bold text-white leading-snug">
              I have read, understood, and accept all 11 terms of the End-User Legal Disclaimer and Safety Acknowledgment. I confirm I am solely responsible for my own actions and compliance with lawful orders.
            </span>
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              Mandatory first-time acceptance required prior to entering App
            </span>

            <button
              id="confirm-disclaimer-btn"
              disabled={!isChecked}
              onClick={handleAccept}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isChecked
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>I AGREE &amp; ENTER APPLICATION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
