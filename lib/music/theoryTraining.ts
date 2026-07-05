export type TheoryMode =
  | "notes"
  | "keys"
  | "intervals"
  | "triads"
  | "roman"
  | "rhythm";

export type TheoryQuestion = {
  id: string;
  mode: TheoryMode;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

const noteQuestions: TheoryQuestion[] = [
  {
    id: "note-treble-g",
    mode: "notes",
    prompt: "In treble clef, what note is on the second line from the bottom?",
    choices: ["E", "G", "B", "D"],
    answer: "G",
    explanation:
      "The lines of the treble clef are E, G, B, D, F from bottom to top. The second line is G.",
  },
  {
    id: "note-treble-f",
    mode: "notes",
    prompt: "In treble clef, what note is on the top line?",
    choices: ["D", "E", "F", "G"],
    answer: "F",
    explanation:
      "The treble clef line notes are E, G, B, D, F. The top line is F.",
  },
  {
    id: "note-bass-f",
    mode: "notes",
    prompt: "In bass clef, what note is on the second line from the top?",
    choices: ["A", "B", "D", "F"],
    answer: "F",
    explanation:
      "The bass clef line notes are G, B, D, F, A from bottom to top. The second line from the top is F.",
  },
  {
    id: "note-bass-c",
    mode: "notes",
    prompt: "In bass clef, what note is in the second space from the bottom?",
    choices: ["A", "C", "E", "G"],
    answer: "C",
    explanation:
      "The bass clef spaces are A, C, E, G from bottom to top. The second space is C.",
  },
];

const keyQuestions: TheoryQuestion[] = [
  {
    id: "key-1-sharp",
    mode: "keys",
    prompt: "What major key has 1 sharp?",
    choices: ["C major", "G major", "D major", "F major"],
    answer: "G major",
    explanation:
      "G major has one sharp: F#. In the circle of fifths, each step clockwise adds one sharp.",
  },
  {
    id: "key-2-sharps",
    mode: "keys",
    prompt: "What major key has 2 sharps?",
    choices: ["G major", "D major", "A major", "E major"],
    answer: "D major",
    explanation:
      "D major has two sharps: F# and C#. It comes after G major in the sharp-key order.",
  },
  {
    id: "key-1-flat",
    mode: "keys",
    prompt: "What major key has 1 flat?",
    choices: ["F major", "Bb major", "Eb major", "C major"],
    answer: "F major",
    explanation:
      "F major has one flat: Bb. In the flat-key direction, F is the first major key.",
  },
  {
    id: "key-3-flats",
    mode: "keys",
    prompt: "What major key has 3 flats?",
    choices: ["Bb major", "Eb major", "Ab major", "Db major"],
    answer: "Eb major",
    explanation:
      "Eb major has three flats: Bb, Eb, and Ab.",
  },
];

const intervalQuestions: TheoryQuestion[] = [
  {
    id: "interval-c-e",
    mode: "intervals",
    prompt: "What is the interval from C up to E?",
    choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th"],
    answer: "Major 3rd",
    explanation:
      "C to E spans three letter names: C-D-E. Since it is four half steps, it is a major 3rd.",
  },
  {
    id: "interval-c-eb",
    mode: "intervals",
    prompt: "What is the interval from C up to Eb?",
    choices: ["Minor 3rd", "Major 3rd", "Perfect 4th", "Tritone"],
    answer: "Minor 3rd",
    explanation:
      "C to Eb spans three letter names and is three half steps, so it is a minor 3rd.",
  },
  {
    id: "interval-c-g",
    mode: "intervals",
    prompt: "What is the interval from C up to G?",
    choices: ["Perfect 4th", "Perfect 5th", "Major 6th", "Octave"],
    answer: "Perfect 5th",
    explanation:
      "C to G spans five letter names: C-D-E-F-G. It is a perfect 5th.",
  },
  {
    id: "interval-f-b",
    mode: "intervals",
    prompt: "What is the interval from F up to B?",
    choices: ["Perfect 4th", "Tritone", "Perfect 5th", "Minor 6th"],
    answer: "Tritone",
    explanation:
      "F to B is an augmented 4th, also called a tritone. It contains six half steps.",
  },
];

const triadQuestions: TheoryQuestion[] = [
  {
    id: "triad-c-major",
    mode: "triads",
    prompt: "Which notes spell a C major triad?",
    choices: ["C-E-G", "C-Eb-G", "C-F-G", "C-D-G"],
    answer: "C-E-G",
    explanation:
      "A major triad is root, major 3rd, and perfect 5th. C major is C-E-G.",
  },
  {
    id: "triad-a-minor",
    mode: "triads",
    prompt: "Which notes spell an A minor triad?",
    choices: ["A-C#-E", "A-C-E", "A-D-E", "A-C-Eb"],
    answer: "A-C-E",
    explanation:
      "A minor triad is root, minor 3rd, and perfect 5th. A minor is A-C-E.",
  },
  {
    id: "triad-b-dim",
    mode: "triads",
    prompt: "Which notes spell a B diminished triad?",
    choices: ["B-D-F#", "B-D-F", "B-D#-F#", "B-E-F"],
    answer: "B-D-F",
    explanation:
      "A diminished triad is root, minor 3rd, and diminished 5th. B diminished is B-D-F.",
  },
  {
    id: "triad-c-aug",
    mode: "triads",
    prompt: "Which notes spell a C augmented triad?",
    choices: ["C-E-G", "C-Eb-G", "C-E-G#", "C-F-G#"],
    answer: "C-E-G#",
    explanation:
      "An augmented triad is root, major 3rd, and raised 5th. C augmented is C-E-G#.",
  },
];

const romanQuestions: TheoryQuestion[] = [
  {
    id: "roman-g-d",
    mode: "roman",
    prompt: "In G major, what Roman numeral is the chord D-F#-A?",
    choices: ["I", "ii", "IV", "V"],
    answer: "V",
    explanation:
      "D is scale degree 5 in G major. D-F#-A is a major triad, so the Roman numeral is V.",
  },
  {
    id: "roman-c-f",
    mode: "roman",
    prompt: "In C major, what Roman numeral is the chord F-A-C?",
    choices: ["I", "ii", "IV", "V"],
    answer: "IV",
    explanation:
      "F is scale degree 4 in C major. F-A-C is a major triad, so it is IV.",
  },
  {
    id: "roman-c-dm",
    mode: "roman",
    prompt: "In C major, what Roman numeral is the chord D-F-A?",
    choices: ["I", "ii", "IV", "vi"],
    answer: "ii",
    explanation:
      "D is scale degree 2 in C major. D-F-A is minor in the key, so it is written as lowercase ii.",
  },
  {
    id: "roman-f-gm",
    mode: "roman",
    prompt: "In F major, what Roman numeral is the chord G-Bb-D?",
    choices: ["I", "ii", "iii", "V"],
    answer: "ii",
    explanation:
      "G is scale degree 2 in F major. G-Bb-D is minor, so the Roman numeral is lowercase ii.",
  },
];

const rhythmQuestions: TheoryQuestion[] = [
  {
    id: "rhythm-quarter",
    mode: "rhythm",
    prompt: "In 4/4 time, how many beats does a quarter note usually receive?",
    choices: ["1", "2", "3", "4"],
    answer: "1",
    explanation:
      "In 4/4 time, the quarter note gets one beat. The bottom 4 means the quarter note is the beat unit.",
  },
  {
    id: "rhythm-half",
    mode: "rhythm",
    prompt: "In 4/4 time, how many beats does a half note receive?",
    choices: ["1", "2", "3", "4"],
    answer: "2",
    explanation:
      "A half note equals two quarter notes, so in 4/4 time it receives two beats.",
  },
  {
    id: "rhythm-dotted-half",
    mode: "rhythm",
    prompt: "In 4/4 time, how many beats does a dotted half note receive?",
    choices: ["1.5", "2", "3", "4"],
    answer: "3",
    explanation:
      "A dot adds half the note's value. A half note is 2 beats, and the dot adds 1 more, so a dotted half note is 3 beats.",
  },
  {
    id: "rhythm-eighths",
    mode: "rhythm",
    prompt: "How many eighth notes fit into one quarter note?",
    choices: ["1", "2", "3", "4"],
    answer: "2",
    explanation:
      "Two eighth notes equal one quarter note.",
  },
];

export function getTheoryQuestions(mode: TheoryMode) {
  if (mode === "notes") return noteQuestions;
  if (mode === "keys") return keyQuestions;
  if (mode === "intervals") return intervalQuestions;
  if (mode === "triads") return triadQuestions;
  if (mode === "roman") return romanQuestions;
  return rhythmQuestions;
}

export function getRandomTheoryQuestion(mode: TheoryMode) {
  const questions = getTheoryQuestions(mode);
  return questions[Math.floor(Math.random() * questions.length)];
}