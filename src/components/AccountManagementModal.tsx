import React, { useState } from 'react';
import { 
  X, Trash2, ShieldAlert, CreditCard, UserX, Download, 
  AlertTriangle, CheckCircle, RefreshCw, FileText, Lock, 
  HelpCircle, ChevronRight, ArrowRight, Ban, EyeOff
} from 'lucide-react';
import { UserProfile, EvidenceCustodyRecord } from '../types';
import { AccountDeletionService } from '../services/accountDeletionService';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
  onAccountDeleted: () => void;
  evidenceRecords?: EvidenceCustodyRecord[];
  initialTab?: 'unsubscribe' | 'purge_personal' | 'delete_account';
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  onAccountDeleted,
  evidenceRecords = [],
  initialTab = 'unsubscribe'
}) => {
  const [activeTab, setActiveTab] = useState<'unsubscribe' | 'purge_personal' | 'delete_account'>(() => {
    if (userProfile.membershipTier !== 'free') return 'unsubscribe';
    return initialTab;
  });

  const [unsubscribeReason, setUnsubscribeReason] = useState('cost');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account confirmation
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [purgeEvidenceVault, setPurgeEvidenceVault] = useState(true);
  const [hasExportedData, setHasExportedData] = useState(false);

  if (!isOpen) return null;

  const isPaid = userProfile.membershipTier !== 'free';

  const planName = 
    userProfile.membershipTier === 'all_encounters_pro'
      ? 'All-Encounters Universal Defense Pro'
      : userProfile.membershipTier === 'lifetime_pro'
      ? 'Lifetime Pass Pro'
      : 'Free Citizen Tier';

  // Handle Unsubscribe / Cancel Subscription
  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const reason = unsubscribeReason === 'other' ? otherReasonText : unsubscribeReason;
      const res = await AccountDeletionService.cancelSubscription(userProfile, reason);
      onProfileUpdated(res.updatedProfile);
      setStatusMessage({
        type: 'success',
        text: '✅ Subscription cancelled successfully. Auto-renewal has been terminated and your account downgraded to Free Citizen.'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to cancel subscription. Please check your network connection.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Purge Personal Profile Data
  const handlePurgePersonalInfo = () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const cleaned = AccountDeletionService.purgePersonalProfileData(userProfile);
      onProfileUpdated(cleaned);
      setStatusMessage({
        type: 'success',
        text: '✅ Personal profile information (vehicle, address, emergency contacts, voice biometrics) has been permanently cleared.'
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to purge personal information.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Complete Account Deletion
  const handleDeleteEntireAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      setStatusMessage({
        type: 'error',
        text: 'Please type "DELETE" into the box to confirm permanent account deletion.'
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      await AccountDeletionService.deleteEntireAccount(userProfile, purgeEvidenceVault);
      setStatusMessage({
        type: 'success',
        text: '✅ Account and all associated personal data have been completely purged from the system.'
      });
      setTimeout(() => {
        onAccountDeleted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to delete account. Please try again.'
      });
      setIsProcessing(false);
    }
  };

  // Handle Data Export before deletion
  const handleExportData = () => {
    AccountDeletionService.exportUserData(userProfile, evidenceRecords);
    setHasExportedData(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-700/60 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Account &amp; Data Privacy Center</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Manage subscriptions, purge personal profile data, or request permanent account deletion.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 p-1.5 gap-1.5 overflow-x-auto">
          {isPaid && (
            <button
              onClick={() => {
                setActiveTab('unsubscribe');
                setStatusMessage(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'unsubscribe'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>Cancel Subscription</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('purge_personal');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'purge_personal'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-blue-400" />
            <span>Purge Personal Data</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('delete_account');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'delete_account'
                ? 'bg-red-950/70 text-red-300 border border-red-600/70'
                : 'text-zinc-400 hover:text-red-300 hover:bg-zinc-800/60'
            }`}
          >
            <UserX className="w-3.5 h-3.5 text-red-400" />
            <span>Delete Entire Account</span>
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-3 text-xs flex items-center gap-2.5 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
                : 'bg-red-950/90 text-red-200 border-red-700/60'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[65vh]">
          
          {/* TAB 1: UNSUBSCRIBE / CANCEL SUBSCRIPTION */}
          {activeTab === 'unsubscribe' && (
            <div className="space-y-4">
              {/* Active Plan Banner */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                    Current Active Membership
                  </div>
                  <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>{planName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono uppercase">
                      Active ({userProfile.billingCycle || 'Monthly'})
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Auto-renewing billing plan via Stripe Secure.
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs font-mono text-zinc-300 font-bold">
                    {userProfile.billingCycle === 'yearly' ? '$49.99 / year' : '$14.99 / month'}
                  </div>
                  <div className="text-[10px] text-zinc-500">Auto-Renews until cancelled</div>
                </div>
              </div>

              {/* What Happens When You Cancel */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>What happens when you cancel your subscription:</span>
                </div>
                <ul className="space-y-1.5 text-zinc-300 pl-6 list-disc text-[11px] leading-relaxed">
                  <li>
                    <strong>Immediate Stop to Auto-Renewal:</strong> No future subscription charges will occur on your card.
                  </li>
                  <li>
                    <strong>Free Citizen Tier Retained:</strong> You retain complete lifetime access to real-time constitutional rights guidance, basic encounter audio recording, and your existing saved Evidence Vault records.
                  </li>
                  <li>
                    <strong>Live Multi-Contact SMS Relay Gated:</strong> Automatic broadcast to up to 5 emergency witnesses will downgrade to 1 emergency contact under the Free tier.
                  </li>
                </ul>
              </div>

              {/* Reason for Cancelling */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  Please let us know why you are cancelling (optional):
                </label>
                <select
                  value={unsubscribeReason}
                  onChange={(e) => setUnsubscribeReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 text-xs rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="cost">Too expensive / Budget constraint</option>
                  <option value="not_needed">Do not drive frequently / Rarely encounter law enforcement</option>
                  <option value="sold_car">Sold vehicle or switched commute method</option>
                  <option value="features">Desired feature was not available</option>
                  <option value="temporary">Temporary pause, plan to resubscribe later</option>
                  <option value="other">Other reason</option>
                </select>

                {unsubscribeReason === 'other' && (
                  <textarea
                    rows={2}
                    value={otherReasonText}
                    onChange={(e) => setOtherReasonText(e.target.value)}
                    placeholder="Briefly describe why you are cancelling..."
                    className="w-full bg-zinc-950 border border-zinc-700 text-xs rounded-xl p-2.5 text-zinc-200 focus:outline-none focus:border-amber-500 mt-2"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Keep My Subscription
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelSubscription}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Cancellation...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Confirm Cancellation &amp; Unsubscribe</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PURGE PERSONAL INFORMATION ONLY */}
          {activeTab === 'purge_personal' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
                <div className="font-bold text-blue-300 flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-blue-400" />
                  <span>Right to Privacy: Wipe Stored Personal Identifiers</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Use this feature if you wish to wipe private identifying details from your device while keeping your account and legal Evidence Vault records active.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-white text-xs uppercase tracking-wider">
                  The following personal information will be permanently deleted:
                </div>
                <ul className="space-y-1.5 text-zinc-400 text-[11px] pl-4 list-disc">
                  <li>
                    <strong>Vehicle Identifiers:</strong> Make, Model, License Plate Number ({userProfile.vehicleLicensePlate || 'None recorded'}), and Vehicle Color.
                  </li>
                  <li>
                    <strong>Emergency Contacts:</strong> All secondary and primary witness contacts ({userProfile.emergencyContacts?.length || (userProfile.emergencyContactName ? 1 : 0)} contacts stored).
                  </li>
                  <li>
                    <strong>Medical &amp; Hearing Notes:</strong> Any recorded health disclosures or deaf/hard of hearing flags.
                  </li>
                  <li>
                    <strong>Voice Biometrics:</strong> Recorded audio voice calibration samples and frequency print data.
                  </li>
                  <li>
                    <strong>Security PIN:</strong> Reset back to default lock pin (7482).
                  </li>
                </ul>
                <div className="pt-2 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5 border-t border-zinc-900">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Your account credentials and saved incident evidence logs will NOT be deleted.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePurgePersonalInfo}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Purging Personal Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Stored Personal Information</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PERMANENTLY DELETE ACCOUNT & WIPE ALL DATA */}
          {activeTab === 'delete_account' && (
            <div className="space-y-4">
              {/* Danger Warning Banner */}
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-700/80 text-xs space-y-2">
                <div className="font-bold text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Permanent Account Deletion (Irreversible Action)</span>
                </div>
                <p className="text-red-300/90 text-[11px] leading-relaxed">
                  Under GDPR and CCPA compliance standards, this will permanently terminate your Citizen Account, cancel all active subscriptions, wipe all stored profile details, and purge your biometric recordings. This action cannot be undone.
                </p>
              </div>

              {/* Step 1: Export Data Option */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download Certified Data Export (.JSON)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Recommended: Save an encrypted copy of your legal certificates, profile, and incident logs before permanent deletion.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 shrink-0 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{hasExportedData ? 'Exported (Download Again)' : 'Download Export'}</span>
                </button>
              </div>

              {/* Step 2: Evidence Vault Purge Checkbox */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purgeEvidenceVault}
                    onChange={(e) => setPurgeEvidenceVault(e.target.checked)}
                    className="mt-0.5 rounded bg-zinc-900 border-zinc-700 text-red-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-white">
                      Also permanently delete Court Evidence Vault recordings &amp; legal logs ({evidenceRecords.length} records)
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      If checked, all Federal Rule of Evidence 902(14) chain-of-custody certificates, audio recordings, and police speech transcripts will be wiped forever.
                    </p>
                  </div>
                </label>
              </div>

              {/* Step 3: Type "DELETE" to confirm */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  To confirm permanent deletion, type <span className="font-mono text-red-400 font-black">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full bg-zinc-950 border border-red-700/60 font-mono text-sm rounded-xl p-2.5 text-red-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 uppercase tracking-widest"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel &amp; Keep Account
                </button>
                <button
                  type="button"
                  disabled={isProcessing || deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                  onClick={handleDeleteEntireAccount}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Account &amp; Wiping Data...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete Account &amp; Wipe Data</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Info */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500">
          <span>GDPR Art. 17 &amp; CCPA Right-To-Be-Forgotten Compliance Standards</span>
          <button
            onClick={onClose}
            className="hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
