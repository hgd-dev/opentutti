export type EarTrainingMode = "interval" | "chord" | "cadence";

export type EarTrainingQuestion = {
  id: string;
  mode: EarTrainingMode;
  title: string;
  prompt: string;
  notes: string[][];
  choices: string[];
  answer: string;
  explanation: string;
};

const intervalQuestions: EarTrainingQuestion[] = [
  {
    id: "interval-m2",
    mode: "interval",
    title: "Minor 2nd",
    prompt: "Identify the melodic interval.",
    notes: [["C4"], ["Db4"]],
    choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Perfect 4th"],
    answer: "Minor 2nd",
    explanation:
      "A minor 2nd is the smallest common step between two different note names. It sounds tense and close, like two neighboring piano keys.",
  },
  {
    id: "interval-M2",
    mode: "interval",
    title: "Major 2nd",
    prompt: "Identify the melodic interval.",
    notes: [["C4"], ["D4"]],
    choices: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Perfect 4th"],
    answer: "Major 2nd",
    explanation:
      "A major 2nd is a whole step. It sounds like the first two notes of a major scale: do to re.",
  },
  {
    id: "interval-m3",
    mode: "interval",
    title: "Minor 3rd",
    prompt: "Identify the melodic interval.",
    notes: [["C4"], ["Eb4"]],
    choices: ["Minor 3rd", "Major 3rd", "Perfect 5th", "Major 6th"],
    answer: "Minor 3rd",
    explanation:
      "A minor 3rd has a darker sound than a major 3rd. It is the distance from do to me in minor.",
  },
  {
    id: "interval-M3",
    mode: "interval",
    title: "Major 3rd",
    prompt: "Identify the melodic interval.",
    notes: [["C4"], ["E4"]],
    choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th"],
    answer: "Major 3rd",
    explanation:
      "A major 3rd sounds bright and stable. It is the distance from do to mi in a major scale.",
  },
  {
    id: "interval-P4",
    mode: "interval",
    title: "Perfect 4th",
    prompt: "Identify the melodic interval.",
    notes: [["C4"], ["F4"]],
    choices: ["Major 3rd", "Perfect 4th", "Perfect 5th", "Minor 6th"],
    answer: "Perfect 4th",
    explanation:
      "A perfect 4th sounds open and strong. It is the distance from do to fa.",
  },
  {
    id: "interval-P5",
    mode: "interval",
    title: "Perfect 5th",
    prompt: "Identify the melodic interval.",
    notes: [["C4"], ["G4"]],
    choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Major 6th"],
    answer: "Perfect 5th",
    explanation:
      "A perfect 5th sounds very open and stable. It is the distance from do to sol.",
  },
];

const chordQuestions: EarTrainingQuestion[] = [
  {
    id: "chord-major",
    mode: "chord",
    title: "Major Triad",
    prompt: "Identify the chord quality.",
    notes: [["C4", "E4", "G4"]],
    choices: ["Major", "Minor", "Diminished", "Augmented"],
    answer: "Major",
    explanation:
      "A major triad has a bright and stable sound. From the root, it contains a major 3rd and a perfect 5th.",
  },
  {
    id: "chord-minor",
    mode: "chord",
    title: "Minor Triad",
    prompt: "Identify the chord quality.",
    notes: [["C4", "Eb4", "G4"]],
    choices: ["Major", "Minor", "Diminished", "Augmented"],
    answer: "Minor",
    explanation:
      "A minor triad sounds darker than major. From the root, it contains a minor 3rd and a perfect 5th.",
  },
  {
    id: "chord-diminished",
    mode: "chord",
    title: "Diminished Triad",
    prompt: "Identify the chord quality.",
    notes: [["C4", "Eb4", "Gb4"]],
    choices: ["Major", "Minor", "Diminished", "Augmented"],
    answer: "Diminished",
    explanation:
      "A diminished triad sounds tense and unstable because it has a minor 3rd and a diminished 5th.",
  },
  {
    id: "chord-augmented",
    mode: "chord",
    title: "Augmented Triad",
    prompt: "Identify the chord quality.",
    notes: [["C4", "E4", "G#4"]],
    choices: ["Major", "Minor", "Diminished", "Augmented"],
    answer: "Augmented",
    explanation:
      "An augmented triad sounds bright but unsettled because it has a major 3rd and a raised 5th.",
  },
];

const cadenceQuestions: EarTrainingQuestion[] = [
  {
    id: "cadence-authentic",
    mode: "cadence",
    title: "Authentic Cadence",
    prompt: "Identify the cadence.",
    notes: [
      ["G3", "B3", "D4"],
      ["C4", "E4", "G4"],
    ],
    choices: ["Authentic", "Half", "Plagal", "Deceptive"],
    answer: "Authentic",
    explanation:
      "An authentic cadence moves from V to I. It sounds finished and resolved, like a strong musical period.",
  },
  {
    id: "cadence-half",
    mode: "cadence",
    title: "Half Cadence",
    prompt: "Identify the cadence.",
    notes: [
      ["C4", "E4", "G4"],
      ["G3", "B3", "D4"],
    ],
    choices: ["Authentic", "Half", "Plagal", "Deceptive"],
    answer: "Half",
    explanation:
      "A half cadence ends on V. It sounds unfinished, like the music is pausing and asking for a response.",
  },
  {
    id: "cadence-plagal",
    mode: "cadence",
    title: "Plagal Cadence",
    prompt: "Identify the cadence.",
    notes: [
      ["F3", "A3", "C4"],
      ["C4", "E4", "G4"],
    ],
    choices: ["Authentic", "Half", "Plagal", "Deceptive"],
    answer: "Plagal",
    explanation:
      "A plagal cadence moves from IV to I. It often has an 'amen' sound.",
  },
  {
    id: "cadence-deceptive",
    mode: "cadence",
    title: "Deceptive Cadence",
    prompt: "Identify the cadence.",
    notes: [
      ["G3", "B3", "D4"],
      ["A3", "C4", "E4"],
    ],
    choices: ["Authentic", "Half", "Plagal", "Deceptive"],
    answer: "Deceptive",
    explanation:
      "A deceptive cadence usually moves from V to vi instead of V to I. It avoids the expected resolution.",
  },
];

export function getEarTrainingQuestions(mode: EarTrainingMode) {
  if (mode === "interval") return intervalQuestions;
  if (mode === "chord") return chordQuestions;
  return cadenceQuestions;
}

export function getRandomEarTrainingQuestion(mode: EarTrainingMode) {
  const questions = getEarTrainingQuestions(mode);
  return questions[Math.floor(Math.random() * questions.length)];
}