export type MembershipTier = 'free' | 'all_encounters_pro' | 'lifetime_pro' | 'paid';

export type BillingCycle = 'monthly' | 'yearly' | 'lifetime' | 'pay_per_use';

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: string;
  popular?: boolean;
}

export type EncounterType = 
  | 'traffic_stop' 
  | 'home_encounter' 
  | 'walking_street' 
  | 'public_recording';

export interface EncounterDefinition {
  id: EncounterType;
  title: string;
  shortTitle: string;
  badge: string;
  iconName: string;
  description: string;
  requiredTier: 'free' | 'all_encounters_pro';
  legalPrinciples: string[];
  keyQuestions: string[];
}

export type ComplianceCategory = 
  | 'MUST_COMPLY' 
  | 'RIGHT_TO_REFUSE' 
  | 'ASK_CLARIFY' 
  | 'DE_ESCALATE' 
  | 'NEUTRAL_NOTICE';

export interface LegalAnalysisResult {
  category: ComplianceCategory;
  headline: string;
  recommendedResponse: string;
  legalCitation: string;
  statuteOrCase: string;
  explanation: string;
  confidence: number;
  deEscalationTip: string;
  sourceStatuteUrl?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TranscriptEntry {
  id: string;
  timestamp: number;
  speaker: 'officer' | 'user' | 'system';
  originalText: string;
  translatedText?: string;
  analysis?: LegalAnalysisResult;
}

export interface JurisdictionLaw {
  stateCode: string;
  stateName: string;
  stopAndIdentify: boolean;
  stopAndIdentifyStatute: string;
  stopAndIdentifySummary: string;
  wiretappingConsent: 'one-party' | 'all-party' | 'public-exception';
  recordingPoliceNotes: string;
  vehicleSearchConsentRule: string;
  preliminaryBreathTestMandatory: boolean;
  preliminaryBreathTestRule: string;
  passengerIdRequirement: string;
  relevantStatuteCodes: string[];
}

export type AuthProvider = 'google' | 'facebook' | 'apple' | 'email';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  provider: AuthProvider;
  avatarUrl?: string;
  createdAt: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface VoiceTrainingProfile {
  isTrained: boolean;
  trainedAt?: number;
  sampleCount: number;
  trainedPhrases: string[];
  confidenceThreshold: number;
  speakerSignature?: string;
  audioSampleDataUrl?: string;
  audioDurationMs?: number;
  pitchHz?: number;
  spectralCentroid?: number;
  voiceLockActive: boolean;
  sensitivity: 'lenient' | 'balanced' | 'strict';
}

export interface CustomVoiceCommands {
  callWitnesses?: string;
  arrestLockdown?: string;
  startRecording?: string;
  stopRecording?: string;
  readRights?: string;
  refuseSearch?: string;
  freeToGo?: string;
  stealthMode?: string;
}

export type UserRole = 'client' | 'admin';

export interface UserProfile {
  id?: string;
  email?: string;
  phone?: string;
  authProvider?: AuthProvider;
  role?: UserRole;
  avatarUrl?: string;
  hasCompletedOnboarding?: boolean;
  name: string;
  homeState?: string;
  nativeLanguage: string;
  membershipTier: MembershipTier;
  billingCycle?: BillingCycle;
  credits: number;
  vehicleMakeModel: string;
  vehicleLicensePlate: string;
  vehicleColor?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContacts?: EmergencyContact[];
  autoSendWitnessSmsPermission?: boolean;
  medicalConditions: string;
  isDeafOrHardOfHearing: boolean;
  preferredVoice: string;
  whisperModeEnabled: boolean;
  duressLockPin: string;
  autoNotifyContactOnStart: boolean;
  isLifetimeMember?: boolean;
  referralCode?: string;
  promoCodeUsed?: string;
  requireCardRefundUnlock?: boolean;
  verifiedCardHolderName?: string;
  paymentStatus?: 'active' | 'trialing' | 'failed' | 'past_due';
  isTrialActive?: boolean;
  trialEndsAt?: number;
  skippedTrial?: boolean;
  customVoiceCommands?: CustomVoiceCommands;
  voiceTraining?: VoiceTrainingProfile;
  announceRecordingOutLoud?: boolean;
  isAnonymous?: boolean;
  anonymousAlias?: string;
  appTheme?: 'tactical_dark' | 'midnight_blue' | 'carbon_fiber' | 'amber_gold' | 'crimson_guard' | 'forest_camo';
  customBackgroundImageUrl?: string;
  backgroundOpacity?: number;
  isCloudOnlineMode?: boolean;
}

export interface DevicePermissionsState {
  camera: boolean;
  microphone: boolean;
  location: boolean;
  notifications: boolean;
  deviceLockOverride?: boolean;
  fullDeviceEncryption?: boolean;
  hasPrompted: boolean;
  grantedAt?: number;
}

export interface LiveStreamSessionData {
  sessionId: string;
  isLive: boolean;
  userName: string;
  userPhone?: string;
  encounterType: EncounterType;
  startedAt: number;
  completedAt?: number;
  durationSeconds: number;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    jurisdictionState: string;
    city?: string;
  };
  transcript: TranscriptEntry[];
  certificateId: string;
  sha256Hash?: string;
  videoUrl?: string;
  lastSnapshot?: string;
  currentStatusNote?: string;
  emergencyContactsNotified?: string[];
  updatedAt: number;
  viewerCount?: number;
}

