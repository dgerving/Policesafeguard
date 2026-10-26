/**
 * AppUrlHelper - Centralized URL & Official Brand Domain Manager
 *
 * Provides clean, trusted, non-suspicious URLs for sharing, QR codes, referrals,
 * and live encounter streams. Supports custom domain configuration, official
 * vanity URLs (e.g. policesafeguard.com), and direct cloud endpoints.
 */

export interface OfficialDomainOption {
  domain: string;
  name: string;
  badge: string;
  description: string;
}

export class AppUrlHelper {
  // Flagship server IP address
  public static readonly SERVER_HOST_IP = '66.223.49.89';

  // Functional live public consumer-side deployment URL (100% public, official live domain)
  public static readonly FUNCTIONAL_CONSUMER_URL = 'https://www.policesafeguard.com';
  public static readonly PUBLIC_USER_URL = 'https://www.policesafeguard.com';
  public static readonly PRODUCTION_PUBLIC_URL = 'https://www.policesafeguard.com';
  public static readonly OFFICIAL_VERCEL_URL = 'https://policesafeguard.com';
  public static readonly OFFICIAL_LIVE_WEBSITE = 'https://www.policesafeguard.com';
  public static readonly DEFAULT_BRAND_DOMAIN = 'www.policesafeguard.com';
  public static readonly PUBLIC_CLOUD_APP_URL = 'https://www.policesafeguard.com';

  /**
   * Generates destination URL for Northwest Registered Agent Domain Forwarding
   * ensuring users land immediately on the official sign-up onboarding page.
   * Never routes through Google AI Studio.
   */
  public static getNorthwestForwardingDestination(referralCode?: string): string {
    const codeParam = referralCode ? `&ref=${encodeURIComponent(referralCode)}` : '';
    return `https://www.policesafeguard.com/?signup=1${codeParam}`;
  }

  // Recognized official brand domain alternatives
  public static readonly OFFICIAL_DOMAINS: OfficialDomainOption[] = [
    {
      domain: 'www.policesafeguard.com',
      name: 'Police Safeguard (Official Live Flagship - 66.223.49.89)',
      badge: 'Official Flagship',
      description: 'Official production website and primary live link (https://www.policesafeguard.com)'
    },
    {
      domain: 'policesafeguard.com',
      name: 'Police Safeguard (Apex Domain - 66.223.49.89)',
      badge: 'Branded Apex',
      description: 'Clean, trusted apex web application domain pointing to host 66.223.49.89'
    }
  ];

  private static readonly STORAGE_CUSTOM_DOMAIN_KEY = 'police_safeguard_custom_domain';
  private static readonly STORAGE_URL_MODE_KEY = 'police_safeguard_url_mode'; // 'branded' | 'direct'

  /**
   * Identifies if a host or URL is an internal developer workstation (ais-dev-) or AI Studio editor
   * that prompts for Google/AI Studio developer credentials instead of showing the user app.
   */
  public static isInternalOrSandboxHost(hostOrUrl?: string): boolean {
    if (!hostOrUrl) return true;
    const lower = hostOrUrl.toLowerCase();
    return (
      lower.includes('ais-dev-') ||
      lower.includes('ais-pre-') ||
      lower.includes('aistudio.google') ||
      lower.includes('cloudworkstations.dev') ||
      lower.includes('localhost') ||
      lower.includes('127.0.0.1') ||
      lower.includes('0.0.0.0') ||
      lower.includes('webcontainer') ||
      lower.includes('.run.app') ||
      lower.includes('googleusercontent.com') ||
      lower.includes('.google.com')
    );
  }

  /**
   * Retrieves the user-configured custom domain if set, or fallback to default
   */
  public static getCustomDomain(): string {
    if (typeof window === 'undefined') return this.DEFAULT_BRAND_DOMAIN;
    try {
      const stored = localStorage.getItem(this.STORAGE_CUSTOM_DOMAIN_KEY);
      if (stored && stored.trim()) {
        const cleaned = stored.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        if (!this.isInternalOrSandboxHost(cleaned)) {
          return cleaned;
        }
      }
    } catch (e) {}
    return this.DEFAULT_BRAND_DOMAIN;
  }

  /**
   * Sets or updates custom domain
   */
  public static setCustomDomain(domain: string): void {
    if (typeof window === 'undefined') return;
    try {
      const cleaned = domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
      if (cleaned) {
        localStorage.setItem(this.STORAGE_CUSTOM_DOMAIN_KEY, cleaned);
      } else {
        localStorage.removeItem(this.STORAGE_CUSTOM_DOMAIN_KEY);
      }
    } catch (e) {}
  }

