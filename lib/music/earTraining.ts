export type EarTrainingMode =
  "pitch" | "keyboard" | "interval" | "scale" | "chord" | "cadence";

export type EarPlaybackStyle =
  | "single"
  | "reference"
  | "melodic-ascending"
  | "melodic-descending"
  | "harmonic"
  | "blocked"
  | "arpeggiated"
  | "scale-ascending"
  | "scale-descending"
  | "progression";

export type EarClef = "treble" | "bass" | "alto" | "tenor";

export type EarTrainingQuestion = {
  id: string;
  mode: EarTrainingMode;
  title: string;
  prompt: string;
  notes: string[][];
  playbackStyle: EarPlaybackStyle;
  choices: string[];
  answer: string;
  explanation: string;
  clef?: EarClef;
  rootNote?: string;
  staffAnswerNotes?: (string | string[])[];
};

export type EarTrainingSettings = {
  clefs: EarClef[];
  range: {
    low: string;
    high: string;
  };
  pitch: {
    submode: "perfect" | "reference";
    answerMode: "choice" | "keyboard";
    referenceNote: string;
  };
  interval: {
    playback: "ascending" | "descending" | "harmonic";
    ascending: boolean;
    descending: boolean;
    harmonic: boolean;
    enabledAnswers: string[];
  };
  scale: {
    playback: "ascending" | "descending";
    ascending: boolean;
    descending: boolean;
    enabledAnswers: string[];
  };
  chord: {
    playback: "blocked" | "arpeggiated";
    enabledAnswers: string[];
  };
};

type IntervalDefinition = {
  label: string;
  semitones: number;
  number: string;
  quality: string;
  explanation: string;
};

type ChordDefinition = {
  label: string;
  semitones: number[];
  explanation: string;
};

type ScaleDefinition = {
  label: string;
  semitones: number[];
  explanation: string;
};

type CadenceDefinition = {
  label: string;
  roman: string;
  chords: number[][];
  explanation: string;
};

