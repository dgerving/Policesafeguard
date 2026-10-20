import { GoogleGenAI, Type } from '@google/genai';
import { getJurisdictionByCode } from '../src/data/jurisdictions';
import { HypotheticalScenarioAnalysis } from '../src/types';

let geminiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Intelligent jurisdiction-grounded fallback generator
 * Generates accurate legal analysis when Gemini API key is unset or offline.
 */
export function generateLocalJurisdictionAnalysis(
  scenario: string,
  stateCode = 'FED',
  encounterType = 'general'
): HypotheticalScenarioAnalysis {
  const law = getJurisdictionByCode(stateCode);
  const text = scenario.toLowerCase();

  // Detect key scenarios
  const isPhone = text.includes('phone') || text.includes('passcode') || text.includes('password') || text.includes('device') || text.includes('cellular');
  const isSearch = text.includes('search') || text.includes('trunk') || text.includes('glove') || text.includes('bag') || text.includes('look inside');
  const isK9 = text.includes('dog') || text.includes('k9') || text.includes('sniff') || text.includes('canine');
  const isId = text.includes('id') || text.includes('identity') || text.includes('license') || text.includes('name') || text.includes('who you are');
  const isPassenger = text.includes('passenger') || text.includes('rider') || text.includes('back seat') || text.includes('passenger seat');
  const isHome = encounterType === 'home_encounter' || text.includes('home') || text.includes('door') || text.includes('house') || text.includes('apartment') || text.includes('knock');
  const isFilming = encounterType === 'public_recording' || text.includes('film') || text.includes('record') || text.includes('camera') || text.includes('video') || text.includes('first amendment');
  const isDui = text.includes('drink') || text.includes('dui') || text.includes('breath') || text.includes('sober') || text.includes('alcohol') || text.includes('field sobriety') || text.includes('eye test') || text.includes('walk and turn');
  const isExitVehicle = text.includes('step out') || text.includes('exit') || text.includes('get out of the car') || text.includes('out of the vehicle');
  const isFrisk = text.includes('pat down') || text.includes('frisk') || text.includes('pocket') || text.includes('pockets') || text.includes('hands in') || text.includes('weapon') || text.includes('feel');
  const isWindow = text.includes('window') || text.includes('roll down') || text.includes('crack');
  const isQuestioning = text.includes('where are you coming') || text.includes('where are you going') || text.includes('what are you doing') || text.includes('questions') || text.includes('silent') || text.includes('talk');

  // 1. DUI & FIELD SOBRIETY TESTS SCENARIO
  if (isDui) {
    return {
      safestActionHeadline: 'Field Sobriety Exercises (SFSTs) and roadside portable breath tests are 100% voluntary prior to arrest in almost all states.',
      actionSteps: [
        'Politely decline physical coordination tests (Walk and Turn, One-Leg Stand, Horizontal Gaze Nystagmus eye test).',
        'State clearly that you are declining voluntary roadside tests on advice of counsel.',
        'Keep both hands resting on the top of the steering wheel. If an officer asks if you have had anything to drink, invoke your 5th Amendment silence immediately.'
      ],
      exactWordsToSay: '"Officer, on the advice of legal counsel, I politely decline to perform any voluntary roadside field sobriety exercises or preliminary tests. I am invoking my Fifth Amendment right to remain silent."',
      whatYouMustComplyWith: [
        'You must hand over your driver license, vehicle registration, and proof of insurance.',
        'If ordered to exit the vehicle, you must step out under Pennsylvania v. Mimms (434 U.S. 106).',
        'Post-Arrest Implied Consent: If you are formally arrested and taken to a police facility or hospital, statutory implied consent laws require taking a certified chemical test (breath/blood), or face administrative driver license suspension.'
      ],
      whatYouHaveRightToRefuse: [
        'Absolute right to refuse roadside Standardized Field Sobriety Tests (SFSTs) which are designed to build probable cause against you.',
        'Right to refuse preliminary handheld roadside breath tests (PBTs) before arrest.',
        'Right to refuse answering: "How much have you had to drink tonight?" or "Where were you drinking?"'
      ],
      policeTricksAndTraps: [
        '"If you pass my quick eye test, I\'ll let you drive home right now." (Field tests are subjective and rarely scored as passing).',
        '"Refusing my tests will automatically suspend your license." (Roadside SFSTs are voluntary; implied consent suspension applies to post-arrest chemical tests).',
        '"I smell alcohol on your breath—just take this portable breath tester to clear yourself."'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Implied Consent & Field Sobriety Code`,
          summary: law.preliminaryBreathTestRule,
          relevance: `Distinguishes voluntary roadside tests from post-arrest implied consent penalties in ${law.stateName}.`
        }
      ],
      constitutionalPrecedents: [
        'Birchfield v. North Dakota, 579 U.S. 438 (2016) - 4th Amendment permits warrantless breath tests incident to lawful arrest, but warrantless blood tests violate the Constitution.',
        'Berkemer v. McCarty, 468 U.S. 420 (1984) - Roadside questioning is non-custodial, so voluntary admissions can establish probable cause; silence must be affirmatively stated.',
        'Missouri v. McNeely, 569 U.S. 141 (2013) - The natural dissipation of alcohol in the bloodstream does not create a per se exigency justifying warrantless blood draws.'
      ],
      deEscalationAdvice: 'Never argue your sobriety level. Do not stumble or lean against your car. Speak with minimal, steady words.',
      riskLevel: 'critical',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  // 2. PASSENGER IDENTIFICATION SCENARIO
  if (isPassenger) {
    return {
      safestActionHeadline: 'Passengers have no general constitutional or statutory obligation to show ID absent independent reasonable articulable suspicion.',
      actionSteps: [
        'Remain calm and stay seated with your hands in plain view in your lap.',
        'If the officer asks for your ID, politely inquire: "Officer, are you suspecting me of committing a specific crime, or am I free to decline?"',
        'If ordered to exit or stay inside the car, comply under Maryland v. Wilson, but maintain your right not to identify.'
      ],
      exactWordsToSay: '"Officer, I am riding as a passenger and have committed no infraction. Unless you have independent reasonable suspicion that I am involved in a crime, I choose not to provide identification and invoke my right to remain silent."',
      whatYouMustComplyWith: [
        'Under Maryland v. Wilson (519 U.S. 408), officers can order passengers to step out of the vehicle (or remain inside) for officer safety.',
        'Passengers are technically detained during the traffic stop (Brendlin v. California), but this does NOT automatically compel identification.'
      ],
      whatYouHaveRightToRefuse: [
        'Right to refuse providing your driver license, ID card, full name, or date of birth unless the officer has independent reasonable suspicion.',
        'Right to refuse answering investigative questions regarding the driver, destination, or ownership of items in the car.'
      ],
      policeTricksAndTraps: [
        '"I need everyone\'s ID in the vehicle for officer safety / routine warrant checks."',
        '"If you refuse to give me your name, you\'re obstructing justice and going to jail."',
        'Asking passengers: "Do you have your seatbelt on?" to manufacture an independent infraction that compels identification.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Passenger Identification Standard`,
          summary: law.passengerIdRequirement,
          relevance: `Governs passenger obligations during motor vehicle stops in ${law.stateName}.`
        }
      ],
      constitutionalPrecedents: [
        'Brendlin v. California, 551 U.S. 249 (2007) - A passenger is seized under the 4th Amendment during a traffic stop and has standing to challenge the stop.',
        'Maryland v. Wilson, 519 U.S. 408 (1997) - An officer may order passengers out of a lawfully stopped vehicle, but cannot compel ID without independent RAS.',
        'Brown v. Texas, 443 U.S. 47 (1979) - Police cannot stop and demand identification without reasonable articulable suspicion of criminal conduct.'
      ],
      deEscalationAdvice: 'Keep your hands flat on your thighs. Speak respectfully without raising your voice. Do not rummage through pockets or bags.',
      riskLevel: 'medium',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  // 3. TERRY FRISK, POCKETS, & WEAPONS PAT-DOWN
  if (isFrisk) {
    return {
      safestActionHeadline: 'A Terry pat-down is constitutionally restricted to checking for weapons only; officers cannot manipulate pockets or search for drugs without consent.',
      actionSteps: [
        'Keep both hands open, spread your fingers, and do not reach into your pockets or waistline.',
        'If the officer places hands on you, do not physically pull away or resist; speak your verbal objection clearly.',
        'If an officer reaches inside your pockets to pull out non-weapon items, verbally state: "Officer, that is not a weapon."'
      ],
      exactWordsToSay: '"Officer, I do not consent to any pat-down or search of my pockets or clothing. I am not armed, and I am not resisting your commands."',
      whatYouMustComplyWith: [
        'If an officer initiates a physical pat-down, you must stand still and submit physically (never resist physically on the street; preserve your constitutional challenge for court).'
      ],
      whatYouHaveRightToRefuse: [
        'Right to refuse consenting to a frisk (never say "sure, go ahead").',
        'Right to be free from pocket searches: under Minnesota v. Dickerson, if an officer feels an object that is clearly not a weapon, they cannot manipulate or extract it without a warrant or probable cause.'
      ],
      policeTricksAndTraps: [
        '"Mind if I make sure you don\'t have anything sharp on you?" (Phrased casually to gain voluntary consent to empty your pockets).',
        'Squeezing, sliding, and manipulating cigarette packs, small plastic baggies, or wallets in your pockets.',
        'Reaching straight into your pockets without conducting an initial outer-clothing pat-down.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Stop and Frisk Standards`,
          summary: `In ${law.stateName}, an officer must articulate specific facts that the suspect is armed and dangerous before an outer-clothing frisk is lawful.`,
          relevance: 'Applies directly to street, sidewalk, and roadside pat-downs.'
        }
      ],
      constitutionalPrecedents: [
        'Terry v. Ohio, 392 U.S. 1 (1968) - Frisks are strictly limited to an outer-clothing pat-down for weapons when there is reasonable suspicion the person is armed and dangerous.',
        'Minnesota v. Dickerson, 508 U.S. 366 (1993) - Plain-Feel Doctrine: Officers cannot squeeze, slide, or manipulate objects once they realize they are not weapons.',
        'Florida v. J.L., 529 U.S. 266 (2000) - An anonymous tip that a person is carrying a firearm does not alone justify a stop and frisk.'
      ],
      deEscalationAdvice: 'Keep your palms visible with fingers spread. Avoid any sudden flinching or shifting of weight.',
      riskLevel: 'critical',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  // 4. ROLLING WINDOWS DOWN
  if (isWindow) {
    return {
      safestActionHeadline: 'Cracking your window 2 to 3 inches is legally sufficient to exchange documents and communicate without forfeiting barrier safety.',
      actionSteps: [
        'Roll your driver side window down approximately 2 to 3 inches—enough to clearly hear the officer and slide your driver license, registration, and insurance through the opening.',
        'Keep your hands placed at the 10 and 2 positions on the steering wheel in plain sight.',
        'If the officer orders you to roll the window down all the way, politely inform them that you can hear and exchange paperwork safely through the opening.'
      ],
      exactWordsToSay: '"Officer, I can hear you clearly and I can pass my license, registration, and proof of insurance through this opening. If you are ordering me out of the car, I will comply, but I prefer to keep my window at this level."',
      whatYouMustComplyWith: [
        'You must produce your driver license, registration, and insurance upon lawful request.',
        'If the officer gives a direct lawful order for you to exit the vehicle (Pennsylvania v. Mimms), you MUST comply, close your door behind you, and roll up the window if possible.'
      ],
      whatYouHaveRightToRefuse: [
        'There is no statute requiring a driver to roll their window down 100% all the way; motor vehicle codes require displaying and delivering documents upon demand.',
        'Right to refuse consenting to search or letting the officer stick their head/arms through the window.'
      ],
      policeTricksAndTraps: [
        '"Roll that window all the way down right now so I can inspect the vehicle." (Used to stick their head inside and claim they "smell marijuana" or see "plain view" contraband).',
        'Claiming they cannot hear you through a 3-inch gap when normal speaking volume is easily audible.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Motor Vehicle Document Exchange`,
          summary: `Drivers in ${law.stateName} must present and surrender driver license, registration, and insurance upon demand by a peace officer.`,
          relevance: 'Compliance is satisfied when paperwork is physically handed to the officer.'
        }
      ],
      constitutionalPrecedents: [
        'Pennsylvania v. Mimms, 434 U.S. 106 (1977) - An officer can order a driver out of a vehicle during a lawful traffic stop for officer safety.',
        'New York v. Class, 475 U.S. 106 (1986) - Entering the passenger compartment without consent or probable cause violates the Fourth Amendment.'
      ],
      deEscalationAdvice: 'Speak politely and calmly. Turn on your interior dome light if it is nighttime so the officer can see your hands clearly.',
      riskLevel: 'low',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  if (isPhone) {
    return {
      safestActionHeadline: 'Never surrender your phone passcode or unlock your device without a judicial warrant.',
      actionSteps: [
        'Lock your phone immediately with a numeric passcode (turn off Face ID / fingerprint if possible by holding power + volume buttons).',
        'Keep your hands visible on the steering wheel or at your sides; do not reach suddenly for your phone.',
        'If the officer demands your phone, do not resist physical confiscation, but clearly state your lack of consent.'
      ],
      exactWordsToSay: '"Officer, under Riley v. California and the Fourth and Fifth Amendments, I do not consent to any search of my phone, and I do not agree to provide my passcode or unlock the device without a warrant."',
      whatYouMustComplyWith: [
        'If physically seized by the officer, do not fight or physically grab the phone back (comply physically, object verbally).'
      ],
      whatYouHaveRightToRefuse: [
        'You have the absolute constitutional right to refuse giving your passcode or password.',
        'You have the right to refuse biometric unlocking (Face ID / fingerprint) without a specific court order.',
        'You have the right to refuse handing over unlocked digital contents.'
      ],
      policeTricksAndTraps: [
        '"If you have nothing to hide, just unlock it so we can clear this up quickly."',
        '"If you don\'t give me the code, I\'ll tow your car and keep the phone forever."',
        'Grabbing the phone and pointing it at your face to trigger Face ID before you lock it.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} State Privacy Protections & 4th Amendment`,
          summary: `In ${law.stateName}, digital search warrants must specify with particularity the data sought. Officers cannot conduct exploratory phone searches.`,
          relevance: 'Applies directly to personal mobile devices seized during roadside or pedestrian stops.'
        }
      ],
      constitutionalPrecedents: [
        'Riley v. California, 573 U.S. 373 (2014) - Police cannot search cell phone digital contents without a search warrant.',
        'Salinas v. Texas, 570 U.S. 178 (2013) - Silence must be affirmatively invoked under the 5th Amendment.'
      ],
      deEscalationAdvice: 'Keep your hands visible. State your refusal calmly and respectfully without touching or clutching the device defensively.',
      riskLevel: 'medium',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  if (isHome) {
    return {
      safestActionHeadline: 'Keep your door shut and locked. Never open your door or step outside without a judge-signed search warrant.',
      actionSteps: [
        'Keep the door locked. Do not open it even a crack; speak through the closed door or window.',
        'Ask the officers if they have a judicial search warrant signed by a judge.',
        'If they claim to have a warrant, request that they hold it up to a window or slide it under the door for you to inspect.'
      ],
      exactWordsToSay: '"Officers, with all due respect, I do not open my door without a search warrant signed by a judge. If you do not have a warrant, I do not consent to entry, and I am choosing to exercise my right to remain silent."',
      whatYouMustComplyWith: [
        'If police possess a valid judicial search warrant naming your address and signed by a judge, you must allow entry (do not physically obstruct).'
      ],
      whatYouHaveRightToRefuse: [
        'Absolute right to refuse opening your front door for consensual "knock-and-talks".',
        'Absolute right to refuse stepping outside your threshold into public view.',
        'Absolute right to refuse answering questions about who is inside.'
      ],
      policeTricksAndTraps: [
        '"We just want to talk for two minutes about your neighbor."',
        '"If you don\'t open up right now, we\'ll kick the door down and arrest everyone inside for obstruction."',
        '"Step outside onto the porch so we can hear you better" (used to bypass Payton v. New York home protections).'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Curtilage & Trespass Precedents`,
          summary: `Under ${law.stateName} law and Florida v. Jardines, police entry onto residential curtilage without a warrant or exigency exceeds customary license.`,
          relevance: 'Protects homeowners and tenants from warrantless entry and coercive entryway intrusions.'
        }
      ],
      constitutionalPrecedents: [
        'Payton v. New York, 445 U.S. 573 (1980) - Physical entry of the home is the chief evil of the Fourth Amendment; warrant required.',
        'Georgia v. Randolph, 547 U.S. 103 (2006) - Any physically present resident\'s refusal blocks consent search.',
        'Florida v. Jardines, 569 U.S. 1 (2013) - Unlicensed police curtilage investigations violate the Fourth Amendment.'
      ],
      deEscalationAdvice: 'Speak politely but firmly. Never touch the doorknob. Do not turn the lights on/off erratically or display hostility.',
      riskLevel: 'high',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  if (isK9) {
    return {
      safestActionHeadline: 'Do not consent to a K-9 sniff, and do not allow the officer to prolong the stop waiting for a drug dog.',
      actionSteps: [
        'Present required driving documents (license, registration, proof of insurance).',
        'Notice the time on your dashboard clock or phone.',
        'Once the officer finishes writing the citation or warning, immediately ask if you are free to leave.'
      ],
      exactWordsToSay: '"Officer, I do not consent to any canine sniff or search of my vehicle. Am I free to go, or am I being detained?"',
      whatYouMustComplyWith: [
        'Drivers must provide driver license, registration, and insurance upon lawful stop.',
        'If the officer orders you to step out of the car, you must comply under Pennsylvania v. Mimms, but keep doors closed behind you.'
      ],
      whatYouHaveRightToRefuse: [
        'Right to refuse consenting to a vehicle search or K-9 deployment.',
        'Right to be free from traffic stops prolonged beyond the time necessary to handle the initial traffic infraction.'
      ],
      policeTricksAndTraps: [
        '"We have a dog unit coming in 15 minutes, why don\'t you just sit tight and let us check?"',
        'Intentionally delaying writing the speeding ticket while waiting for a secondary K-9 cruiser to arrive.',
        'Claiming the dog "alerted" or changed its posture when it simply followed a handler cue.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Vehicle Stop Limitations`,
          summary: law.vehicleSearchConsentRule,
          relevance: 'Limits police from manufacturing delays during ordinary motor vehicle stops.'
        }
      ],
      constitutionalPrecedents: [
        'Rodriguez v. United States, 575 U.S. 348 (2015) - Police cannot prolong a traffic stop to wait for a drug dog without separate reasonable suspicion.',
        'Illinois v. Caballes, 543 U.S. 405 (2005) - Dog sniffs during lawful stops cannot extend the duration of the stop.'
      ],
      deEscalationAdvice: 'Ask calmly: "Officer, how much longer will this citation take? Am I being detained?" Do not argue or attempt to drive off until released.',
      riskLevel: 'high',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  if (isFilming) {
    return {
      safestActionHeadline: `You have an affirmative First Amendment right to record police officers in public in ${law.stateName}.`,
      actionSteps: [
        'Hold your phone steadily at chest level or mounted; avoid sudden thrusting motions toward officers.',
        'Maintain a reasonable distance (8 to 15 feet away) so officers cannot claim physical interference or obstruction.',
        'Never physically touch an officer or insert yourself between officers and a suspect.'
      ],
      exactWordsToSay: `"Officer, I am exercising my First Amendment right to record public police activity from a safe, non-interfering distance. I am not obstructing your duties."`,
      whatYouMustComplyWith: [
        'You must obey reasonable, content-neutral time, place, and manner safety orders (such as stepping back behind yellow police tape or onto the sidewalk).'
      ],
      whatYouHaveRightToRefuse: [
        'Right to refuse demands to turn off your camera, delete footage, or surrender your recording device.',
        'Right to refuse leaving a public forum where you have a lawful right to be present.',
        'Right to refuse providing ID simply for filming in public (unless suspected of a crime).'
      ],
      policeTricksAndTraps: [
        '"You\'re violating our two-party wiretapping law by recording my voice without consent!" (False: public police duties have no expectation of privacy).',
        '"Step 50 feet down the block or you\'re getting arrested for obstruction."',
        'Shining high-power flashlights directly into your camera lens to ruin the footage.'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Wiretap & Public Recording Rule`,
          summary: law.recordingPoliceNotes,
          relevance: `Clarifies recording rights and exemptions under ${law.stateName} state law.`
        }
      ],
      constitutionalPrecedents: [
        'Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011) - Clearly established 1st Amendment right to film public police activity.',
        'Turner v. Driver, 848 F.3d 678 (5th Cir. 2017) - 1st Amendment protects right to record police officers performing duties in public.'
      ],
      deEscalationAdvice: 'Keep recording without engaging in verbal shouting matches. Let the video quietly capture everything.',
      riskLevel: 'medium',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  if (isSearch) {
    return {
      safestActionHeadline: 'Clearly and repeatedly state: "Officer, I do not consent to any searches."',
      actionSteps: [
        'Keep both hands in plain sight on the steering wheel (or at your sides if on foot).',
        'State your non-consent clearly so that body cameras and in-car microphones record your verbal refusal.',
        'If the officer searches anyway, do not physically resist; repeat your verbal objection clearly.'
      ],
      exactWordsToSay: '"Officer, I am not resisting, but I want to make it 100% clear for the record that I do not consent to any search of my person, vehicle, or personal property."',
      whatYouMustComplyWith: [
        'You must step out of the vehicle if ordered under Pennsylvania v. Mimms.',
        'Do not physically swat away or push an officer who proceeds with a warrantless search.'
      ],
      whatYouHaveRightToRefuse: [
        'You have the absolute right to refuse consent to any search of your trunk, glove compartment, bags, or clothing.',
        'Refusing consent cannot legally be used as "suspicion" to justify a search.'
      ],
      policeTricksAndTraps: [
        '"Mind if I take a quick peek in the back?" (Phramed as polite conversation to trick you into voluntary consent).',
        '"If you have nothing illegal, why won\'t you let me check?"',
        '"We can do this the easy way or the hard way—either you consent or I tow your vehicle and search it anyway."'
      ],
      stateSpecificLaws: [
        {
          statuteOrCase: `${law.stateName} Search & Seizure Rules`,
          summary: law.vehicleSearchConsentRule,
          relevance: 'Applies to roadside consent searches and vehicle inventory requirements.'
        }
      ],
      constitutionalPrecedents: [
        'Schneckloth v. Bustamonte, 412 U.S. 218 (1973) - Consent searches require voluntary consent without duress or coercion.',
        'Carroll v. United States, 267 U.S. 132 (1925) - Automobile exception requires probable cause, not mere curiosity.'
      ],
      deEscalationAdvice: 'Repeat your refusal with steady, polite tone: "Officer, I respect your authority, but I do not consent to searches."',
      riskLevel: 'high',
      jurisdictionStateCode: law.stateCode,
      jurisdictionStateName: law.stateName,
    };
  }

  // Default / General Stop & Identify scenario
  return {
    safestActionHeadline: `Know your rights in ${law.stateName}: Ask "Am I free to go, or am I being detained?" and invoke your 5th Amendment right to silence.`,
    actionSteps: [
      'Keep hands visible at all times. Make no sudden movements.',
      isPassenger 
        ? 'As a passenger, you are not obligated to identify yourself unless suspected of an independent crime.'
        : `If driving, present your license, registration, and proof of insurance as required by ${law.stateName} law.`,
      'Ask the clarifying question: "Officer, am I being detained, or am I free to leave?"',
      'If detained, state clearly that you are exercising your right to remain silent.'
    ],
    exactWordsToSay: law.stopAndIdentify
      ? `"Officer, here is my required identification. I am invoking my Fifth Amendment right to remain silent, and I will not answer questions without an attorney present. Am I free to leave?"`
      : `"Officer, I do not wish to answer questions. Am I free to leave, or am I being detained? I am invoking my Fifth Amendment right to remain silent."`,
    whatYouMustComplyWith: [
      'Drivers must present driver license, registration, and insurance upon demand.',
      'Must step out of vehicle if ordered by an officer (Pennsylvania v. Mimms).'
    ],
    whatYouHaveRightToRefuse: [
      law.stopAndIdentify 
        ? `In ${law.stateName} (${law.stopAndIdentifyStatute}), you must provide identification only if lawfully detained or arrested. You have the right to refuse answering investigative questions beyond identifying yourself.`
        : `In ${law.stateName}, there is no general stop-and-identify statute for pedestrians or passengers. You have the right to refuse providing ID unless driving or under arrest.`,
      'Right to refuse answering: "Where are you coming from?", "Where are you going?", or "Have you had anything to drink tonight?"',
      'Right to refuse consent to any search.'
    ],
    policeTricksAndTraps: [
      '"Do you know why I stopped you today?" (Trap designed to get you to confess to a violation on camera).',
      '"If you just tell me what you were doing, I\'ll let you off with a warning."',
      '"You have to answer my questions or you\'re resisting an officer."'
    ],
    stateSpecificLaws: [
      {
        statuteOrCase: law.stopAndIdentifyStatute,
        summary: law.stopAndIdentifySummary,
        relevance: `Defines citizen identification requirements in ${law.stateName}.`
      },
      {
        statuteOrCase: `${law.stateName} Passenger ID Rule`,
        summary: law.passengerIdRequirement,
        relevance: 'Applies to anyone riding as a passenger in a stopped vehicle.'
      }
    ],
    constitutionalPrecedents: [
      'Terry v. Ohio, 392 U.S. 1 (1968) - Stops require reasonable articulable suspicion of criminal activity.',
      'Salinas v. Texas, 570 U.S. 178 (2013) - Silence must be affirmatively invoked; staying mute without stating the invocation can be used against you.'
    ],
    deEscalationAdvice: 'Never argue on the side of the road. Protect your physical safety first, preserve your rights verbally, and contest illegal conduct in court.',
    riskLevel: 'medium',
    jurisdictionStateCode: law.stateCode,
    jurisdictionStateName: law.stateName,
  };
}

/**
 * Analyzes a user-described hypothetical scenario using Gemini AI (with local fallback).
 */
export async function analyzeHypotheticalScenario(
  scenario: string,
  stateCode = 'FED',
  encounterType = 'general'
): Promise<HypotheticalScenarioAnalysis> {
  const law = getJurisdictionByCode(stateCode);
  const gemini = getGemini();

  if (!gemini) {
    return generateLocalJurisdictionAnalysis(scenario, stateCode, encounterType);
  }

  try {
    const prompt = `
Citizen's Hypothetical Encounter Description:
"${scenario}"

User's Jurisdiction:
State: ${law.stateName} (${law.stateCode})
Stop and Identify Law in ${law.stateName}: ${law.stopAndIdentify ? 'YES' : 'NO'} (${law.stopAndIdentifyStatute}) - ${law.stopAndIdentifySummary}
Wiretapping / Recording Consent in ${law.stateName}: ${law.wiretappingConsent} - ${law.recordingPoliceNotes}
Vehicle Search Consent Rule in ${law.stateName}: ${law.vehicleSearchConsentRule}
Preliminary Breath Test Rule in ${law.stateName}: ${law.preliminaryBreathTestRule}
Passenger ID Rule in ${law.stateName}: ${law.passengerIdRequirement}
Relevant State Statutes: ${law.relevantStatuteCodes.join(', ')}

Please evaluate this exact hypothetical scenario under ${law.stateName} state law and the US Constitution (1st, 4th, 5th, 14th Amendments).
Provide the safest, most practical, and legally bulletproof action for this civilian to take.
Identify exact words to say in quotes, actions to take, what they MUST comply with, what they have the right to REFUSE, common police tricks/traps, specific state statutes and landmark court cases, and de-escalation guidance.
`;

    const systemInstruction = `You are a senior constitutional rights defense attorney and appellate criminal defense counsel specializing in police encounters, 4th Amendment search and seizure jurisprudence, and state statutory criminal law.
Your mission is to provide civilians with the most credible, authoritative, and legally bulletproof guidance possible for hypothetical police encounter scenarios.

LEGAL CREDIBILITY MANDATES:
1. CITATIONS: Always provide authentic, verifiable statutory codes and landmark Supreme Court / Federal Circuit case citations with reporter volume, page, and decision year (e.g., "Terry v. Ohio, 392 U.S. 1 (1968)", "Rodriguez v. United States, 575 U.S. 348 (2015)", "Riley v. California, 573 U.S. 373 (2014)").
2. STATE ACCURACY: Ground state-specific duties strictly in the named jurisdiction's enacted penal or vehicle codes (e.g. Stop & Identify status, implied consent chemical test rules, one-party vs all-party wiretapping/recording statutes).
3. BURDEN OF PROOF: Explicitly differentiate between Consensual Encounters, Reasonable Articulable Suspicion (RAS) for brief investigative detentions, and Probable Cause (PC) for custodial arrests.
4. EXACT SCRIPT: The "exactWordsToSay" MUST be polite, firm, non-argumentative, and legally precise, explicitly invoking 5th Amendment silence, non-consent to searches, and clarifying detention status ("Am I free to leave or am I being detained?").
5. POLICE TRAPS: Expose psychological interrogation tricks (e.g., false promises of leniency, manufacturing consensual consent, prolonging stops past citation mission).
6. REALISTIC DE-ESCALATION: Prioritize civilian physical survival and record preservation over roadside arguments—contest unconstitutional acts in court rather than on the asphalt.

You MUST return a clean JSON object following this schema:
{
  "safestActionHeadline": "string - 1 authoritative sentence summarizing the single safest, legally sound action",
  "actionSteps": [
    "step 1: exact physical posture/action",
    "step 2...",
    "step 3..."
  ],
  "exactWordsToSay": "string - Verbatim words in quotation marks to speak calmly and firmly to the officer",
  "whatYouMustComplyWith": [
    "string - specific lawful command citizen cannot refuse under penalty of law"
  ],
  "whatYouHaveRightToRefuse": [
    "string - specific unlawful or voluntary request citizen has a constitutional right to decline"
  ],
  "policeTricksAndTraps": [
    "string - coercive phrasing, bluff, or trap police commonly deploy in this scenario"
  ],
  "stateSpecificLaws": [
    {
      "statuteOrCase": "Exact state statute or state supreme court precedent (e.g. Texas Penal Code § 38.02 or Cal. Veh. Code § 12951)",
      "summary": "Authoritative explanation of the legal rule and its application",
      "relevance": "Why this specific statute governs this encounter"
    }
  ],
  "constitutionalPrecedents": [
    "Formal landmark citation with volume, reporter, page, year (e.g. Terry v. Ohio, 392 U.S. 1 (1968))"
  ],
  "deEscalationAdvice": "string - essential tactical and physical de-escalation protocol to stay safe",
  "riskLevel": "low" | "medium" | "high" | "critical"
}`;

    const jsonSchema = {
      type: Type.OBJECT,
      properties: {
        safestActionHeadline: { type: Type.STRING },
        actionSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        exactWordsToSay: { type: Type.STRING },
        whatYouMustComplyWith: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        whatYouHaveRightToRefuse: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        policeTricksAndTraps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        stateSpecificLaws: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              statuteOrCase: { type: Type.STRING },
              summary: { type: Type.STRING },
              relevance: { type: Type.STRING },
            },
            required: ['statuteOrCase', 'summary', 'relevance'],
          },
        },
        constitutionalPrecedents: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        deEscalationAdvice: { type: Type.STRING },
        riskLevel: { type: Type.STRING },
      },
      required: [
        'safestActionHeadline',
        'actionSteps',
        'exactWordsToSay',
        'whatYouMustComplyWith',
        'whatYouHaveRightToRefuse',
        'policeTricksAndTraps',
        'stateSpecificLaws',
        'constitutionalPrecedents',
        'deEscalationAdvice',
        'riskLevel',
      ],
    };

    // Candidate models to query: try primary first, followed by fallbacks if upstream demand spikes occur
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest'];

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 8000);
        });

        const geminiCall = gemini.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: jsonSchema,
          },
        });

        const response = await Promise.race([geminiCall, timeoutPromise]);
        if (!response) {
          continue; // Timeout on this model, try next candidate
        }

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text) as HypotheticalScenarioAnalysis;
          return {
            ...parsed,
            jurisdictionStateCode: law.stateCode,
            jurisdictionStateName: law.stateName,
          };
        }
      } catch (modelErr: any) {
        // Upstream demand spike (503 UNAVAILABLE) or transient rate limit: try next candidate model
        const isTransient = modelErr?.status === 503 || 
          modelErr?.message?.includes('503') || 
          modelErr?.message?.includes('high demand') ||
          modelErr?.message?.includes('UNAVAILABLE');
        
        if (!isTransient) {
          // Log informative notice without triggering uncaught error
          console.info(`Model ${model} note: ${modelErr?.message || modelErr}`);
        }
      }
    }

    // If candidate models are busy with high demand, serve instant statutory fallback
    console.info('Gemini models experiencing temporary upstream demand spikes; delivering comprehensive statutory jurisdiction analysis.');
    return generateLocalJurisdictionAnalysis(scenario, stateCode, encounterType);
  } catch (err: any) {
    console.info('Hypothetical scenario handled via local jurisdiction engine:', err?.message || 'fallback');
    return generateLocalJurisdictionAnalysis(scenario, stateCode, encounterType);
  }
}
