/**
 * BailVaultService - Manages the Wrongful Accusation & Bail Relief Vault
 * 
 * Tracks the community bail fund, dual 5% pledges, subscriber contributions,
 * and donation goals. Accurately tracks live contributions without dummy/demo data.
 */

export interface BailVaultState {
  totalVaultBalance: number;
  donationCycleGoal: number;
  cycleNumber: number;
  subscriberContributionsCount: number;
  dualPledgeAutoContributions: number;
  totalPoliceCharityPledged: number; // 5% Honest Police Work
  totalBailVaultPledged: number;      // 5% Wrongful Accusation Vault
  investorBondsmenCount: number;
}

const STORAGE_KEY = 'police_safeguard_bail_vault_state';
const LEGACY_STORAGE_KEY = 'police_protection_bail_vault_state';

export class BailVaultService {
  private static defaultState: BailVaultState = {
    totalVaultBalance: 0.00,
    donationCycleGoal: 10000.00,
    cycleNumber: 1,
    subscriberContributionsCount: 0,
    dualPledgeAutoContributions: 0.00,
    totalPoliceCharityPledged: 0.00,
    totalBailVaultPledged: 0.00,
    investorBondsmenCount: 0,
  };

  /**
   * Retrieves the current vault state from localStorage or defaults, resetting legacy demo values
   */
  public static getState(): BailVaultState {
    if (typeof window === 'undefined') return this.defaultState;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If stored contains legacy dummy balance or candidate, purge and reset to accurate numbers
        if (parsed.totalVaultBalance === 4680 || parsed.currentCandidate || parsed.cycleNumber === 3) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return this.defaultState;
        }
        return { ...this.defaultState, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load bail vault state:', e);
    }
    return this.defaultState;
  }

  /**
   * Syncs latest verified vault state from backend server
   */
  public static async syncWithServer(): Promise<BailVaultState> {
    try {
      const res = await fetch('/api/vault/status');
      if (res.ok) {
        const data = await res.json();
        const current = this.getState();
        const updated: BailVaultState = {
          ...current,
          totalVaultBalance: typeof data.totalVaultBalance === 'number' ? data.totalVaultBalance : current.totalVaultBalance,
          donationCycleGoal: typeof data.donationCycleGoal === 'number' ? data.donationCycleGoal : current.donationCycleGoal,
          subscriberContributionsCount: typeof data.subscriberContributionsCount === 'number' ? data.subscriberContributionsCount : current.subscriberContributionsCount,
          cycleNumber: typeof data.cycleNumber === 'number' ? data.cycleNumber : 1
        };
        this.saveState(updated);
        return updated;
      }
    } catch (e) {}
    return this.getState();
  }

  /**
   * Persists vault state to localStorage and optional backend
   */
  private static saveState(state: BailVaultState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  /**
   * Adds an automatic 5% pledge contribution from an app purchase
   */
  public static recordPurchasePledge(purchaseAmountDollars: number): void {
    const pledgeAmount = Math.round(purchaseAmountDollars * 0.05 * 100) / 100;
    const current = this.getState();
    const updated: BailVaultState = {
      ...current,
      totalVaultBalance: Math.round((current.totalVaultBalance + pledgeAmount) * 100) / 100,
      totalBailVaultPledged: Math.round((current.totalBailVaultPledged + pledgeAmount) * 100) / 100,
      totalPoliceCharityPledged: Math.round((current.totalPoliceCharityPledged + pledgeAmount) * 100) / 100,
      dualPledgeAutoContributions: Math.round((current.dualPledgeAutoContributions + pledgeAmount) * 100) / 100,
    };
    this.saveState(updated);
  }

  /**
   * Adds a direct subscriber contribution to the Bail Relief Vault
   */
  public static recordDirectDonation(amountDollars: number, donorAlias?: string): BailVaultState {
    const current = this.getState();
    const updated: BailVaultState = {
      ...current,
      totalVaultBalance: Math.round((current.totalVaultBalance + amountDollars) * 100) / 100,
      subscriberContributionsCount: current.subscriberContributionsCount + 1
    };
    this.saveState(updated);
    return updated;
  }

  /**
   * Generates a personal referral link for social media to promote the Bail Relief Vault
   */
  public static getPromotionalShareUrl(referralCode: string): string {
    const code = referralCode || 'DEFENSE';
    // Generates link directing traffic to the public consumer app with vault focus
    return `https://www.policesafeguard.com/?vault=1&ref=${encodeURIComponent(code)}&signup=1`;
  }

  /**
   * Prepares preformatted social media copy for promoting the Bail Relief Vault
   */
  public static getSocialShareText(referralCode: string): string {
    const link = this.getPromotionalShareUrl(referralCode);
    return `🛡️ Stand up against wrongful arrests! 5% of all purchases on Police SafeGuard goes to the Bail Relief Vault for innocent citizens proven not guilty, alongside 5% supporting honest police work. Support the cause or get covered:\n\n${link}`;
  }
}