export interface EvidenceCustodyRecord {
  sessionId: string;
  createdAt: number;
  completedAt: number;
  durationSeconds: number;
  videoUrl?: string;
  videoBlobSize?: number;
  audioBlobSize?: number;
  sha256Hash: string;
  deviceFingerprint: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    jurisdictionState: string;
    city?: string;
  };
  transcript: TranscriptEntry[];
  complianceScore?: number;
  isEncrypted: boolean;
  encryptionAlgorithm?: string;
  certificateId: string;
  admissibilityNotes: string;
  thumbnailUrl?: string;
  isSealed?: boolean;
  custodyStatus?: string;
}

export interface SimulationOption {
  label: string;
  spokenStatement: string;
  isBestPractice: boolean;
  category: ComplianceCategory;
  feedback: string;
  citation: string;
  scoreDelta: number;
}

export interface SimulationStep {
  stepNumber: number;
  officerStatement: string;
  officerAudioPrompt?: string;
  aiCommentary: LegalAnalysisResult;
  options: SimulationOption[];
}

export interface SimulationScenario {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  jurisdictionContext: string;
  initialContext: string;
  steps: SimulationStep[];
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  accent: string;
  description: string;
  isPaidOnly: boolean;
  rate: number;
  pitch: number;
}

export interface HypotheticalLawReference {
  statuteOrCase: string;
  summary: string;
  relevance: string;
}

export interface HypotheticalScenarioAnalysis {
  safestActionHeadline: string;
  actionSteps: string[];
  exactWordsToSay: string;
  whatYouMustComplyWith: string[];
  whatYouHaveRightToRefuse: string[];
  policeTricksAndTraps: string[];
  stateSpecificLaws: HypotheticalLawReference[];
  constitutionalPrecedents: string[];
  deEscalationAdvice: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  jurisdictionStateCode?: string;
  jurisdictionStateName?: string;
}

export type ReferralRewardTier = 'monthly' | 'yearly' | 'lifetime';

export interface ReferredUserRecord {
  id: string;
  name: string;
  maskedEmail: string;
  timestamp: number;
  planPurchased: 'monthly' | 'yearly' | 'lifetime' | 'weekly' | 'pending';
  amount: number;
  isVerified: boolean;
}

export interface ReferralProgramState {
  referralCode: string;
  totalReferrals: number;
  referrals: ReferredUserRecord[];
  claimedTiers: {
    monthly: boolean;
    yearly: boolean;
    lifetime: boolean;
  };
}

export interface CharityPartner {
  id: string;
  name: string;
  tagline: string;
  category: 'fallen_officers' | 'youth_outreach' | 'mental_wellness' | 'community_policing';
  description: string;
  website: string;
  taxExemptStatus: string;
  allocationPercentage: number;
}

export interface CharityImpactData {
  charityPercentage: number; // 10%
  totalDonatedDollars: number;
  totalTransactionsCount: number;
  missionStatement: string;
  partners: CharityPartner[];
  recentPledges: {
    id: string;
    timestamp: number;
    plan: string;
    donationAmount: number;
    partnerName: string;
  }[];
}

