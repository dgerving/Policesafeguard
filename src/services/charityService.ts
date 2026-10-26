import { CharityImpactData, CharityPartner } from '../types';

export const VETTED_LAW_ENFORCEMENT_CHARITIES: CharityPartner[] = [
  {
    id: 'cops',
    name: 'Concerns of Police Survivors (C.O.P.S.)',
    tagline: 'Rebuilding the lives of surviving families of fallen officers',
    category: 'fallen_officers',
    description: 'Providing comprehensive resources, psychological counseling, and education scholarships to families and affected co-workers of officers killed in the line of duty across all 50 states.',
    website: 'https://www.concernsofpolicesurvivors.org',
    taxExemptStatus: '501(c)(3) Non-Profit Organization',
    allocationPercentage: 40
  },
  {
    id: 'nleomf',
    name: 'National Law Enforcement Officers Memorial Fund',
    tagline: 'Honoring fallen heroes & advancing officer wellness',
    category: 'community_policing',
    description: 'Dedicated to honoring the service and sacrifice of America\'s law enforcement officers, maintaining the national memorial, and operating national officer safety and wellness initiatives.',
    website: 'https://nleomf.org',
    taxExemptStatus: '501(c)(3) Non-Profit Organization',
    allocationPercentage: 30
  },
  {
    id: 'national-pal',
    name: 'National Police Athletic / Activity Leagues (PAL)',
    tagline: 'Bridging communities and youth through positive police mentorship',
    category: 'youth_outreach',
    description: 'Empowering children and youth through educational, athletic, and cultural activities led by mentor police officers, fostering mutual trust and reducing juvenile delinquency.',
    website: 'https://www.nationalpal.org',
    taxExemptStatus: '501(c)(3) Non-Profit Organization',
    allocationPercentage: 15
  },
  {
    id: 'badge-of-life',
    name: 'Badge of Life / First Responder Suicide Prevention',
    tagline: 'Mental health resilience and trauma counseling for officers',
    category: 'mental_wellness',
    description: 'Developing operational stress management, suicide prevention protocols, and confidential psychological support for active law enforcement officers coping with cumulative occupational trauma.',
    website: 'https://badgeoflife.org',
    taxExemptStatus: '501(c)(3) Non-Profit Organization',
    allocationPercentage: 15
  }
];

export class CharityService {
  public static readonly CHARITY_PERCENTAGE = 5; // 5% of every purchase

  public static readonly MISSION_STATEMENT = 
    "While Police SafeGuard is specifically engineered to protect citizens from civil rights violations and help eliminate unfair, unjust, or dishonest practices used by less-than-honest police officials, the developers and subscribers of this app firmly support legitimate law enforcement and honest police officers. Exactly 5% of every subscription and defense credit purchase is structured as a dedicated donation to reputable law enforcement charities supporting fallen officer families, youth outreach, and officer mental wellness.";

  /**
   * Calculates the exact dollar amount of the 5% donation for a given price
   */
  public static calculateDonation(price: number): number {
    return Math.round(price * 0.05 * 100) / 100;
  }

  /**
   * Returns a friendly breakdown string for a subscription tier & billing cycle
   */
  public static getDonationBadgeText(price: number): string {
    const donation = this.calculateDonation(price);
    return `Includes $${donation.toFixed(2)} (5%) donated to honest officer & fallen police charities`;
  }

  /**
   * Fetches latest cumulative charity impact data from the backend
   */
  public static async fetchImpactData(): Promise<CharityImpactData> {
    try {
      const res = await fetch('/api/charity/impact');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend charity impact fetch failed, using local model:', e);
    }

    // Default fallback impact data
    return {
      charityPercentage: 5,
      totalDonatedDollars: 0.00,
      totalTransactionsCount: 0,
      missionStatement: this.MISSION_STATEMENT,
      partners: VETTED_LAW_ENFORCEMENT_CHARITIES,
      recentPledges: []
    };
  }
}
