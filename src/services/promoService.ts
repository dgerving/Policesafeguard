/**
 * PromoService - Manages promo code entry and validation.
 * No promo codes or lifetime memberships are advertised in the UI.
 * Valid code: '4MYDAY1S' (case-insensitive) grants full lifetime access.
 * All previous codes have been deactivated.
 */
import { UserProfile } from '../types';

export interface PromoCodeStatus {
  active: boolean;
}

export interface PromoRedeemResult {
  success: boolean;
  message: string;
  error?: string;
  updatedProfile?: UserProfile;
}

const STORAGE_PROMO_REDEEMED_KEY = 'police_protection_user_redeemed_promo';
const VALID_LIFETIME_CODE = '4MYDAY1S';

export class PromoService {
  /**
   * Status check without exposing or advertising any code strings
   */
  public static async getStatus(): Promise<PromoCodeStatus> {
    return { active: true };
  }

  /**
   * Redeems a promo code entered by the user
   */
  public static async redeem(rawCode: string, currentProfile: UserProfile): Promise<PromoRedeemResult> {
    const code = (rawCode || '').trim().toUpperCase();

    if (!code) {
      return {
        success: false,
        error: 'EMPTY_CODE',
        message: 'Please enter a promo code.'
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
          userName: currentProfile.name || 'Protected Citizen'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const updated = this.applyLifetimePro(currentProfile, code);
          return {
            success: true,
            message: data.message || 'Promo code applied successfully! Full access granted.',
            updatedProfile: updated
          };
        } else {
          return {
            success: false,
            error: data.error || 'INVALID_CODE',
            message: data.message || 'Invalid promo code. Please check the code and try again.'
          };
        }
      }
    } catch (e) {
      console.warn('Server promo redeem check failed, checking fallback validator', e);
    }

    // Fallback validation: only 4MYDAY1S is active; all other codes deactivated
    if (code !== VALID_LIFETIME_CODE) {
      return {
        success: false,
        error: 'INVALID_CODE',
        message: 'Invalid promo code. Please check the code and try again.'
      };
    }

    const updated = this.applyLifetimePro(currentProfile, code);
    return {
      success: true,
      message: 'Promo code applied successfully! Full access granted.',
      updatedProfile: updated
    };
  }

  /**
   * Applies full lifetime access benefits to user profile
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
}
