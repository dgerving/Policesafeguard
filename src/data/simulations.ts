import { SimulationScenario } from '../types';

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sim-consent-search',
    title: 'Routine Speeding & Consent Search Trap',
    category: 'Traffic Stop Basics',
    difficulty: 'Beginner',
    description: 'You are pulled over for traveling 9 mph over the speed limit. The officer attempts casual conversation to fish for admissions and asks to search your trunk.',
    jurisdictionContext: 'Federal 4th Amendment & Delaware v. Prouse (1979)',
    initialContext: 'You pulled over safely to the right shoulder, rolled your window down 4 inches, placed your hands on the steering wheel at 10 and 2, and turned on the interior dome light.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Good evening. License, registration, and proof of insurance please. Do you know why I pulled you over tonight?',
        officerAudioPrompt: 'License, registration, and proof of insurance please. Do you know why I pulled you over tonight?',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'MANDATORY COMPLIANCE: Provide Documents',
          recommendedResponse: 'Hand over documents calmly. Do NOT admit speed: "Here are my documents officer. I do not know why I was stopped."',
          legalCitation: 'Delaware v. Prouse (1979) & State Traffic Code',
          statuteOrCase: 'You must provide documents. Never guess or admit guilt to "Do you know why I stopped you?". Admitting speed is an official admission of guilt on bodycam.',
          explanation: 'Giving an estimate like "I was only going 5 over" locks in your confession before trial.',
          deEscalationTip: 'State: "I am reaching for my glovebox now."',
          confidence: 0.99,
          severity: 'medium'
        },
        options: [
          {
            label: 'Admit: "I think I was speeding a little bit, maybe 50 in a 40?"',
            spokenStatement: 'I think I was speeding a little bit, maybe 50 in a 40?',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'FATAL MISTAKE: You just recorded a legally binding confession on police bodycam that ruins any defense in traffic court.',
            citation: 'Federal Rules of Evidence 801(d)(2) - Admission by Party-Opponent',
            scoreDelta: -25
          },
          {
            label: 'Best Practice: "Here are my license, registration, and insurance. I don\'t know why you stopped me, officer."',
            spokenStatement: 'Here are my license, registration, and insurance. I do not know why you stopped me, officer.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'PERFECT: You complied with your legal duty to provide documents without self-incriminating.',
            citation: 'Delaware v. Prouse, 440 U.S. 648 (1979)',
            scoreDelta: +25
          },
          {
            label: 'Refuse: "I don\'t have to show you anything unless you tell me why first!"',
            spokenStatement: 'I don\'t have to show you anything unless you tell me why first!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'DANGEROUS: Refusing to produce a driver license upon request during a traffic stop is an arrestable misdemeanor in all 50 states.',
            citation: 'State Motor Vehicle Code Failure to Display License',
            scoreDelta: -30
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Where are you headed this late at night, and where were you coming from? Did you have anything to drink with dinner?',
        officerAudioPrompt: 'Where are you headed this late at night, and where were you coming from? Did you have anything to drink with dinner?',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REMAIN SILENT: 5th Amendment',
          recommendedResponse: 'Invoke politely: "Officer, I am exercising my Fifth Amendment right to remain silent and decline to answer questions."',
          legalCitation: 'Salinas v. Texas, 570 U.S. 178 (2013) & 5th Amendment',
          statuteOrCase: 'You are under no legal obligation to disclose your travel plans, itinerary, or alcohol consumption.',
          explanation: 'Saying "Just had two beers three hours ago" provides the officer with reasonable suspicion to order field sobriety tests and possible arrest.',
          deEscalationTip: 'Be respectful and polite. Firmly state that you choose not to answer personal questions.',
          confidence: 0.98,
          severity: 'high'
        },
        options: [
          {
            label: 'Casual reply: "Just coming from a buddy\'s house, had one beer hours ago, totally fine."',
            spokenStatement: 'Just coming from a buddy\'s house, had one beer hours ago, totally fine.',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'ERROR: Admitting any alcohol consumption gives the officer legal justification to pull you out of the car for DUI investigation.',
            citation: 'Probable Cause Doctrine & Navarette v. California',
            scoreDelta: -25
          },
          {
            label: 'Best Practice: "Officer, with all due respect, I am exercising my 5th Amendment right to remain silent regarding my evening."',
            spokenStatement: 'Officer, with all due respect, I am exercising my Fifth Amendment right to remain silent regarding my evening.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'EXCELLENT: You invoked the Fifth Amendment explicitly as required by Salinas v. Texas. Your silence cannot be used against you.',
            citation: 'Salinas v. Texas, 570 U.S. 178 (2013)',
            scoreDelta: +25
          }
        ]
      },
      {
        stepNumber: 3,
        officerStatement: 'Well, you seem a bit nervous. You don\'t mind if I pop your trunk and take a quick look inside, do you? If you have nothing to hide, it\'ll take 30 seconds.',
        officerAudioPrompt: 'Well, you seem a bit nervous. You don\'t mind if I pop your trunk and take a quick look inside, do you? If you have nothing to hide, it\'ll take 30 seconds.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ABSOLUTE RIGHT TO REFUSE: Search Consent Request',
          recommendedResponse: 'Clear Non-Consent: "Officer, I do not consent to any searches of my vehicle, trunk, or belongings."',
          legalCitation: 'Schneckloth v. Bustamonte, 412 U.S. 218 (1973) & 4th Amendment',
          statuteOrCase: 'The officer has no warrant and no probable cause; they are asking for voluntary consent. Refusing consent can NEVER be used as suspicion.',
          explanation: 'Never consent to a search. Even if you have nothing illegal, an old forgotten prescription bottle or a passenger\'s property could lead to arrest.',
          deEscalationTip: 'State your refusal clearly for the recording. If they search anyway, do not physically resist.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Best Practice: "Officer, I do not consent to any search of my car or trunk."',
            spokenStatement: 'Officer, I do not consent to any search of my car or trunk.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: '100% CORRECT: Clear, unequivocal refusal of consent protects your 4th Amendment rights on the record.',
            citation: 'Schneckloth v. Bustamonte, 412 U.S. 218 (1973)',
            scoreDelta: +25
          },
          {
            label: 'Consent: "Sure, go ahead, I have nothing to hide."',
            spokenStatement: 'Sure, go ahead, I have nothing to hide.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CRITICAL MISTAKE: You waived your 4th Amendment protections. Any item found or interpreted as contraband can now be used against you.',
            citation: 'Consent Waiver Doctrine',
            scoreDelta: -30
          }
        ]
      }
    ]
  },
  {
    id: 'sim-exit-mimms',
    title: 'Order to Exit Vehicle & Mimms Doctrine',
    category: 'Officer Safety Orders',
    difficulty: 'Intermediate',
    description: 'The officer orders you to exit your vehicle. Many drivers mistakenly believe they can refuse to get out of their car. Learn how to handle this safely.',
    jurisdictionContext: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
    initialContext: 'An officer has approached your vehicle in the rain and ordered you to step out of the car.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Driver, step out of the vehicle right now. Put your hands where I can see them.',
        officerAudioPrompt: 'Driver, step out of the vehicle right now. Put your hands where I can see them.',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'MANDATORY COMPLIANCE: Step Out of the Car',
          recommendedResponse: 'Comply with order: "Yes officer, I am unbuckling and stepping out now with my hands visible."',
          legalCitation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
          statuteOrCase: 'Officers have bright-line constitutional authority to order drivers out of any lawfully stopped vehicle without showing any specific suspicion.',
          explanation: 'Refusing to exit is considered physical obstruction and will result in being forcibly removed, tased, or arrested.',
          deEscalationTip: 'Keep hands on the wheel, say "I am unbuckling my seatbelt now," and step out calmly.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Yes officer, I am unbuckling and stepping out now with my hands visible."',
            spokenStatement: 'Yes officer, I am unbuckling and stepping out now with my hands visible.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'EXCELLENT: Under Pennsylvania v. Mimms, you must comply with exit orders. You complied safely while keeping hands visible.',
            citation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
            scoreDelta: +25
          },
          {
            label: 'Refusal: "I\'m not stepping out! What crime did I commit? You can\'t force me out!"',
            spokenStatement: 'I am not stepping out! What crime did I commit? You can not force me out!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'DANGEROUS: You do NOT have the right to refuse an order to exit. You risk felony resisting and bodily harm.',
            citation: 'Pennsylvania v. Mimms (1977)',
            scoreDelta: -35
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Turn around, put your hands on the hood. I am going to search your pockets and pat you down.',
        officerAudioPrompt: 'Turn around, put your hands on the hood. I am going to search your pockets and pat you down.',
        aiCommentary: {
          category: 'DE_ESCALATE',
          headline: 'VERBAL OBJECTION / PHYSICAL COMPLIANCE: Terry Frisk',
          recommendedResponse: 'Comply physically without resisting, but state verbally: "Officer, I am complying under duress, but I do not consent to any pat down or search."',
          legalCitation: 'Terry v. Ohio, 392 U.S. 1 (1968) & Minnesota v. Dickerson, 508 U.S. 366 (1993)',
          statuteOrCase: 'A Terry pat-down is only lawful if the officer has reasonable suspicion you are armed and dangerous. Pockets cannot be searched without weapons feel.',
          explanation: 'Do not fight or pull away physically. Your recorded verbal non-consent ensures any evidence seized can be thrown out in court.',
          deEscalationTip: 'State non-consent aloud into the microphone. Keep body relaxed.',
          confidence: 0.98,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "I will comply with your instructions officer, but I state for the record that I do not consent to any search or pat down."',
            spokenStatement: 'I will comply with your instructions officer, but I state for the record that I do not consent to any search or pat down.',
            isBestPractice: true,
            category: 'DE_ESCALATE',
            feedback: 'PERFECT: You preserved your physical safety while establishing on video that the search was non-consensual for motion to suppress in court.',
            citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
            scoreDelta: +25
          },
          {
            label: 'Physical reaction: Pull your arms away and swat the officer\'s hands.',
            spokenStatement: 'Get your hands off me!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'FATAL ERROR: Battery on a law enforcement officer. Never touch an officer.',
            citation: 'Resisting with Violence / Battery on Peace Officer',
            scoreDelta: -50
          }
        ]
      }
    ]
  },
  {
    id: 'sim-passenger-rights',
    title: 'Passenger Rights & Stop-and-Identify',
    category: 'Passenger Protections',
    difficulty: 'Intermediate',
    description: 'You are a passenger in the front seat. The driver was pulled over for an expired registration sticker. The officer aggressively demands your ID.',
    jurisdictionContext: 'Brendlin v. California (2007) & State Stop-and-ID Statutes',
    initialContext: 'You are sitting quietly in the passenger seat with your hands resting on your lap.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'You in the passenger seat: give me your driver license right now, and what\'s your social security number?',
        officerAudioPrompt: 'You in the passenger seat: give me your driver license right now, and what is your social security number?',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'PASSENGER PRIVILEGE: ID Not Automatically Compellable',
          recommendedResponse: 'Inquire politely: "Officer, am I suspected of any crime, or am I required to identify myself as a passenger?"',
          legalCitation: 'Brendlin v. California, 551 U.S. 249 (2007) & Terry v. Ohio',
          statuteOrCase: 'Passengers are seized during traffic stops, but absent independent reasonable suspicion, police cannot demand ID in most states.',
          explanation: 'Unless you are in a strict stop-and-id state with suspected criminal activity, passengers have no legal obligation to present identification.',
          deEscalationTip: 'Speak in a calm, respectful tone. If the officer threatens arrest for refusing, state: "I provide my name under protest."',
          confidence: 0.94,
          severity: 'medium'
        },
        options: [
          {
            label: 'Best Practice: "Officer, am I suspected of a crime, or am I free to decline providing my ID as a passenger?"',
            spokenStatement: 'Officer, am I suspected of a crime, or am I free to decline providing my ID as a passenger?',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'EXCELLENT: Forces the officer to either articulate reasonable suspicion or concede that identification is voluntary.',
            citation: 'Brendlin v. California, 551 U.S. 249 (2007)',
            scoreDelta: +25
          },
          {
            label: 'Antagonistic: "I don\'t talk to pigs! Go arrest the real criminals!"',
            spokenStatement: 'I do not talk to you! Go arrest real criminals!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'TERRIBLE: Antagonistic language escalates danger, invites retaliatory policing, and prejudices a judge or jury.',
            citation: 'De-escalation Standard of Conduct',
            scoreDelta: -40
          }
        ]
      }
    ]
  },
  {
    id: 'sim-k9-delay',
    title: 'Unlawful Prolonged Detention (K-9 Dog Sniff)',
    category: 'Fourth Amendment Clocks',
    difficulty: 'Advanced',
    description: 'The officer has handed you your speeding warning, but asks you to sit on the curb and wait 25 minutes for a canine drug dog unit to arrive.',
    jurisdictionContext: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
    initialContext: 'You have received your documents back from the officer.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Here is your warning. Now I want you to hang out here for a bit. My partner is bringing a narcotics dog to sniff the exterior of your car.',
        officerAudioPrompt: 'Here is your warning. Now I want you to hang out here for a bit. My partner is bringing a narcotics dog to sniff the exterior of your car.',
        aiCommentary: {
          category: 'ASK_CLARIFY',
          headline: 'RODRIGUEZ INQUIRY: Am I Free To Leave?',
          recommendedResponse: 'Ask immediately: "Officer, has the purpose of this traffic stop concluded? Am I free to leave, or am I being detained?"',
          legalCitation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
          statuteOrCase: 'A police stop exceeding the time needed to handle the matter for which the stop was made violates the Constitution\'s shield against unreasonable seizures.',
          explanation: 'Under Rodriguez, police cannot extend a completed traffic stop by even two minutes to wait for a dog sniff without independent reasonable suspicion of drugs.',
          deEscalationTip: 'State the question clearly. If the officer says "You are being detained", ask for the reasonable articulable suspicion on record.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, since the traffic stop has concluded, am I free to leave, or am I being detained?"',
            spokenStatement: 'Officer, since the traffic stop has concluded, am I free to leave, or am I being detained?',
            isBestPractice: true,
            category: 'ASK_CLARIFY',
            feedback: 'BRILLIANT: This single question triggers the Rodriguez constitutional clock on your video recording, making any subsequent dog sniff evidence inadmissible.',
            citation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
            scoreDelta: +25
          },
          {
            label: 'Passive Compliance: "Okay, I\'ll just wait here as long as you need."',
            spokenStatement: 'Okay, I will just wait here as long as you need.',
            isBestPractice: false,
            category: 'ASK_CLARIFY',
            feedback: 'MISSED DEFENSE: Waiting willingly converts an unlawful detention into a voluntary consensual encounter, destroying your motion to suppress.',
            citation: 'Consensual Encounter Doctrine',
            scoreDelta: -25
          }
        ]
      }
    ]
  },
  {
    id: 'sim-phone-search',
    title: 'Phone Passcode & Digital Privacy',
    category: 'Fifth Amendment & Digital Rights',
    difficulty: 'Advanced',
    description: 'During a stop, the officer notices your phone mounted on the dashboard and asks you to unlock it to show your recent text messages.',
    jurisdictionContext: 'Riley v. California, 573 U.S. 373 (2014)',
    initialContext: 'The officer is shining a flashlight directly onto your smartphone screen.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'I saw you looking down at your phone back there. Hand me your phone, and unlock it so I can see if you were texting while driving.',
        officerAudioPrompt: 'I saw you looking down at your phone back there. Hand me your phone, and unlock it so I can see if you were texting while driving.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ABSOLUTE PRIVACY RIGHT: Refuse Phone Unlock',
          recommendedResponse: 'Refuse passcode: "Officer, I do not consent to any search of my phone, and under the Fifth Amendment, I decline to provide my passcode or unlock it."',
          legalCitation: 'Riley v. California, 573 U.S. 373 (2014) & 5th Amendment',
          statuteOrCase: 'Supreme Court declared cell phones hold the "privacies of life." Police MUST obtain a warrant signed by a neutral magistrate before searching digital devices.',
          explanation: 'Your passcode is testimonial evidence protected by the 5th Amendment. Police cannot compel you to disclose your memorized code.',
          deEscalationTip: 'If placed under arrest, trigger Emergency Arrest Lockdown in Police SafeGuard to encrypt all local data.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Best Practice: "Officer, I do not consent to any search of my phone, and I exercise my Fifth Amendment right not to unlock it."',
            spokenStatement: 'Officer, I do not consent to any search of my phone, and I exercise my Fifth Amendment right not to unlock it.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'OUTSTANDING: Riley v. California requires a warrant. You firmly protected your constitutional privacy.',
            citation: 'Riley v. California, 573 U.S. 373 (2014)',
            scoreDelta: +25
          },
          {
            label: 'Unlock phone: "Fine, here, you can check my messages, I wasn\'t texting."',
            spokenStatement: 'Fine, here, you can check my messages, I was not texting.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'FATAL PRIVACY BREACH: Unlocking gives the officer free rein to browse photos, emails, bank accounts, and location history.',
            citation: 'Plain View Exception on Unlocked Devices',
            scoreDelta: -35
          }
        ]
      }
    ]
  },
  {
    id: 'sim-home-warrantless',
    title: 'Knock at the Front Door: Police Requesting Entry',
    category: 'Home & Residence',
    difficulty: 'Intermediate',
    description: 'Two uniformed officers knock on your front door in the evening, claiming they are investigating a neighborhood incident and asking to step inside to talk.',
    jurisdictionContext: 'Fourth Amendment, Payton v. New York (1980) & Florida v. Jardines (2013)',
    initialContext: 'You hear loud knocking at your front door. You look through the peephole and see two officers. You keep the deadbolt locked.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Police department, open up! We need to ask you a few questions about something that happened down the street.',
        officerAudioPrompt: 'Police department, open up! We need to ask you a few questions about something that happened down the street.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REFUSE: Warrantless Home Entry Demand',
          recommendedResponse: 'Keep door locked. Speak through door: "Officers, do you have a search warrant signed by a judge? If not, I choose not to open the door."',
          legalCitation: 'Payton v. New York, 445 U.S. 573 (1980) & Fourth Amendment',
          statuteOrCase: 'You have no legal obligation to open your door or allow police into your home without a search warrant signed by a judge.',
          explanation: 'Opening the door exposes your home interior to "plain view" observations and allows officers to claim consent or exigent circumstances.',
          deEscalationTip: 'Speak in a calm, clear voice through the locked door or an adjacent closed window.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Best Practice: Keep door locked, speak through door: "Officers, do you have a search warrant signed by a judge? If not, I decline to open the door."',
            spokenStatement: 'Officers, do you have a search warrant signed by a judge? If not, I decline to open the door.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'PERFECT: Payton v. New York draws a firm constitutional line at the threshold of the home. You preserved your Fourth Amendment sanctity.',
            citation: 'Payton v. New York, 445 U.S. 573 (1980)',
            scoreDelta: +25
          },
          {
            label: 'Open door wide: "Sure, come on in officers, what happened?"',
            spokenStatement: 'Sure, come on in officers, what happened?',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'DANGEROUS: Inviting police inside waives your Fourth Amendment protections. Any item in plain view may now be seized without a warrant.',
            citation: 'Waiver of Fourth Amendment Home Privacy via Voluntary Consent',
            scoreDelta: -35
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'We just want to step inside for two minutes to look around and make sure nobody is hiding in here. Mind if we check the back rooms?',
        officerAudioPrompt: 'We just want to step inside for two minutes to look around and make sure nobody is hiding in here. Mind if we check the back rooms?',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ABSOLUTE RIGHT TO REFUSE: Home Search Request',
          recommendedResponse: 'Through locked door: "Officers, I do not consent to any entry or search of my residence."',
          legalCitation: 'Georgia v. Randolph, 547 U.S. 103 (2006)',
          statuteOrCase: 'Police cannot conduct a consent search of your residence when you refuse consent.',
          explanation: 'Never consent to a "quick look around." Officers use casual language to secure voluntary search permission.',
          deEscalationTip: 'Keep your composure. State: "Please step off my property if you do not have a warrant."',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Best Practice: "Officers, I do not consent to any entry or search of my home, and I decline to answer questions without my attorney."',
            spokenStatement: 'Officers, I do not consent to any entry or search of my home, and I decline to answer questions without my attorney.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'EXEMPLARY: Firm, lawful refusal. Any warrantless entry after this statement will be suppressed in court.',
            citation: 'Georgia v. Randolph, 547 U.S. 103 (2006)',
            scoreDelta: +25
          },
          {
            label: 'Crack door open: "You can just look from right here in the hallway."',
            spokenStatement: 'You can just look from right here in the hallway.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'RISKY: Cracking the door gives officers an opportunity to physically breach or claim they smell or see contraband in plain view.',
            citation: 'Plain Smell & Exigent Circumstances Pretext',
            scoreDelta: -20
          }
        ]
      }
    ]
  },
  {
    id: 'sim-street-pedestrian',
    title: 'Walking on Sidewalk: Demanding Identification',
    category: 'Pedestrian / Street Stop',
    difficulty: 'Intermediate',
    description: 'You are walking down a sidewalk near an open commercial district. A squad car rolls up and an officer steps out, ordering you to stop and show ID.',
    jurisdictionContext: 'Terry v. Ohio (1968) & Brown v. Texas (1979)',
    initialContext: 'You are carrying a grocery bag walking home. An officer walks toward you with hand near holster.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Hey you, stop right there. What are you doing in this neighborhood? Come over here and let me see some ID.',
        officerAudioPrompt: 'Hey you, stop right there. What are you doing in this neighborhood? Come over here and let me see some ID.',
        aiCommentary: {
          category: 'ASK_CLARIFY',
          headline: 'CRITICAL INQUIRY: Establish Detention vs. Consensual Encounter',
          recommendedResponse: 'Stop calmly with hands visible: "Officer, am I free to leave or am I being detained?"',
          legalCitation: 'United States v. Mendenhall (1980) & Brown v. Texas (1979)',
          statuteOrCase: 'Walking in public does not require carrying or displaying ID unless an officer has reasonable suspicion of a crime.',
          explanation: 'Asking "Am I being detained?" forces the officer to state on the record whether they have legal justification for a stop.',
          deEscalationTip: 'Do not reach into pockets or make sudden hand gestures.',
          confidence: 0.98,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, am I free to leave, or am I being detained?"',
            spokenStatement: 'Officer, am I free to leave, or am I being detained?',
            isBestPractice: true,
            category: 'ASK_CLARIFY',
            feedback: 'TEXTBOOK RESPONSE: This clarifies your constitutional status under Terry v. Ohio and prevents a consensual encounter trap.',
            citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
            scoreDelta: +25
          },
          {
            label: 'Aggressive: "I don\'t have to talk to you, get lost pig!"',
            spokenStatement: 'I do not have to talk to you, get lost!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'ESCALATION HAZARD: Belligerent insults provoke pretextual disorderly conduct or obstruction arrests and compromise safety.',
            citation: 'Principles of Tactical De-escalation',
            scoreDelta: -30
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'You\'re acting nervous. Put your hands on your head, I\'m going to pat you down and check your pockets.',
        officerAudioPrompt: 'You are acting nervous. Put your hands on your head, I am going to pat you down and check your pockets.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RIGHT TO REFUSE SEARCH: Frisk Limitation',
          recommendedResponse: 'Comply physically without fighting, but declare audibly: "Officer, I do not consent to any pat down or search of my pockets."',
          legalCitation: 'Minnesota v. Dickerson, 508 U.S. 366 (1993)',
          statuteOrCase: 'A Terry frisk is limited to an outer-clothing pat-down for weapons. Officers cannot manipulate pockets to look for non-weapons.',
          explanation: 'Verbalizing non-consent ensures that if the officer improperly rummages through your pockets, the evidence will be thrown out in court.',
          deEscalationTip: 'Keep hands still. Do not pull away physically.',
          confidence: 0.97,
          severity: 'critical'
        },
        options: [
          {
            label: 'Best Practice: "Officer, I am complying with your instructions and not resisting, but I do not consent to any pat-down or search of my pockets."',
            spokenStatement: 'Officer, I am complying with your instructions and not resisting, but I do not consent to any pat-down or search of my pockets.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'MASTERFUL: You protected your physical safety by not resisting, while completely shielding your legal rights in court.',
            citation: 'Minnesota v. Dickerson, 508 U.S. 366 (1993)',
            scoreDelta: +25
          },
          {
            label: 'Physical resistance: Swat officer\'s hand away: "Don\'t touch me!"',
            spokenStatement: 'Do not touch me!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'SEVERE CRIME: Swatting an officer\'s hand is battery on a police officer and resisting arrest with violence.',
            citation: 'Felony Battery on a Law Enforcement Officer',
            scoreDelta: -45
          }
        ]
      }
    ]
  },
  {
    id: 'sim-public-filming',
    title: 'Public Sidewalk: First Amendment Filming Rights',
    category: 'First Amendment / Public Recording',
    difficulty: 'Intermediate',
    description: 'You are standing on a public sidewalk 20 feet away filming police who have conducted a vehicle stop. An officer walks up and demands you turn off your camera.',
    jurisdictionContext: 'First Amendment, Glik v. Cunniffe (2011) & Turner v. Driver (2017)',
    initialContext: 'You are holding your phone horizontally at chest height, standing near a crosswalk. You are not speaking to the arrested subject.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'You can\'t film here, it\'s an active police investigation. Turn that phone off and delete whatever you just recorded right now.',
        officerAudioPrompt: 'You can not film here, it is an active police investigation. Turn that phone off and delete whatever you just recorded right now.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'FIRST AMENDMENT PROTECTED: Right to Film Police in Public',
          recommendedResponse: 'Keep camera recording: "Officer, I am exercising my First Amendment right to record public officials on a public sidewalk from a non-interfering distance."',
          legalCitation: 'Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011) & Riley v. California',
          statuteOrCase: 'You have a constitutional right to record police in public view. Police cannot command you to stop recording or delete media without a warrant.',
          explanation: 'Never delete footage. The Police SafeGuard app is actively streaming an encrypted hash to the court evidence vault.',
          deEscalationTip: 'Hold the camera steady and speak in a polite, conversational tone.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Best Practice: "Officer, under the First Amendment, I have a constitutional right to record public servants in a public forum. I am not interfering."',
            spokenStatement: 'Officer, under the First Amendment, I have a constitutional right to record public servants in a public forum. I am not interfering.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'EXCELLENT: Firmly asserts Glik v. Cunniffe and First Amendment precedent while maintaining professional posture.',
            citation: 'Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011)',
            scoreDelta: +25
          },
          {
            label: 'Submit & delete: "Sorry officer, I\'m turning it off and deleting it right now."',
            spokenStatement: 'Sorry officer, I am turning it off and deleting it right now.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'UNNECESSARY SURRENDER: You surrendered your First Amendment constitutional rights and destroyed potential evidence of police conduct.',
            citation: 'First Amendment Forum Doctrine',
            scoreDelta: -25
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'You need to back up across the street right now or I\'m arresting you for obstruction of justice!',
        officerAudioPrompt: 'You need to back up across the street right now or I am arresting you for obstruction of justice!',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'REASONABLE BUFFER: Step Back While Continuing to Record',
          recommendedResponse: 'Step back calmly while keeping camera pointed: "Yes officer, I am stepping back to your requested distance while continuing my recording."',
          legalCitation: 'Colten v. Kentucky, 407 U.S. 104 (1972)',
          statuteOrCase: 'Police may establish reasonable perimeter buffers for scene safety. Complying with distance orders deprives them of any obstruction pretext.',
          explanation: 'Stepping back takes away any legal pretext for arrest while preserving your continuous video recording.',
          deEscalationTip: 'Walk backward slowly and announce your compliance.',
          confidence: 0.96,
          severity: 'medium'
        },
        options: [
          {
            label: 'Best Practice: Step backward while filming: "Yes officer, I am stepping back to maintain a safe perimeter while continuing my continuous recording."',
            spokenStatement: 'Yes officer, I am stepping back to maintain a safe perimeter while continuing my continuous recording.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'BRILLIANT: Defeats the obstruction charge while preserving complete video evidence from a safe distance.',
            citation: 'Colten v. Kentucky, 407 U.S. 104 (1972)',
            scoreDelta: +25
          },
          {
            label: 'Refuse to budge: "I\'m on a public sidewalk and I\'m not moving an inch!"',
            spokenStatement: 'I am on a public sidewalk and I am not moving an inch!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'OBSTRUCTION RISK: Refusing a reasonable distance command gives police a valid legal basis to arrest for interfering or obstruction.',
            citation: 'State Obstruction of Governmental Administration Statues',
            scoreDelta: -30
          }
        ]
      }
    ]
  },
  {
    id: 'sim-firearm-duty-to-inform',
    title: 'Concealed Carry & State Duty-to-Inform Laws',
    category: 'Weapons & 2nd Amendment',
    difficulty: 'Advanced',
    description: 'You are legally carrying a licensed concealed handgun during a night traffic stop. The officer approaches your window and asks if you have weapons.',
    jurisdictionContext: 'State Duty-to-Inform Statutes & District of Columbia v. Heller',
    initialContext: 'Nighttime stop. Hands at 10 and 2 on the steering wheel. Dome light illuminated. Licensed firearm is holstered on your right hip or glovebox.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Driver, license and registration please. For our mutual safety, are there any weapons, firearms, or knives inside this vehicle tonight?',
        officerAudioPrompt: 'Driver, license and registration please. For our mutual safety, are there any weapons, firearms, or knives inside this vehicle tonight?',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'CRITICAL SAFETY & STATE DUTY TO INFORM',
          recommendedResponse: 'Keep hands on the wheel. Announce permit calmly without using the word "gun": "Officer, I am a licensed concealed carrier. My firearm is secured on my right hip. My hands are on the wheel. How would you like me to proceed?"',
          legalCitation: 'State Concealed Carry Duty-to-Inform Statues & Terry v. Ohio',
          statuteOrCase: 'In duty-to-inform states (TX, OH, MI, NC, NE, AK, LA), you have an affirmative legal duty to disclose immediately. In all states, reaching toward a weapon without announcing causes extreme officer hazard.',
          explanation: 'Never yell "I have a gun!" as that can trigger an involuntary officer draw. Always say "I am a licensed concealed carry holder, my firearm is holstered, and my hands are on the wheel."',
          deEscalationTip: 'Never reach for your wallet or registration if it is next to your firearm until the officer gives explicit verbal permission.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Calm & Precise: "Officer, I am a licensed concealed carrier. My firearm is secured on my right hip. My hands are on the steering wheel. How would you like me to proceed?"',
            spokenStatement: 'Officer, I am a licensed concealed carrier. My firearm is secured on my right hip. My hands are on the steering wheel. How would you like me to proceed?',
            isBestPractice: true,
            category: 'DE_ESCALATE',
            feedback: 'LIFE-SAVING BEST PRACTICE: Defuses tension, satisfies statutory duty to inform, keeps hands visible, and ensures the officer controls the movement.',
            citation: 'State CCW Notification Statutes & Officer Safety Protocols',
            scoreDelta: +30
          },
          {
            label: 'Quick reach: Reach for your wallet near your holster while saying "I got a gun right here but I\'m getting my ID"',
            spokenStatement: 'I got a gun right here but I am getting my ID',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'LETHAL HAZARD: Reaching near a firearm while saying the word "gun" creates an immediate perceived deadly threat for the officer.',
            citation: 'Terry v. Ohio, 392 U.S. 1 (1968) - Threat Assessment',
            scoreDelta: -50
          },
          {
            label: 'Deny: "No officer, nothing in here at all." (Even though you are carrying)',
            spokenStatement: 'No officer, nothing in here at all.',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'UNLAWFUL: Lying about carrying a weapon is a criminal offense in duty-to-inform states and immediately voids CCW permits if discovered.',
            citation: 'State Concealed Carry Revocation Statutes & False Statements',
            scoreDelta: -35
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Keep your hands right there on the wheel. I am going to open your door, reach in, and secure your weapon while I run your information. Do you consent to me seizing it?',
        officerAudioPrompt: 'Keep your hands right there on the wheel. I am going to open your door, reach in, and secure your weapon while I run your information. Do you consent to me seizing it?',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'NON-CONSENT TO SEARCH WHILE COMPLYING WITH COMMAND',
          recommendedResponse: 'Comply with the physical command without consenting to a search: "Officer, I will comply with your direct command for safety, but I do not consent to any warrantless search of my person or vehicle."',
          legalCitation: 'Arizona v. Gant, 556 U.S. 332 (2009) & Terry Protective Frisk',
          statuteOrCase: 'Officers may temporarily secure a weapon for reasonable safety under Terry, but cannot conduct a full exploratory vehicle search without independent probable cause.',
          explanation: 'Stating non-consent prevents the officer from later claiming you granted permission to search the rest of your vehicle.',
          deEscalationTip: 'Do not pull away or resist physically. State your legal non-consent clearly on the recording.',
          confidence: 0.96,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, for safety I will comply with your direct command, but I do not consent to any search of my person, firearm, or vehicle."',
            spokenStatement: 'Officer, for safety I will comply with your direct command, but I do not consent to any search of my person, firearm, or vehicle.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'EXCELLENT: Preserves your Fourth Amendment non-consent on the record while preventing any physical escalation.',
            citation: 'Arizona v. Gant (2009) & Florida v. J.L. (2000)',
            scoreDelta: +25
          },
          {
            label: 'Fight the seizure: Pull away from the officer: "You can\'t take my Second Amendment away without a warrant!"',
            spokenStatement: 'You can not take my Second Amendment away without a warrant!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'DANGEROUS: Physical resistance during a weapons frisk will be met with immediate physical force and felony resisting arrest charges.',
            citation: 'State Resisting Lawful Detention Statutes',
            scoreDelta: -45
          }
        ]
      }
    ]
  },
  {
    id: 'sim-sobriety-checkpoint-sfst',
    title: 'DUI Sobriety Checkpoint & Field Sobriety Refusal',
    category: 'Sobriety Checkpoints',
    difficulty: 'Intermediate',
    description: 'You are stopped at a late-night holiday sobriety checkpoint. The officer notices your red eyes from a long workday and asks you to step out for field sobriety tests.',
    jurisdictionContext: 'Michigan Dept. of State Police v. Sitz (1990) & Voluntary SFST Standards',
    initialContext: 'Late evening checkpoint. Cones and police cruisers present. You have rolled down your window and presented your driver license through the gap.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Good evening, sobriety checkpoint. Have you had any alcoholic beverages, wine, or beer to drink tonight? Where are you driving home from?',
        officerAudioPrompt: 'Good evening, sobriety checkpoint. Have you had any alcoholic beverages, wine, or beer to drink tonight? Where are you driving home from?',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: '5TH AMENDMENT AT SOBRIETY CHECKPOINTS',
          recommendedResponse: 'Decline politely: "Good evening officer. Here are my documents. I am exercising my right to remain silent and decline to answer questions."',
          legalCitation: 'Michigan Dept. of State Police v. Sitz (1990) & 5th Amendment',
          statuteOrCase: 'Under Sitz, checkpoints are legal for brief initial inquiry, but drivers are NOT legally required to answer investigative questions regarding where they were or what they consumed.',
          explanation: 'Saying "Just one glass of wine 4 hours ago" gives the officer reasonable suspicion to pull you out of line for extended investigation.',
          deEscalationTip: 'Keep your demeanor polite, calm, and neutral. Hand over license and registration without argument.',
          confidence: 0.98,
          severity: 'medium'
        },
        options: [
          {
            label: 'Best Practice: "Good evening officer. Here are my documents. I am exercising my constitutional right to remain silent and decline to answer questions."',
            spokenStatement: 'Good evening officer. Here are my documents. I am exercising my constitutional right to remain silent and decline to answer questions.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'FLAWLESS: Complies with checkpoint license verification while giving zero admissions for the officer to build a DUI case.',
            citation: 'Salinas v. Texas & Michigan Dept. of State Police v. Sitz',
            scoreDelta: +25
          },
          {
            label: 'Admit moderate drinking: "I had one beer with dinner around 6 PM, but that was hours ago and I feel totally fine."',
            spokenStatement: 'I had one beer with dinner around 6 PM, but that was hours ago and I feel totally fine.',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'FATAL ADMISSION: Admitting to any consumption provides legal justification for an immediate exit order and SFST battery.',
            citation: 'State DUI Reasonable Suspicion Standards',
            scoreDelta: -30
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Your eyes look a little tired. I want you to step out of the car right over here on the white line and perform a quick eye test and walk-and-turn to show me you are safe.',
        officerAudioPrompt: 'Your eyes look a little tired. I want you to step out of the car right over here on the white line and perform a quick eye test and walk-and-turn to show me you are safe.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ROADSIDE FIELD SOBRIETY TESTS ARE 100% VOLUNTARY',
          recommendedResponse: 'Step out under Mimms, but decline tests: "Officer, I will step out as ordered, but I respectfully decline to perform any voluntary roadside balance or eye tests. Am I free to go?"',
          legalCitation: 'NHTSA SFST Guidelines & State Implied Consent Statutes',
          statuteOrCase: 'Standardized Field Sobriety Tests (SFSTs: HGN, Walk & Turn, One-Leg Stand) are VOLUNTARY in all 50 states. Only post-arrest chemical tests (breath/blood at the station) are covered by Implied Consent laws.',
          explanation: 'SFSTs are designed for failure (graded on subjective minor cues like starting too early or stepping off an imaginary line). Declining voluntary tests prevents the officer from gathering subjective evidence against you.',
          deEscalationTip: 'Always comply with the physical order to step out of the vehicle (Pennsylvania v. Mimms), but decline the tests verbally.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: Step out of the car, keep hands visible, and state: "Officer, I am complying with your order to step out, but I respectfully decline to participate in any voluntary roadside sobriety tests or eye evaluations. Am I free to go?"',
            spokenStatement: 'Officer, I am complying with your order to step out, but I respectfully decline to participate in any voluntary roadside sobriety tests or eye evaluations. Am I free to go?',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'OUTSTANDING LEGAL MASTERY: You avoided the Mimms obstruction trap by stepping out, while denying the officer the voluntary subjective evidence they needed to substantiate a DUI arrest.',
            citation: 'Pennsylvania v. Mimms (1977) & NHTSA SFST Manual Standards',
            scoreDelta: +35
          },
          {
            label: 'Take the tests: "Sure officer, I have great balance, I can do any test you want."',
            spokenStatement: 'Sure officer, I have great balance, I can do any test you want.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'TRAP SPRUNG: NHTSA studies show over 80% of sober individuals exhibit at least two "cues of impairment" on uneven roadside asphalt at night.',
            citation: 'NHTSA SFST Validation Studies',
            scoreDelta: -25
          }
        ]
      }
    ]
  },
  {
    id: 'sim-k9-highway-prolonged',
    title: 'K-9 Sniff Prolongation & Rodriguez Violation',
    category: 'Traffic Stop Basics',
    difficulty: 'Advanced',
    description: 'You were pulled over for an improper lane change. The officer hands you a written warning, and then tells you to sit tight while waiting for a drug dog unit to arrive.',
    jurisdictionContext: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
    initialContext: 'Daytime highway stop. Officer has completed writing the warning citation and returned your license and registration.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Here is your warning for the lane change. Keep it under control. Now, I notice you seem a bit nervous. I have a K-9 unit finishing lunch 8 minutes away. I need you to wait right here while he conducts a quick sniff around your vehicle.',
        officerAudioPrompt: 'Here is your warning for the lane change. Keep it under control. Now, I notice you seem a bit nervous. I have a K-9 unit finishing lunch 8 minutes away. I need you to wait right here while he conducts a quick sniff around your vehicle.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'RODRIGUEZ VIOLATION: Traffic Stop Mission Completed',
          recommendedResponse: 'Establish completion on record: "Officer, you have handed me my warning citation. Has the mission of this traffic stop concluded? Am I free to go? I do not consent to waiting for a dog or any extension of this stop."',
          legalCitation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
          statuteOrCase: 'Under Rodriguez, police may not prolong a traffic stop beyond the time reasonably required to complete the traffic mission to conduct a K-9 sniff without independent reasonable suspicion of criminal activity.',
          explanation: 'Saying "Nervousness" is NOT legally sufficient reasonable suspicion under the Fourth Amendment to prolong a completed traffic stop.',
          deEscalationTip: 'Ask the pivotal legal question: "Officer, am I being detained or am I free to go?" Record the exact time.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, you have issued my warning citation. Has the mission of this traffic stop concluded? Am I free to go? I do not consent to waiting for a K-9 unit or extending this detention."',
            spokenStatement: 'Officer, you have issued my warning citation. Has the mission of this traffic stop concluded? Am I free to go? I do not consent to waiting for a K-9 unit or extending this detention.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'LANDMARK PRECEDENT APPLIED: By establishing that the ticket is completed and denying consent to wait, any subsequent search is suppressible in court under the exclusionary rule.',
            citation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
            scoreDelta: +35
          },
          {
            label: 'Agree to wait: "Okay, I have nothing to hide, we can wait for the dog."',
            spokenStatement: 'Okay, I have nothing to hide, we can wait for the dog.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CONSTITUTIONAL WAIVER: Consenting to wait waives your Rodriguez protections and transforms an unlawful detention into a voluntary encounter.',
            citation: 'Schneckloth v. Bustamonte, 412 U.S. 218 (1973)',
            scoreDelta: -30
          }
        ]
      }
    ]
  },
  {
    id: 'sim-felony-stop-identity',
    title: 'High-Risk Felony Stop & Mistaken Vehicle Identity',
    category: 'High-Stakes Crisis',
    difficulty: 'Advanced',
    description: 'Multiple police cruisers box your car in with lights flashing and officers taking cover behind their doors with service weapons drawn. The PA system bellows conflicting commands.',
    jurisdictionContext: 'Graham v. Connor, 490 U.S. 386 & Pennsylvania v. Mimms',
    initialContext: 'Nighttime intersection. Three squad cars behind you with spotlight high beams blinding your mirrors. Officers are shouting commands over cruiser PA loudspeakers.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'DRIVER! TURN OFF THE ENGINE! DROP YOUR KEYS OUT THE WINDOW! KEEP BOTH HANDS HIGH OUT THE WINDOW WHERE WE CAN SEE THEM! DO NOT REACH FOR ANYTHING OR WE WILL FIRE!',
        officerAudioPrompt: 'Driver! Turn off the engine! Drop your keys out the window! Keep both hands high out the window where we can see them! Do not reach for anything or we will fire!',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'CRITICAL SURVIVAL PROTOCOL: High-Risk Officer Safety Order',
          recommendedResponse: 'Total non-verbal compliance. Turn off ignition, drop keys out driver window, extend both open hands outside the window. Do NOT make sudden gestures or reach for your phone or wallet.',
          legalCitation: 'Graham v. Connor, 490 U.S. 386 (1989) & Officer Safety Doctrine',
          statuteOrCase: 'Under Graham v. Connor, split-second officer safety decisions in high-risk felony stops legally authorize armed commands. Reaching inside pockets or glovebox during a felony stop creates imminent threat justification.',
          explanation: 'Never reach for driver license or documents during a high-risk stop until specifically instructed by the primary officer.',
          deEscalationTip: 'Keep fingers spread wide and completely stationary. Keep cabin dome light ON if already switched on.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Survive & Comply: Turn off engine, drop keys on pavement, hold both open hands out the window, remain silent.',
            spokenStatement: 'Complying non-verbally. Engine off, keys dropped, hands spread wide out the window.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'LIFE-SAVING PROTOCOL: Visible hands eliminate perceived threats. Dropping keys proves vehicle cannot flee.',
            citation: 'Standard Tactical Police Procedure & Mimms Doctrine',
            scoreDelta: +30
          },
          {
            label: 'Reach for wallet: "Wait, let me grab my ID to prove you have the wrong person!"',
            spokenStatement: 'Wait officer, let me grab my wallet from my back pocket to show you who I am!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'LETHAL HAZARD: Reaching into clothing during a drawn-weapon felony stop looks identical to drawing a concealed firearm and justifies lethal force under Graham v. Connor.',
            citation: 'Tennessee v. Garner, 471 U.S. 1 (1985)',
            scoreDelta: -50
          },
          {
            label: 'Open door quickly and step out: "What is going on here? Why are your guns out?!"',
            spokenStatement: 'What is going on here? Why are your guns out?!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'EXTREME RISK: Exiting the vehicle without direct command during a felony stop is treated as aggressive engagement.',
            citation: 'Tactical Stop Doctrine',
            scoreDelta: -45
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'DRIVER, WITH YOUR LEFT HAND, REACH OUTSIDE AND OPEN THE DOOR FROM THE EXTERIOR HANDLE! STEP OUT BACKWARDS TOWARDS THE SOUND OF MY VOICE! KEEP YOUR HANDS IN THE AIR!',
        officerAudioPrompt: 'Driver, with your left hand, reach outside and open the door from the exterior handle! Step out backwards towards the sound of my voice! Keep your hands in the air!',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'MIMMS MANDATORY COMPLIANCE: Directed Backward Extraction',
          recommendedResponse: 'Follow the specific extraction commands methodically. Keep your back to the officers so they can clearly see you possess no rear waistband weapons.',
          legalCitation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
          statuteOrCase: 'Officers have lawful constitutional power to order any occupant out of a vehicle. In felony stops, directed backward steps ensure safe custody.',
          explanation: 'Announce every physical movement if you speak: "I am stepping out backwards now."',
          deEscalationTip: 'Move slowly and smoothly. Avoid turning around to look at the cruisers until told to do so.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: Slowly open door from outside, step out backwards, hands high in the air, step back slowly.',
            spokenStatement: 'Officer, I am stepping out backwards now with my hands raised in the air.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'FLAWLESS EXECUTION: Compliance with the physical commands diffuses tension while the AI audio/video recording preserves the official timeline for court.',
            citation: 'Pennsylvania v. Mimms (1977)',
            scoreDelta: +25
          },
          {
            label: 'Refuse: "I am not getting out until you tell me what crime you are accusing me of!"',
            spokenStatement: 'I am not getting out until you tell me what crime you are accusing me of!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'CRIMINAL OBSTRUCTION: Refusing an exit order during a felony stop violates state obstruction statutes and will result in physical dog deployment or taser deployment.',
            citation: 'Mimms & State Resisting Statutes',
            scoreDelta: -40
          }
        ]
      }
    ]
  },
  {
    id: 'sim-border-checkpoint-internal',
    title: 'Internal Border Patrol Checkpoint (100-Mile Border Zone)',
    category: 'Federal & Constitutional Limits',
    difficulty: 'Advanced',
    description: 'You are driving along an interstate highway 70 miles north of the Mexican border. You are directed into a permanent United States Border Patrol checkpoint.',
    jurisdictionContext: 'United States v. Martinez-Fuerte, 428 U.S. 543 (1976)',
    initialContext: 'Daytime federal highway checkpoint. Armed federal agents in green uniforms directing traffic into single lanes with sniffing dogs.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Good afternoon. United States Border Patrol. Are you and all your passengers United States citizens? Where were you born?',
        officerAudioPrompt: 'Good afternoon. United States Border Patrol. Are you and all your passengers United States citizens? Where were you born?',
        aiCommentary: {
          category: 'ASK_CLARIFY',
          headline: 'MARTINEZ-FUERTE SCOPE: Brief Immigration Inquiries',
          recommendedResponse: 'You may choose to answer: "Yes, I am a U.S. citizen" to pass through in seconds. Under the Fifth Amendment, you also retain the right to remain silent, though agents may prolong brief detention to verify status.',
          legalCitation: 'United States v. Martinez-Fuerte, 428 U.S. 543 (1976) & 5th Amendment',
          statuteOrCase: 'Under Martinez-Fuerte, Border Patrol may briefly stop vehicles at fixed checkpoints without warrants to verify citizenship. However, they CANNOT conduct general criminal searches without probable cause.',
          explanation: 'Stating "I am a United States citizen" is the fastest lawful de-escalation. If exercising silence, remain respectful and state Fifth Amendment invocation clearly.',
          deEscalationTip: 'State citizenship clearly or invoke the Fifth Amendment politely without physical agitation.',
          confidence: 0.97,
          severity: 'medium'
        },
        options: [
          {
            label: 'Direct Constitutional Response: "Yes officer, I am a United States citizen."',
            spokenStatement: 'Yes officer, I am a United States citizen.',
            isBestPractice: true,
            category: 'DE_ESCALATE',
            feedback: 'OPTIMAL COMPLIANCE: Answers the specific statutory immigration query permitted under Martinez-Fuerte without waiving any Fourth Amendment search protections.',
            citation: 'United States v. Martinez-Fuerte, 428 U.S. 543 (1976)',
            scoreDelta: +25
          },
          {
            label: 'Fifth Amendment Silence: "Officer, I am choosing to exercise my Fifth Amendment right to remain silent."',
            spokenStatement: 'Officer, I am choosing to exercise my Fifth Amendment right to remain silent regarding personal questions.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CONSTITUTIONALLY SOUND: Silence is protected under the 5th Amendment, though federal agents may direct your vehicle to secondary inspection to verify identity.',
            citation: 'Salinas v. Texas & 5th Amendment',
            scoreDelta: +15
          },
          {
            label: 'Aggressive defiance: "This checkpoint is completely unconstitutional! You have zero jurisdiction here!"',
            spokenStatement: 'This checkpoint is completely unconstitutional! You have zero jurisdiction here!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'LEGAL ERROR: In Martinez-Fuerte (1976), the U.S. Supreme Court explicitly ruled internal border checkpoints within 100 miles of the border constitutional.',
            citation: 'United States v. Martinez-Fuerte (1976)',
            scoreDelta: -25
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Alright. Go ahead and pop your trunk open for me. I need to make sure you do not have anyone hidden in the back.',
        officerAudioPrompt: 'Alright. Go ahead and pop your trunk open for me. I need to make sure you do not have anyone hidden in the back.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'CRITICAL FOURTH AMENDMENT LIMIT: Vehicle Searches Require Consent or PC',
          recommendedResponse: 'Refuse clearly and politely: "Officer, with all due respect, I do not consent to any searches of my vehicle or trunk. Am I free to proceed on my way?"',
          legalCitation: 'United States v. Ortiz, 422 U.S. 891 (1975)',
          statuteOrCase: 'In United States v. Ortiz, the Supreme Court ruled that at internal traffic checkpoints, Border Patrol agents CANNOT search private vehicle compartments or trunks without probable cause or voluntary consent.',
          explanation: 'Many drivers mistakenly believe Border Patrol has unlimited search powers inland. They do not. A search without consent or probable cause is unconstitutional.',
          deEscalationTip: 'State refusal firmly without touching trunk release latch.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, I do not consent to any search of my trunk or vehicle. Has the immigration inspection concluded? Am I free to go?"',
            spokenStatement: 'Officer, I do not consent to any search of my trunk or vehicle. Has the immigration inspection concluded? Am I free to go?',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'LANDMARK DEFENSE: Ortiz v. United States strictly forbids warrantless trunk searches at fixed checkpoints without probable cause or consent.',
            citation: 'United States v. Ortiz, 422 U.S. 891 (1975)',
            scoreDelta: +35
          },
          {
            label: 'Consenting to search: "Sure, go ahead and pop it open, I have nothing to hide."',
            spokenStatement: 'Sure, go ahead and pop it open, I have nothing to hide.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'WAIVED PROTECTION: Consenting waives all Fourth Amendment protections and allows agents to search every bag, parcel, and container in your vehicle.',
            citation: 'Schneckloth v. Bustamonte (1973)',
            scoreDelta: -30
          }
        ]
      }
    ]
  },
  {
    id: 'sim-odor-vehicle-search',
    title: 'Vehicle Odor Search: Decriminalized vs. Prohibition State',
    category: 'Fourth Amendment & State Laws',
    difficulty: 'Advanced',
    description: 'An officer stops your vehicle for an unilluminated license plate light. Upon stepping up to the window, the officer claims: "I detect the odor of cannabis. Step out so I can search the car."',
    jurisdictionContext: 'State Statutory Protections (NY/CA/MN) vs. Federal Carroll Doctrine',
    initialContext: 'Late evening suburban road. Officer has requested your registration and is sniffing near the driver window sill.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Driver, I smell marijuana coming from the passenger compartment. That gives me probable cause under the automobile exception to search your entire vehicle. Step out of the car right now.',
        officerAudioPrompt: 'Driver, I smell marijuana coming from the passenger compartment. That gives me probable cause under the automobile exception to search your entire vehicle. Step out of the car right now.',
        aiCommentary: {
          category: 'ASK_CLARIFY',
          headline: 'CRITICAL STATE LAW VARIANCE: Cannabis Odor Precedents',
          recommendedResponse: 'Comply with physical exit under Mimms, but verbally record your lack of consent and invoke state statutory bans on odor searches if in legal state.',
          legalCitation: 'State Cannabis Codes (e.g. NY Penal Law § 222.05, CA H&S § 11362.1) vs. Carroll v. United States',
          statuteOrCase: 'In decriminalized/legal states (NY, CA, MN, NJ, MD, VA), state statutes expressly prohibit police from using cannabis odor alone as probable cause to search vehicles. In non-legal states (TX, ID, KS, WY), plain smell still justifies warrantless searches.',
          explanation: 'Never physically resist an officer who begins searching, even if the search is illegal. Physical resistance is a crime. Instead, state clear verbal non-consent on the audio/video record.',
          deEscalationTip: 'Step out calmly, lock doors behind you if possible, and state on camera: "Officer, I am complying with your exit order, but I do not consent to any search of this vehicle."',
          confidence: 0.98,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: Step out calmly, keep hands visible, state: "Officer, I am complying with your exit order, but I state on the record that I do not consent to any vehicle search."',
            spokenStatement: 'Officer, I am complying with your exit order, but I state on the record that I do not consent to any vehicle search.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'TACTICAL & LEGAL MASTERCLASS: You complied with the mandatory Mimms exit order while creating an unassailable record of non-consent for your attorney to file a Motion to Suppress.',
            citation: 'Pennsylvania v. Mimms (1977) & State Exclusionary Rules',
            scoreDelta: +30
          },
          {
            label: 'Physically block the officer: "You cannot search my car! Marijuana is legal here, I am not letting you in!"',
            spokenStatement: 'You cannot search my car! Marijuana is legal here, I am not letting you in!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'FATAL TACTICAL ERROR: Never physically obstruct police or physically block a search. Even if the search is later ruled unconstitutional, physically resisting is an independent arrestable crime in all 50 states.',
            citation: 'State Obstruction of Justice Statutes',
            scoreDelta: -45
          },
          {
            label: 'Admit: "Yeah, my friend was smoking a joint in here yesterday, but there is nothing in the car today."',
            spokenStatement: 'Yeah, my friend was smoking a joint in here yesterday, but there is nothing in the car today.',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'RUINOUS ADMISSION: You just provided independent verbal admission corroborating the odor, handing the officer lawful probable cause even in states with odor limitations.',
            citation: 'Party Opponent Admission Doctrine',
            scoreDelta: -35
          }
        ]
      }
    ]
  },
  {
    id: 'sim-dui-blood-warrant',
    title: 'Roadside PBT Refusal vs. Forced Blood Draw Warrant',
    category: 'Fourth Amendment & Implied Consent',
    difficulty: 'Advanced',
    description: 'Pulled over on a weekend evening. You decline voluntary roadside eye tests and roadside handheld breathalyzer. The officer arrests you and threatens to take your blood by force at a hospital without a warrant.',
    jurisdictionContext: 'Birchfield v. North Dakota, 579 U.S. 438 & Missouri v. McNeely, 569 U.S. 141',
    initialContext: 'Roadside curb at 1:15 AM. Officer has concluded traffic questioning and is holding a portable roadside breathalyzer (PBT).',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Blow into this handheld breath device right now. If you refuse to blow into this tube on the street, you are going to jail right this second.',
        officerAudioPrompt: 'Blow into this handheld breath device right now. If you refuse to blow into this tube on the street, you are going to jail right this second.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ROADSIDE PBT IS VOLUNTARY: Not the Implied Consent Test',
          recommendedResponse: 'Politely refuse preliminary field test: "Officer, I politely decline this preliminary roadside breath test and any voluntary roadside field tests."',
          legalCitation: 'State Motor Vehicle Codes on Preliminary Breath Tests (PBT)',
          statuteOrCase: 'In the vast majority of states, roadside Preliminary Breath Tests (PBTs) are non-evidentiary investigative tools and are completely voluntary. The mandatory "Implied Consent" test only occurs AFTER a lawful arrest at the police station or medical facility on certified desktop equipment.',
          explanation: 'PBT devices have high error margins and are primarily used by officers to establish probable cause for arrest.',
          deEscalationTip: 'State refusal calmly. Be prepared that the officer may place you under arrest based on other driving observations.',
          confidence: 0.97,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, with all due respect, I decline to submit to this preliminary roadside breath test or any voluntary field tests."',
            spokenStatement: 'Officer, with all due respect, I decline to submit to this preliminary roadside breath test or any voluntary field tests.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CONSTITUTIONALLY CORRECT: Roadside PBTs are non-mandatory in almost all states. Refusing roadside PBT prevents giving the officer easy roadside calibration evidence.',
            citation: 'State PBT Statutory Frameworks',
            scoreDelta: +25
          },
          {
            label: 'Blow willingly: "Fine, I only had a glass of wine, I will blow into the handheld device."',
            spokenStatement: 'Fine, I only had a glass of wine, I will blow into the handheld device.',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'PRE-TRIAL TRAP: Portable roadside units are notoriously inaccurate and any reading above 0.00 will be used as sworn probable cause for your immediate arrest.',
            citation: 'PBT Evidentiary Precedents',
            scoreDelta: -25
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Alright, you are under arrest for DUI. We are going to the hospital and drawing your blood. If you refuse, we will hold you down and take it by force without any paperwork.',
        officerAudioPrompt: 'Alright, you are under arrest for DUI. We are going to the hospital and drawing your blood. If you refuse, we will hold you down and take it by force without any paperwork.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'LANDMARK FOURTH AMENDMENT LIMIT: Warrantless Blood Draws Unconstitutional',
          recommendedResponse: 'State clearly on the record: "Officer, under Birchfield v. North Dakota and Missouri v. McNeely, warrantless blood draws violate the Fourth Amendment. I do not consent to any warrantless blood draw. If you obtain a judge-signed electronic warrant, I will submit peacefully to the hospital staff."',
          legalCitation: 'Birchfield v. North Dakota, 579 U.S. 438 (2016) & Missouri v. McNeely, 569 U.S. 141 (2013)',
          statuteOrCase: 'In Birchfield and McNeely, the Supreme Court ruled that police CANNOT compel a warrantless blood draw under implied consent. A blood draw is a physical bodily intrusion requiring a search warrant signed by a neutral magistrate, unless true exigent circumstances exist.',
          explanation: 'Do NOT physically fight hospital personnel. Announce lack of consent clearly to the medical phlebotomist so the hospital notes reflect involuntary forced draw without a signed warrant.',
          deEscalationTip: 'State non-consent verbally. Comply physically if an electronic search warrant signed by a judge is served.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officer, under Supreme Court precedent in Birchfield v. North Dakota and Missouri v. McNeely, I do not consent to any warrantless blood draw without a judge-signed search warrant."',
            spokenStatement: 'Officer, under Supreme Court precedent in Birchfield v. North Dakota and Missouri v. McNeely, I do not consent to any warrantless blood draw without a judge-signed search warrant.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'HISTORIC SUPREME COURT PRECEDENT: Forcing a blood draw without a judicial warrant suppresses the entire blood alcohol lab results under the Fourth Amendment exclusionary rule.',
            citation: 'Birchfield v. North Dakota, 579 U.S. 438 (2016)',
            scoreDelta: +40
          },
          {
            label: 'Physically fight the phlebotomist: Struggle and punch medical staff at the clinic.',
            spokenStatement: 'Do not touch me! I will fight anyone who comes near me with a needle!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'FELONY BATTERY: Physically assaulting hospital staff or police is a severe felony battery charge punishable by years in state prison, completely separate from DUI.',
            citation: 'State Battery on Medical Personnel Penal Codes',
            scoreDelta: -60
          }
        ]
      }
    ]
  },
  {
    id: 'sim-curtilage-tenant-rights',
    title: 'Tenant Rights: Warrantless Raid & Landlord Consent Trap',
    category: 'Home & Fourth Amendment',
    difficulty: 'Advanced',
    description: 'Police knock on your apartment door at 8:00 PM accompanied by your property landlord. The officers state: "Your landlord gave us permission to inspect your apartment for illegal substances. Step aside."',
    jurisdictionContext: 'Georgia v. Randolph, 547 U.S. 103 & Chapman v. United States, 365 U.S. 610',
    initialContext: 'Apartment threshold. Landlord standing behind two uniformed patrol officers.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Tenant, step aside. Your landlord owns this property and has signed a consent search waiver granting us full permission to search the premises. If you stand in our way, you will be arrested for obstruction.',
        officerAudioPrompt: 'Tenant, step aside. Your landlord owns this property and has signed a consent search waiver granting us full permission to search the premises. If you stand in our way, you will be arrested for obstruction.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'LANDLORD CANNOT WAIVE YOUR 4TH AMENDMENT RIGHTS: Chapman Doctrine',
          recommendedResponse: 'State firmly from the doorway: "Officers, under Chapman v. United States, a landlord has no constitutional authority to consent to a search of a tenant\'s private dwelling. As the lawful resident present, I do not consent to any entry or search without a judicial warrant."',
          legalCitation: 'Chapman v. United States, 365 U.S. 610 (1961) & Georgia v. Randolph, 547 U.S. 103 (2006)',
          statuteOrCase: 'In Chapman v. United States, the Supreme Court unequivocally held that a landlord cannot consent to a police search of a tenant\'s rented home. Furthermore, under Georgia v. Randolph, a physically present resident\'s refusal trumps any third-party consent.',
          explanation: 'Your Fourth Amendment reasonable expectation of privacy in your home is absolute against third-party landlord waivers.',
          deEscalationTip: 'Do NOT open the door wide or invite the officers across the threshold. Keep screen or door partially closed while speaking.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Best Practice: "Officers, under Chapman v. United States, a landlord cannot consent to search my private rented residence. I am the tenant and I do not consent to any search or entry without a warrant."',
            spokenStatement: 'Officers, under Chapman v. United States, a landlord cannot consent to search my private rented residence. I am the tenant and I do not consent to any search or entry without a warrant.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CONSTITUTIONAL FORTRESS: Citing Chapman v. United States establishes illegal entry. Any evidence discovered during entry is tainted fruit of the poisonous tree.',
            citation: 'Chapman v. United States, 365 U.S. 610 (1961)',
            scoreDelta: +35
          },
          {
            label: 'Yield to landlord: "Well, if the landlord signed a waiver, I guess I have no choice. Come on in."',
            spokenStatement: 'Well, if the landlord signed a waiver, I guess I have no choice. Come on in.',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'WAIVED CONSTITUTIONAL SHIELD: Inviting officers inside waives your Chapman and Fourth Amendment protections, validating any plain view or drawer searches.',
            citation: 'Voluntary Consent Doctrine',
            scoreDelta: -30
          }
        ]
      }
    ]
  },
  {
    id: 'sim-rideshare-passenger',
    title: 'Rideshare Driver: Unruly Backseat Passenger & Contraband',
    category: 'Traffic Stop Basics',
    difficulty: 'Advanced',
    description: 'You are driving Uber/Lyft at 2:00 AM when an officer pulls you over for an illuminated license plate bulb outage. During the stop, the officer spots an unzipped backpack with suspected narcotics packaging on the rear floorboard next to a belligerent passenger. The officer orders you out, demands you turn off your dash camera, and threatens to charge you with constructive possession of narcotics and impound your vehicle.',
    jurisdictionContext: 'Pennsylvania v. Mimms, 434 U.S. 106 & Wyoming v. Houghton, 526 U.S. 295',
    initialContext: 'Nighttime stop on city avenue. Rideshare app active on dash mount; commercial interior dashcam recording.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Step out of the car right now, driver! I see drug paraphernalia at your passenger\'s feet. Turn off that dashcam recording right now or I\'ll seize it as evidence!',
        officerAudioPrompt: 'Step out of the car right now, driver! Turn off that dashcam recording right now or I will seize it as evidence!',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'MANDATORY DRIVER EXIT: Pennsylvania v. Mimms',
          recommendedResponse: 'Comply with exit order while asserting First Amendment recording: "Officer, I am complying with your exit command under Mimms. However, I am keeping my commercial dashcam active under the First Amendment."',
          legalCitation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977) & Turner v. Driver, 848 F.3d 678 (5th Cir. 2017)',
          statuteOrCase: 'Police can unconditionally order any driver out of a vehicle during a lawful stop. However, police cannot order you to cease passive audio/video recording from a vehicle dashcam.',
          explanation: 'Complying with the physical exit order prevents arrest for obstruction, while preserving the camera secures unbiased evidence.',
          deEscalationTip: 'Keep hands empty and visible as you step out of the vehicle.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Comply with exit order calmly, protect camera: "Officer, I am complying with your order to exit under Mimms. However, I am keeping my commercial dash camera active as protected by the First Amendment. I am an on-duty rideshare driver and have no connection to the passenger\'s bags."',
            spokenStatement: 'Officer, I am complying with your order to exit. However, I am keeping my dash camera recording as permitted by law. I am an on-duty rideshare driver operating on the platform.',
            isBestPractice: true,
            category: 'DE_ESCALATE',
            feedback: 'TACTICAL MASTERY: You correctly comply with the Pennsylvania v. Mimms exit order for officer safety while firmly asserting your First Amendment recording rights. Stating your gig rideshare status immediately establishes lack of dominion/control over passenger cargo.',
            citation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977) & Turner v. Driver, 848 F.3d 678 (5th Cir. 2017)',
            scoreDelta: +25
          },
          {
            label: 'Refuse to exit the vehicle: "You can\'t tell me to step out for a light bulb! This is harassment and my passenger did it!"',
            spokenStatement: 'You cannot make me step out for a bulb! This is harassment and you need to deal with my passenger!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'CRITICAL ERROR: Under Pennsylvania v. Mimms, police have absolute authority to order the driver out of any lawfully stopped vehicle for officer safety. Refusing can lead to physical removal, taser deployment, and obstruction charges.',
            citation: 'Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
            scoreDelta: -30
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Whose backpack is that? Since it\'s in your vehicle, you have constructive possession. You\'re going to jail unless you give me consent to search your entire trunk, glovebox, and personal phone right now.',
        officerAudioPrompt: 'Whose backpack is that? Since it is in your vehicle, you have constructive possession. Give me consent to search your trunk and phone.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'REFUSE CONSENT TO SEARCH VEHICLE & DIGITAL DEVICES: Wyoming v. Houghton & Riley',
          recommendedResponse: 'State unequivocally: "Officer, I do not consent to any searches of my vehicle, trunk, personal belongings, or digital phone. That backpack belongs exclusively to the passenger."',
          legalCitation: 'Wyoming v. Houghton, 526 U.S. 295 (1999) & Riley v. California, 573 U.S. 373 (2014)',
          statuteOrCase: 'Under Wyoming v. Houghton, police may search containers in a vehicle capable of holding the object of probable cause, but they cannot search your locked trunk or phone without independent probable cause or a search warrant.',
          explanation: 'Never give consent. Voluntary consent waives all 4th Amendment suppression arguments.',
          deEscalationTip: 'State non-consent clearly and calmly without shouting.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Refuse consent for personal spaces, invoke silence: "Officer, I do not consent to any searches of my vehicle, trunk, personal belongings, or phone. The backpack belongs exclusively to the rideshare passenger who hailed this trip, verified by the digital platform log. I am exercising my Fourth and Fifth Amendment rights."',
            spokenStatement: 'Officer, I do not consent to any searches of my vehicle, personal belongings, or phone. That bag belongs to the rider according to platform records. I invoke my right to remain silent.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'FLAWLESS DEFENSE: Wyoming v. Houghton allows police to search containers in a vehicle capable of holding contraband if they have probable cause, BUT they CANNOT conduct a fishing expedition into your locked trunk or phone without a warrant. Never consent.',
            citation: 'Wyoming v. Houghton, 526 U.S. 295 (1999) & Riley v. California, 573 U.S. 373 (2014)',
            scoreDelta: +30
          },
          {
            label: 'Surrender search consent: "Fine, search whatever you want! Search my trunk and phone so you know I\'m innocent!"',
            spokenStatement: 'Fine, search whatever you want! Search my trunk and phone so you know I am innocent!',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'FATAL CONCESSION: Giving blanket voluntary consent expands the officer\'s scope beyond the passenger\'s perimeter. Any unrelated item found in your trunk or messages on your phone can now be used against you.',
            citation: 'Schneckloth v. Bustamonte, 412 U.S. 218 (1973)',
            scoreDelta: -35
          }
        ]
      },
      {
        stepNumber: 3,
        officerStatement: 'Your passenger is claiming you sold them the bag! I\'m putting cuffs on you for constructive possession unless you start answering questions about where you came from.',
        officerAudioPrompt: 'Your passenger is claiming you sold them the bag! I am putting cuffs on you unless you start answering questions.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'INVOKE 5TH AMENDMENT SILENCE & 6TH AMENDMENT COUNSEL',
          recommendedResponse: 'State: "Officer, I am invoking my right to remain silent and my right to an attorney. I will not answer questions without counsel. Am I under arrest, or am I free to go?"',
          legalCitation: 'Edwards v. Arizona, 451 U.S. 477 (1981) & Miranda v. Arizona, 384 U.S. 436 (1966)',
          statuteOrCase: 'Under Edwards v. Arizona and Berghuis v. Thompkins, you must unambiguously invoke your right to silence and counsel. Once invoked, all custodial questioning must immediately cease.',
          explanation: 'Blaming the passenger or arguing roadside provides conflicting statements that prosecutors exploit.',
          deEscalationTip: 'State the phrase clearly once, then remain completely silent.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Invoke right to counsel & clarify detention status: "Officer, I am invoking my right to remain silent and my right to an attorney. I want my lawyer present for any interrogation. Am I under arrest, or am I free to go?"',
            spokenStatement: 'Officer, I am invoking my right to remain silent and my right to legal counsel. I will not answer questions without an attorney. Am I under arrest or free to go?',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'INVINCIBLE SHIELD: Clear, unequivocal invocation of the 5th and 6th Amendments under Miranda and Edwards v. Arizona cuts off all custodial interrogation immediately. Asking "Am I under arrest or free to go?" forces the officer to commit on the record.',
            citation: 'Edwards v. Arizona, 451 U.S. 477 (1981) & Miranda v. Arizona, 384 U.S. 436 (1966)',
            scoreDelta: +35
          },
          {
            label: 'Argue and fabricate stories: "He\'s a lying addict! Look at my Uber app, look at my text history, I\'ve never seen this guy before!"',
            spokenStatement: 'He is a lying addict! Look at my Uber app, look at my messages, I do not know this guy!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'HAZARDOUS TRAP: Engaging in an emotional shouting match with the officer and giving unverified statements creates inconsistent statements that prosecutors exploit at trial. Always invoke silence.',
            citation: 'Berghuis v. Thompkins, 560 U.S. 370 (2010)',
            scoreDelta: -25
          }
        ]
      }
    ]
  },
  {
    id: 'sim-cash-forfeiture',
    title: 'Gig Contractor: Roadside Cash Seizure & Asset Forfeiture',
    category: 'Vehicle Searches',
    difficulty: 'Advanced',
    description: 'You are an independent contractor carrying $7,400 in cash from a completed remodeling job and a private equipment sale. An officer stops you on an interstate highway for an alleged 2-second following distance. After spotting the bank cash envelope on the center console, the officer orders you out, claims large cash sums are presumed drug proceeds under Civil Asset Forfeiture, calls a narcotics K-9, and threatens to seize the currency.',
    jurisdictionContext: 'Timbs v. Indiana, 139 S. Ct. 682 & Rodriguez v. United States, 575 U.S. 348',
    initialContext: 'Interstate highway shoulder. Patrol cruiser lights flashing behind work vehicle.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'That is a lot of cash sitting on your console, driver. Normal people do not carry envelopes of thousands in cash. You\'re involved in illegal narcotics trafficking or money laundering. Where did this money come from?',
        officerAudioPrompt: 'That is a lot of cash on your console. Where did this money come from?',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'REFUSE FINANCIAL INTERROGATION: 5th Amendment Protection',
          recommendedResponse: 'State: "Officer, carrying U.S. currency is entirely legal under federal law. Respectfully, I choose to remain silent regarding my personal finances. Here are my driving credentials."',
          legalCitation: 'U.S. Const. Amend. V & 31 U.S.C. § 5103',
          statuteOrCase: 'There is no dollar limit on carrying cash domestically within the United States. Providing driver license and vehicle documents satisfies the statutory stop requirements.',
          explanation: 'Volunteering financial details or contractor work history allows officers to fabricate pretextual discrepancies for civil forfeiture seizures.',
          deEscalationTip: 'Hand over documents calmly and politely assert your 5th Amendment rights.',
          confidence: 0.98,
          severity: 'high'
        },
        options: [
          {
            label: 'Invoke silence on personal finances, establish lawful possession: "Officer, carrying U.S. currency is entirely legal under federal law. Respectfully, I am choosing to exercise my Fifth Amendment right to remain silent regarding my personal finances. Here is my driver\'s license, registration, and insurance."',
            spokenStatement: 'Officer, carrying U.S. currency is completely legal. Respectfully, I exercise my Fifth Amendment right to remain silent regarding my finances. Here are my driving credentials.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CONSTITUTIONAL PRECISION: There is no legal limit on carrying cash within the United States. Providing driving documents satisfies legal obligations while refusing roadside financial interrogation prevents self-incrimination.',
            citation: 'U.S. Constitution Amend. V & 31 U.S.C. § 5103',
            scoreDelta: +25
          },
          {
            label: 'Get defensive: "That\'s none of your business! You can\'t ask me about my money, you\'re just a traffic cop!"',
            spokenStatement: 'That is none of your business! You cannot ask me about my money!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'ESCALATION RISK: While legally you do not have to answer financial questions, aggressive hostility gives the officer an excuse to claim you are acting nervous or evasive, which officers falsely cite in asset forfeiture affidavits.',
            citation: 'Illinois v. Wardlow, 528 U.S. 119 (2000)',
            scoreDelta: -20
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Because you\'re refusing to explain the money, I\'m calling a drug dog to sniff your car. Step back to my cruiser while we wait 25 minutes for the K-9 unit to arrive.',
        officerAudioPrompt: 'Because you are refusing to explain the money, I am calling a drug dog. Wait 25 minutes for the K-9 unit.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'PROHIBITED STOP PROLONGATION: Rodriguez Doctrine',
          recommendedResponse: 'State: "Officer, under Rodriguez v. United States, you cannot extend this traffic stop beyond the time needed to address the following-distance infraction. I do not consent to waiting for a dog. Am I free to leave?"',
          legalCitation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
          statuteOrCase: 'Under Rodriguez v. United States, police cannot prolong a traffic stop to conduct a dog sniff without reasonable suspicion of a crime. Refusal to consent to a search or question cannot serve as reasonable suspicion.',
          explanation: 'Explicitly voicing your lack of consent to the delay preserves your 4th Amendment suppression rights.',
          deEscalationTip: 'Speak with calm authority and note the time on your dashboard clock.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Assert Rodriguez violation on prolonged detention: "Officer, under Rodriguez v. United States, you cannot prolong this traffic stop beyond the time required to complete the citation for following distance. I do not consent to any prolonged detention or vehicle search. Am I free to leave?"',
            spokenStatement: 'Officer, under Rodriguez v. United States, you cannot extend this stop beyond the original citation mission. I do not consent to waiting for a dog or any search. Am I free to leave?',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CASE LAW BULLETPROOF: In Rodriguez v. United States (2015), the Supreme Court ruled that police cannot extend a completed traffic stop by even a single minute to conduct a dog sniff without independent reasonable suspicion. Citing Rodriguez puts the officer on notice for a § 1983 civil rights lawsuit.',
            citation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
            scoreDelta: +35
          },
          {
            label: 'Agree to wait: "Okay, bring the dog. I have nothing to hide anyway."',
            spokenStatement: 'Okay, bring the dog. I have nothing to hide anyway.',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'WAIVING RODRIGUEZ PROTECTIONS: By agreeing to wait for the K-9 unit, you consent to extending the stop, destroying your Fourth Amendment suppression claim in court if the dog alerts falsely.',
            citation: 'Rodriguez v. United States, 575 U.S. 348 (2015)',
            scoreDelta: -30
          }
        ]
      },
      {
        stepNumber: 3,
        officerStatement: 'I am taking this $7,400 as suspected civil forfeiture contraband. Sign this voluntary roadside abandonment disclaimer right here and I will let you go without a ticket.',
        officerAudioPrompt: 'I am taking this money as civil forfeiture contraband. Sign this voluntary abandonment disclaimer right here.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'NEVER SIGN ROADSIDE WAIVERS: Demand Official Property Receipt',
          recommendedResponse: 'State: "I will not sign any abandonment waiver. This is my lawful money. If you seize it, I demand a sworn, itemized property receipt with your badge number, department, and incident number immediately."',
          legalCitation: 'Timbs v. Indiana, 139 S. Ct. 682 (2019) & 18 U.S.C. § 981',
          statuteOrCase: 'Under the Eighth Amendment Excessive Fines Clause (Timbs v. Indiana), unconstitutional civil forfeitures are illegal. Signing an abandonment waiver waives your title and legal remedy.',
          explanation: 'Demanding an itemized official receipt forces police to establish a sworn evidence chain for your attorney to petition for immediate release.',
          deEscalationTip: 'Do not touch the paperwork. Keep your hands visible and calmly repeat your demand for a receipt.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Firmly refuse abandonment waiver & demand itemized receipt: "I will NOT sign any abandonment waiver or disclaimer. This is my lawful property. If you seize it, I demand a sworn, itemized property receipt with your badge number, department name, exact serial count, and incident case number immediately."',
            spokenStatement: 'I will not sign any waiver or abandonment form. This is my lawful property. I demand an itemized property receipt with your name, badge number, and incident number immediately.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'PROTECTS EVIDENCE CHAIN: Officers in forfeiture traps routinely coerce citizens into signing roadside "waivers" declaring they abandon the cash. Never sign! Demanding an itemized receipt with badge and case numbers creates the formal evidence chain necessary for your attorney to recover the money.',
            citation: 'Timbs v. Indiana, 139 S. Ct. 682 (2019) (Eighth Amendment Excessive Fines Clause)',
            scoreDelta: +35
          },
          {
            label: 'Sign the waiver to avoid going to jail: "If signing this means I don\'t get arrested, I\'ll sign it."',
            spokenStatement: 'If signing this means I do not get arrested, I will sign it.',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'IRREVERSIBLE DISASTER: Signing a roadside disclaimer surrenders all ownership claims to your cash under state civil forfeiture law. Recovering funds after signing an abandonment form is nearly impossible.',
            citation: 'Civil Asset Forfeiture Reform Act (CAFRA), 18 U.S.C. § 981',
            scoreDelta: -45
          }
        ]
      }
    ]
  },
  {
    id: 'sim-terry-rural-patdown',
    title: 'Rural Highway Speed Trap & Coerced Terry Weapons Frisk',
    category: 'Traffic Stop Basics',
    difficulty: 'Intermediate',
    description: 'A lone county deputy on an unlit country road pulls you over for driving 59 mph in a 55 mph zone. After ordering you out of your car under Pennsylvania v. Mimms, the deputy immediately commands you to face away, place your hands flat on the hood of the squad car, and spread your feet for a "routine officer safety weapons frisk", despite you showing zero hostility, no suspicious bulges, and complete cooperation.',
    jurisdictionContext: 'Terry v. Ohio, 392 U.S. 1 & Minnesota v. Dickerson, 508 U.S. 366',
    initialContext: 'Dark rural highway. Squad car headlights illuminating your vehicle.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Driver, put your hands flat on the hood and spread your feet! I pat down everyone I pull over out here on the highway for officer safety. Do not move!',
        officerAudioPrompt: 'Driver, put your hands flat on the hood and spread your feet! I pat down everyone for officer safety.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'ROUTINE PAT-DOWNS ARE UNCONSTITUTIONAL: Terry v. Ohio',
          recommendedResponse: 'Comply with physical posture for safety while stating verbal non-consent: "Deputy, I am complying with your physical safety commands, but I explicitly state on the record that I do not consent to any pat-down or search of my person or pockets."',
          legalCitation: 'Terry v. Ohio, 392 U.S. 1 (1968) & Arizona v. Johnson, 555 U.S. 323 (2009)',
          statuteOrCase: 'Under Terry v. Ohio, an officer cannot conduct a weapons frisk as a routine practice. They must possess specific, articulable reasonable suspicion that you are both armed AND dangerous.',
          explanation: 'Never physically fight an officer on a dark highway. Preserve your rights verbally while complying with physical positioning.',
          deEscalationTip: 'State your verbal non-consent clearly and do not make sudden hand movements.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Comply with physical posture while explicitly objecting to frisk: "Deputy, I am complying with your physical safety commands for your safety and mine, but I explicitly state for the record that I do not consent to any physical search, pat-down, or search of my pockets. You have no reasonable suspicion that I am armed or dangerous."',
            spokenStatement: 'Deputy, I am complying with your physical safety commands, but I explicitly state on the record that I do not consent to any pat-down or search of my person or pockets.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'EXCELLENT BALANCE: Never physically resist an officer\'s commands on a dark roadside as that risks lethal force. By stating verbal non-consent clearly, you preserve your Fourth Amendment Terry v. Ohio objection for court while maintaining personal safety.',
            citation: 'Terry v. Ohio, 392 U.S. 1 (1968) & Arizona v. Johnson, 555 U.S. 323 (2009)',
            scoreDelta: +30
          },
          {
            label: 'Physically pull away or swat the officer\'s hand: "Get your hands off me! You have no right to touch me for a speeding ticket!"',
            spokenStatement: 'Get your hands off me! You have no right to touch me for a speeding ticket!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'LIFE-THREATENING ERROR: Physically swatting or pulling away from an armed officer on a rural highway will instantly trigger physical violence, taser deployment, or firearm draw, and gives them probable cause for felony resisting an officer.',
            citation: 'Tennessee v. Garner, 471 U.S. 1 (1985)',
            scoreDelta: -45
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'I feel a soft object in your front pocket. It might be packaging for illegal contraband. I am reaching inside your pocket right now to pull it out.',
        officerAudioPrompt: 'I feel a soft object in your front pocket. I am reaching inside your pocket right now to pull it out.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'PLAIN FEEL LIMITS: Minnesota v. Dickerson',
          recommendedResponse: 'State: "Deputy, under Minnesota v. Dickerson, a Terry frisk is strictly limited to weapons. A soft item is not immediately apparent as a weapon. I do not consent to you entering my pockets."',
          legalCitation: 'Minnesota v. Dickerson, 508 U.S. 366 (1993)',
          statuteOrCase: 'In Minnesota v. Dickerson, the Supreme Court established the plain feel doctrine: an officer conducting a frisk cannot manipulate or search into pockets unless an object is immediately recognizable as a weapon upon touch.',
          explanation: 'Reaching into pockets for non-weapons without consent turns an unauthorized frisk into an unconstitutional full search.',
          deEscalationTip: 'State non-consent verbally. Keep hands on the squad car hood.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Object under Plain Feel doctrine: "Deputy, I do not consent to you entering my pockets. Under Minnesota v. Dickerson, a Terry pat-down is strictly limited to identifying weapons. A soft object is not immediately apparent as a weapon or contraband. I object to this search."',
            spokenStatement: 'Deputy, I do not consent to you entering my pockets. Under Minnesota v. Dickerson, a Terry frisk is limited to weapons. A soft item is not a weapon. I object to this search.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'SUPREME COURT MASTERY: Under the "Plain Feel" doctrine established in Minnesota v. Dickerson (1993), an officer cannot manipulate or search into pockets unless the object\'s identity as a weapon or contraband is instantly obvious upon light touch. Citing Dickerson will suppress any seized evidence.',
            citation: 'Minnesota v. Dickerson, 508 U.S. 366 (1993)',
            scoreDelta: +35
          },
          {
            label: 'Say nothing and let them search: (Stay silent and let them empty all your pockets).',
            spokenStatement: '...',
            isBestPractice: false,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'TACIT ACQUIESCENCE: Silence during an unauthorized pocket search can be argued by prosecutors as implied consent. Clearly stating "I do not consent to entering my pockets" is essential.',
            citation: 'Schneckloth v. Bustamonte, 412 U.S. 218 (1973)',
            scoreDelta: -20
          }
        ]
      }
    ]
  },
  {
    id: 'sim-protest-phone-curfew',
    title: 'Protest Perimeter: Dispersal Order & Phone Deletion Threat',
    category: 'Public Filming',
    difficulty: 'Advanced',
    description: 'You are returning to your parked vehicle along a public sidewalk two blocks away from a downtown protest when bicycle officers cordon off the street and declare an emergency curfew dispersal. An officer corners you against a building, orders you to stop filming on your smartphone, and aggressively demands you unlock the device so they can delete your footage under threat of arrest.',
    jurisdictionContext: 'Glik v. Cunniffe, 655 F.3d 78 & Riley v. California, 573 U.S. 373',
    initialContext: 'Downtown sidewalk at dusk. Riot police line blocking the cross street.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'You are in an unlawful assembly zone! Put that phone away right now! Recording our tactical formation is interfering with police operations. Shut it off or you are going in handcuffs!',
        officerAudioPrompt: 'You are in an unlawful assembly zone! Put that phone away right now! Shut it off or you are going in handcuffs!',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: '1ST AMENDMENT FILMING RIGHTS IN PUBLIC: Glik v. Cunniffe',
          recommendedResponse: 'State: "Officer, I am peacefully recording on a public sidewalk under the First Amendment without interference. I am complying with dispersal and walking to my car. Which way should I exit?"',
          legalCitation: 'Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011) & Turner v. Driver, 848 F.3d 678 (5th Cir. 2017)',
          statuteOrCase: 'Citizens have a constitutionally protected First Amendment right to film police officers performing public duties in public spaces. Police cannot order recording stopped unless you physically obstruct.',
          explanation: 'Affirming that you are actively dispersing eliminates pretextual grounds for an arrest for failure to disperse.',
          deEscalationTip: 'Maintain a safe physical distance of 10-15 feet while recording.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Affirm First Amendment right to record while confirming exit path: "Officer, I am peacefully recording on a public sidewalk as protected by the First Amendment. I am not interfering with your operations. I am walking directly to my parked car to comply with your dispersal order. Which direction would you like me to walk?"',
            spokenStatement: 'Officer, I am recording on a public sidewalk under the First Amendment without interference. I am walking to my car to comply with dispersal. Which direction should I exit?',
            isBestPractice: true,
            category: 'DE_ESCALATE',
            feedback: 'CONSTITUTIONAL PRECISION: Filming police from a non-interfering distance on public sidewalks is clearly established First Amendment conduct across all federal circuits. Asking for the exit route demonstrates compliance with lawful dispersal orders.',
            citation: 'Glik v. Cunniffe, 655 F.3d 78 (1st Cir. 2011) & Turner v. Driver, 848 F.3d 678 (5th Cir. 2017)',
            scoreDelta: +30
          },
          {
            label: 'Taunt the officer: "You can\'t tell me what to do, you fascist pig! I\'m staying right here all night and livestreaming your face!"',
            spokenStatement: 'You cannot tell me what to do! I am staying right here and livestreaming your face!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'PROVOKING UNLAWFUL ARREST: While verbal criticism of police is First Amendment protected (City of Houston v. Hill), refusing to obey a valid public safety dispersal order gives officers legal grounds to arrest you for failure to disperse.',
            citation: 'City of Houston v. Hill, 482 U.S. 451 (1987)',
            scoreDelta: -35
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'Hand over that phone! Unlock it and delete the video of my face right now or I am arresting you for obstruction and destroying your phone as evidence!',
        officerAudioPrompt: 'Hand over that phone! Unlock it and delete the video right now or you are under arrest!',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'DIGITAL DEVICE PRIVACY & EVIDENCE TAMPERING: Riley v. California & 18 U.S.C. § 1519',
          recommendedResponse: 'State: "Officer, under Riley v. California you need a judicial warrant to search my phone. Under 18 U.S.C. § 1519, ordering footage deleted is federal evidence tampering. I will not unlock or delete anything."',
          legalCitation: 'Riley v. California, 573 U.S. 373 (2014) & 18 U.S.C. § 1519',
          statuteOrCase: 'Under Riley v. California, police cannot search a mobile phone without a warrant. Ordering a citizen to destroy recordings of an encounter constitutes federal evidence tampering and civil rights deprivation under 18 U.S.C. § 242.',
          explanation: 'Deleting video destroys your sole objective evidence. Live stream vault backup protects the recording automatically.',
          deEscalationTip: 'Hold the phone firmly with lock screen engaged. Do not unlock using facial recognition.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Refuse passcode & warn of federal evidence destruction statute: "Officer, under Riley v. California, you cannot search my phone without a warrant. Under 18 U.S.C. § 1519, ordering a citizen to destroy recorded footage is federal evidence tampering. I will not unlock my phone or delete any media. My live stream is already backed up to an encrypted cloud evidence vault."',
            spokenStatement: 'Officer, under Riley v. California you need a warrant to search my phone. Under federal law, ordering footage deleted is evidence tampering. I will not unlock or delete anything.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'UNTOUCHABLE SHIELD: Police cannot search digital devices without a search warrant (Riley v. California). Furthermore, officers who seize phones or force deletion of video commit federal crimes under 18 U.S.C. § 1519 and § 242 (Deprivation of Rights Under Color of Law).',
            citation: 'Riley v. California, 573 U.S. 373 (2014) & 18 U.S.C. § 1519',
            scoreDelta: +40
          },
          {
            label: 'Unlock the phone and delete: "Okay, please do not arrest me! Look, I am deleting the video right now."',
            spokenStatement: 'Okay, please do not arrest me! Look, I am deleting the video right now.',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'DESTROYING YOUR OWN EVIDENCE: Deleting your video destroys the sole objective evidence that proves you were peacefully complying and that the officer acted unlawfully. Never delete footage.',
            citation: 'First Amendment Right to Record',
            scoreDelta: -40
          }
        ]
      }
    ]
  },
  {
    id: 'sim-second-amendment-carry',
    title: 'Permitless Carry State: Lawful Holstered Firearm Confrontation',
    category: 'Traffic Stop Basics',
    difficulty: 'Advanced',
    description: 'You are legally carrying a holstered sidearm in a permitless constitutional carry state while driving home. An officer stops you for failing to signal a lane change 100 feet before an intersection. The officer notices your holster clipped to your waistband, draws their service weapon, and screams conflicting commands for you to keep your hands on the wheel while reaching for your driver\'s license.',
    jurisdictionContext: 'NYSRPA v. Bruen, 142 S. Ct. 2111 & Terry v. Ohio, 392 U.S. 1',
    initialContext: 'Suburban boulevard. Side mirror shows officer with hand unholstered.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'GUN! GUN! Do not touch it! Reach for your wallet and get your hands up at the same time! Do not move or I will shoot!',
        officerAudioPrompt: 'GUN! GUN! Keep your hands up and reach for your wallet! Do not move or I will shoot!',
        aiCommentary: {
          category: 'DE_ESCALATE',
          headline: 'FREEZE WITH HANDS VISIBLE ON STEERING WHEEL: De-escalate Panic',
          recommendedResponse: 'Keep hands glued to 10 and 2: "Officer, my hands are flat on top of the steering wheel. I am not moving. I am a lawful gun owner. My firearm is securely holstered. Tell me how you want me to proceed before I move."',
          legalCitation: 'Graham v. Connor, 490 U.S. 386 (1989) & District of Columbia v. Heller, 554 U.S. 570 (2008)',
          statuteOrCase: 'When an officer shouts conflicting commands under high adrenaline, never reach toward your waist or pockets. Verbal communication and visible hands prevent accidental discharge.',
          explanation: 'Reaching for credentials while an officer sees a firearm creates immediate risk of lethal force under the reasonable officer standard.',
          deEscalationTip: 'Speak in a loud, slow, clear voice. Do not take your hands off the steering wheel rim.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Freeze with hands on 10 and 2, announce calmly without moving: "Officer, my hands are flat on top of the steering wheel. I am not moving. I am a lawful gun owner in full compliance with state carry laws. My firearm is securely holstered. Tell me specifically how you want me to proceed before I move any finger."',
            spokenStatement: 'Officer, my hands are flat on the steering wheel. I am not moving. I am a lawful gun owner. My firearm is securely holstered. Tell me how you want me to proceed before I move.',
            isBestPractice: true,
            category: 'DE_ESCALATE',
            feedback: 'LIFE-SAVING PROTOCOL: When an officer is hyperventilating with a drawn weapon, conflicting commands can be fatal. Freezing with hands visibly plastered to the steering wheel and verbally acknowledging the firearm defuses panic without reaching near the waistband.',
            citation: 'Graham v. Connor, 490 U.S. 386 (1989) & NYSRPA v. Bruen, 142 S. Ct. 2111 (2022)',
            scoreDelta: +35
          },
          {
            label: 'Reach down quickly for your wallet to show your permit: "Wait, I have a permit! Let me grab my wallet from my back pocket!"',
            spokenStatement: 'Wait, I have a permit! Let me reach for my wallet right now to prove it!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'POTENTIALLY FATAL ACTION: Reaching toward your hip or back pocket when an officer has shouted "GUN" is the leading cause of tragic officer-involved shootings. NEVER reach toward your waist or pockets.',
            citation: 'Standard Law Enforcement Use of Force Protocols',
            scoreDelta: -50
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'You didn\'t inform me the second I walked up to your window! In this state you committed a crime! I am disarming you right now and taking your firearm to the trunk.',
        officerAudioPrompt: 'You did not inform me the second I walked up! I am disarming you right now and taking your firearm.',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'SUBMIT TO TEMPORARY DISARMAMENT UNDER VERBAL OBJECTION',
          recommendedResponse: 'State: "Officer, I submit to your temporary possession of the weapon for safety, but I do not consent to any serial number tracing or permanent confiscation of my firearm."',
          legalCitation: 'Terry v. Ohio, 392 U.S. 1 (1968) & Pennsylvania v. Mimms, 434 U.S. 106 (1977)',
          statuteOrCase: 'Under Terry v. Ohio and state safety doctrines, police may temporarily take custody of an accessible firearm for the duration of a traffic stop. However, they cannot seize it permanently without criminal charges.',
          explanation: 'Physically blocking or fighting disarmament is criminal obstruction with a weapon.',
          deEscalationTip: 'Allow the officer to retrieve the firearm while keeping your hands visible.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Clarify state statutory duty to inform calmly: "Officer, in this jurisdiction, there is no duty to inform unless specifically asked, or I have satisfied our state\'s duty. I submit to your temporary possession for your safety, but I do not consent to any serial number tracing or permanent confiscation of my firearm."',
            spokenStatement: 'Officer, I submit to your temporary possession for safety, but I do not consent to any serial number check or confiscation of my lawfully carried firearm.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'STATUTORY MASTERY: States fall into either mandatory duty-to-inform (e.g., Ohio, Michigan, Texas, North Carolina) or non-duty states (e.g., Florida, Pennsylvania, California until asked). Submitting to temporary disarmament under protest protects both your life and your legal remedies.',
            citation: 'District of Columbia v. Heller, 554 U.S. 570 (2008)',
            scoreDelta: +30
          },
          {
            label: 'Argue and physically block the officer: "You can\'t take my gun! The Second Amendment says shall not be infringed!"',
            spokenStatement: 'You cannot take my gun! The Second Amendment says shall not be infringed!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'DANGEROUS RESISTANCE: Police are legally permitted under Terry v. Ohio and Pennsylvania v. Mimms to temporarily secure an accessible firearm during a stop for officer safety. Physically blocking disarmament constitutes felony resisting with a weapon.',
            citation: 'Terry v. Ohio, 392 U.S. 1 (1968)',
            scoreDelta: -45
          }
        ]
      }
    ]
  },
  {
    id: 'sim-tint-interior-intrusion',
    title: 'Dark Window Tint: Officer Physical Cabin Intrusion Search',
    category: 'Vehicle Searches',
    difficulty: 'Intermediate',
    description: 'An officer stops your vehicle for allegedly violating state window tint darkness limits. You roll your window down 3 inches to communicate safely. Rather than using an exterior tint-meter inspection tool, the officer reaches their arm through your window crack, unlocks the door from the inside, opens the door, and leans their head and torso deep into the cabin to scan the floorboards.',
    jurisdictionContext: 'United States v. Jones, 565 U.S. 400 & New York v. Class, 475 U.S. 106',
    initialContext: 'Daytime traffic stop in commercial district. Window rolled down 3 inches.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'Why is your window only cracked? I need to inspect the inside of your car. (Officer unlocks and swings open your door, sticking their head into your cabin).',
        officerAudioPrompt: 'Why is your window only cracked? I need to inspect the inside of your car.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'PHYSICAL ENTRY INTO VEHICLE IS A 4TH AMENDMENT SEARCH: United States v. Jones',
          recommendedResponse: 'State: "Officer, physically penetrating the interior of my car is a search under United States v. Jones. Window tint inspection is conducted using an exterior photometer on the glass. I do not consent to your physical entry into my vehicle cabin."',
          legalCitation: 'United States v. Jones, 565 U.S. 400 (2012) & Florida v. Jardines, 569 U.S. 1 (2013)',
          statuteOrCase: 'Under the physical trespassory test in United States v. Jones, an officer reaching or leaning their body into a vehicle cabin constitutes a search under the Fourth Amendment, which requires probable cause or a warrant.',
          explanation: 'Verbally objecting on the record ensures that any observations made inside the vehicle cannot be claimed as plain view.',
          deEscalationTip: 'State non-consent verbally without grabbing the door handle.',
          confidence: 0.99,
          severity: 'high'
        },
        options: [
          {
            label: 'Object to physical intrusion into vehicle interior under United States v. Jones: "Officer, physically penetrating the interior of my vehicle is a Fourth Amendment search under United States v. Jones. Window tint inspection is conducted using an exterior photometer on the glass. I do not consent to this search or your physical entry into my vehicle cabin."',
            spokenStatement: 'Officer, physically entering the interior of my car is a search under United States v. Jones. I do not consent to you opening my door or searching the cabin.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'CONSTITUTIONAL MASTERCLASS: In United States v. Jones (2012) and Florida v. Jardines, the Supreme Court revived the trespassory test: any physical intrusion into a constitutionally protected space (like a vehicle interior) without a warrant or probable cause is an unconstitutional search.',
            citation: 'United States v. Jones, 565 U.S. 400 (2012) & New York v. Class, 475 U.S. 106 (1986)',
            scoreDelta: +35
          },
          {
            label: 'Reach out to grab the door handle back: "Hey! Close my door! You can\'t open my door!" (Grabbing the door to close it).',
            spokenStatement: 'Hey! Close my door right now!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'PHYSICAL RESISTANCE HAZARD: Attempting to grab a door while an officer\'s body or arm is inside can be interpreted as attempting to crush or assault an officer, leading to immediate force. Object verbally with case citations.',
            citation: 'De-escalation Safety Protocols',
            scoreDelta: -35
          }
        ]
      }
    ]
  },
  {
    id: 'sim-campus-police-border',
    title: 'Campus Police Off-Campus City Stop & Dorm Search Demand',
    category: 'Pedestrian Encounters',
    difficulty: 'Intermediate',
    description: 'You are driving two blocks away from university property on a public municipal city street. A marked University Campus Police cruiser initiates a traffic stop for a rolling stop at a stop sign. The campus officer demands your student ID, threatens you with academic suspension, and orders you to accompany them to your off-campus rented apartment so they can inspect your room.',
    jurisdictionContext: 'Payton v. New York, 445 U.S. 573 & Constitutional Due Process',
    initialContext: 'City boulevard two blocks south of state university campus gate.',
    steps: [
      {
        stepNumber: 1,
        officerStatement: 'You go to State University, don\'t you? Give me your Student ID card right now or I\'ll report you to the Dean of Students for immediate suspension and code of conduct violation!',
        officerAudioPrompt: 'You go to State University, don\'t you? Give me your Student ID right now or I will report you to the Dean.',
        aiCommentary: {
          category: 'MUST_COMPLY',
          headline: 'PROVIDE MOTOR VEHICLE CREDENTIALS, NOT ACADEMIC BADGES',
          recommendedResponse: 'State: "Officer, this is a public road. I am providing my state driver\'s license, registration, and proof of insurance as required by the motor vehicle code. Student conduct policies do not replace statutory law."',
          legalCitation: 'State Motor Vehicle Code & Constitutional Due Process',
          statuteOrCase: 'On public city roads, your statutory duty is to provide your state driver\'s license and insurance. Campus police acting outside campus grounds cannot demand student university IDs under threat of academic retaliation.',
          explanation: 'Providing your official driver documents satisfies the law while preventing unauthorized student conduct violations.',
          deEscalationTip: 'Hand over driver credentials calmly and refuse to answer university policy questions.',
          confidence: 0.98,
          severity: 'medium'
        },
        options: [
          {
            label: 'Provide state driver\'s license, separate university rules from criminal law: "Officer, this is a public municipal road. I am providing my state driver\'s license, registration, and proof of insurance as required by the motor vehicle code. Student codes of conduct do not supersede Fourth Amendment constitutional protections."',
            spokenStatement: 'Officer, here is my state driver license, registration, and insurance. Student conduct policies do not replace the motor vehicle code or constitutional law.',
            isBestPractice: true,
            category: 'MUST_COMPLY',
            feedback: 'AUTHORITY BOUNDARY DEFENSE: On public streets, your legal duty is governed by state traffic codes, requiring a state driver\'s license. Campus police on public roads operate under mutual aid or state peace officer commissions, and cannot use university disciplinary threats to bypass statutory rights.',
            citation: 'State Motor Vehicle Code & Constitutional Due Process',
            scoreDelta: +30
          },
          {
            label: 'Surrender all university credentials and student portal passwords: "Here is my student ID, my student email, please do not suspend me from school!"',
            spokenStatement: 'Here is my student ID and email, please do not report me to the university!',
            isBestPractice: false,
            category: 'DE_ESCALATE',
            feedback: 'UNNECESSARY SURRENDER: Submitting to administrative threats when stopped for a minor city traffic infraction invites the officer to unlawfully intrude into your student academic standing.',
            citation: 'Fourth Amendment Search Doctrine',
            scoreDelta: -25
          }
        ]
      },
      {
        stepNumber: 2,
        officerStatement: 'We are going to your apartment right now. As campus police, we have the right to search any student residence for university policy violations without a warrant.',
        officerAudioPrompt: 'We are going to your apartment right now. As campus police, we have the right to search student residences without a warrant.',
        aiCommentary: {
          category: 'RIGHT_TO_REFUSE',
          headline: 'OFF-CAMPUS HOMES ARE IMMUNE TO WARRANTLESS SEARCHES: Payton v. New York',
          recommendedResponse: 'State: "Officer, I do not consent to any search of my home or apartment. Under Payton v. New York, you cannot enter my residence without a search warrant signed by a judge."',
          legalCitation: 'Payton v. New York, 445 U.S. 573 (1980)',
          statuteOrCase: 'In Payton v. New York, the Supreme Court established that police entry into a private residence without a warrant is presumptively unreasonable. University police have no jurisdiction to search off-campus residences without a judicial warrant.',
          explanation: 'Never consent to home entry. Consent waives all Fourth Amendment protections.',
          deEscalationTip: 'State non-consent clearly and refuse to drive officers to your residence.',
          confidence: 0.99,
          severity: 'critical'
        },
        options: [
          {
            label: 'Refuse off-campus warrantless search: "Officer, I do not consent to any search of my home or apartment. An off-campus residence has full Fourth Amendment privacy protections under Payton v. New York. You cannot enter my home without a search warrant signed by a neutral judge."',
            spokenStatement: 'Officer, I do not consent to any search of my residence. Under Payton v. New York, you cannot enter my home without a signed search warrant from a judge.',
            isBestPractice: true,
            category: 'RIGHT_TO_REFUSE',
            feedback: 'IRONCLAD PRIVACY DEFENSE: Off-campus apartments have the highest expectation of privacy under the Fourth Amendment. University police have ZERO authority to search off-campus student homes without a judicially signed warrant or emergency exigent circumstances.',
            citation: 'Payton v. New York, 445 U.S. 573 (1980)',
            scoreDelta: +35
          },
          {
            label: 'Agree to open your apartment: "Well, if you\'re campus police, I guess you can check my room."',
            spokenStatement: 'Well, if you are campus police, I guess you can check my room.',
            isBestPractice: false,
            category: 'MUST_COMPLY',
            feedback: 'FATAL PERMISSION: Giving voluntary consent allows campus police to enter and search your private living space without a warrant. Any items found can lead to criminal charges and expulsion.',
            citation: 'Payton v. New York, 445 U.S. 573 (1980)',
            scoreDelta: -40
          }
        ]
      }
    ]
  }
];
