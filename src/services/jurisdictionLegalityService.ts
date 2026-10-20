/**
 * JurisdictionLegalityService
 *
 * Enforces state-specific and federal legal compliance for app features.
 * If a feature is unlawful or restricted in the user's active jurisdiction
 * (e.g. Covert/Surreptitious recording in Two-Party Wiretap states, radar detectors
 * in VA/DC, or touching screens while driving in hands-free states), this service
 * denies the feature and provides a statutory citation and legal explanation.
 */

export type AppFeature = 
  | 'stealth_unannounced_recording'
  | 'covert_earpiece_only'
  | 'touch_screen_while_driving'
  | 'police_scanner_feed'
  | 'radar_alert_interception'
  | 'close_proximity_recording'
  | 'refuse_all_identification'
  | 'refuse_pedestrian_id_in_stop_and_id'
  | 'withhold_firearm_declaration_duty'
  | 'refuse_post_arrest_chemical_test'
  | 'disobey_mimms_exit_order';

export interface FeatureLegalityCheck {
  isLegal: boolean;
  feature: AppFeature;
  featureName: string;
  stateCode: string;
  stateName: string;
  statuteCitation: string;
  reason: string;
  legalGuidance: string;
  mandatoryAlternative: string;
}

// 12 All-Party / Two-Party Consent Wiretap States
// In these jurisdictions, recording conversations without clear audible notice or all-party consent
// is a criminal wiretap violation (felony or misdemeanor).
export const TWO_PARTY_CONSENT_STATES: Record<string, { statute: string; name: string; legalRule: string }> = {
  CA: {
    statute: 'Cal. Penal Code § 632 (Invasion of Privacy Act)',
    name: 'California',
    legalRule: 'All-party consent state. Secret or unannounced audio recording is unlawful. Notice that interaction is being recorded is legally required.'
  },
  FL: {
    statute: 'Fla. Stat. § 934.03 (Security of Communications Act)',
    name: 'Florida',
    legalRule: 'Two-party consent state. Recording private conversation without prior announcement is a third-degree felony.'
  },
  IL: {
    statute: '720 ILCS 5/14-2 (Illinois Eavesdropping Statute)',
    name: 'Illinois',
    legalRule: 'All-party consent required for audio recording unless in an open public encounter with audible notice.'
  },
  MA: {
    statute: 'Mass. Gen. Laws ch. 272, § 99 (Massachusetts Wiretap Act)',
    name: 'Massachusetts',
    legalRule: 'Strict two-party wiretap law. Secret audio recording is prohibited (Commonwealth v. Hyde). Notice of recording must be announced.'
  },
  MD: {
    statute: 'Md. Code Ann., Cts. & Jud. Proc. § 10-402',
    name: 'Maryland',
    legalRule: 'All parties must consent or be notified that audio recording is in progress.'
  },
  PA: {
    statute: '18 Pa. Cons. Stat. § 5703 (Wiretapping and Electronic Surveillance Act)',
    name: 'Pennsylvania',
    legalRule: 'Two-party consent state. Audible notice of recording protects citizen from illegal eavesdropping allegations.'
  },
  WA: {
    statute: 'RCW 9.73.030 (Washington Interception of Communications)',
    name: 'Washington',
    legalRule: 'All-party consent state. Recording is unlawful without clear mutual announcement.'
  },
  CT: {
    statute: 'Conn. Gen. Stat. § 52-570d',
    name: 'Connecticut',
    legalRule: 'All-party consent or audible notification tone is legally required for phone/voice recordings.'
  },
  DE: {
    statute: '11 Del. Code § 1335',
    name: 'Delaware',
    legalRule: 'Recording without notice in areas with expected privacy is prohibited.'
  },
  MT: {
    statute: 'Mont. Code Ann. § 45-8-213',
    name: 'Montana',
    legalRule: 'Requires all-party knowledge and announcement of electronic recording.'
  },
  NH: {
    statute: 'N.H. Rev. Stat. Ann. § 570-A:2',
    name: 'New Hampshire',
    legalRule: 'Two-party consent law. Audible announcement required to prevent wiretap prosecution.'
  },
  NV: {
    statute: 'Nev. Rev. Stat. § 200.650',
    name: 'Nevada',
    legalRule: 'All-party consent required for in-person audio interception unless openly displayed.'
  }
};