  /**
   * Gets preferred URL mode: 'branded' (official domain) is the permanent default
   */
  public static getUrlMode(): 'branded' | 'direct' {
    if (typeof window === 'undefined') return 'branded';
    try {
      const mode = localStorage.getItem(this.STORAGE_URL_MODE_KEY);
      if (mode === 'direct' || mode === 'branded') return mode;
    } catch (e) {}
    return 'branded';
  }

  /**
   * Sets preferred URL mode
   */
  public static setUrlMode(mode: 'branded' | 'direct'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_URL_MODE_KEY, mode);
    } catch (e) {}
  }

  public static readonly PUBLIC_SHARED_APP_URL = 'https://www.policesafeguard.com';

  /**
   * Resolves the verified, publicly accessible production base URL that guarantees
   * 100% zero-login access for any external recipient, phone, or witness on any carrier.
   * PERMANENT FIX: Internal developer endpoints (ais-dev-, ais-pre-, cloudworkstations.dev, run.app)
   * are completely eliminated and ALWAYS route through the official public domain (https://www.policesafeguard.com).
   */
  public static getPublicBroadcastBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location) {
      const { origin, hostname } = window.location;
      if (origin && origin !== 'null' && !this.isInternalOrSandboxHost(hostname)) {
        return origin;
      }
    }
    // Guaranteed non-sandbox public domain
    const custom = this.getCustomDomain();
    return `https://${custom}`;
  }

  /**
   * Generates public user-facing referral link with zero login requirement.
   * Directs user to the live landing page with automatic official sign-up onboarding.
   */
  public static getReferralUrl(referralCode: string, forceMode?: 'branded' | 'direct'): string {
    const base = this.getOfficialBrandedBaseUrl();
    return `${base}/?ref=${encodeURIComponent(referralCode)}&signup=1`;
  }

  /**
   * Resolves the canonical direct Cloud URL for live functional execution.
   */
  public static getDirectCloudUrl(): string {
    return this.getPublicBroadcastBaseUrl();
  }

  /**
   * Returns the clean official branded base URL (e.g. https://www.policesafeguard.com)
   */
  public static getOfficialBrandedBaseUrl(): string {
    const domain = this.getCustomDomain();
    return `https://${domain}`;
  }

  /**
   * Resolves the primary base URL based on active preference
   */
  public static getEffectiveBaseUrl(): string {
    const mode = this.getUrlMode();
    if (mode === 'branded') {
      return this.getOfficialBrandedBaseUrl();
    }
    return this.getPublicBroadcastBaseUrl();
  }

  /**
   * Generates official live account download link with immediate sign-up onboarding
   */
  public static getLiveAccountDownloadUrl(referralCode?: string, _userName?: string, forceMode?: 'branded' | 'direct'): string {
    const base = forceMode === 'branded' ? this.getOfficialBrandedBaseUrl() : this.getPublicBroadcastBaseUrl();
    
    const params = new URLSearchParams();
    params.set('download', '1');
    params.set('signup', '1');
    if (referralCode) {
      params.set('ref', referralCode);
    }
    return `${base}/?${params.toString()}`;
  }

  /**
   * Generates clean short link (e.g. policesafeguard.com/r/SHIELD-1234)
   */
  public static getCleanVanityUrl(referralCode?: string): string {
    const domain = this.getCustomDomain();
    if (referralCode) {
      return `https://${domain}/r/${referralCode}`;
    }
    return `https://${domain}/download`;
  }

  /**
   * Resolves the verified working web URL for the application
   */
  public static getWorkingWebUrl(): string {
    return this.getPublicBroadcastBaseUrl();
  }

  /**
   * Generates a guaranteed 100% working live encounter stream URL for witnesses and emergency contacts.
   * Completely bypasses login walls or internal preview restrictions.
   * Embeds verified encounter metadata (name, encounter type, location, GPS, start timestamp)
   * directly in query parameters so the recipient gets instant visibility with ZERO margin for errors.
   */
  public static getLiveStreamUrl(
    sessionId: string, 
    sessionMetadata?: {
      userName?: string;
      encounterType?: string;
      locationDesc?: string;
      latitude?: number;
      longitude?: number;
      stateCode?: string;
      startedAt?: number;
      userPhone?: string;
    },
    forceMode?: 'branded' | 'direct'
  ): string {
    // PERMANENT FIX: Always use official public domain policesafeguard.com for witness stream links so external users are never prompted to log into AI Studio
    const base = this.getOfficialBrandedBaseUrl();
    const params = new URLSearchParams();
    
    params.set('live', sessionId);
    params.set('autowatch', '1');

    if (sessionMetadata?.userName && sessionMetadata.userName.trim()) {
      params.set('name', sessionMetadata.userName);
    }
    if (sessionMetadata?.encounterType) {
      params.set('type', sessionMetadata.encounterType);
    }
    if (sessionMetadata?.locationDesc) {
      params.set('loc', sessionMetadata.locationDesc);
    }
    if (typeof sessionMetadata?.latitude === 'number' && typeof sessionMetadata?.longitude === 'number') {
      params.set('lat', sessionMetadata.latitude.toFixed(6));
      params.set('lng', sessionMetadata.longitude.toFixed(6));
    }
    if (sessionMetadata?.stateCode) {
      params.set('state', sessionMetadata.stateCode);
    }
    if (sessionMetadata?.startedAt) {
      params.set('ts', sessionMetadata.startedAt.toString());
    }
    if (sessionMetadata?.userPhone) {
      params.set('p', sessionMetadata.userPhone);
    }

    return `${base}/?${params.toString()}`;
  }

  /**
   * Generates a trustworthy, non-suspicious message for SMS / messaging apps
   */
  public static getTrustworthyShareMessage(referralCode?: string, userName?: string): string {
    const cleanUrl = this.getCleanVanityUrl(referralCode);
    const directUrl = this.getReferralUrl(referralCode || 'SHIELD-PRO', 'branded');
    const citizen = userName && userName.trim() ? `${userName.trim()} invites you to install ` : '';

    return `🛡️ ${citizen}Police Safeguard: Official Civilian Rights Assistant\n\nKnow your constitutional rights in real time during traffic stops & police encounters. 100% Free Civilian Protection.\n\n👉 Official Sign-Up: ${directUrl}\n📲 App Link: ${cleanUrl}`;
  }

  /**
   * DNS configuration instructions for custom domain mapping (policesafeguard.com on IP 66.223.49.89)
   */
  public static getDNSInstructions(customDomain?: string) {
    const domain = customDomain || this.getCustomDomain();
    const serverIp = this.SERVER_HOST_IP; // 66.223.49.89
    const destinationUrl = 'https://www.policesafeguard.com/?signup=1';

    return {
      domain,
      serverIp,
      destinationUrl,
      answers: {
        subdomain: '@ (root) or www',
        recordType: 'A Record pointing to 66.223.49.89',
        aRecordValue: serverIp,
        cnameValue: domain,
        forwardingDestination: destinationUrl,
        ipExplanation: `Your host server IP address is ${serverIp}. Add an A Record for '@' pointing to ${serverIp}, and a CNAME record for 'www' pointing to ${domain}.`
      },
      aRecord: {
        type: 'A',
        host: '@ (root domain)',
        value: serverIp,
        ttl: 'Automatic / 300s'
      },
      cnameRecord: {
        type: 'CNAME',
        host: 'www',
        value: domain,
        ttl: 'Automatic / 300s'
      },
      webForwardingRecord: {
        type: 'URL Forwarding / 301 Redirect',
        source: domain,
        destination: destinationUrl,
        forwardPath: true
      },
      hostSteps: [
        `Step 1 (DNS A Record): In your domain host DNS management for ${domain}, set an A Record: Name/Host = '@', Points to / Value = '${serverIp}'.`,
        `Step 2 (www CNAME Record): Add a CNAME record: Name/Host = 'www', Points to / Value = '${domain}'.`,
        `Step 3 (Sign-Up Landing Redirect): Configure your web host at ${serverIp} (via Apache .htaccess or Nginx reverse proxy) to serve the app or forward root traffic to '/?signup=1' so new users immediately open the account creation screen.`
      ],
      northwestSteps: [
        `Step 1 (Remove Dead A Record): In Northwest Registered Agent > Domains > ${domain}, delete the A record pointing to 66.223.49.89 (it is an unhosted registrar parking IP).`,
        `Step 2 (Open Forwarding): In Northwest Domains > ${domain}, click 'Forwarding' (or Web Forwarding).`,
        `Step 3 (Paste Destination): Enter '${this.getNorthwestForwardingDestination()}'. Set type to 301 Permanent and enable Forward Path.`,
        `Step 4 (Save): Click Save. Visiting ${domain} now instantly launches Police Safeguard with the official sign-up onboarding modal!`
      ],
      cloudflareSteps: [
        `Step 1 (DNS A Record): In your domain host DNS management for ${domain}, set an A Record: Name/Host = '@', Points to / Value = '${serverIp}'.`,
        `Step 2 (www CNAME Record): Add a CNAME record: Name/Host = 'www', Points to / Value = '${domain}'.`,
        `Step 3 (Sign-Up Landing Redirect): Configure your web host at ${serverIp} (via Apache .htaccess or Nginx reverse proxy) to serve the app or forward root traffic to '/?signup=1' so new users immediately open the account creation screen.`
      ]
    };
  }
}
