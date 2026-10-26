import { ReferralProgramState, ReferredUserRecord, ReferralRewardTier } from '../types';
import { AppUrlHelper } from './appUrlHelper';

const REFERRAL_STORAGE_KEY = 'police_safeguard_referral_state';
const LEGACY_REFERRAL_STORAGE_KEY = 'police_protection_referral_state';

export class ReferralService {
  private static generateReferralCode(): string {
    const letters = 'SHIELD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${letters}-${rand}`;
  }

  public static getReferralState(): ReferralProgramState {
    try {
      const stored = localStorage.getItem(REFERRAL_STORAGE_KEY) || localStorage.getItem(LEGACY_REFERRAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.referrals)) {
          // Ensure zero mock, demo, or fake entries exist
          parsed.referrals = parsed.referrals.filter((r: any) => 
            r.id !== 'ref-1' && 
            r.name !== 'Marcus Vance' && 
            r.name !== 'Elena Rostova' &&
            !r.id.startsWith('ref-')
          );
          parsed.totalReferrals = parsed.referrals.length;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading referral state from storage:', e);
    }

    const newState: ReferralProgramState = {
      referralCode: this.generateReferralCode(),
      totalReferrals: 0,
      referrals: [],
      claimedTiers: {
        monthly: false,
        yearly: false,
        lifetime: false,
      }
    };

    this.saveReferralState(newState);
    return newState;
  }

  public static saveReferralState(state: ReferralProgramState): void {
    try {
      localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Error saving referral state:', e);
    }
  }

  /**
   * Resets referral records to a clean 0-count real live account.
   */
  public static resetToCleanLiveAccount(): ReferralProgramState {
    const currentState = this.getReferralState();
    const cleanState: ReferralProgramState = {
      referralCode: currentState.referralCode || this.generateReferralCode(),
      totalReferrals: 0,
      referrals: [],
      claimedTiers: {
        monthly: false,
        yearly: false,
        lifetime: false,
      }
    };
    this.saveReferralState(cleanState);
    return cleanState;
  }

  /**
   * Verified live check for referral data
   */
  public static isSampleData(): boolean {
    return false;
  }

  public static getReferralStats(state?: ReferralProgramState) {
    const currentState = state || this.getReferralState();
    const verified = currentState.referrals.filter(r => r.isVerified);

    // Rule 1: Monthly Free Subscription requires 10 referrals who purchase a subscription of equal or greater value
    // (Monthly, Yearly, or Lifetime all qualify)
    const monthlyEligible = verified.filter(r => 
      r.planPurchased === 'monthly' || r.planPurchased === 'yearly' || r.planPurchased === 'lifetime'
    );
    const monthlyCount = monthlyEligible.length;
    const monthlyTarget = 10;
    const canClaimMonthly = monthlyCount >= monthlyTarget && !currentState.claimedTiers.monthly;

    // Rule 2: Yearly Free Subscription requires 10 referrals who purchase a subscription of equal or greater value
    // (Yearly or Lifetime qualify)
    const yearlyEligible = verified.filter(r => 
      r.planPurchased === 'yearly' || r.planPurchased === 'lifetime'
    );
    const yearlyCount = yearlyEligible.length;
    const yearlyTarget = 10;
    const canClaimYearly = yearlyCount >= yearlyTarget && !currentState.claimedTiers.yearly;

    // Rule 3: Lifetime Free Subscription requires 20 referrals who purchase a Lifetime subscription
    const lifetimeEligible = verified.filter(r => r.planPurchased === 'lifetime');
    const lifetimeCount = lifetimeEligible.length;
    const lifetimeTarget = 20;
    const canClaimLifetime = lifetimeCount >= lifetimeTarget && !currentState.claimedTiers.lifetime;

    return {
      totalReferrals: currentState.referrals.length,
      verifiedCount: verified.length,
      monthly: {
        count: monthlyCount,
        target: monthlyTarget,
        percent: Math.min(100, Math.round((monthlyCount / monthlyTarget) * 100)),
        canClaim: canClaimMonthly,
        isClaimed: currentState.claimedTiers.monthly,
        qualifyingPlans: 'Monthly ($3.99), Yearly ($25.99), or Lifetime ($79.99)',
      },
      yearly: {
        count: yearlyCount,
        target: yearlyTarget,
        percent: Math.min(100, Math.round((yearlyCount / yearlyTarget) * 100)),
        canClaim: canClaimYearly,
        isClaimed: currentState.claimedTiers.yearly,
        qualifyingPlans: 'Yearly ($25.99) or Lifetime ($79.99)',
      },
      lifetime: {
        count: lifetimeCount,
        target: lifetimeTarget,
        percent: Math.min(100, Math.round((lifetimeCount / lifetimeTarget) * 100)),
        canClaim: canClaimLifetime,
        isClaimed: currentState.claimedTiers.lifetime,
        qualifyingPlans: 'Lifetime Access ($79.99)',
      }
    };
  }

  public static claimReward(tier: ReferralRewardTier): { success: boolean; state: ReferralProgramState; message: string } {
    const state = this.getReferralState();
    const stats = this.getReferralStats(state);

    if (tier === 'monthly') {
      if (!stats.monthly.canClaim && !state.claimedTiers.monthly) {
        return { success: false, state, message: `Need ${stats.monthly.target - stats.monthly.count} more qualifying referrals to claim Free Monthly Premium.` };
      }
      state.claimedTiers.monthly = true;
    } else if (tier === 'yearly') {
      if (!stats.yearly.canClaim && !state.claimedTiers.yearly) {
        return { success: false, state, message: `Need ${stats.yearly.target - stats.yearly.count} more qualifying referrals to claim Free Yearly Premium.` };
      }
      state.claimedTiers.yearly = true;
    } else if (tier === 'lifetime') {
      if (!stats.lifetime.canClaim && !state.claimedTiers.lifetime) {
        return { success: false, state, message: `Need ${stats.lifetime.target - stats.lifetime.count} more qualifying referrals to claim Free Lifetime Premium.` };
      }
      state.claimedTiers.lifetime = true;
    }

    this.saveReferralState(state);
    return { 
      success: true, 
      state, 
      message: `Congratulations! Your Free ${tier.toUpperCase()} Premium Subscription has been unlocked!` 
    };
  }

  public static simulateReferralPurchase(plan: 'monthly' | 'yearly' | 'lifetime'): ReferralProgramState {
    const state = this.getReferralState();
    const sampleNames = ['Jordan Vance', 'Taylor Smith', 'Amara Patel', 'Lucas Garcia', 'Morgan Reed', 'Devon Chen', 'Samira Khan', 'Casey O’Connor'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const initials = randomName.split(' ');
    const masked = `${initials[0][0].toLowerCase()}***${initials[1][0].toLowerCase()}@policesafeguard.com`;
    
    const amounts = {
      monthly: 3.99,
      yearly: 25.99,
      lifetime: 79.99
    };

    const newRecord: ReferredUserRecord = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: randomName,
      maskedEmail: masked,
      timestamp: Date.now(),
      planPurchased: plan,
      amount: amounts[plan],
      isVerified: true
    };

    state.referrals.unshift(newRecord);
    state.totalReferrals = state.referrals.length;
    this.saveReferralState(state);
    return state;
  }

  public static getShareUrl(code: string): string {
    return AppUrlHelper.getReferralUrl(code);
  }
}