// Strict Hands-Free Driving Laws (Touching mobile device while vehicle engine is running)
export const STRICT_HANDS_FREE_STATES: Record<string, { statute: string; name: string }> = {
  CA: { statute: 'Cal. Veh. Code § 23123.5', name: 'California' },
  NY: { statute: 'N.Y. Veh. & Traf. Law § 1225-d', name: 'New York' },
  GA: { statute: 'O.C.G.A. § 40-6-241 (Hands-Free Georgia Act)', name: 'Georgia' },
  MN: { statute: 'Minn. Stat. § 169.475', name: 'Minnesota' },
  WA: { statute: 'RCW 46.61.672 (E-DUI Statute)', name: 'Washington' },
  IL: { statute: '625 ILCS 5/12-610.2', name: 'Illinois' },
  TX: { statute: 'Tex. Transp. Code § 545.4251', name: 'Texas' },
  FL: { statute: 'Fla. Stat. § 316.305 (Wireless Communications While Driving)', name: 'Florida' }
};

// States with specific physical buffer distance laws for filming police
export const BUFFER_DISTANCE_STATES: Record<string, { statute: string; distanceFeet: number; name: string }> = {
  IN: { statute: 'Ind. Code § 35-44.1-3-1 (25-Foot Encroachment Law)', distanceFeet: 25, name: 'Indiana' },
  LA: { statute: 'La. R.S. 14:108 (25-Foot Distance Order)', distanceFeet: 25, name: 'Louisiana' }
};

