export type StaffNote = {
  pitch: string;
  duration: "q" | "h" | "w" | "8";
};

export type StaffTemplate = {
  id: string;
  title: string;
  description: string;
  clef: "treble" | "bass";
  timeSignature: string;
  keySignature: string;
  tempo: number;
  notes: StaffNote[];
};

export const staffTemplates: StaffTemplate[] = [
  {
    id: "c-major-scale",
    title: "C Major Scale",
    description: "A simple one-octave C major scale in quarter notes.",
    clef: "treble",
    timeSignature: "4/4",
    keySignature: "C",
    tempo: 90,
    notes: [
      { pitch: "C4", duration: "q" },
      { pitch: "D4", duration: "q" },
      { pitch: "E4", duration: "q" },
      { pitch: "F4", duration: "q" },
      { pitch: "G4", duration: "q" },
      { pitch: "A4", duration: "q" },
      { pitch: "B4", duration: "q" },
      { pitch: "C5", duration: "q" },
    ],
  },
  {
    id: "minor-third-builder",
    title: "Minor Third Builder",
    description: "Hear and see minor thirds starting from C, D, E, and A.",
    clef: "treble",
    timeSignature: "4/4",
    keySignature: "C",
    tempo: 80,
    notes: [
      { pitch: "C4", duration: "q" },
      { pitch: "Eb4", duration: "q" },
      { pitch: "D4", duration: "q" },
      { pitch: "F4", duration: "q" },
      { pitch: "E4", duration: "q" },
      { pitch: "G4", duration: "q" },
      { pitch: "A4", duration: "q" },
      { pitch: "C5", duration: "q" },
    ],
  },
  {
    id: "major-triad-arpeggio",
    title: "Major Triad Arpeggio",
    description: "C major, F major, and G major triads as broken chords.",
    clef: "treble",
    timeSignature: "4/4",
    keySignature: "C",
    tempo: 90,
    notes: [
      { pitch: "C4", duration: "q" },
      { pitch: "E4", duration: "q" },
      { pitch: "G4", duration: "q" },
      { pitch: "C5", duration: "q" },
      { pitch: "F4", duration: "q" },
      { pitch: "A4", duration: "q" },
      { pitch: "C5", duration: "q" },
      { pitch: "F5", duration: "q" },
      { pitch: "G4", duration: "q" },
      { pitch: "B4", duration: "q" },
      { pitch: "D5", duration: "q" },
      { pitch: "G5", duration: "q" },
    ],
  },
  {
    id: "cadence-basic",
    title: "Basic Cadence Shape",
    description: "A simple V-I melodic outline for hearing resolution.",
    clef: "treble",
    timeSignature: "4/4",
    keySignature: "C",
    tempo: 72,
    notes: [
      { pitch: "G4", duration: "q" },
      { pitch: "B4", duration: "q" },
      { pitch: "D5", duration: "q" },
      { pitch: "B4", duration: "q" },
      { pitch: "C5", duration: "h" },
      { pitch: "G4", duration: "h" },
    ],
  },
  {
    id: "rhythm-quarter-half",
    title: "Quarter and Half Note Rhythm",
    description: "A beginner rhythm-reading template using quarters and halves.",
    clef: "treble",
    timeSignature: "4/4",
    keySignature: "C",
    tempo: 84,
    notes: [
      { pitch: "C4", duration: "q" },
      { pitch: "C4", duration: "q" },
      { pitch: "D4", duration: "h" },
      { pitch: "E4", duration: "q" },
      { pitch: "E4", duration: "q" },
      { pitch: "D4", duration: "h" },
    ],
  },
];