const noteNamesSharp = [
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

const pitchChoices = [
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

const intervalDefinitions: IntervalDefinition[] = [
  {
    label: "Unison",
    semitones: 0,
    number: "1",
    quality: "perfect",
    explanation:
      "A unison repeats the same pitch. It should sound identical rather than higher or lower.",
  },
  {
    label: "Minor 2nd",
    semitones: 1,
    number: "2",
    quality: "minor",
    explanation:
      "A minor 2nd is one half step. It sounds very close and tense.",
  },
  {
    label: "Major 2nd",
    semitones: 2,
    number: "2",
    quality: "major",
    explanation:
      "A major 2nd is a whole step. It sounds like do to re in a major scale.",
  },
  {
    label: "Minor 3rd",
    semitones: 3,
    number: "3",
    quality: "minor",
    explanation: "A minor 3rd has a darker sound than a major 3rd.",
  },
  {
    label: "Major 3rd",
    semitones: 4,
    number: "3",
    quality: "major",
    explanation: "A major 3rd sounds bright and stable.",
  },
  {
    label: "Perfect 4th",
    semitones: 5,
    number: "4",
    quality: "perfect",
    explanation: "A perfect 4th sounds open and strong.",
  },
  {
    label: "Tritone",
    semitones: 6,
    number: "4",
    quality: "augmented",
    explanation: "A tritone divides the octave in half and sounds unstable.",
  },
  {
    label: "Perfect 5th",
    semitones: 7,
    number: "5",
    quality: "perfect",
    explanation: "A perfect 5th sounds open, stable, and consonant.",
  },
  {
    label: "Minor 6th",
    semitones: 8,
    number: "6",
    quality: "minor",
    explanation: "A minor 6th is wide and darker than a major 6th.",
  },
  {
    label: "Major 6th",
    semitones: 9,
    number: "6",
    quality: "major",
    explanation: "A major 6th is wide, warm, and lyrical.",
  },
  {
    label: "Minor 7th",
    semitones: 10,
    number: "7",
    quality: "minor",
    explanation: "A minor 7th is wide and unresolved.",
  },
  {
    label: "Major 7th",
    semitones: 11,
    number: "7",
    quality: "major",
    explanation:
      "A major 7th is very tense because it sits just below the octave.",
  },
  {
    label: "Octave",
    semitones: 12,
    number: "8",
    quality: "perfect",
    explanation:
      "An octave is the same pitch class in a higher or lower register.",
  },
];

const chordDefinitions: ChordDefinition[] = [
  {
    label: "Major Triad",
    semitones: [0, 4, 7],
    explanation:
      "A major triad has a bright sound: root, major 3rd, perfect 5th.",
  },
  {
    label: "Minor Triad",
    semitones: [0, 3, 7],
    explanation:
      "A minor triad has a darker sound: root, minor 3rd, perfect 5th.",
  },
  {
    label: "Diminished Triad",
    semitones: [0, 3, 6],
    explanation:
      "A diminished triad sounds tense because of the diminished 5th.",
  },
  {
    label: "Augmented Triad",
    semitones: [0, 4, 8],
    explanation:
      "An augmented triad sounds bright but unstable because of the raised 5th.",
  },
  {
    label: "Suspended 2nd",
    semitones: [0, 2, 7],
    explanation: "A suspended 2nd replaces the 3rd of the triad with the 2nd.",
  },
  {
    label: "Suspended 4th",
    semitones: [0, 5, 7],
    explanation: "A suspended 4th replaces the 3rd of the triad with the 4th.",
  },
  {
    label: "Dominant 7th",
    semitones: [0, 4, 7, 10],
    explanation:
      "A dominant 7th has a major triad plus a minor 7th. It wants to resolve.",
  },
  {
    label: "Major 7th",
    semitones: [0, 4, 7, 11],
    explanation:
      "A major 7th has a major triad plus a major 7th. It sounds smooth but bright.",
  },
  {
    label: "Minor 7th",
    semitones: [0, 3, 7, 10],
    explanation:
      "A minor 7th has a minor triad plus a minor 7th. It sounds darker and jazzy.",
  },
  {
    label: "Minor-major 7th",
    semitones: [0, 3, 7, 11],
    explanation:
      "A minor-major 7th has a minor triad plus a major 7th. It sounds dark and tense.",
  },
  {
    label: "Half-diminished 7th",
    semitones: [0, 3, 6, 10],
    explanation:
      "A half-diminished 7th is a diminished triad plus a minor 7th.",
  },
  {
    label: "Diminished 7th",
    semitones: [0, 3, 6, 9],
    explanation: "A diminished 7th stacks minor thirds and sounds very tense.",
  },
  {
    label: "Augmented 7th",
    semitones: [0, 4, 8, 10],
    explanation: "An augmented 7th has an augmented triad plus a minor 7th.",
  },
  {
    label: "Augmented-major 7th",
    semitones: [0, 4, 8, 11],
    explanation:
      "An augmented-major 7th has an augmented triad plus a major 7th.",
  },
  {
    label: "Major 6th Chord",
    semitones: [0, 4, 7, 9],
    explanation: "A major 6th chord is a major triad with an added major 6th.",
  },
  {
    label: "Minor 6th Chord",
    semitones: [0, 3, 7, 9],
    explanation: "A minor 6th chord is a minor triad with an added major 6th.",
  },
];

const scaleDefinitions: ScaleDefinition[] = [
  {
    label: "Major",
    semitones: [0, 2, 4, 5, 7, 9, 11, 12],
    explanation:
      "The major scale has the pattern whole, whole, half, whole, whole, whole, half.",
  },
  {
    label: "Natural Minor",
    semitones: [0, 2, 3, 5, 7, 8, 10, 12],
    explanation:
      "Natural minor has a lowered 3rd, 6th, and 7th compared with major.",
  },
  {
    label: "Harmonic Minor",
    semitones: [0, 2, 3, 5, 7, 8, 11, 12],
    explanation:
      "Harmonic minor has a raised 7th, creating a strong pull to tonic.",
  },
  {
    label: "Melodic Minor",
    semitones: [0, 2, 3, 5, 7, 9, 11, 12],
    explanation:
      "Melodic minor raises the 6th and 7th ascending compared with natural minor.",
  },
  {
    label: "Dorian",
    semitones: [0, 2, 3, 5, 7, 9, 10, 12],
    explanation:
      "Dorian sounds minor but has a raised 6th compared with natural minor.",
  },
  {
    label: "Phrygian",
    semitones: [0, 1, 3, 5, 7, 8, 10, 12],
    explanation: "Phrygian sounds minor with a distinctive lowered 2nd.",
  },
  {
    label: "Lydian",
    semitones: [0, 2, 4, 6, 7, 9, 11, 12],
    explanation: "Lydian sounds major with a bright raised 4th.",
  },
  {
    label: "Mixolydian",
    semitones: [0, 2, 4, 5, 7, 9, 10, 12],
    explanation: "Mixolydian sounds major with a lowered 7th.",
  },
  {
    label: "Locrian",
    semitones: [0, 1, 3, 5, 6, 8, 10, 12],
    explanation:
      "Locrian sounds unstable because it has a lowered 2nd and diminished 5th.",
  },
  {
    label: "Chromatic",
    semitones: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    explanation: "The chromatic scale moves by half steps.",
  },
  {
    label: "Whole Tone",
    semitones: [0, 2, 4, 6, 8, 10, 12],
    explanation:
      "The whole tone scale moves entirely by whole steps and sounds floating.",
  },
  {
    label: "Major Pentatonic",
    semitones: [0, 2, 4, 7, 9, 12],
    explanation:
      "The major pentatonic scale is a five-note major-colored scale.",
  },
  {
    label: "Minor Pentatonic",
    semitones: [0, 3, 5, 7, 10, 12],
    explanation:
      "The minor pentatonic scale is a five-note minor-colored scale.",
  },
  {
    label: "Blues",
    semitones: [0, 3, 5, 6, 7, 10, 12],
    explanation:
      "The blues scale adds a chromatic blue note to the minor pentatonic shape.",
  },
];

const cadenceDefinitions: CadenceDefinition[] = [
  {
    label: "Authentic",
    roman: "V-I",
    chords: [
      [7, 11, 14],
      [0, 4, 7],
    ],
    explanation:
      "An authentic cadence moves from V to I. It sounds finished and resolved.",
  },
  {
    label: "Half",
    roman: "I-V",
    chords: [
      [0, 4, 7],
      [7, 11, 14],
    ],
    explanation: "A half cadence ends on V. It sounds unfinished.",
  },
  {
    label: "Plagal",
    roman: "IV-I",
    chords: [
      [5, 9, 12],
      [0, 4, 7],
    ],
    explanation:
      "A plagal cadence moves from IV to I and often sounds like “amen.”",
  },
  {
    label: "Deceptive",
    roman: "V-vi",
    chords: [
      [7, 11, 14],
      [9, 12, 16],
    ],
    explanation:
      "A deceptive cadence moves from V to vi instead of resolving to I.",
  },
];

export const defaultEarTrainingSettings: EarTrainingSettings = {
  clefs: ["treble", "bass"],
  range: {
    low: "C3",
    high: "C5",
  },
  pitch: {
    submode: "perfect",
    answerMode: "choice",
    referenceNote: "C4",
  },
  interval: {
    playback: "ascending",
    ascending: true,
    descending: true,
    harmonic: true,
    enabledAnswers: intervalDefinitions.map((item) => item.label),
  },
  scale: {
    playback: "ascending",
    ascending: true,
    descending: false,
    enabledAnswers: scaleDefinitions.map((item) => item.label),
  },
  chord: {
    playback: "blocked",
    enabledAnswers: chordDefinitions.map((item) => item.label),
  },
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function noteToMidi(note: string) {
  const match = note.match(/^([A-G])([#b]{0,2})(\d)$/);

  if (!match) {
    throw new Error(`Invalid note: ${note}`);
  }

  const [, letter, accidental = "", octaveString] = match;
  const octave = Number(octaveString);

  const baseMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  let semitone = baseMap[letter];

  if (accidental === "#") semitone += 1;
  if (accidental === "##") semitone += 2;
  if (accidental === "b") semitone -= 1;
  if (accidental === "bb") semitone -= 2;

  return (octave + 1) * 12 + semitone;
}

function midiToNote(midi: number) {
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNamesSharp[((midi % 12) + 12) % 12];

  return `${noteName}${octave}`;
}

function noteWithoutOctave(note: string) {
  return note.replace(/\d/g, "");
}

function transpose(note: string, semitones: number) {
  return midiToNote(noteToMidi(note) + semitones);
}

const intervalSemitonesByNumberQuality: Record<string, Record<string, number>> = {
  "1": {
    perfect: 0,
  },
  "2": {
    diminished: 0,
    minor: 1,
    major: 2,
    augmented: 3,
  },
  "3": {
    diminished: 2,
    minor: 3,
    major: 4,
    augmented: 5,
  },
  "4": {
    diminished: 4,
    perfect: 5,
    augmented: 6,
  },
  "5": {
    diminished: 6,
    perfect: 7,
    augmented: 8,
  },
  "6": {
    diminished: 7,
    minor: 8,
    major: 9,
    augmented: 10,
  },
  "7": {
    diminished: 9,
    minor: 10,
    major: 11,
    augmented: 12,
  },
  "8": {
    diminished: 11,
    perfect: 12,
    augmented: 13,
  },
};

const diatonicLetters = ["C", "D", "E", "F", "G", "A", "B"];

function getIntervalSemitones(number: string, quality: string) {
  return intervalSemitonesByNumberQuality[number]?.[quality];
}

function spellUpperIntervalNote(
  rootNote: string,
  number: string,
  quality: string,
) {
  const semitones = getIntervalSemitones(number, quality);

  if (semitones === undefined) {
    return transpose(rootNote, 0);
  }

  const match = rootNote.match(/^([A-G])([#b]{0,2})(\d)$/);

  if (!match) {
    return transpose(rootNote, semitones);
  }

  const [, rootLetter, , rootOctaveString] = match;
  const rootOctave = Number(rootOctaveString);
  const rootIndex = diatonicLetters.indexOf(rootLetter);

  if (rootIndex === -1) {
    return transpose(rootNote, semitones);
  }

  const intervalNumber = Number(number);
  const targetIndexTotal = rootIndex + intervalNumber - 1;
  const targetLetter = diatonicLetters[targetIndexTotal % diatonicLetters.length];
  const targetOctave =
    rootOctave + Math.floor(targetIndexTotal / diatonicLetters.length);
  const desiredMidi = noteToMidi(rootNote) + semitones;
  const naturalMidi = noteToMidi(`${targetLetter}${targetOctave}`);
  const accidentalDistance = desiredMidi - naturalMidi;

  const accidentalMap: Record<number, string> = {
    [-2]: "bb",
    [-1]: "b",
    0: "",
    1: "#",
    2: "##",
  };

  const accidental = accidentalMap[accidentalDistance];

  if (accidental === undefined) {
    return transpose(rootNote, semitones);
  }

  return `${targetLetter}${accidental}${targetOctave}`;
}

function getPreferredClefForNote(note: string, clefs: EarClef[]): EarClef {
  const midi = noteToMidi(note);

  if (clefs.length === 1) return clefs[0];

  if (clefs.includes("bass") && midi <= noteToMidi("B3")) return "bass";
  if (clefs.includes("treble") && midi >= noteToMidi("C4")) return "treble";
  if (
    clefs.includes("alto") &&
    midi >= noteToMidi("C3") &&
    midi <= noteToMidi("C5")
  ) {
    return "alto";
  }
  if (
    clefs.includes("tenor") &&
    midi >= noteToMidi("G2") &&
    midi <= noteToMidi("G4")
  ) {
    return "tenor";
  }

  return clefs[0] ?? "treble";
}

function getNotesInRange(low: string, high: string) {
  const lowMidi = noteToMidi(low);
  const highMidi = noteToMidi(high);
  const notes: string[] = [];

  for (let midi = lowMidi; midi <= highMidi; midi++) {
    notes.push(midiToNote(midi));
  }

  return notes;
}

function normalizeSettings(settings?: Partial<EarTrainingSettings>) {
  return {
    ...defaultEarTrainingSettings,
    ...settings,
    pitch: {
      ...defaultEarTrainingSettings.pitch,
      ...settings?.pitch,
    },
    interval: {
      ...defaultEarTrainingSettings.interval,
      ...settings?.interval,
    },
    scale: {
      ...defaultEarTrainingSettings.scale,
      ...settings?.scale,
    },
    chord: {
      ...defaultEarTrainingSettings.chord,
      ...settings?.chord,
    },
    range: {
      ...defaultEarTrainingSettings.range,
      ...settings?.range,
    },
  };
}

function getIntervalPrompt(style: EarPlaybackStyle) {
  if (style === "harmonic") return "Identify the harmonic interval.";
  if (style === "melodic-descending") {
    return "Identify the descending melodic interval.";
  }
  return "Identify the ascending melodic interval.";
}

export function generatePitchQuestion(
  settingsInput?: Partial<EarTrainingSettings>,
): EarTrainingQuestion {
  const settings = normalizeSettings(settingsInput);
  const pool = getNotesInRange(settings.range.low, settings.range.high);
  const note = randomItem(pool.length > 0 ? pool : ["C4"]);
  const clef = getPreferredClefForNote(note, settings.clefs);
  const answer = noteWithoutOctave(note);

  if (settings.pitch.submode === "reference") {
    const referenceNote = settings.pitch.referenceNote;

    return {
      id: `pitch-reference-${note}-${Date.now()}-${Math.random()}`,
      mode: "pitch",
      title: `Pitch Reference (${noteWithoutOctave(referenceNote)})`,
      prompt: "Identify the second pitch after the reference note.",
      notes: [[referenceNote], [note]],
      playbackStyle: "reference",
      choices: pitchChoices,
      answer,
      clef,
      rootNote: note,
      staffAnswerNotes: [note],
      explanation: `The reference note played first. The target pitch was ${answer}. Use the reference to hear how far the target moved.`,
    };
  }

  return {
    id: `pitch-${note}-${Date.now()}-${Math.random()}`,
    mode: "pitch",
    title: `Pitch ${answer}`,
    prompt: "Identify the single pitch.",
    notes: [[note]],
    playbackStyle: "single",
    choices: pitchChoices,
    answer,
    clef,
    rootNote: note,
    staffAnswerNotes: [note],
    explanation: `${answer} is the pitch you heard. In Pitch Perfect mode, the goal is to connect the sound of a single note to its letter name.`,
  };
}

export function generateKeyboardQuestion(
  settingsInput?: Partial<EarTrainingSettings>,
): EarTrainingQuestion {
  const settings = normalizeSettings(settingsInput);
  const pool = getNotesInRange(settings.range.low, settings.range.high);
  const note = randomItem(pool.length > 0 ? pool : ["C4"]);
  const clef = getPreferredClefForNote(note, settings.clefs);
  const answer = noteWithoutOctave(note);

  return {
    id: `keyboard-${note}-${Date.now()}-${Math.random()}`,
    mode: "keyboard",
    title: "Keyboard Ear Training",
    prompt: "Click the key matching the pitch you heard.",
    notes: [[note]],
    playbackStyle: "single",
    choices: pitchChoices,
    answer,
    clef,
    rootNote: note,
    staffAnswerNotes: [note],
    explanation: `The note you heard was ${answer}. Keyboard ear training connects pitch sound to keyboard location.`,
  };
}

export function generateIntervalQuestion(
  settingsInput?: Partial<EarTrainingSettings>,
): EarTrainingQuestion {
  const settings = normalizeSettings(settingsInput);
  const enabled = intervalDefinitions.filter((item) =>
    settings.interval.enabledAnswers.includes(item.label),
  );
  const interval = randomItem(
    enabled.length > 0 ? enabled : intervalDefinitions,
  );

  const possibleRoots = getNotesInRange(
    settings.range.low,
    settings.range.high,
  ).filter(
    (note) =>
      noteToMidi(note) + interval.semitones <= noteToMidi(settings.range.high),
  );

  const baseNote = randomItem(
    possibleRoots.length > 0 ? possibleRoots : ["C4"],
  );
  const clef = getPreferredClefForNote(baseNote, settings.clefs);
  const upperPlaybackNote = transpose(baseNote, interval.semitones);
  const upperStaffNote = spellUpperIntervalNote(
    baseNote,
    interval.number,
    interval.quality,
  );

  const styleByPlayback: Record<
    EarTrainingSettings["interval"]["playback"],
    EarPlaybackStyle
  > = {
    ascending: "melodic-ascending",
    descending: "melodic-descending",
    harmonic: "harmonic",
  };

  const style: EarPlaybackStyle =
    styleByPlayback[settings.interval.playback] ?? "melodic-ascending";

  let notes: string[][];

  if (style === "harmonic") {
    notes = [[baseNote, upperPlaybackNote]];
  } else if (style === "melodic-descending") {
    notes = [[upperPlaybackNote], [baseNote]];
  } else {
    notes = [[baseNote], [upperPlaybackNote]];
  }

  const staffAnswerNotes =
    style === "harmonic"
      ? [[baseNote, upperStaffNote]]
      : style === "melodic-descending"
        ? [upperStaffNote, baseNote]
        : [baseNote, upperStaffNote];

  return {
    id: `interval-${interval.label}-${baseNote}-${style}-${Date.now()}-${Math.random()}`,
    mode: "interval",
    title: interval.label,
    prompt: getIntervalPrompt(style),
    notes,
    playbackStyle: style,
    choices: intervalDefinitions.map((item) => item.label),
    answer: interval.label,
    clef,
    rootNote: baseNote,
    staffAnswerNotes,
    explanation: `${interval.explanation} This example started on ${noteWithoutOctave(
      baseNote,
    )}.`,
  };
}

export function generateScaleQuestion(
  settingsInput?: Partial<EarTrainingSettings>,
): EarTrainingQuestion {
  const settings = normalizeSettings(settingsInput);
  const enabled = scaleDefinitions.filter((item) =>
    settings.scale.enabledAnswers.includes(item.label),
  );
  const scale = randomItem(enabled.length > 0 ? enabled : scaleDefinitions);

  const rootPool = getNotesInRange(
    settings.range.low,
    settings.range.high,
  ).filter((note) => noteToMidi(note) + 12 <= noteToMidi(settings.range.high));

  const root = randomItem(rootPool.length > 0 ? rootPool : ["C4"]);
  const clef = getPreferredClefForNote(root, settings.clefs);

  const style: EarPlaybackStyle =
    settings.scale.playback === "descending"
      ? "scale-descending"
      : "scale-ascending";

  const scaleNotes = scale.semitones.map((semitone) =>
    transpose(root, semitone),
  );
  const playbackNotes =
    style === "scale-descending" ? [...scaleNotes].reverse() : scaleNotes;

  return {
    id: `scale-${scale.label}-${root}-${style}-${Date.now()}-${Math.random()}`,
    mode: "scale",
    title: `${scale.label} Scale`,
    prompt: "Identify the scale or mode.",
    notes: playbackNotes.map((note) => [note]),
    playbackStyle: style,
    choices: scaleDefinitions.map((item) => item.label),
    answer: scale.label,
    clef,
    rootNote: root,
    staffAnswerNotes: scaleNotes,
    explanation: scale.explanation,
  };
}

export function generateChordQuestion(
  settingsInput?: Partial<EarTrainingSettings>,
): EarTrainingQuestion {
  const settings = normalizeSettings(settingsInput);
  const enabled = chordDefinitions.filter((item) =>
    settings.chord.enabledAnswers.includes(item.label),
  );
  const chord = randomItem(enabled.length > 0 ? enabled : chordDefinitions);

  const rootPool = getNotesInRange(
    settings.range.low,
    settings.range.high,
  ).filter(
    (note) =>
      noteToMidi(note) + Math.max(...chord.semitones) <=
      noteToMidi(settings.range.high),
  );

  const root = randomItem(rootPool.length > 0 ? rootPool : ["C4"]);
  const clef = getPreferredClefForNote(root, settings.clefs);
  const chordNotes = chord.semitones.map((semitone) =>
    transpose(root, semitone),
  );

  const playbackStyle: EarPlaybackStyle =
    settings.chord.playback === "arpeggiated" ? "arpeggiated" : "blocked";

  const notes =
    playbackStyle === "arpeggiated"
      ? chordNotes.map((note) => [note])
      : [chordNotes];

  return {
    id: `chord-${chord.label}-${root}-${Date.now()}-${Math.random()}`,
    mode: "chord",
    title: chord.label,
    prompt: "Identify the chord quality.",
    notes,
    playbackStyle,
    choices: chordDefinitions.map((item) => item.label),
    answer: chord.label,
    clef,
    rootNote: root,
    staffAnswerNotes: chordNotes,
    explanation: `${chord.explanation} This chord was built from ${noteWithoutOctave(
      root,
    )}.`,
  };
}

export function generateCadenceQuestion(): EarTrainingQuestion {
  const tonic = randomItem(["C4", "D4", "E4", "F4", "G4"]);
  const tonicMidi = noteToMidi(tonic);
  const cadence = randomItem(cadenceDefinitions);

  const notes = cadence.chords.map((chord) =>
    chord.map((semitone) => midiToNote(tonicMidi + semitone)),
  );

  return {
    id: `cadence-${cadence.label}-${tonic}-${Date.now()}-${Math.random()}`,
    mode: "cadence",
    title: `${cadence.label} Cadence`,
    prompt: "Identify the cadence.",
    notes,
    playbackStyle: "progression",
    choices: cadenceDefinitions.map((item) => item.label),
    answer: cadence.label,
    clef: "treble",
    rootNote: tonic,
    staffAnswerNotes: notes.flat(),
    explanation: `${cadence.explanation} In Roman numerals, this is ${cadence.roman}.`,
  };
}

export function getRandomEarTrainingQuestion(
  mode: EarTrainingMode,
  settings?: Partial<EarTrainingSettings>,
) {
  if (mode === "pitch") return generatePitchQuestion(settings);
  if (mode === "keyboard") return generateKeyboardQuestion(settings);
  if (mode === "interval") return generateIntervalQuestion(settings);
  if (mode === "scale") return generateScaleQuestion(settings);
  if (mode === "chord") return generateChordQuestion(settings);
  return generateCadenceQuestion();
}

export function getEarTrainingQuestions(
  mode: EarTrainingMode,
  settings?: Partial<EarTrainingSettings>,
) {
  return Array.from({ length: 20 }, () =>
    getRandomEarTrainingQuestion(mode, settings),
  );
}

export function getIntervalStaffNotesFromSelection(
  rootNote: string,
  quality: string,
  number: string,
  playbackStyle: EarPlaybackStyle = "melodic-ascending",
) {
  const semitones = getIntervalSemitones(number, quality);

  if (semitones === undefined) {
    return [rootNote];
  }

  const upperNote = spellUpperIntervalNote(rootNote, number, quality);

  if (playbackStyle === "harmonic") {
    return [[rootNote, upperNote]];
  }

  if (playbackStyle === "melodic-descending") {
    return [upperNote, rootNote];
  }

  return [rootNote, upperNote];
}

export const earTrainingOptionLists = {
  intervals: intervalDefinitions.map((item) => item.label),
  scales: scaleDefinitions.map((item) => item.label),
  chords: chordDefinitions.map((item) => item.label),
  clefs: ["treble", "bass", "alto", "tenor"] as EarClef[],
  rangeNotes: [
    "C2",
    "D2",
    "E2",
    "F2",
    "G2",
    "A2",
    "B2",
    "C3",
    "D3",
    "E3",
    "F3",
    "G3",
    "A3",
    "B3",
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
    "E5",
    "F5",
    "G5",
    "A5",
    "B5",
    "C6",
  ],
};