export class JurisdictionLegalityService {
  /**
   * Checks whether a requested feature is lawful in the specified state jurisdiction.
   * If unlawful or restricted, returns isLegal = false with full statutory explanation.
   */
  public static checkFeatureLegality(feature: AppFeature, stateCode: string, stateName = ''): FeatureLegalityCheck {
    const code = (stateCode || 'FED').toUpperCase();
    const resolvedStateName = stateName || code;

    // Feature 1: Stealth / Unannounced / Covert Audio Recording
    if (feature === 'stealth_unannounced_recording' || feature === 'covert_earpiece_only') {
      const twoPartyInfo = TWO_PARTY_CONSENT_STATES[code];
      if (twoPartyInfo) {
        return {
          isLegal: false,
          feature,
          featureName: 'Silent / Unannounced Covert Recording',
          stateCode: code,
          stateName: twoPartyInfo.name,
          statuteCitation: twoPartyInfo.statute,
          reason: `In ${twoPartyInfo.name}, state law classifies non-consensual or secret audio recording as a felony or misdemeanor wiretap offense under ${twoPartyInfo.statute}.`,
          legalGuidance: `${twoPartyInfo.legalRule} To protect you from felony criminal charges, Police SafeGuard denies silent recording in this state.`,
          mandatoryAlternative: 'The app automatically enforces "Audible Legal Notice". An authoritative spoken statement is broadcast via speaker to legally put all parties on notice, converting the recording into a lawful, FRE 902 self-authenticating court record.'
        };
      }
    }

    // Feature 2: Touching phone screen while driving
    if (feature === 'touch_screen_while_driving') {
      const handsFreeInfo = STRICT_HANDS_FREE_STATES[code];
      if (handsFreeInfo) {
        return {
          isLegal: false,
          feature,
          featureName: 'Manual Screen Touching While Operating Vehicle',
          stateCode: code,
          stateName: handsFreeInfo.name,
          statuteCitation: handsFreeInfo.statute,
          reason: `Under ${handsFreeInfo.statute}, holding or manually tapping a smartphone while behind the wheel on a public roadway is an infraction that gives law enforcement reasonable suspicion to initiate a traffic stop.`,
          legalGuidance: 'Never hold or touch your phone once pulled over or while vehicle engine is running.',
          mandatoryAlternative: 'Police SafeGuard enforces Hands-Free Voice Activation and Automatic Earpiece Narration so you never have to touch your device during an encounter.'
        };
      }
    }

    // Feature 3: Police scanner frequency interception (VA / DC prohibition)
    if (feature === 'police_scanner_feed' || feature === 'radar_alert_interception') {
      if (code === 'VA') {
        return {
          isLegal: false,
          feature,
          featureName: 'Police Frequency / Radar Interception',
          stateCode: 'VA',
          stateName: 'Virginia',
          statuteCitation: 'Va. Code Ann. § 46.2-1079',
          reason: 'Virginia is the only state where operating any device that intercepts police radar or emergency signals in a motor vehicle is strictly prohibited by law.',
          legalGuidance: 'Equipping police frequency interception inside a vehicle in Virginia can result in citation and device seizure.',
          mandatoryAlternative: 'Police SafeGuard uses satellite GPS legal boundaries and public statutory databases, ensuring 100% legal compliance with zero signal jamming or interception.'
        };
      }
    }

    // Feature 4: Recording within physical buffer distance
    if (feature === 'close_proximity_recording') {
      const bufferInfo = BUFFER_DISTANCE_STATES[code];
      if (bufferInfo) {
        return {
          isLegal: false,
          feature,
          featureName: `Recording Within ${bufferInfo.distanceFeet} Feet of Officer`,
          stateCode: code,
          stateName: bufferInfo.name,
          statuteCitation: bufferInfo.statute,
          reason: `Under ${bufferInfo.statute}, remaining within ${bufferInfo.distanceFeet} feet of an officer engaged in official duties after being ordered to step back is a misdemeanor offense.`,
          legalGuidance: 'While the First Amendment protects your right to film in public, you must maintain the statutory buffer distance when ordered.',
          mandatoryAlternative: `Step back to at least ${bufferInfo.distanceFeet + 5} feet, use camera zoom, and state: "Officer, I am complying with your distance order while maintaining continuous visual recording from ${bufferInfo.distanceFeet + 5} feet."`
        };
      }
    }

    // Feature 5: Absolute refusal of identification as a driver
    if (feature === 'refuse_all_identification') {
      return {
        isLegal: false,
        feature,
        featureName: 'Refusal to Present Driver License on Traffic Stop',
        stateCode: code,
        stateName: resolvedStateName,
        statuteCitation: 'Delaware v. Prouse, 440 U.S. 648 & State Motor Vehicle Codes',
        reason: 'Under the motor vehicle laws of all 50 states, operating a motor vehicle on public roads is a licensed privilege. A driver must display their license, registration, and insurance upon lawful request.',
        legalGuidance: 'Refusing to show a driver license when lawfully stopped behind the wheel results in immediate arrest and vehicle impoundment.',
        mandatoryAlternative: 'Provide documents calmly. Do NOT answer personal questions (where you are going, what you drank), but DO hand over the physical documents.'
      };
    }

    // Feature 6: Refusal to Identify as a Pedestrian during Lawful Detention in Stop-and-Identify States
    if (feature === 'refuse_pedestrian_id_in_stop_and_id') {
      const stopAndIdStates = ['NV', 'UT', 'AZ', 'CO', 'FL', 'GA', 'IL', 'IN', 'KS', 'LA', 'MO', 'MT', 'NE', 'NH', 'NM', 'ND', 'OH', 'RI', 'TX', 'VT', 'WI'];
      if (stopAndIdStates.includes(code)) {
        return {
          isLegal: false,
          feature,
          featureName: 'Silent Refusal of Name During Lawful Pedestrian Detention',
          stateCode: code,
          stateName: resolvedStateName,
          statuteCitation: `Hiibel v. Sixth Judicial Dist. Court of Nevada, 542 U.S. 177 (2004) & ${code} Stop-and-ID Code`,
          reason: `In ${resolvedStateName}, state statutes authorize officers with reasonable suspicion to demand your full legal name. Under Hiibel v. Nevada, failing or refusing to identify yourself during a lawful Terry stop is a misdemeanor offense.`,
          legalGuidance: 'You are NOT required to answer questions about where you are going or what you are doing, but in this state you MUST state your true legal name.',
          mandatoryAlternative: 'State clearly: "My legal name is [Full Name]. Aside from identifying myself, I am exercising my right to remain silent and decline to answer questions without my attorney."'
        };
      }
    }

    // Feature 7: Withholding Firearm Status in Duty-to-Inform States
    if (feature === 'withhold_firearm_declaration_duty') {
      const dutyToInformStates = ['TX', 'OH', 'MI', 'NC', 'NE', 'AK', 'LA', 'SC', 'OK', 'ME'];
      if (dutyToInformStates.includes(code)) {
        return {
          isLegal: false,
          feature,
          featureName: 'Withholding Concealed Firearm Status from Officer',
          stateCode: code,
          stateName: resolvedStateName,
          statuteCitation: `${code} Concealed Handgun Duty to Inform Statute`,
          reason: `Under ${resolvedStateName} law, any licensed concealed carrier stopped by law enforcement has an affirmative statutory duty to immediately inform the officer of the firearm and present their permit alongside their driver license.`,
          legalGuidance: 'Remaining silent about a concealed weapon in a duty-to-inform state can result in permit revocation, firearm seizure, and misdemeanor criminal charges.',
          mandatoryAlternative: 'Keep both hands visible on the steering wheel and state calmly: "Officer, for mutual safety and per state statute, I am informing you that I am a licensed concealed carrier and I have a firearm legally secured in the vehicle. My hands are staying on the wheel."'
        };
      }
    }

    // Feature 8: Total Refusal of Post-Arrest Evidentiary Chemical Testing
    if (feature === 'refuse_post_arrest_chemical_test') {
      return {
        isLegal: false,
        feature,
        featureName: 'Complete Refusal of Post-Arrest Chemical Test (Breath/Blood)',
        stateCode: code,
        stateName: resolvedStateName,
        statuteCitation: `${code} Implied Consent Statute & Birchfield v. North Dakota, 579 U.S. 438 (2016)`,
        reason: 'Under Implied Consent statutes in all 50 states, driving on public roadways implies consent to post-arrest evidentiary breath testing. Refusing post-arrest chemical tests results in immediate administrative license suspension (typically 12 months) and can be used as evidence of guilt in court.',
        legalGuidance: 'While you may lawfully refuse roadside preliminary breath tests (PBT) and field sobriety exercises in most states before arrest, post-arrest tests trigger severe implied consent statutory penalties.',
        mandatoryAlternative: 'Comply with the lawful post-arrest evidentiary breath test required by statute, but request to consult with legal counsel and do not consent to warrantless blood draws without a signed judicial warrant.'
      };
    }

    // Feature 9: Refusal to Exit Vehicle Upon Officer Order
    if (feature === 'disobey_mimms_exit_order') {
      return {
        isLegal: false,
        feature,
        featureName: 'Refusal to Step Out of Vehicle Upon Lawful Order',
        stateCode: code,
        stateName: resolvedStateName,
        statuteCitation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
        reason: 'Under the landmark Supreme Court ruling Pennsylvania v. Mimms, an officer conducting a lawful traffic stop has the absolute constitutional authority to order the driver (and passengers under Maryland v. Wilson) to exit the vehicle for officer safety, with no additional justification needed.',
        legalGuidance: 'Refusing an exit order is physical obstruction / resisting an officer and will lead to window breakage, physical extraction, and arrest.',
        mandatoryAlternative: 'Comply with the physical exit order immediately. Keep hands visible, step out slowly, and state verbally: "Officer, I am complying with your order to step out, but I do not consent to any searches of my person or vehicle."'
      };
    }

    // Default: Legal under Federal & State Law
    return {
      isLegal: true,
      feature,
      featureName: 'Constitutional Legal Feature',
      stateCode: code,
      stateName: resolvedStateName,
      statuteCitation: 'U.S. Constitution (1st, 4th, 5th Amendments)',
      reason: 'This feature is fully lawful under both state and federal constitutional standards.',
      legalGuidance: 'Protected under First Amendment public recording precedents and Fifth Amendment self-incrimination clauses.',
      mandatoryAlternative: ''
    };
  }

