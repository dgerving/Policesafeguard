import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  recoveryKeyHash: string;
  name: string;
  phone?: string;
  homeState?: string;
  nativeLanguage?: string;
  membershipTier: 'free' | 'all_encounters_pro' | 'lifetime_pro' | 'paid';
  billingCycle: 'monthly' | 'yearly' | 'lifetime' | 'pay_per_use';
  credits: number;
  vehicleMakeModel?: string;
  vehicleLicensePlate?: string;
  vehicleColor?: string;
  emergencyContacts?: Array<{ id: string; name: string; phone: string; isPrimary?: boolean }>;
  medicalConditions?: string;
  isDeafOrHardOfHearing?: boolean;
  duressLockPinHash?: string;
  isAnonymous?: boolean;
  anonymousAlias?: string;
  role?: 'client' | 'admin';
  authProvider?: 'google' | 'apple' | 'facebook' | 'email';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuthSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers(): Map<string, UserRecord> {
  const map = new Map<string, UserRecord>();
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((u: UserRecord) => {
          if (u.id && u.email) {
            map.set(u.email.toLowerCase().trim(), u);
          }
        });
      }
    } catch (e) {
      console.error('[AuthService] Error loading users.json:', e);
    }
  }
  return map;
}

function saveUsers(map: Map<string, UserRecord>): void {
  try {
    const list = Array.from(map.values());
    const tempFile = `${USERS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
  } catch (e) {
    console.error('[AuthService] Error saving users.json:', e);
  }
}

function loadSessions(): Map<string, AuthSession> {
  const map = new Map<string, AuthSession>();
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        const now = Date.now();
        data.forEach((s: AuthSession) => {
          if (s.token && s.expiresAt > now) {
            map.set(s.token, s);
          }
        });
      }
    } catch (e) {
      console.error('[AuthService] Error loading sessions.json:', e);
    }
  }
  return map;
}

function saveSessions(map: Map<string, AuthSession>): void {
  try {
    const list = Array.from(map.values());
    const tempFile = `${SESSIONS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tempFile, SESSIONS_FILE);
  } catch (e) {
    console.error('[AuthService] Error saving sessions.json:', e);
  }
}

// In-memory caches backed by disk
const usersCache = loadUsers();
const sessionsCache = loadSessions();

export class AuthService {
  private static hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  private static hashRecoveryKey(recoveryKey: string): string {
    return crypto.createHash('sha256').update(recoveryKey.trim().toUpperCase()).digest('hex');
  }

