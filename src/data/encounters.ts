import { EncounterDefinition, EncounterType } from '../types';

export const ENCOUNTER_TYPES: Record<EncounterType, EncounterDefinition> = {
  traffic_stop: {
    id: 'traffic_stop',
    title: 'Vehicle Traffic Stop',
    shortTitle: 'Traffic Stop',
    badge: 'MOTOR VEHICLE',
    iconName: 'Car',
    description: 'Police stop while driving, parked in vehicle, or passenger during roadway enforcement.',
    requiredTier: 'free',
    legalPrinciples: [
      'Delaware v. Prouse: Police must have reasonable suspicion of a traffic violation or criminal activity to pull you over.',
      'Pennsylvania v. Mimms: Officers may order driver to exit vehicle for officer safety (mandatory compliance).',
      'Rodriguez v. United States: Officers cannot extend the stop duration beyond the time needed for citation without independent suspicion.',
      'Schneckloth v. Bustamonte: You have an absolute right to refuse consent to search vehicle interior, trunk, or glovebox.'
    ],
    keyQuestions: [
      'Officer, what is the reason for this stop?',
      'Am I free to leave or am I being detained?',
      'I do not consent to any search of my vehicle or belongings.',
      'I am exercising my right to remain silent under the Fifth Amendment.'
    ]
  },
  home_encounter: {
    id: 'home_encounter',
    title: 'Home & Residence Encounter',
    shortTitle: 'At Home / Front Door',
    badge: 'PRIVATE RESIDENCE',
    iconName: 'Home',
    description: 'Officers knocking at your front door, porch, apartment, or requesting warrantless entry into your home.',
    requiredTier: 'free',
    legalPrinciples: [
      'Payton v. New York: The Fourth Amendment firmly draws the line at the home door. Police cannot enter without a judicial search warrant, valid consent, or active exigency.',
      'Florida v. Jardines: Police on your front porch for a "knock and talk" enjoy only the rights of any private visitor. You are under no obligation to open the door or speak to them.',
      'Georgia v. Randolph: If one physically present co-occupant refuses entry/search, police cannot enter even if another resident consents.',
      'Steagald v. United States: An arrest warrant for a suspect does NOT grant authority to search a third-party home without a separate search warrant.'
    ],
    keyQuestions: [
      'Officers, do you have a search warrant signed by a judge?',
      'Please slide the signed warrant under the door or hold it up to the window.',
      'I do not consent to you entering my residence.',
      'I am choosing not to speak with you without an attorney. Please step off my property.'
    ]
  },
  walking_street: {
    id: 'walking_street',
    title: 'Pedestrian & Street Encounter',
    shortTitle: 'Walking / Approached',
    badge: 'PEDESTRIAN / TERRY STOP',
    iconName: 'Footprints',
    description: 'Approached while walking on a sidewalk, waiting at a bus stop, or stopped by foot patrol / bicycle officers.',
    requiredTier: 'free',
    legalPrinciples: [
      'United States v. Mendenhall: In a consensual encounter, you are completely free to disregard the officer and walk away without answering.',
      'Terry v. Ohio: An officer cannot detain you on foot without reasonable, articulable suspicion (RAS) that you have committed, are committing, or are about to commit a crime.',
      'Brown v. Texas: Police cannot stop and compel identification from a pedestrian without individualized reasonable suspicion.',
      'Minnesota v. Dickerson: A Terry frisk is strictly limited to an outer-clothing pat-down for weapons. Officers cannot manipulate pockets or non-weapon items.'
    ],
    keyQuestions: [
      'Officer, am I free to leave, or am I being detained?',
      'If I am free to go, I will continue on my way. Have a safe day.',
      'What is your reasonable articulable suspicion of a crime?',
      'I do not consent to any pat-down, frisk, or search of my person, pockets, or bag.'
    ]
  },
  public_recording: {
    id: 'public_recording',
    title: 'Public Space & Sidewalk Filming',
    shortTitle: 'Public Filming & Demonstrations',
    badge: 'FIRST AMENDMENT AUDIT',
    iconName: 'Video',
    description: 'Recording police in public view, attending rallies or protests, or observing government officials in public forums.',
    requiredTier: 'free',
    legalPrinciples: [
      'Glik v. Cunniffe & Turner v. Driver: Citizens have an established First Amendment right to film police officers discharging their duties in public spaces.',
      'Riley v. California: Police may not seize your phone or view/delete your videos without a search warrant from a judge.',
      'Houston v. Hill: The First Amendment protects verbal criticism and questioning of police officers so long as it does not physically obstruct duties.',
      'Reasonable Distance: While you can film, you must comply with reasonable orders to stay a safe distance (e.g., 10-15 feet) so as not to physically interfere.'
    ],
    keyQuestions: [
      'Officer, I am exercising my First Amendment right to record public officials in a public forum.',
      'I am maintaining a safe distance and not physically interfering with your investigation.',
      'I do not consent to handing over my phone or unlocking my device.',
      'Are you ordering me to step back under penalty of arrest? If so, what distance is required?'
    ]
  }
};

export const ENCOUNTER_LIST: EncounterDefinition[] = Object.values(ENCOUNTER_TYPES);
