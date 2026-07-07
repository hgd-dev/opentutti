import type { EarClef } from "@/lib/music/earTraining";

export type TheoryMode =
  "pitch" | "interval" | "scale" | "chord" | "cadence" | "key-signature";

export type TheoryAnswerMode = "choices" | "keyboard";

export type TheoryPlaybackType =
  "ascending" | "descending" | "harmonic" | "blocked" | "arpeggiated";

export type TheoryStaffNote = string | string[];

export type TheorySettings = {
  clefs: EarClef[];
  range: {
    low: string;
    high: string;
  };
  pitch: {
    answerMode: TheoryAnswerMode;
  };
  interval: {
    playbackType: "ascending" | "descending" | "harmonic";
    enabledAnswers: string[];
  };
  scale: {
    playbackType: "ascending" | "descending";
    enabledAnswers: string[];
  };
  chord: {
    playbackType: "blocked" | "arpeggiated";
    enabledAnswers: string[];
    includeInversions: boolean;
  };
  cadence: {
    enabledAnswers: string[];
  };
  keySignature: {
    includeRelativeMinor: boolean;
  };
};

export type TheoryQuestion = {
  id: string;
  mode: TheoryMode;
  title: string;
  prompt: string;
  clef: EarClef;
  staffNotes: TheoryStaffNote[];
  keySignature?: string;
  timeSignature?: string;
  choices: string[];
  answer: string;
  explanation: string;
  playbackType?: TheoryPlaybackType;
  rootNote?: string;
  chordInversion?: ChordInversion;
};

export type ChordInversion =
  "Root position" | "1st inversion" | "2nd inversion" | "3rd inversion";

const scaleGroups = {
  common: ["Major", "Natural Minor", "Harmonic Minor", "Melodic Minor"],
  special: [
    "Chromatic",
    "Whole Tone",
    "Major Pentatonic",
    "Minor Pentatonic",
    "Blues",
  ],
  modes: ["Dorian", "Phrygian", "Lydian", "Mixolydian", "Locrian"],
};

const chordGroups = {
  triads: ["Major Triad", "Minor Triad", "Diminished Triad", "Augmented Triad"],
  sevenths: [
    "Dominant 7th",
    "Major 7th",
    "Minor 7th",
    "Minor-major 7th",
    "Half-diminished 7th",
    "Diminished 7th",
    "Augmented 7th",
    "Augmented-major 7th",
  ],
};

export const theoryOptionLists = {
  clefs: ["treble", "bass", "alto", "tenor"] as EarClef[],
  rangeNotes: [
    "C2",
    "C#2",
    "D2",
    "D#2",
    "E2",
    "F2",
    "F#2",
    "G2",
    "G#2",
    "A2",
    "A#2",
    "B2",
    "C3",
    "C#3",
    "D3",
    "D#3",
    "E3",
    "F3",
    "F#3",
    "G3",
    "G#3",
    "A3",
    "A#3",
    "B3",
    "C4",
    "C#4",
    "D4",
    "D#4",
    "E4",
    "F4",
    "F#4",
    "G4",
    "G#4",
    "A4",
    "A#4",
    "B4",
    "C5",
    "C#5",
    "D5",
    "D#5",
    "E5",
    "F5",
    "F#5",
    "G5",
    "G#5",
    "A5",
    "A#5",
    "B5",
    "C6",
  ],
  pitchClasses: [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ],
  intervalNumbers: [
    { value: "1", label: "Unison / 1st" },
    { value: "2", label: "2nd" },
    { value: "3", label: "3rd" },
    { value: "4", label: "4th" },
    { value: "5", label: "5th" },
    { value: "6", label: "6th" },
    { value: "7", label: "7th" },
    { value: "8", label: "Octave / 8th" },
  ],
  scaleGroups,
  scales: [...scaleGroups.common, ...scaleGroups.special, ...scaleGroups.modes],
  chordGroups,
  chords: [...chordGroups.triads, ...chordGroups.sevenths],
  chordInversions: [
    "Root position",
    "1st inversion",
    "2nd inversion",
    "3rd inversion",
  ] as ChordInversion[],
  cadences: ["Authentic", "Half", "Plagal", "Deceptive"],
};