  /**
   * Returns a list of all active statutory warnings for a given state
   */
  public static getStateComplianceSummary(stateCode: string): {
    twoPartyWiretap: boolean;
    strictHandsFree: boolean;
    dutyToInformFirearms: boolean;
    stopAndIdentify: boolean;
    distanceBufferLaw?: number;
    summaryNotes: string[];
  } {
    const code = (stateCode || 'FED').toUpperCase();
    const twoParty = Boolean(TWO_PARTY_CONSENT_STATES[code]);
    const handsFree = Boolean(STRICT_HANDS_FREE_STATES[code]);
    const buffer = BUFFER_DISTANCE_STATES[code]?.distanceFeet;

    // Duty to inform states (immediate affirmative disclosure required when stopped with licensed concealed firearm)
    const dutyToInformStates = ['TX', 'OH', 'MI', 'NC', 'NE', 'AK', 'LA', 'SC', 'OK', 'ME'];
    const dutyToInform = dutyToInformStates.includes(code);

    // Stop and Identify states (pedestrians must provide name upon reasonable suspicion)
    const stopAndIdStates = ['NV', 'UT', 'AZ', 'CO', 'FL', 'GA', 'IL', 'IN', 'KS', 'LA', 'MO', 'MT', 'NE', 'NH', 'NM', 'ND', 'OH', 'RI', 'TX', 'VT', 'WI'];
    const stopAndIdentify = stopAndIdStates.includes(code);

    const notes: string[] = [];
    if (twoParty) {
      notes.push(`⚠️ ${TWO_PARTY_CONSENT_STATES[code].name} is an All-Party Wiretap State: Audible notice that recording is active is required.`);
    } else {
      notes.push(`✅ ${code} is a One-Party Consent State: Single-party recording is lawful under state law.`);
    }

    if (dutyToInform) {
      notes.push(`🚨 Duty to Inform State: If carrying a concealed firearm, you have an affirmative legal duty to inform the officer immediately upon contact.`);
    } else {
      notes.push(`ℹ️ No Affirmative Duty to Inform: In ${code}, you are not legally required to volunteer firearm status unless specifically asked.`);
    }

    if (stopAndIdentify) {
      notes.push(`📋 Stop-and-Identify Jurisdiction: If lawfully detained upon reasonable suspicion, you must state your name.`);
    }

    if (buffer) {
      notes.push(`📏 Statutory Buffer: Maintain at least ${buffer} feet of distance when filming law enforcement.`);
    }

    return {
      twoPartyWiretap: twoParty,
      strictHandsFree: handsFree,
      dutyToInformFirearms: dutyToInform,
      stopAndIdentify,
      distanceBufferLaw: buffer,
      summaryNotes: notes
    };
  }
}
