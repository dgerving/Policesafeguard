import { LegalAnalysisResult, JurisdictionLaw, EncounterType } from '../types';
import { getJurisdictionByCode } from '../data/jurisdictions';

export class AiLegalEngine {
  /**
   * Analyzes an officer or citizen statement against constitutional law and state statutes,
   * tailored to the specific encounter setting (traffic stop, home, walking, public filming).
   */
  static analyzeStatement(
    statement: string,
    jurisdictionStateCode = 'US',
    isPassenger = false,
    encounterType: EncounterType = 'traffic_stop'
  ): LegalAnalysisResult {
    const text = statement.toLowerCase().trim();
    const law: JurisdictionLaw = getJurisdictionByCode(jurisdictionStateCode);

    // ==========================================
    // 1. HOME & RESIDENCE ENCOUNTERS (Payton v. New York)
    // ==========================================
    if (encounterType === 'home_encounter') {
      // 1A. Police demand to open door / enter home
      if (
        text.includes('open the door') ||
        text.includes('open up') ||
        text.includes('police open') ||
        text.includes('let us in') ||
        text.includes('can we come in') ||
        text.includes('come inside') ||
        text.includes('step outside your house') ||
        text.includes('come out of the house')
      ) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REFUSE: Warrantless Home Entry',
          recommendedResponse: 'Keep door closed/locked. Speak through door: "Officers, do you have a search warrant signed by a judge? If not, I do not consent to you entering my home and I choose not to open the door."',
          legalCitation: 'Payton v. New York, 445 U.S. 573 (1980) & Fourth Amendment',
          statuteOrCase: 'Under the Fourth Amendment, physical entry of the home is the chief evil against which the wording is directed. Police cannot enter a private home without a search warrant signed by a neutral magistrate, consent, or active exigent circumstances.',
          explanation: 'You are under no legal obligation to open your door or step outside your home for police unless they possess a valid search warrant. Speaking through the locked door or window fully preserves your rights.',
          deEscalationTip: 'Speak politely but firmly through the closed door. Do not crack the door open, as officers may claim "plain view" or push their way inside.',
          confidence: 0.99,
          severity: 'critical'
        };
      }

      // 1B. Claiming to have a warrant
      if (
        text.includes('have a warrant') ||
        text.includes('got a warrant') ||
        text.includes('search warrant') ||
        text.includes('arrest warrant')
      ) {
        return {
          category: 'ASK_CLARIFY',
          headline: 'WARRANT VERIFICATION: Request Document Review',
          recommendedResponse: 'Keep door locked: "Please slide the warrant under the door or hold it up to the window so I can verify the judge\'s signature, address, and scope."',
          legalCitation: 'Federal Rules of Criminal Procedure Rule 41 & Steagald v. United States, 451 U.S. 204 (1981)',
          statuteOrCase: 'Residents have the right to inspect a search warrant to verify it names the correct address and is signed by a judge. Note: An arrest warrant for another person does NOT permit searching your home without a separate search warrant (Steagald v. US).',
          explanation: 'Verify if the document is an administrative warrant (e.g. code enforcement/ICE) vs a judicial criminal search warrant signed by a state or federal judge.',
          deEscalationTip: 'If officers force entry with a warrant, do not physically impede them. Verbally object: "I am complying under duress but I do not consent to any search outside the warrant\'s exact boundaries."',
          confidence: 0.98,
          severity: 'critical'
        };
      }

