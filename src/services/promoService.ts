/**
 * PromoService - Manages promo codes and lifetime membership redemptions.
 * Features an active promo code for friends & family (e.g. FAMILY5) with a strict
 * 5-use maximum limit that becomes a dead code once exhausted.
 */

import { UserProfile } from '../types';

export interface PromoCodeStatus {
  code: string;
  name: string;
  description: string;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  isDead: boolean;
}

export interface PromoRedeemResult {
  success: boolean;
  message: string;
  error?: string;
  remainingUses?: number;
  updatedProfile?: UserProfile;
}

const STORAGE_PROMO_COUNT_KEY = 'police_protection_promo_family5_uses';
const STORAGE_PROMO_REDEEMED_KEY = 'police_protection_user_redeemed_promo';
const PRIMARY_PROMO_CODE = 'FAMILY5';
const VALID_PROMO_ALIASES = ['FAMILY5', 'VIPFAMILY', 'VIPLIFETIME', 'PROTECT5', 'POLICE5'];
const MAX_PROMO_USES = 5;

export class PromoService {
  public static readonly ACTIVE_CODE = PRIMARY_PROMO_CODE;
  public static readonly MAX_USES = MAX_PROMO_USES;

  /**
   * Fetches the current usage and status of the active promo code
   */
  public static async getStatus(): Promise<PromoCodeStatus> {
    try {
      const res = await fetch('/api/promo/status');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Network promo check failed, using local tracking', e);
    }

    // Local fallback tracking
    const localUses = this.getLocalUsageCount();
    const remaining = Math.max(0, MAX_PROMO_USES - localUses);

    return {
      code: PRIMARY_PROMO_CODE,
      name: 'Friends & Family Lifetime Access',
      description: 'Exclusive 100% free lifetime membership for app launch ambassadors',
      maxUses: MAX_PROMO_USES,
      usedCount: localUses,
      remainingUses: remaining,
      isDead: remaining <= 0
    };
  }

  /**
   * Redeems a promo code for the user
   */
  public static async redeem(rawCode: string, currentProfile: UserProfile): Promise<PromoRedeemResult> {
    const code = rawCode.trim().toUpperCase();

    if (!code) {
      return {
        success: false,
        error: 'EMPTY_CODE',
        message: 'Please enter a promo code.'
      };
    }

    // Check if user already redeemed a lifetime promo code on this device
    const alreadyRedeemed = localStorage.getItem(STORAGE_PROMO_REDEEMED_KEY);
    if (alreadyRedeemed === code && currentProfile.membershipTier === 'lifetime_pro') {
      return {
        success: true,
        message: 'You already have Lifetime Pro Membership unlocked!',
        updatedProfile: currentProfile
      };
    }

    // Try server API redemption first
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          userEmail: currentProfile.email || 'user@policesafeguard.com',
          userName: currentProfile.name || 'Civilian Defender'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const updated = this.applyLifetimePro(currentProfile, code);
          return {
            success: true,
            message: data.message || `Code '${code}' activated! Lifetime Pro Membership granted.`,
            remainingUses: data.remainingUses,
            updatedProfile: updated
          };
        } else {
          return {
            success: false,
            error: data.error,
            message: data.message || 'Promo code could not be redeemed.'
          };
        }
      }
    } catch (e) {
      console.warn('Server promo redeem failed, using offline validator', e);
    }

    // Offline / Client-Side Fallback Validation
    const isRecognized = VALID_PROMO_ALIASES.includes(code);
    if (!isRecognized) {
      return {
        success: false,
        error: 'INVALID_CODE',
        message: `Invalid code '${code}'. Please verify the spelling.`
      };
    }

    const currentUses = this.getLocalUsageCount();
    if (currentUses >= MAX_PROMO_USES) {
      return {
        success: false,
        error: 'DEAD_CODE',
        message: `This promo code '${code}' has reached its maximum limit of 5 uses and is now a dead code.`
      };
    }

    // Increment and save usage
    const newCount = currentUses + 1;
    this.setLocalUsageCount(newCount);
    const updated = this.applyLifetimePro(currentProfile, code);

    return {
      success: true,
      message: `Congratulations! Code '${code}' redeemed. Lifetime Pro Membership is now active forever!`,
      remainingUses: Math.max(0, MAX_PROMO_USES - newCount),
      updatedProfile: updated
    };
  }

  /**
   * Applies Lifetime Pro benefits to the user profile
   */
  private static applyLifetimePro(current: UserProfile, code: string): UserProfile {
    const updated: UserProfile = {
      ...current,
      membershipTier: 'lifetime_pro',
      billingCycle: 'lifetime',
      credits: 9999,
      isLifetimeMember: true,
      promoCodeUsed: code
    };

    try {
      localStorage.setItem(STORAGE_PROMO_REDEEMED_KEY, code);
      localStorage.setItem('police_safeguard_profile', JSON.stringify(updated));
      localStorage.setItem('police_safeguard_membership_tier', 'lifetime_pro');
      localStorage.removeItem('civicshield_profile');
      localStorage.removeItem('civicshield_membership_tier');
    } catch (e) {}

    return updated;
  }

  private static getLocalUsageCount(): number {
    try {
      const val = localStorage.getItem(STORAGE_PROMO_COUNT_KEY);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  }

  private static setLocalUsageCount(count: number): void {
    try {
      localStorage.setItem(STORAGE_PROMO_COUNT_KEY, count.toString());
    } catch (e) {}
  }
}