export const defaultTheorySettings: TheorySettings = {
  clefs: ["treble", "bass"],
  range: {
    low: "C3",
    high: "C5",
  },
  pitch: {
    answerMode: "choices",
  },
  interval: {
    playbackType: "ascending",
    enabledAnswers: [
      "Perfect Unison",
      "Minor 2nd",
      "Major 2nd",
      "Minor 3rd",
      "Major 3rd",
      "Perfect 4th",
      "Augmented 4th",
      "Diminished 5th",
      "Perfect 5th",
      "Minor 6th",
      "Major 6th",
      "Minor 7th",
      "Major 7th",
      "Perfect Octave",
    ],
  },
  scale: {
    playbackType: "ascending",
    enabledAnswers: [...theoryOptionLists.scales],
  },
  chord: {
    playbackType: "blocked",
    enabledAnswers: [...theoryOptionLists.chords],
    includeInversions: false,
  },
  cadence: {
    enabledAnswers: [...theoryOptionLists.cadences],
  },
  keySignature: {
    includeRelativeMinor: false,
  },
};

const chromaticSharps = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const letterNames = ["C", "D", "E", "F", "G", "A", "B"];
const naturalSemitones: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const scalePatterns: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11, 12],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10, 12],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11, 12],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11, 12],
  Dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  Phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  Lydian: [0, 2, 4, 6, 7, 9, 11, 12],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  Locrian: [0, 1, 3, 5, 6, 8, 10, 12],
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  "Whole Tone": [0, 2, 4, 6, 8, 10, 12],
  "Major Pentatonic": [0, 2, 4, 7, 9, 12],
  "Minor Pentatonic": [0, 3, 5, 7, 10, 12],
  Blues: [0, 3, 5, 6, 7, 10, 12],
};

const chordPatterns: Record<string, number[]> = {
  "Major Triad": [0, 4, 7],
  "Minor Triad": [0, 3, 7],
  "Diminished Triad": [0, 3, 6],
  "Augmented Triad": [0, 4, 8],
  "Dominant 7th": [0, 4, 7, 10],
  "Major 7th": [0, 4, 7, 11],
  "Minor 7th": [0, 3, 7, 10],
  "Minor-major 7th": [0, 3, 7, 11],
  "Half-diminished 7th": [0, 3, 6, 10],
  "Diminished 7th": [0, 3, 6, 9],
  "Augmented 7th": [0, 4, 8, 10],
  "Augmented-major 7th": [0, 4, 8, 11],
};

const keySignatures = [
  { major: "Cb major", minor: "Ab minor", vex: "Cb", accidentals: "7 flats" },
  { major: "Gb major", minor: "Eb minor", vex: "Gb", accidentals: "6 flats" },
  { major: "Db major", minor: "Bb minor", vex: "Db", accidentals: "5 flats" },
  { major: "Ab major", minor: "F minor", vex: "Ab", accidentals: "4 flats" },
  { major: "Eb major", minor: "C minor", vex: "Eb", accidentals: "3 flats" },
  { major: "Bb major", minor: "G minor", vex: "Bb", accidentals: "2 flats" },
  { major: "F major", minor: "D minor", vex: "F", accidentals: "1 flat" },
  {
    major: "C major",
    minor: "A minor",
    vex: "C",
    accidentals: "no sharps or flats",
  },
  { major: "G major", minor: "E minor", vex: "G", accidentals: "1 sharp" },
  { major: "D major", minor: "B minor", vex: "D", accidentals: "2 sharps" },
  { major: "A major", minor: "F# minor", vex: "A", accidentals: "3 sharps" },
  { major: "E major", minor: "C# minor", vex: "E", accidentals: "4 sharps" },
  { major: "B major", minor: "G# minor", vex: "B", accidentals: "5 sharps" },
  { major: "F# major", minor: "D# minor", vex: "F#", accidentals: "6 sharps" },
  { major: "C# major", minor: "A# minor", vex: "C#", accidentals: "7 sharps" },
];

