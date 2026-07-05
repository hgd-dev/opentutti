import type { StaffTemplate, StaffNote } from "@/lib/music/staffTemplates";

export type SightReadingLevel = "level-1" | "level-2" | "level-3";

export type SightReadingMelody = StaffTemplate & {
  level: SightReadingLevel;
  noteNames: string[];
  tips: string[];
};

const levelSettings = {
  "level-1": {
    title: "Level 1",
    description: "Stepwise motion in C major using mostly quarter notes.",
    pitches: ["C4", "D4", "E4", "F4", "G4"],
    durations: ["q"] as StaffNote["duration"][],
    length: 8,
    tips: [
      "Look for stepwise motion before you sing.",
      "Keep a steady quarter-note pulse.",
      "Use do-re-mi thinking in C major.",
    ],
  },
  "level-2": {
    title: "Level 2",
    description: "Steps and small skips in C major using quarters and halves.",
    pitches: ["C4", "D4", "E4", "F4", "G4", "A4"],
    durations: ["q", "q", "q", "h"] as StaffNote["duration"][],
    length: 8,
    tips: [
      "Scan for repeated notes and skips before starting.",
      "Half notes should feel twice as long as quarter notes.",
      "If you see a third, think about skipping one scale degree.",
    ],
  },
  "level-3": {
    title: "Level 3",
    description: "More range with eighth notes, skips, and simple rhythm changes.",
    pitches: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    durations: ["q", "q", "8", "8", "h"] as StaffNote["duration"][],
    length: 10,
    tips: [
      "Count carefully before singing eighth notes.",
      "Check the highest and lowest note before you begin.",
      "Do not rush longer notes after a pair of eighth notes.",
    ],
  },
};

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function noteName(pitch: string) {
  return pitch.replace(/\d/g, "");
}

export function generateSightReadingMelody(
  level: SightReadingLevel
): SightReadingMelody {
  const settings = levelSettings[level];

  const notes: StaffNote[] = [];

  let lastIndex = Math.floor(settings.pitches.length / 2);

  for (let i = 0; i < settings.length; i++) {
    const movement = randomItem([-2, -1, 0, 1, 2]);
    const nextIndex = Math.max(
      0,
      Math.min(settings.pitches.length - 1, lastIndex + movement)
    );

    lastIndex = nextIndex;

    notes.push({
      pitch: settings.pitches[nextIndex],
      duration: randomItem(settings.durations),
    });
  }

  return {
    id: `sight-${level}-${Date.now()}`,
    title: settings.title,
    description: settings.description,
    clef: "treble",
    timeSignature: "4/4",
    keySignature: "C",
    tempo: level === "level-3" ? 76 : 84,
    notes,
    level,
    noteNames: notes.map((note) => noteName(note.pitch)),
    tips: settings.tips,
  };
}

export const sightReadingLevels: {
  value: SightReadingLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "level-1",
    label: "Level 1",
    description: levelSettings["level-1"].description,
  },
  {
    value: "level-2",
    label: "Level 2",
    description: levelSettings["level-2"].description,
  },
  {
    value: "level-3",
    label: "Level 3",
    description: levelSettings["level-3"].description,
  },
];