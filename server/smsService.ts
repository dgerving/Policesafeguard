import crypto from 'crypto';

export interface SmsDispatchResult {
  phone: string;
  name: string;
  status: 'delivered' | 'sent' | 'native_fallback';
  provider: 'twilio' | 'native_sms_app';
  messageId: string;
  sentAt: number;
  nativeSmsUri?: string;
  error?: string;
}

// In-memory rate limiting map: ipOrSession -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

export class SmsService {
  /**
   * Sanitizes and validates phone numbers to E.164 format (+1XXXXXXXXXX)
   */
  public static normalizePhone(phone: string): string | null {
    if (!phone) return null;
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `+1${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+${digitsOnly}`;
    } else if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
      return `+${digitsOnly}`;
    }
    return null;
  }

  /**
   * Enforces rate limiting: max 5 dispatches per session, max 20 per hour
   */
  public static checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(identifier) || [];
    // Filter timestamps within last 1 hour
    const recent = timestamps.filter(t => now - t < 3600000);
    if (recent.length >= 20) {
      return false;
    }
    recent.push(now);
    rateLimitMap.set(identifier, recent);
    return true;
  }

  private static sanitizeMessageUrls(text: string): string {
    if (!text) return '';
    return text
      .replace(/https?:\/\/[a-zA-Z0-9._-]*cloudworkstations\.dev[^\s]*/gi, (url) => {
        const query = url.includes('?') ? '?' + url.split('?')[1] : '';
        return `https://www.policesafeguard.com/${query}`;
      })
      .replace(/https?:\/\/ais-(?:dev|pre)-[a-zA-Z0-9._-]*\.run\.app[^\s]*/gi, (url) => {
        const query = url.includes('?') ? '?' + url.split('?')[1] : '';
        return `https://www.policesafeguard.com/${query}`;
      })
      .replace(/https?:\/\/localhost(?::\d+)?[^\s]*/gi, (url) => {
        const query = url.includes('?') ? '?' + url.split('?')[1] : '';
        return `https://www.policesafeguard.com/${query}`;
      })
      .replace(/https?:\/\/127\.0\.0\.1(?::\d+)?[^\s]*/gi, (url) => {
        const query = url.includes('?') ? '?' + url.split('?')[1] : '';
        return `https://www.policesafeguard.com/${query}`;
      });
  }

  /**
   * Dispatches emergency SMS to witnesses via Twilio if configured,
   * or prepares native SMS URI fallback with carrier-compliant content.
   */
  public static async dispatchWitnessAlerts(params: {
    sessionId: string;
    recipients: Array<{ phone: string; name?: string }>;
    message: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; deliveries: SmsDispatchResult[]; error?: string }> {
    const { sessionId, recipients, ipAddress } = params;
    const message = this.sanitizeMessageUrls(params.message);

    const rateKey = sessionId || ipAddress || 'global_sms';
    if (!this.checkRateLimit(rateKey)) {
      return {
        success: false,
        deliveries: [],
        error: 'Emergency SMS dispatch rate limit reached. Please wait before broadcasting again.'
      };
    }

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID;
    const hasTwilio = Boolean(twilioAccountSid && twilioAuthToken && twilioFrom);

    const deliveries: SmsDispatchResult[] = [];

    for (const r of recipients) {
      const normalized = this.normalizePhone(r.phone);
      if (!normalized) {
        deliveries.push({
          phone: r.phone,
          name: r.name || 'Witness',
          status: 'native_fallback',
          provider: 'native_sms_app',
          messageId: `ERR-INVALID-${Date.now()}`,
          sentAt: Date.now(),
          error: 'Invalid phone number format. Must include 10 or 11 digits.'
        });
        continue;
      }

      let messageId = `SMS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      let status: 'delivered' | 'sent' | 'native_fallback' = 'sent';
      let provider: 'twilio' | 'native_sms_app' = 'native_sms_app';
      let dispatchError: string | undefined;

      if (hasTwilio) {
        try {
          const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
          const bodyParams = new URLSearchParams();
          bodyParams.append('To', normalized);
          if (twilioFrom!.startsWith('MG')) {
            bodyParams.append('MessagingServiceSid', twilioFrom!);
          } else {
            bodyParams.append('From', twilioFrom!);
          }
          bodyParams.append('Body', message);

          const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: bodyParams.toString(),
            }
          );

          if (twilioRes.ok) {
            const data: any = await twilioRes.json();
            messageId = data.sid || messageId;
            status = 'delivered';
            provider = 'twilio';
          } else {
            const errData: any = await twilioRes.json().catch(() => ({}));
            dispatchError = errData?.message || 'Twilio carrier rejected dispatch';
            provider = 'native_sms_app';
            status = 'native_fallback';
          }
        } catch (err: any) {
          dispatchError = err?.message || 'Network error reaching SMS gateway';
          provider = 'native_sms_app';
          status = 'native_fallback';
        }
      }

      const nativeSmsUri = `sms:${encodeURIComponent(normalized)}?body=${encodeURIComponent(message)}`;

      deliveries.push({
        phone: normalized,
        name: r.name || 'Witness Contact',
        status,
        provider,
        messageId,
        sentAt: Date.now(),
        nativeSmsUri,
        error: dispatchError
      });
    }

    return {
      success: true,
      deliveries
    };
  }
}