const cadenceProgressions: Record<
  string,
  { notes: string[][]; explanation: string }
> = {
  Authentic: {
    notes: [
      ["G3", "B3", "D4"],
      ["C4", "E4", "G4"],
    ],
    explanation:
      "An authentic cadence moves from V to I. In C major, that is G-B-D resolving to C-E-G.",
  },
  Half: {
    notes: [
      ["C4", "E4", "G4"],
      ["G3", "B3", "D4"],
    ],
    explanation:
      "A half cadence ends on V. This example moves from I to V in C major.",
  },
  Plagal: {
    notes: [
      ["F3", "A3", "C4"],
      ["C4", "E4", "G4"],
    ],
    explanation:
      "A plagal cadence moves from IV to I. It is the classic “Amen” cadence shape.",
  },
  Deceptive: {
    notes: [
      ["G3", "B3", "D4"],
      ["A3", "C4", "E4"],
    ],
    explanation:
      "A deceptive cadence usually moves from V to vi instead of resolving to I.",
  },
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function midiFromPitch(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]{0,2})(\d)$/);
  if (!match) return 60;

  const [, letter, accidental, octaveText] = match;
  const accidentalValue = accidental.split("").reduce((total, symbol) => {
    if (symbol === "#") return total + 1;
    if (symbol === "b") return total - 1;
    return total;
  }, 0);

  return (
    (Number(octaveText) + 1) * 12 + naturalSemitones[letter] + accidentalValue
  );
}