      // 1C. Knock and Talk / "Just want to talk"
      if (
        text.includes('just want to talk') ||
        text.includes('talk to you') ||
        text.includes('ask a few questions') ||
        text.includes('neighborhood check') ||
        text.includes('knock and talk')
      ) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REFUSE: Consensual "Knock-and-Talk"',
          recommendedResponse: 'Through closed door: "Officers, I do not wish to speak with you or answer any questions without my attorney. Please step off my property."',
          legalCitation: 'Florida v. Jardines, 569 U.S. 1 (2013)',
          statuteOrCase: 'A "knock-and-talk" is strictly consensual. Police on your curtilage have no greater legal authority than a private delivery person. Once you revoke consent, they must leave your curtilage unless they have probable cause and exigency.',
          explanation: 'Police frequently use friendly informal visits to gather admissions, observe interior odors, or obtain voluntary consent to search. Silence or refusal cannot be penalized.',
          deEscalationTip: 'Be brief and respectful: "Have a good day officers, please leave the premises."',
          confidence: 0.96,
          severity: 'high'
        };
      }

      // 1D. Residential search consent request
      if (
        text.includes('look around') ||
        text.includes('search the house') ||
        text.includes('search your apartment') ||
        text.includes('check inside') ||
        text.includes('mind if we look')
      ) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ABSOLUTE RIGHT TO REFUSE: Residential Search Consent',
          recommendedResponse: 'Unambiguous refusal: "I do not consent to any search of my home, curtilage, or personal effects."',
          legalCitation: 'Georgia v. Randolph, 547 U.S. 103 (2006) & Schneckloth v. Bustamonte',
          statuteOrCase: 'Under Georgia v. Randolph, if any physically present co-occupant expressly objects to a search, the police cannot conduct a consent search even if another occupant consents.',
          explanation: 'Never consent to a residential search. If police enter unlawfully over your objection, any evidence seized can be suppressed in court under the Exclusionary Rule (Mapp v. Ohio).',
          deEscalationTip: 'Keep your hands visible. Record the officer badge numbers and the exact refusal audio.',
          confidence: 0.99,
          severity: 'critical'
        };
      }
    }

    // ==========================================
    // 2. WALKING & PEDESTRIAN STOPS (Terry v. Ohio)
    // ==========================================
    if (encounterType === 'walking_street') {
      // 2A. Pedestrian stop / "Stop right there" / "Where are you going"
      if (
        text.includes('stop right there') ||
        text.includes('come here') ||
        text.includes('where are you going') ||
        text.includes('where are you headed') ||
        text.includes('what are you doing around here') ||
        text.includes('hold up') ||
        text.includes('freeze')
      ) {
        return {
          category: 'ASK_CLARIFY',
          headline: 'CRITICAL INQUIRY: Establish Detention vs. Consensual Encounter',
          recommendedResponse: 'Stop calmly, hands open at waist height: "Officer, am I free to leave, or am I being detained?"',
          legalCitation: 'United States v. Mendenhall, 446 U.S. 544 (1980) & Florida v. Royer, 460 U.S. 491 (1983)',
          statuteOrCase: 'In a consensual encounter, you may simply walk away. An officer cannot lawfully detain a pedestrian without reasonable, articulable suspicion (RAS) that crime is afoot.',
          explanation: 'Asking "Am I free to leave?" puts the burden on the officer. If they say "Yes", say "Thank you, I am choosing to go about my day" and walk away calmly. If they say "No", you are officially detained under Terry v. Ohio and constitutional protections attach.',
          deEscalationTip: 'Do not run or make sudden movements. Stand still and ask the question calmly.',
          confidence: 0.98,
          severity: 'high'
        };
      }

      // 2B. Pedestrian ID Demand
      if (
        text.includes('show me your id') ||
        text.includes('give me your id') ||
        text.includes('who are you') ||
        text.includes('what is your name') ||
        text.includes('got any identification') ||
        text.includes('identify yourself')
      ) {
        if (!law.stopAndIdentify) {
          return {
            category: 'RIGHT_TO_REFUSE',
            headline: 'NO STOP-AND-ID STATUTE: Walking on Foot',
            recommendedResponse: 'Inquire politely: "Officer, am I suspected of committing a specific crime, or am I free to decline providing identification?"',
            legalCitation: `${law.stateName} Law (No Stop-and-ID) & Brown v. Texas, 443 U.S. 47 (1979)`,
            statuteOrCase: 'In states without Stop-and-Identify statutes, pedestrians are not legally required to identify themselves unless they are under lawful arrest supported by probable cause.',
            explanation: 'Unlike driving a motor vehicle (which requires a license), simply walking in public does not require carrying or presenting government ID.',
            deEscalationTip: 'If the officer threatens immediate arrest for obstruction, provide your legal name verbally to prevent unlawful physical force, while stating: "I am providing my name under duress."',
            confidence: 0.95,
            severity: 'medium'
          };
        } else {
          return {
            category: 'ASK_CLARIFY',
            headline: 'STOP-AND-ID JURISDICTION: Reasonable Suspicion Required',
            recommendedResponse: 'Inquire: "Officer, what is your reasonable articulable suspicion that I have committed a crime? Am I being detained?"',
            legalCitation: `${law.stateName} Statute: ${law.stopAndIdentifyStatute} & Hiibel v. Nevada, 542 U.S. 177 (2004)`,
            statuteOrCase: law.stopAndIdentifySummary,
            explanation: 'Even in Stop-and-ID states, the Supreme Court held in Hiibel that officers CANNOT demand ID on a whim; they MUST possess individualized reasonable suspicion that you were involved in criminal activity.',
            deEscalationTip: 'If the officer states a valid suspicion of an infraction/crime, you must provide your true name and DOB (or physical ID if required by statute).',
            confidence: 0.94,
            severity: 'high'
          };
        }
      }

      // 2C. Frisk / Pat Down / Empty Pockets
      if (
        text.includes('pat you down') ||
        text.includes('frisk') ||
        text.includes('empty your pockets') ||
        text.includes('check your bag') ||
        text.includes('hands on your head') ||
        text.includes('put your hands on the wall')
      ) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REFUSE SEARCH: Terry Frisk Limitations',
          recommendedResponse: 'Comply physically without resisting, but state verbally: "Officer, I do not consent to any pat down, frisk, or search of my person or pockets."',
          legalCitation: 'Terry v. Ohio, 392 U.S. 1 (1968) & Minnesota v. Dickerson, 508 U.S. 366 (1993)',
          statuteOrCase: 'A pat-down is permissible ONLY if the officer has independent reasonable suspicion that you are presently ARMED AND DANGEROUS. It is strictly limited to feeling for weapons on outer clothing. Officers cannot manipulate pockets to search for drugs (Plain Feel Doctrine).',
          explanation: 'Never physically fight or resist a frisk. Clearly verbalize non-consent so that any contraband discovered through an illegal manipulation can be excluded in court.',
          deEscalationTip: 'Keep hands completely still and relaxed. State clearly: "I am not resisting, but I do not consent to this search."',
          confidence: 0.97,
          severity: 'critical'
        };
      }
    }

    // ==========================================
    // 3. PUBLIC SPACE & FILMING POLICE (First Amendment)
    // ==========================================
    if (encounterType === 'public_recording') {
      // 3A. Demands to stop filming or delete video
      if (
        text.includes('stop filming') ||
        text.includes('turn that camera off') ||
        text.includes('put that phone away') ||
        text.includes('delete that video') ||
        text.includes('you cannot record here') ||
        text.includes('against the law to record')
      ) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'FIRST AMENDMENT RIGHT: Filming Police in Public',
          recommendedResponse: 'Keep camera recording: "Officer, I am exercising my First Amendment right to record public officials in a public space. I am not interfering with your duties."',
          legalCitation: 'Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011) & Turner v. Driver, 848 F.3d 678 (5th Cir. 2017)',
          statuteOrCase: 'Federal courts across the United States have repeatedly ruled that the public has a clearly established First Amendment right to record law enforcement officers carrying out their duties in public forums.',
          explanation: 'Officers cannot order you to stop filming or demand that you delete video. Threatening arrest or retaliating against a citizen for recording is a civil rights violation under 42 U.S.C. § 1983.',
          deEscalationTip: 'Do not scream or antagonize. Stand still, hold the phone steadily, and maintain a respectful conversational tone.',
          confidence: 0.99,
          severity: 'critical'
        };
      }

      // 3B. Distance & Obstruction commands ("Step back")
      if (
        text.includes('step back') ||
        text.includes('back up') ||
        text.includes('give us room') ||
        text.includes('out of the crime scene') ||
        text.includes('move across the street')
      ) {
        return {
          category: 'MUST_COMPLY',
          headline: 'REASONABLE BUFFER: Step Back While Continuing to Record',
          recommendedResponse: 'Take slow steps backward while filming: "Yes officer, I am stepping back to a safe distance while maintaining my continuous recording."',
          legalCitation: 'Colten v. Kentucky, 407 U.S. 104 (1972) (Reasonable Time/Place/Manner Restrictions)',
          statuteOrCase: 'While you have a right to record, police may establish a reasonable perimeter for safety and non-interference (typically 10-15 feet). Refusing to step back when ordered can lead to a lawful arrest for obstruction.',
          explanation: 'Comply with the physical distance directive so the officer cannot manufacture an obstruction charge. Keep the camera focused on the interaction from the new vantage point.',
          deEscalationTip: 'Announce each backward step: "Taking three steps back now, still filming."',
          confidence: 0.96,
          severity: 'medium'
        };
      }

      // 3C. Seizure of phone / recording equipment
      if (
        text.includes('give me that phone') ||
        text.includes('confiscate your camera') ||
        text.includes('take your phone as evidence') ||
        text.includes('hand over the camera')
      ) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REFUSE: Warrantless Equipment Seizure',
          recommendedResponse: 'Hold phone securely: "Officer, this device contains privileged personal data. I do not consent to any seizure or search of my recording equipment without a warrant."',
          legalCitation: 'Riley v. California, 573 U.S. 373 (2014) & Fourth Amendment',
          statuteOrCase: 'Police cannot seize a citizen\'s camera simply because it captured a recording of police, unless exigent circumstances exist (e.g. imminent destruction of evidence of a violent felony). Even if seized, they cannot search contents without a warrant.',
          explanation: 'Police SafeGuard automatically streams and encrypts your footage to the secure court evidence vault so footage is protected even if the physical phone is confiscated.',
          deEscalationTip: 'Tap the screen to lock device or trigger Emergency Arrest Lock if they attempt physical snatching.',
          confidence: 0.98,
          severity: 'critical'
        };
      }
    }

    // ==========================================
    // 4. COMMON UNIVERSAL ENCOUNTERS (Traffic, Street, Home)
    // ==========================================

    // 4A. Vehicle Exit Demand (Pennsylvania v. Mimms / Maryland v. Wilson)
    if (
      text.includes('step out') ||
      text.includes('get out of the car') ||
      text.includes('exit the vehicle') ||
      text.includes('out of the vehicle')
    ) {
      return {
        category: 'MUST_COMPLY',
        headline: 'MANDATORY COMPLIANCE: Step Out of Vehicle',
        recommendedResponse: 'Comply smoothly. Keep hands visible: "Yes officer, I am exiting now with my hands visible."',
        legalCitation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977) [Maryland v. Wilson, 519 U.S. 408 (1997) for passengers]',
        statuteOrCase: 'U.S. Supreme Court precedent grants officers absolute authority to order driver and passengers out of a vehicle during a lawful traffic stop for officer safety.',
        explanation: 'Refusing an order to exit is considered obstruction or resisting in all 50 states. You cannot refuse an order to step out, even if you believe the stop itself was unwarranted.',
        deEscalationTip: 'Announce your movements before making them. Exit slowly with hands open at chest height.',
        confidence: 0.99,
        severity: 'high'
      };
    }

    // 4B. Search Request: Trunk, Vehicle interior, Pockets (4th Amendment)
    if (
      text.includes('mind if i look') ||
      text.includes('search your car') ||
      text.includes('search the vehicle') ||
      text.includes('look in the trunk') ||
      text.includes('look in the back') ||
      text.includes('take a look inside') ||
      text.includes('check your trunk') ||
      text.includes('pop the trunk') ||
      text.includes('mind if i search')
    ) {
      return {
        category: 'RIGHT_TO_REFUSE',
        headline: 'RIGHT TO REFUSE: Search Consent Request',
        recommendedResponse: 'Firmly & Politely: "Officer, with all due respect, I do not consent to any searches of my vehicle, person, or belongings."',
        legalCitation: 'Fourth Amendment, U.S. Constitution & Schneckloth v. Bustamonte, 412 U.S. 218 (1973)',
        statuteOrCase: `${law.vehicleSearchConsentRule} Officers often frame searches casually as friendly requests ("Mind if I look?"). A refusal cannot be used to establish probable cause.`,
        explanation: 'Police cannot legally search without a warrant, exigent circumstances, probable cause, or YOUR CONSENT. Never give consent. If they proceed anyway, do not physically stop them; clearly state on audio that you do not consent.',
        deEscalationTip: 'Maintain a calm, respectful tone. Do not yell. The camera & microphone are recording your non-consent for court.',
        confidence: 0.98,
        severity: 'critical'
      };
    }

    // 4C. Driver's License, Registration, Insurance
    if (
      text.includes('license and registration') ||
      text.includes('driver\'s license') ||
      text.includes('proof of insurance') ||
      text.includes('show me your license') ||
      text.includes('id and insurance')
    ) {
      if (isPassenger) {
        return {
          category: 'RIGHT_TO_REFUSE',
          headline: 'PASSENGER RIGHTS: ID Request',
          recommendedResponse: 'Politely Inquire: "Officer, am I suspected of committing a crime, or am I free to decline providing identification?"',
          legalCitation: 'Brendlin v. California, 551 U.S. 249 (2007) & ' + (law.stopAndIdentifyStatute || '4th Amendment'),
          statuteOrCase: law.passengerIdRequirement,
          explanation: 'In most states, passengers in a vehicle during a traffic stop are not legally required to provide identification unless the officer has independent reasonable articulable suspicion of an offense.',
          deEscalationTip: 'If the officer insists under threat of arrest, say: "I am providing my name under duress and over my objection."',
          confidence: 0.94,
          severity: 'medium'
        };
      }

      return {
        category: 'MUST_COMPLY',
        headline: 'MANDATORY COMPLIANCE: Present Driver Documents',
        recommendedResponse: 'Acknowledge calmly: "Yes officer. My license and registration are in my wallet/glovebox. I am reaching for them now."',
        legalCitation: `${law.stateName} Vehicle Code & Delaware v. Prouse, 440 U.S. 648 (1979)`,
        statuteOrCase: 'Operating a motor vehicle on public roads is conditioned on producing a valid driver license, registration, and proof of financial responsibility upon lawful request by a peace officer.',
        explanation: 'You are legally required to produce these three documents. Failure to produce them is an arrestable traffic misdemeanor in almost every jurisdiction.',
        deEscalationTip: 'State where the documents are located before moving your hands, especially at night.',
        confidence: 0.99,
        severity: 'medium'
      };
    }

    // 4D. Smartphone / Passcode Demand
    if (
      text.includes('unlock your phone') ||
      text.includes('give me your phone') ||
      text.includes('hand over your phone') ||
      text.includes('let me see your phone') ||
      text.includes('passcode') ||
      text.includes('password') ||
      text.includes('who were you texting')
    ) {
      return {
        category: 'RIGHT_TO_REFUSE',
        headline: 'ABSOLUTE RIGHT TO REFUSE: Smartphone Search',
        recommendedResponse: 'Declare Clearly: "Officer, I do not consent to any search of my phone, and under the Fifth Amendment, I decline to provide my passcode."',
        legalCitation: 'Riley v. California, 573 U.S. 373 (2014) & 5th Amendment Privilege Against Self-Incrimination',
        statuteOrCase: 'U.S. Supreme Court held unanimously that police must obtain a warrant before searching digital contents of a cell phone seized incident to arrest.',
        explanation: 'Officers cannot compel you to disclose a memorized passcode (it constitutes testimonial self-incrimination under the 5th Amendment). Note: Emergency Arrest Lockdown should be armed to prevent compelled biometric unlocks.',
        deEscalationTip: 'Do not touch the screen with your face or fingerprint if detained; keep the phone in passcode-only lock state.',
        confidence: 0.99,
        severity: 'critical'
      };
    }

    // 4E. Interrogations ("Where are you coming from?", "What's in the car?")
    if (
      text.includes('where are you coming from') ||
      text.includes('where are you going') ||
      text.includes('where are you headed') ||
      text.includes('what are you doing out') ||
      text.includes('have you had anything to drink') ||
      text.includes('had a few beers') ||
      text.includes('anything illegal in the car') ||
      text.includes('weapons or narcotics')
    ) {
      return {
        category: 'RIGHT_TO_REFUSE',
        headline: 'RIGHT TO REMAIN SILENT: Investigative Questions',
        recommendedResponse: 'Invoke Fifth Amendment: "Officer, I am choosing to exercise my Fifth Amendment right to remain silent, and I decline to answer questions without an attorney present."',
        legalCitation: 'Fifth Amendment, U.S. Constitution & Salinas v. Texas, 570 U.S. 178 (2013)',
        statuteOrCase: 'You are never required to answer investigative questions. Under Salinas v. Texas, you must explicitly invoke your right to remain silent; staying silently passive is not enough.',
        explanation: 'Officers ask casual questions like "Where are you coming from?" to establish timelines, inconsistent statements, or admissions of having "just one drink" that later form probable cause for arrest.',
        deEscalationTip: 'Do not argue or lie. A simple polite invocation protects your entire legal standing in court.',
        confidence: 0.96,
        severity: 'high'
      };
    }

    // 4F. Prolonged Wait / Dog Sniff / Delay
    if (
      text.includes('waiting for a dog') ||
      text.includes('k-9 unit') ||
      text.includes('k9') ||
      text.includes('sit tight') ||
      text.includes('waiting for backup') ||
      text.includes('takes a while')
    ) {
      return {
        category: 'ASK_CLARIFY',
        headline: 'CONSTITUTIONAL OBJECTION: Prolonged Detention',
        recommendedResponse: 'Formal Inquiry: "Officer, has the mission of this stop concluded? Am I free to leave, or am I being detained?"',
        legalCitation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
        statuteOrCase: 'Supreme Court ruled that police cannot prolong a completed traffic stop to conduct a dog sniff or await a K-9 without independent reasonable suspicion.',
        explanation: 'A stop becomes unlawful if prolonged beyond the time reasonably required to complete the mission. Asking "Am I free to leave?" triggers the constitutional clock for evidence suppression.',
        deEscalationTip: 'Note the exact time elapsed on your video recording watermark for your attorney.',
        confidence: 0.97,
        severity: 'high'
      };
    }

    // 4G. Field Sobriety Tests
    if (
      text.includes('sobriety test') ||
      text.includes('walk the line') ||
      text.includes('heel to toe') ||
      text.includes('follow my finger') ||
      text.includes('blow into this') ||
      text.includes('breathalyzer') ||
      text.includes('eye test')
    ) {
      const isPBT = text.includes('blow') || text.includes('breathalyzer');
      return {
        category: 'RIGHT_TO_REFUSE',
        headline: isPBT ? 'ROAD-SIDE BREATH TEST: Voluntary in Most States' : 'FIELD SOBRIETY EXERCISES: Strictly Voluntary',
        recommendedResponse: 'Polite Refusal: "Officer, I respectfully decline to perform voluntary physical agility exercises or preliminary roadside tests."',
        legalCitation: `${law.stateName} Sobriety Laws & ${law.preliminaryBreathTestRule}`,
        statuteOrCase: 'Standardized Field Sobriety Tests (SFSTs) are designed to gather subjective evidence for arrest. Refusing them is not a crime in nearly all states.',
        explanation: 'Note distinction: Pre-arrest roadside field tests are voluntary. Post-arrest chemical tests (at police station/hospital) are subject to state Implied Consent laws with driver license suspension penalties.',
        deEscalationTip: 'Do not argue about whether you are sober. Simply decline the physical coordination exercises politely.',
        confidence: 0.95,
        severity: 'high'
      };
    }

    // 4H. Arrest / Handcuffs / "You are under arrest"
    if (
      text.includes('under arrest') ||
      text.includes('put your hands behind your back') ||
      text.includes('turn around') ||
      text.includes('handcuff')
    ) {
      return {
        category: 'MUST_COMPLY',
        headline: 'ARREST PROCEDURE: Comply Physically / Invoke 5th & 6th Rights',
        recommendedResponse: 'Comply with handcuffs without resistance: "I am not resisting. I am exercising my right to remain silent and I demand my attorney."',
        legalCitation: 'Miranda v. Arizona, 384 U.S. 436 (1966) & 6th Amendment Right to Counsel',
        statuteOrCase: 'Physical resistance to arrest, even if you believe the arrest is illegal, is a separate criminal felony/misdemeanor in all jurisdictions.',
        explanation: 'TRIGGER ARREST LOCKDOWN NOW on your screen. The app will encrypt all local evidence with AES-256 and lock the phone. Do not speak any words other than demanding an attorney.',
        deEscalationTip: 'Physical compliance prevents bodily harm. Legal fights happen in court, never during the encounter.',
        confidence: 0.99,
        severity: 'critical'
      };
    }

    // Default neutral/general advice based on encounter type
    let defaultHeadline = 'POLICE SAFEGUARD AI: Active Legal Copilot';
    let defaultResponse = 'Speak politely and calmly. Keep hands visible. Await clear officer instructions.';
    if (encounterType === 'home_encounter') {
      defaultHeadline = 'HOME ENCOUNTER: Fourth Amendment Curtilage Active';
      defaultResponse = 'Keep your front door closed and locked. Speak calmly through the door. Ask to see a signed search warrant.';
    } else if (encounterType === 'walking_street') {
      defaultHeadline = 'STREET STOP: Pedestrian Rights Monitor Active';
      defaultResponse = 'Stay calm. Keep hands out of pockets. Ask: "Am I free to leave, or am I being detained?"';
    } else if (encounterType === 'public_recording') {
      defaultHeadline = 'PUBLIC FORUM: First Amendment Recording Active';
      defaultResponse = 'Keep camera rolling steadily. Maintain a respectful 10-15 foot distance from police operations.';
    }

    return {
      category: 'NEUTRAL_NOTICE',
      headline: defaultHeadline,
      recommendedResponse: defaultResponse,
      legalCitation: 'First, Fourth, Fifth, and Fourteenth Amendments, U.S. Constitution',
      statuteOrCase: `${law.recordingPoliceNotes} You are actively recording this encounter with tamper-proof cryptographic audit trail.`,
      explanation: 'The AI Rights Protection Guide is actively listening to dialogue and verifying compliance against federal and state statutes.',
      deEscalationTip: 'Stay calm, keep your movements minimal and visible.',
      confidence: 0.85,
      severity: 'low'
    };
  }
}