  public static generateRecoveryKey(): string {
    const words = [
      'SHIELD', 'RIGHTS', 'VERIFIED', 'CONSTITUTION', 'JUSTICE',
      'FOURTH', 'FIFTH', 'EVIDENCE', 'SECURITY', 'ENCRYPT',
      'CITIZEN', 'PROTECT', 'VAULT', 'INTEGRITY', 'BEACON', 'SAFE'
    ];
    const picked: string[] = [];
    for (let i = 0; i < 4; i++) {
      const randIdx = crypto.randomInt(0, words.length);
      picked.push(words[randIdx]);
    }
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${picked.join('-')}-${randomHex}`;
  }

  public static registerUser(params: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    homeState?: string;
    nativeLanguage?: string;
    role?: 'client' | 'admin';
  }): { user: Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'>; token: string; recoveryKey: string } {
    const email = params.email.toLowerCase().trim();
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (!params.password || params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (!params.name || params.name.trim().length < 2) {
      throw new Error('Please provide your full legal or citizen name.');
    }

    // If account with this email already exists, check if credentials match or guide to sign in
    if (usersCache.has(email)) {
      const existing = usersCache.get(email)!;
      if (params.password) {
        const computedHash = this.hashPassword(params.password, existing.passwordSalt);
        if (computedHash === existing.passwordHash) {
          const logged = this.loginUser(email, params.password);
          return {
            user: logged.user,
            token: logged.token,
            recoveryKey: logged.recoveryKey || 'RECOVERED_ACCOUNT'
          };
        }
      }
      throw new Error('An account with this email address already exists. Please switch to "Returning Citizen" to sign in or recover your password.');
    }

    // Phone number verification (logs notice if shared, but doesn't crash)
    if (params.phone) {
      const cleanPhone = params.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 7) {
        for (const existingUser of usersCache.values()) {
          const existingCleanPhone = (existingUser.phone || '').replace(/\D/g, '');
          if (existingCleanPhone && existingCleanPhone === cleanPhone && existingUser.email !== email) {
            console.info(`[AuthService] Phone ${cleanPhone} shared between ${existingUser.email} and new registration ${email}`);
          }
        }
      }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(params.password, salt);
    const recoveryKey = this.generateRecoveryKey();
    const recoveryKeyHash = this.hashRecoveryKey(recoveryKey);
    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const role: 'client' | 'admin' = params.role || (email === 'dgerving@gmail.com' ? 'admin' : 'client');

    const newUser: UserRecord = {
      id: userId,
      email,
      passwordSalt: salt,
      passwordHash: hash,
      recoveryKeyHash,
      name: params.name.trim(),
      phone: params.phone ? params.phone.trim() : undefined,
      homeState: params.homeState || 'US',
      nativeLanguage: params.nativeLanguage || 'en',
      membershipTier: 'free',
      billingCycle: 'monthly',
      credits: 5,
      role,
      authProvider: 'email',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    usersCache.set(email, newUser);
    saveUsers(usersCache);

    // Issue auth token (30-day session)
    const token = crypto.randomBytes(32).toString('hex');
    const session: AuthSession = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };
    sessionsCache.set(token, session);
    saveSessions(sessionsCache);

    const { passwordSalt, passwordHash, recoveryKeyHash: rkh, ...safeUser } = newUser;
    return { user: safeUser, token, recoveryKey };
  }

  public static loginUser(emailInput: string, passwordInput?: string): {
    user: Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'>;
    token: string;
    recoveryKey?: string;
  } {
    const email = emailInput.toLowerCase().trim();
    let user = usersCache.get(email);
    if (!user) {
      const freshUsers = loadUsers();
      user = freshUsers.get(email);
      if (user) {
        usersCache.set(email, user);
      }
    }

    // Auto-restore / register returning citizen if record was cleared or created in prior session
    if (!user) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = this.hashPassword(passwordInput || 'social_verified_key', salt);
      const recoveryKey = this.generateRecoveryKey();
      const recoveryKeyHash = this.hashRecoveryKey(recoveryKey);
      const userId = `usr_return_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const emailPrefix = email.split('@')[0];
      const cleanName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Citizen';
      const role: 'client' | 'admin' = email === 'dgerving@gmail.com' ? 'admin' : 'client';

      user = {
        id: userId,
        email,
        passwordSalt: salt,
        passwordHash: hash,
        recoveryKeyHash,
        name: cleanName,
        homeState: 'US',
        nativeLanguage: 'en',
        membershipTier: 'free',
        billingCycle: 'monthly',
        credits: 5,
        role,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      usersCache.set(email, user);
      saveUsers(usersCache);

      const token = crypto.randomBytes(32).toString('hex');
      const session: AuthSession = {
        token,
        userId: user.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };
      sessionsCache.set(token, session);
      saveSessions(sessionsCache);

      const { passwordSalt: ps, passwordHash: ph, recoveryKeyHash: rkh, ...safeUser } = user;
      return { user: safeUser, token, recoveryKey };
    }

    // If password provided and user has password, check match
    if (passwordInput && passwordInput.trim()) {
      const computedHash = this.hashPassword(passwordInput, user.passwordSalt);
      const hashBuffer = Buffer.from(computedHash, 'hex');
      const storedBuffer = Buffer.from(user.passwordHash, 'hex');

      if (hashBuffer.length !== storedBuffer.length || !crypto.timingSafeEqual(hashBuffer, storedBuffer)) {
        // If user originally signed up via Social without explicit password, adopt provided password
        const isSocialUser = user.authProvider === 'google' || user.authProvider === 'apple' || user.authProvider === 'facebook' ||
          user.id.startsWith('usr_google') || user.id.startsWith('usr_apple') || user.id.startsWith('usr_facebook') || user.id.startsWith('usr_return');
        if (isSocialUser) {
          const newSalt = crypto.randomBytes(16).toString('hex');
          user.passwordSalt = newSalt;
          user.passwordHash = this.hashPassword(passwordInput, newSalt);
          user.updatedAt = Date.now();
          usersCache.set(email, user);
          saveUsers(usersCache);
        } else {
          throw new Error('Invalid email or password. Please verify your password or use Account Recovery.');
        }
      }
    }
    // If passwordInput is not provided: 1-click returning citizen authentication succeeds seamlessly

    // Ensure dgerving@gmail.com has admin role
    if (user.email === 'dgerving@gmail.com' && !user.role) {
      user.role = 'admin';
      usersCache.set(email, user);
      saveUsers(usersCache);
    }

    // Issue fresh session token
    const token = crypto.randomBytes(32).toString('hex');
    const session: AuthSession = {
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };
    sessionsCache.set(token, session);
    saveSessions(sessionsCache);

    const { passwordSalt, passwordHash, recoveryKeyHash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static socialLogin(params: {
    provider: 'google' | 'apple' | 'facebook';
    email: string;
    name?: string;
    providerId?: string;
    phone?: string;
    password?: string;
    role?: 'client' | 'admin';
  }): {
    user: Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'>;
    token: string;
    recoveryKey?: string;
    isNewUser: boolean;
  } {
    const email = params.email.toLowerCase().trim();
    if (!email || !email.includes('@')) {
      throw new Error('Valid verified email is required for identity verification.');
    }
    const emailPrefix = email.split('@')[0];
    const derivedName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    const cleanName = (params.name || '').trim() || derivedName || 'Citizen';

    let user = usersCache.get(email);
    let isNewUser = false;
    let recoveryKey: string | undefined = undefined;

    if (!user) {
      isNewUser = true;
      const salt = crypto.randomBytes(16).toString('hex');
      const passToHash = params.password && params.password.length >= 6 ? params.password : crypto.randomBytes(24).toString('hex');
      const hash = this.hashPassword(passToHash, salt);
      recoveryKey = this.generateRecoveryKey();
      const recoveryKeyHash = this.hashRecoveryKey(recoveryKey);
      const userId = `usr_${params.provider}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const role: 'client' | 'admin' = params.role || (email === 'dgerving@gmail.com' ? 'admin' : 'client');

      user = {
        id: userId,
        email,
        passwordSalt: salt,
        passwordHash: hash,
        recoveryKeyHash,
        name: cleanName,
        phone: params.phone ? params.phone.trim() : undefined,
        homeState: 'US',
        nativeLanguage: 'en',
        membershipTier: 'free',
        billingCycle: 'monthly',
        credits: 5,
        role,
        authProvider: params.provider,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      usersCache.set(email, user);
      saveUsers(usersCache);
    } else {
      let modified = false;
      if ((!user.name || user.name === 'Citizen') && cleanName) {
        user.name = cleanName;
        modified = true;
      }
      if (user.authProvider !== params.provider) {
        user.authProvider = params.provider;
        modified = true;
      }
      if (params.password && params.password.length >= 6) {
        const salt = crypto.randomBytes(16).toString('hex');
        user.passwordSalt = salt;
        user.passwordHash = this.hashPassword(params.password, salt);
        modified = true;
      }
      if (params.role && user.role !== params.role) {
        user.role = params.role;
        modified = true;
      } else if (email === 'dgerving@gmail.com' && !user.role) {
        user.role = 'admin';
        modified = true;
      }
      if (modified) {
        user.updatedAt = Date.now();
        usersCache.set(email, user);
        saveUsers(usersCache);
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const session: AuthSession = {
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };
    sessionsCache.set(token, session);
    saveSessions(sessionsCache);

    const { passwordSalt, passwordHash, recoveryKeyHash: rkh, ...safeUser } = user;
    return { user: safeUser, token, recoveryKey, isNewUser };
  }

  public static getUserByToken(token: string): Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'> | null {
    if (!token) return null;
    const session = sessionsCache.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (session) {
        sessionsCache.delete(token);
        saveSessions(sessionsCache);
      }
      return null;
    }

    for (const user of usersCache.values()) {
      if (user.id === session.userId) {
        const { passwordSalt, passwordHash, recoveryKeyHash, ...safeUser } = user;
        return safeUser;
      }
    }
    return null;
  }

  public static updateUserProfile(userId: string, updates: Partial<UserRecord>): Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'> {
    for (const [email, user] of usersCache.entries()) {
      if (user.id === userId) {
        const updated: UserRecord = {
          ...user,
          ...updates,
          id: user.id, // prevent overwriting ID or credentials
          email: user.email,
          passwordSalt: user.passwordSalt,
          passwordHash: user.passwordHash,
          recoveryKeyHash: user.recoveryKeyHash,
          updatedAt: Date.now(),
        };
        usersCache.set(email, updated);
        saveUsers(usersCache);
        const { passwordSalt, passwordHash, recoveryKeyHash, ...safeUser } = updated;
        return safeUser;
      }
    }
    throw new Error('User not found.');
  }

  /**
   * Updates user subscription status from Stripe webhook events (checkout.session.completed, customer.subscription.deleted)
   */
  public static updateUserSubscription(params: {
    email?: string;
    customerId?: string;
    subscriptionId?: string;
    membershipTier: 'free' | 'all_encounters_pro' | 'lifetime_pro' | 'paid';
    billingCycle?: 'monthly' | 'yearly' | 'lifetime' | 'pay_per_use';
    creditsDelta?: number;
    clearSubscription?: boolean;
  }): { success: boolean; user?: Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'> } {
    let targetUser: UserRecord | undefined;
    let targetEmail: string | undefined;

    // 1. Try to find user by email
    if (params.email) {
      const cleanEmail = params.email.toLowerCase().trim();
      targetUser = usersCache.get(cleanEmail);
      if (targetUser) targetEmail = cleanEmail;
    }

    // 2. If not found by email, try searching by Stripe Customer ID or Subscription ID
    if (!targetUser) {
      for (const [em, u] of usersCache.entries()) {
        if (
          (params.customerId && u.stripeCustomerId === params.customerId) ||
          (params.subscriptionId && u.stripeSubscriptionId === params.subscriptionId)
        ) {
          targetUser = u;
          targetEmail = em;
          break;
        }
      }
    }

    // 3. If still not found and email is provided, auto-create a user record so customer never loses access
    if (!targetUser && params.email && params.email.includes('@')) {
      const cleanEmail = params.email.toLowerCase().trim();
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = this.hashPassword(crypto.randomBytes(24).toString('hex'), salt);
      const recoveryKey = this.generateRecoveryKey();
      const recoveryKeyHash = this.hashRecoveryKey(recoveryKey);
      const prefix = cleanEmail.split('@')[0];
      const cleanName = prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Protected Citizen';

      targetUser = {
        id: `usr_stripe_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        email: cleanEmail,
        passwordSalt: salt,
        passwordHash: hash,
        recoveryKeyHash,
        name: cleanName,
        membershipTier: params.membershipTier,
        billingCycle: params.billingCycle || 'monthly',
        credits: params.creditsDelta ? Math.max(0, params.creditsDelta) : 5,
        stripeCustomerId: params.customerId,
        stripeSubscriptionId: params.subscriptionId,
        role: cleanEmail === 'dgerving@gmail.com' ? 'admin' : 'client',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      usersCache.set(cleanEmail, targetUser);
      saveUsers(usersCache);
      const { passwordSalt, passwordHash, recoveryKeyHash: rkh, ...safe } = targetUser;
      return { success: true, user: safe };
    }

    if (!targetUser || !targetEmail) {
      console.warn(`[AuthService] No user found for Stripe subscription update: email=${params.email}, customer=${params.customerId}, sub=${params.subscriptionId}`);
      return { success: false };
    }

    // Update user properties
    targetUser.membershipTier = params.membershipTier;
    if (params.billingCycle) {
      targetUser.billingCycle = params.billingCycle;
    }
    if (typeof params.creditsDelta === 'number' && params.creditsDelta > 0) {
      targetUser.credits = (targetUser.credits || 0) + params.creditsDelta;
    }
    if (params.customerId) {
      targetUser.stripeCustomerId = params.customerId;
    }
    if (params.clearSubscription) {
      delete targetUser.stripeSubscriptionId;
    } else if (params.subscriptionId !== undefined) {
      targetUser.stripeSubscriptionId = params.subscriptionId || undefined;
    }
    targetUser.updatedAt = Date.now();

    usersCache.set(targetEmail, targetUser);
    saveUsers(usersCache);
    const { passwordSalt, passwordHash, recoveryKeyHash: rkh, ...safeUser } = targetUser;
    return { success: true, user: safeUser };
  }

  public static recoverAccount(emailInput: string, recoveryKeyInput: string, newPassword: string): {
    user: Omit<UserRecord, 'passwordSalt' | 'passwordHash' | 'recoveryKeyHash'>;
    token: string;
  } {
    const email = emailInput.toLowerCase().trim();
    const user = usersCache.get(email);
    if (!user) {
      throw new Error('Account not found with this email.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const providedHash = this.hashRecoveryKey(recoveryKeyInput);
    if (providedHash !== user.recoveryKeyHash) {
      throw new Error('Invalid recovery phrase or key. Please verify and try again.');
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = this.hashPassword(newPassword, newSalt);

    user.passwordSalt = newSalt;
    user.passwordHash = newHash;
    user.updatedAt = Date.now();
    usersCache.set(email, user);
    saveUsers(usersCache);

    const token = crypto.randomBytes(32).toString('hex');
    const session: AuthSession = {
      token,
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };
    sessionsCache.set(token, session);
    saveSessions(sessionsCache);

    const { passwordSalt, passwordHash, recoveryKeyHash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public static logoutToken(token: string): void {
    if (sessionsCache.has(token)) {
      sessionsCache.delete(token);
      saveSessions(sessionsCache);
    }
  }

  public static deleteUser(userId: string): void {
    for (const [email, user] of usersCache.entries()) {
      if (user.id === userId) {
        usersCache.delete(email);
        saveUsers(usersCache);
        break;
      }
    }
    // Delete all sessions for user
    for (const [token, session] of sessionsCache.entries()) {
      if (session.userId === userId) {
        sessionsCache.delete(token);
      }
    }
    saveSessions(sessionsCache);
  }
}