function pitchFromMidi(midi: number) {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${chromaticSharps[pitchClass]}${octave}`;
}

function pitchClassFromPitch(pitch: string) {
  return pitch.replace(/\d$/, "");
}

function transpose(pitch: string, semitones: number) {
  return pitchFromMidi(midiFromPitch(pitch) + semitones);
}

function rangeNotes(settings: TheorySettings) {
  const lowIndex = theoryOptionLists.rangeNotes.indexOf(settings.range.low);
  const highIndex = theoryOptionLists.rangeNotes.indexOf(settings.range.high);
  const start = Math.max(0, Math.min(lowIndex, highIndex));
  const end = Math.min(
    theoryOptionLists.rangeNotes.length - 1,
    Math.max(lowIndex, highIndex),
  );
  return theoryOptionLists.rangeNotes.slice(start, end + 1);
}

function clefFriendlyNotes(settings: TheorySettings, clef: EarClef) {
  const notes = rangeNotes(settings);
  const filtered = notes.filter((note) => {
    const midi = midiFromPitch(note);
    if (clef === "bass")
      return midi >= midiFromPitch("C2") && midi <= midiFromPitch("C4");
    if (clef === "alto")
      return midi >= midiFromPitch("G3") && midi <= midiFromPitch("E5");
    if (clef === "tenor")
      return midi >= midiFromPitch("C3") && midi <= midiFromPitch("A4");
    return midi >= midiFromPitch("C4") && midi <= midiFromPitch("C6");
  });

  return filtered.length > 0 ? filtered : notes;
}

function normalizeEnabled(items: string[], fallback: string[]) {
  return items.length > 0 ? items : fallback;
}

export function getIntervalQualityOptions(number: string) {
  if (number === "1") return ["perfect"];
  if (["4", "5", "8"].includes(number))
    return ["diminished", "perfect", "augmented"];
  return ["diminished", "minor", "major", "augmented"];
}

export function makeIntervalAnswer(quality: string, number: string) {
  const numberLabel: Record<string, string> = {
    "1": "Unison",
    "2": "2nd",
    "3": "3rd",
    "4": "4th",
    "5": "5th",
    "6": "6th",
    "7": "7th",
    "8": "Octave",
  };

  return `${quality.charAt(0).toUpperCase()}${quality.slice(1)} ${numberLabel[number]}`;
}

function parseIntervalAnswer(answer: string) {
  const [qualityText, ...numberParts] = answer.split(" ");
  const numberText = numberParts.join(" ");
  const quality = qualityText.toLowerCase();
  const number = numberText.includes("Unison")
    ? "1"
    : numberText.includes("2")
      ? "2"
      : numberText.includes("3")
        ? "3"
        : numberText.includes("4")
          ? "4"
          : numberText.includes("5")
            ? "5"
            : numberText.includes("6")
              ? "6"
              : numberText.includes("7")
                ? "7"
                : "8";

  return { quality, number };
}

function targetLetter(root: string, intervalNumber: number) {
  const rootLetter = root[0];
  const rootIndex = letterNames.indexOf(rootLetter);
  return letterNames[(rootIndex + intervalNumber - 1) % letterNames.length];
}

function octaveForWrittenInterval(root: string, intervalNumber: number) {
  const match = root.match(/^([A-G])([#b]{0,2})(\d)$/);
  if (!match) return 4;

  const [, letter, , octaveText] = match;
  const rootIndex = letterNames.indexOf(letter);
  const targetIndex = rootIndex + intervalNumber - 1;
  return Number(octaveText) + Math.floor(targetIndex / 7);
}

function accidentalFromOffset(offset: number) {
  if (offset === -2) return "bb";
  if (offset === -1) return "b";
  if (offset === 1) return "#";
  if (offset === 2) return "##";
  return "";
}

function intervalSemitones(quality: string, number: string) {
  const base: Record<string, Record<string, number>> = {
    "1": { perfect: 0 },
    "2": { diminished: 0, minor: 1, major: 2, augmented: 3 },
    "3": { diminished: 2, minor: 3, major: 4, augmented: 5 },
    "4": { diminished: 4, perfect: 5, augmented: 6 },
    "5": { diminished: 6, perfect: 7, augmented: 8 },
    "6": { diminished: 7, minor: 8, major: 9, augmented: 10 },
    "7": { diminished: 9, minor: 10, major: 11, augmented: 12 },
    "8": { diminished: 11, perfect: 12, augmented: 13 },
  };

  return base[number]?.[quality] ?? 0;
}

export function getIntervalStaffNotesFromSelection(
  rootNote: string,
  quality: string,
  number: string,
  playbackType: "ascending" | "descending" | "harmonic" = "ascending",
): TheoryStaffNote[] {
  const intervalNumber = Number(number);
  const desiredSemitones = intervalSemitones(quality, number);
  const target = targetLetter(rootNote, intervalNumber);
  const targetOctave = octaveForWrittenInterval(rootNote, intervalNumber);
  const targetNaturalMidi = midiFromPitch(`${target}${targetOctave}`);
  const desiredMidi = midiFromPitch(rootNote) + desiredSemitones;
  const offset = desiredMidi - targetNaturalMidi;
  const upperNote = `${target}${accidentalFromOffset(offset)}${targetOctave}`;

  if (playbackType === "descending") return [upperNote, rootNote];
  if (playbackType === "harmonic") return [[rootNote, upperNote]];
  return [rootNote, upperNote];
}

function getPitchQuestion(settings: TheorySettings): TheoryQuestion {
  const clef = randomItem(
    settings.clefs.length ? settings.clefs : defaultTheorySettings.clefs,
  );
  const note = randomItem(clefFriendlyNotes(settings, clef));
  const pitchClass = pitchClassFromPitch(note);
  const answer = settings.pitch.answerMode === "keyboard" ? note : pitchClass;

  return {
    id: `theory-pitch-${Date.now()}-${Math.random()}`,
    mode: "pitch",
    title: "Pitch Reading",
    prompt: "Identify the note shown on the staff.",
    clef,
    staffNotes: [note],
    choices:
      settings.pitch.answerMode === "keyboard"
        ? rangeNotes(settings)
        : theoryOptionLists.pitchClasses,
    answer,
    explanation:
      settings.pitch.answerMode === "keyboard"
        ? `The note is ${note}. Keyboard mode asks for the exact pitch and octave.`
        : `The note is ${pitchClass}. Choice button mode asks for the pitch name only, not the octave.`,
    rootNote: note,
  };
}

function getIntervalQuestion(settings: TheorySettings): TheoryQuestion {
  const enabled = normalizeEnabled(
    settings.interval.enabledAnswers,
    defaultTheorySettings.interval.enabledAnswers,
  );
  const answer = randomItem(enabled);
  const { quality, number } = parseIntervalAnswer(answer);
  const clef = randomItem(
    settings.clefs.length ? settings.clefs : defaultTheorySettings.clefs,
  );
  const roots = clefFriendlyNotes(settings, clef).filter(
    (note) => midiFromPitch(note) <= midiFromPitch("C5"),
  );
  const rootNote = randomItem(roots.length ? roots : ["C4"]);
  const staffNotes = getIntervalStaffNotesFromSelection(
    rootNote,
    quality,
    number,
    settings.interval.playbackType,
  );

  return {
    id: `theory-interval-${Date.now()}-${Math.random()}`,
    mode: "interval",
    title: "Written Intervals",
    prompt: "Identify the interval shown on the staff.",
    clef,
    staffNotes,
    choices: enabled,
    answer,
    explanation: `${answer} means the notes span the correct staff-letter distance and accidental quality. In written theory, the number comes from letter names, and the quality comes from half steps.`,
    playbackType: settings.interval.playbackType,
    rootNote,
  };
}

function getScaleQuestion(settings: TheorySettings): TheoryQuestion {
  const enabled = normalizeEnabled(
    settings.scale.enabledAnswers,
    defaultTheorySettings.scale.enabledAnswers,
  );
  const answer = randomItem(enabled);
  const clef = randomItem(
    settings.clefs.length ? settings.clefs : defaultTheorySettings.clefs,
  );
  const rootsByClef: Record<EarClef, string[]> = {
    treble: ["C4", "D4", "F4", "G4", "A4"],
    bass: ["C3", "D3", "F3", "G3", "A3"],
    alto: ["C4", "D4", "F4", "G4"],
    tenor: ["C3", "D3", "F3", "G3"],
  };
  const rootNote = randomItem(rootsByClef[clef]);
  const pattern = scalePatterns[answer] ?? scalePatterns.Major;
  let staffNotes = pattern.map((steps) => transpose(rootNote, steps));

  if (settings.scale.playbackType === "descending") {
    staffNotes = [...staffNotes].reverse();
  }

  return {
    id: `theory-scale-${Date.now()}-${Math.random()}`,
    mode: "scale",
    title: "Scale Reading",
    prompt: "Identify the scale shown on the staff.",
    clef,
    staffNotes,
    choices: enabled,
    answer,
    explanation: `This is a ${answer} scale. Check the half-step pattern and any characteristic altered degrees.`,
    playbackType: settings.scale.playbackType,
    rootNote,
  };
}

function getAvailableInversionsForChord(chordName: string): ChordInversion[] {
  const tones = chordPatterns[chordName] ?? chordPatterns["Major Triad"];
  return tones.length >= 4
    ? theoryOptionLists.chordInversions
    : theoryOptionLists.chordInversions.filter(
        (item) => item !== "3rd inversion",
      );
}

function applyChordInversion(notes: string[], inversion: ChordInversion) {
  const stepsByInversion: Record<ChordInversion, number> = {
    "Root position": 0,
    "1st inversion": 1,
    "2nd inversion": 2,
    "3rd inversion": 3,
  };
  const steps = Math.min(stepsByInversion[inversion] ?? 0, notes.length - 1);
  const inverted = [...notes];

  for (let i = 0; i < steps; i += 1) {
    const moved = inverted.shift();
    if (moved) inverted.push(transpose(moved, 12));
  }

  return inverted;
}

function getChordQuestion(settings: TheorySettings): TheoryQuestion {
  const enabled = normalizeEnabled(
    settings.chord.enabledAnswers,
    defaultTheorySettings.chord.enabledAnswers,
  );
  const answer = randomItem(enabled);
  const clef = randomItem(
    settings.clefs.length ? settings.clefs : defaultTheorySettings.clefs,
  );
  const rootsByClef: Record<EarClef, string[]> = {
    treble: ["C4", "D4", "F4", "G4", "A4"],
    bass: ["C3", "D3", "F3", "G3", "A3"],
    alto: ["C4", "D4", "F4", "G4"],
    tenor: ["C3", "D3", "F3", "G3"],
  };
  const rootNote = randomItem(rootsByClef[clef]);
  const rootPositionPitches = (
    chordPatterns[answer] ?? chordPatterns["Major Triad"]
  ).map((steps) => transpose(rootNote, steps));
  const availableInversions = getAvailableInversionsForChord(answer);
  const inversion = settings.chord.includeInversions
    ? randomItem(availableInversions)
    : "Root position";
  const pitches = applyChordInversion(rootPositionPitches, inversion);
  const staffNotes: TheoryStaffNote[] =
    settings.chord.playbackType === "blocked" ? [pitches] : pitches;

  const inversionText =
    inversion === "Root position" ? "root position" : inversion.toLowerCase();

  return {
    id: `theory-chord-${Date.now()}-${Math.random()}`,
    mode: "chord",
    title: "Chord Reading",
    prompt: settings.chord.includeInversions
      ? "Identify the chord and inversion shown on the staff."
      : "Identify the chord shown on the staff.",
    clef,
    staffNotes,
    choices: enabled,
    answer,
    explanation: `This is a ${answer} in ${inversionText}. Read the chord tones from bottom to top and identify which chord member is in the bass.`,
    playbackType: settings.chord.playbackType,
    rootNote,
    chordInversion: inversion,
  };
}

function getCadenceQuestion(settings: TheorySettings): TheoryQuestion {
  const enabled = normalizeEnabled(
    settings.cadence.enabledAnswers,
    defaultTheorySettings.cadence.enabledAnswers,
  );
  const answer = randomItem(enabled);
  const progression =
    cadenceProgressions[answer] ?? cadenceProgressions.Authentic;

  return {
    id: `theory-cadence-${Date.now()}-${Math.random()}`,
    mode: "cadence",
    title: "Cadence Reading",
    prompt: "Identify the cadence shown on the staff.",
    clef: "treble",
    staffNotes: progression.notes,
    keySignature: "C",
    choices: enabled,
    answer,
    explanation: progression.explanation,
  };
}

function getKeySignatureQuestion(settings: TheorySettings): TheoryQuestion {
  const clef = randomItem(
    settings.clefs.length ? settings.clefs : defaultTheorySettings.clefs,
  );
  const item = randomItem(keySignatures);
  const askMinor =
    settings.keySignature.includeRelativeMinor && Math.random() < 0.5;
  const answer = askMinor ? item.minor : item.major;
  const allAnswers = settings.keySignature.includeRelativeMinor
    ? keySignatures.flatMap((key) => [key.major, key.minor])
    : keySignatures.map((key) => key.major);
  return {
    id: `theory-key-${Date.now()}-${Math.random()}`,
    mode: "key-signature",
    title: "Key Signature Identification",
    prompt: askMinor
      ? "Identify the relative minor key signature shown on the staff."
      : "Identify the major key signature shown on the staff.",
    clef,
    staffNotes: [],
    keySignature: item.vex,
    choices: allAnswers,
    answer,
    explanation: `${item.vex} shows ${item.accidentals}. That key signature can represent ${item.major} or its relative minor, ${item.minor}.`,
  };
}

export function getRandomTheoryQuestion(
  mode: TheoryMode,
  settings: TheorySettings = defaultTheorySettings,
) {
  if (mode === "pitch") return getPitchQuestion(settings);
  if (mode === "interval") return getIntervalQuestion(settings);
  if (mode === "scale") return getScaleQuestion(settings);
  if (mode === "chord") return getChordQuestion(settings);
  if (mode === "cadence") return getCadenceQuestion(settings);
  return getKeySignatureQuestion(settings);
}
