"use client";

import { useMemo, useState } from "react";
import StaffChoice from "@/components/StaffChoice";
import {
  defaultTheorySettings,
  getIntervalQualityOptions,
  getRandomTheoryQuestion,
  makeIntervalAnswer,
  theoryOptionLists,
  TheoryMode,
  TheoryQuestion,
  TheorySettings,
} from "@/lib/music/theoryTraining";
import type { EarClef } from "@/lib/music/earTraining";

const modes: { value: TheoryMode; label: string; description: string }[] = [
  {
    value: "pitch",
    label: "Pitch",
    description:
      "Identify staff notes across treble, bass, alto, and tenor clefs.",
  },
  {
    value: "interval",
    label: "Intervals",
    description: "Read written melodic and harmonic intervals from notation.",
  },
  {
    value: "scale",
    label: "Scales",
    description: "Identify scales by their staff pattern and altered degrees.",
  },
  {
    value: "chord",
    label: "Chords",
    description: "Identify triads and 7th chords, with optional inversions.",
  },
  {
    value: "cadence",
    label: "Cadences",
    description: "Read short notated progressions and identify cadence type.",
  },
  {
    value: "key-signature",
    label: "Key Signatures",
    description:
      "Identify major and optional relative minor key signatures in every clef.",
  },
];

const intervalNumberDefault = "1";
const intervalQualityDefault = "perfect";

function cloneSettings(settings: TheorySettings): TheorySettings {
  return {
    ...settings,
    clefs: [...settings.clefs],
    range: { ...settings.range },
    pitch: { ...settings.pitch },
    interval: {
      ...settings.interval,
      enabledAnswers: [...settings.interval.enabledAnswers],
    },
    scale: {
      ...settings.scale,
      enabledAnswers: [...settings.scale.enabledAnswers],
    },
    chord: {
      ...settings.chord,
      enabledAnswers: [...settings.chord.enabledAnswers],
    },
    cadence: {
      ...settings.cadence,
      enabledAnswers: [...settings.cadence.enabledAnswers],
    },
    keySignature: { ...settings.keySignature },
  };
}

function qualityLabel(quality: string) {
  return quality.charAt(0).toUpperCase() + quality.slice(1);
}

function modeLabel(mode: TheoryMode) {
  return modes.find((item) => item.value === mode)?.label ?? "Theory";
}

function toggleValue(current: string[], value: string, fallback: string[]) {
  const exists = current.includes(value);
  const next = exists
    ? current.filter((item) => item !== value)
    : [...current, value];
  return next.length > 0 ? next : fallback;
}

const pitchButtonChoices = [
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

const enharmonicFlatChoices = [
  { note: "Db", slot: 1 },
  { note: "Eb", slot: 3 },
  { note: "Gb", slot: 6 },
  { note: "Ab", slot: 8 },
  { note: "Bb", slot: 10 },
];

const enharmonicPitchClassMap: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

const blackKeyLabels: Record<string, string> = {
  "C#": "C#/Db",
  "D#": "D#/Eb",
  "F#": "F#/Gb",
  "G#": "G#/Ab",
  "A#": "A#/Bb",
};

function normalizePitchClassForEnharmonic(note: string) {
  return enharmonicPitchClassMap[note] ?? note;
}

function isEnharmonicPitchMatch(
  selectedNote: string | null | undefined,
  answerNote: string,
  allowEnharmonics: boolean,
) {
  if (!selectedNote) return false;
  if (selectedNote === answerNote) return true;
  if (!allowEnharmonics) return false;

  const selectedOctave = selectedNote.match(/\d+$/)?.[0] ?? "";
  const answerOctave = answerNote.match(/\d+$/)?.[0] ?? "";

  if (selectedOctave || answerOctave) {
    if (selectedOctave !== answerOctave) return false;
  }

  return (
    normalizePitchClassForEnharmonic(selectedNote.replace(/\d+$/, "")) ===
    normalizePitchClassForEnharmonic(answerNote.replace(/\d+$/, ""))
  );
}
const whitePitchClasses = ["C", "D", "E", "F", "G", "A", "B"];
const blackPitchClasses = ["C#", "D#", "F#", "G#", "A#"];
const naturalBeforeBlack: Record<string, string> = {
  "C#": "C",
  "D#": "D",
  "F#": "F",
  "G#": "G",
  "A#": "A",
};
const chromaticPitchClasses = [
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
const naturalSemitones: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function midiFromPitchName(note: string) {
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) return 60;

  const [, letter, accidental, octaveText] = match;
  return (
    (Number(octaveText) + 1) * 12 +
    naturalSemitones[letter] +
    (accidental === "#" ? 1 : 0)
  );
}

function pitchNameFromMidi(midi: number) {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${chromaticPitchClasses[pitchClass]}${octave}`;
}

function getPitchClass(note: string) {
  return note.replace(/\d+$/, "");
}

function keyboardNotesForRange(low: string, high: string) {
  const lowMidi = midiFromPitchName(low);
  const highMidi = midiFromPitchName(high);
  const middleCMidi = midiFromPitchName("C4");
  const start = Math.min(lowMidi, highMidi, middleCMidi);
  const end = Math.max(lowMidi, highMidi, middleCMidi);

  return Array.from({ length: end - start + 1 }, (_, index) =>
    pitchNameFromMidi(start + index),
  );
}

function PitchClassChoiceButtons({
  selected,
  answered,
  answer,
  allowEnharmonics,
  onSelect,
}: {
  selected: string | null;
  answered: boolean;
  answer: string;
  allowEnharmonics: boolean;
  onSelect: (note: string) => void;
}) {
  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-medium text-zinc-400">Choice buttons</p>
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-3">
          {pitchButtonChoices.map((note) => {
            const correctChoice =
              answered && isEnharmonicPitchMatch(note, answer, allowEnharmonics);
            const wrongChoice =
              answered &&
              selected === note &&
              !isEnharmonicPitchMatch(note, answer, allowEnharmonics);
            const selectedChoice = selected === note;

            return (
              <button
                key={note}
                onClick={() => onSelect(note)}
                disabled={answered}
                className={`w-full rounded-2xl border px-4 py-4 text-center text-lg font-semibold transition disabled:cursor-not-allowed ${
                  correctChoice
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100"
                    : wrongChoice
                      ? "border-red-400/70 bg-red-500/15 text-red-100"
                      : selectedChoice
                        ? "border-violet-400/70 bg-violet-500/15 text-white"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-12 gap-3 border-t border-white/10 pt-3">
          {enharmonicFlatChoices.map(({ note, slot }) => {
            const correctChoice =
              answered && isEnharmonicPitchMatch(note, answer, allowEnharmonics);
            const wrongChoice =
              answered &&
              selected === note &&
              !isEnharmonicPitchMatch(note, answer, allowEnharmonics);
            const selectedChoice = selected === note;

            return (
              <button
                key={note}
                style={{ gridColumnStart: slot + 1 }}
                onClick={() => onSelect(note)}
                disabled={answered}
                className={`w-full rounded-2xl border px-4 py-4 text-center text-lg font-semibold transition disabled:cursor-not-allowed ${
                  correctChoice
                    ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100"
                    : wrongChoice
                      ? "border-red-400/70 bg-red-500/15 text-red-100"
                      : selectedChoice
                        ? "border-violet-400/70 bg-violet-500/15 text-white"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RangeKeyboard({
  low,
  high,
  selected,
  answered,
  answer,
  onSelect,
}: {
  low: string;
  high: string;
  selected: string | null;
  answered: boolean;
  answer: string;
  onSelect: (note: string) => void;
}) {
  const allNotes = keyboardNotesForRange(low, high);
  const whiteNotes = allNotes.filter((note) =>
    whitePitchClasses.includes(getPitchClass(note)),
  );
  const blackNotes = allNotes.filter((note) =>
    blackPitchClasses.includes(getPitchClass(note)),
  );
  const whiteKeyWidth = 100 / Math.max(whiteNotes.length, 1);
  const minWidth = Math.max(520, whiteNotes.length * 38);

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
        <span>Keyboard answer format</span>
        <span>Exact pitch required. Middle C is labeled when shown.</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="relative h-48" style={{ minWidth }}>
          <div className="relative flex h-full">
            {whiteNotes.map((note) => {
              const correctChoice = answered && note === answer;
              const wrongChoice =
                answered && selected === note && note !== answer;
              const selectedChoice = selected === note;

              return (
                <button
                  key={note}
                  onClick={() => onSelect(note)}
                  disabled={answered}
                  className={`flex flex-1 items-end justify-center rounded-b-lg border border-zinc-300 bg-white px-1 pb-3 text-[10px] font-semibold text-zinc-950 transition disabled:cursor-not-allowed ${
                    correctChoice
                      ? "bg-emerald-100 text-emerald-950 ring-2 ring-emerald-300"
                      : wrongChoice
                        ? "bg-red-100 text-red-950 ring-2 ring-red-300"
                        : selectedChoice
                          ? "ring-2 ring-violet-400"
                          : ""
                  }`}
                >
                  {note === "C4" ? "Middle C" : note}
                </button>
              );
            })}

            {blackNotes.map((note) => {
              const pitchClass = getPitchClass(note);
              const octave = Number(note.match(/\d+$/)?.[0] ?? "4");
              const previousWhiteIndex = whiteNotes.findIndex(
                (whiteNote) =>
                  getPitchClass(whiteNote) === naturalBeforeBlack[pitchClass] &&
                  Number(whiteNote.match(/\d+$/)?.[0] ?? "4") === octave,
              );

              if (previousWhiteIndex < 0) return null;

              const left = (previousWhiteIndex + 0.68) * whiteKeyWidth;
              const correctChoice = answered && note === answer;
              const wrongChoice =
                answered && selected === note && note !== answer;
              const selectedChoice = selected === note;

              return (
                <button
                  key={note}
                  onClick={() => onSelect(note)}
                  disabled={answered}
                  className={`absolute top-0 z-10 flex h-[112px] items-end justify-center rounded-b-md bg-zinc-950 pb-2 text-[9px] font-semibold text-white shadow-lg transition disabled:cursor-not-allowed ${
                    correctChoice
                      ? "bg-emerald-500 ring-2 ring-emerald-300"
                      : wrongChoice
                        ? "bg-red-500 ring-2 ring-red-300"
                        : selectedChoice
                          ? "ring-2 ring-violet-400"
                          : ""
                  }`}
                  style={{
                    left: `${left}%`,
                    width: `${whiteKeyWidth * 0.64}%`,
                  }}
                >
                  <span className="leading-tight">
                    {blackKeyLabels[pitchClass] ?? pitchClass}
                    <span className="block text-[8px] opacity-70">{octave}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function staffSizeForQuestion(question: TheoryQuestion) {
  const noteCount = question.staffNotes.length;

  if (question.mode === "scale") {
    return { width: 720, height: 135 };
  }

  if (question.mode === "cadence") {
    return { width: 460, height: 135 };
  }

  if (question.mode === "key-signature") {
    return { width: 340, height: 115 };
  }

  if (question.mode === "pitch") {
    return { width: 340, height: 125 };
  }

  if (question.mode === "interval") {
    return { width: 380, height: 135 };
  }

  if (question.mode === "chord") {
    return { width: noteCount > 1 ? 430 : 340, height: 135 };
  }

  return { width: 420, height: 135 };
}

export default function TheoryTester() {
  const [settings, setSettings] = useState<TheorySettings>(() =>
    cloneSettings(defaultTheorySettings),
  );
  const [mode, setMode] = useState<TheoryMode>("pitch");
  const [question, setQuestion] = useState<TheoryQuestion>(() =>
    getRandomTheoryQuestion("pitch", defaultTheorySettings),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [perModeStats, setPerModeStats] = useState<
    Record<TheoryMode, { correct: number; total: number }>
  >({
    pitch: { correct: 0, total: 0 },
    interval: { correct: 0, total: 0 },
    scale: { correct: 0, total: 0 },
    chord: { correct: 0, total: 0 },
    cadence: { correct: 0, total: 0 },
    "key-signature": { correct: 0, total: 0 },
  });
  const [intervalNumber, setIntervalNumber] = useState(intervalNumberDefault);
  const [intervalQuality, setIntervalQuality] = useState(
    intervalQualityDefault,
  );
  const [chordInversionAnswer, setChordInversionAnswer] =
    useState("Root position");
  const [keyRootAnswer, setKeyRootAnswer] = useState("C");
  const [keyAccidentalAnswer, setKeyAccidentalAnswer] = useState("");
  const [keyModeAnswer, setKeyModeAnswer] = useState("major");

  const intervalQualityOptions = useMemo(
    () => getIntervalQualityOptions(intervalNumber),
    [intervalNumber],
  );

  const intervalSelection = makeIntervalAnswer(intervalQuality, intervalNumber);
  const currentAnswer = getCurrentAnswer();
  const expectedAnswer = getExpectedAnswer();
  const isCorrect =
    mode === "pitch"
      ? isEnharmonicPitchMatch(
          currentAnswer,
          expectedAnswer,
          settings.pitch.allowEnharmonics,
        )
      : currentAnswer === expectedAnswer;

  const accuracy = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((correctCount / totalCount) * 100);
  }, [correctCount, totalCount]);

  const staffSize = staffSizeForQuestion(question);

  function formatChordAnswer(chord: string, inversion: string) {
    return `${chord} — ${inversion}`;
  }

  function formatKeyAnswer(root: string, accidental: string, modeName: string) {
    return `${root}${accidental} ${modeName}`;
  }

  function getCurrentAnswer() {
    if (mode === "interval") return intervalSelection;
    if (mode === "chord" && settings.chord.includeInversions && selected) {
      return selected;
    }
    if (mode === "key-signature") {
      return formatKeyAnswer(keyRootAnswer, keyAccidentalAnswer, keyModeAnswer);
    }
    return selected;
  }

  function getExpectedAnswer() {
    if (
      mode === "chord" &&
      settings.chord.includeInversions &&
      question.chordInversion
    ) {
      return formatChordAnswer(question.answer, question.chordInversion);
    }
    return question.answer;
  }

  function resetAnswerState() {
    setSelected(null);
    setAnswered(false);
    setIntervalNumber(intervalNumberDefault);
    setIntervalQuality(intervalQualityDefault);
    setChordInversionAnswer("Root position");
    setKeyRootAnswer("C");
    setKeyAccidentalAnswer("");
    setKeyModeAnswer("major");
  }

  function regenerate(nextMode = mode, nextSettings = settings) {
    setQuestion(getRandomTheoryQuestion(nextMode, nextSettings));
    resetAnswerState();
  }

  function changeMode(nextMode: TheoryMode) {
    setMode(nextMode);
    regenerate(nextMode, settings);
  }

  function updateSettings(
    producer: (current: TheorySettings) => TheorySettings,
  ) {
    setSettings((current) => {
      const next = producer(cloneSettings(current));
      setQuestion(getRandomTheoryQuestion(mode, next));
      resetAnswerState();
      return next;
    });
  }

  function submitAnswer(choice?: string) {
    if (answered) return;

    const submitted = choice ?? getCurrentAnswer();
    const expected = getExpectedAnswer();
    if (!submitted) return;

    setSelected(submitted);
    setAnswered(true);
    setTotalCount((current) => current + 1);
    setPerModeStats((current) => ({
      ...current,
      [mode]: {
        correct:
          current[mode].correct +
          ((mode === "pitch"
            ? isEnharmonicPitchMatch(
                submitted,
                expected,
                settings.pitch.allowEnharmonics,
              )
            : submitted === expected)
            ? 1
            : 0),
        total: current[mode].total + 1,
      },
    }));

    if (
      mode === "pitch"
        ? isEnharmonicPitchMatch(
            submitted,
            expected,
            settings.pitch.allowEnharmonics,
          )
        : submitted === expected
    ) {
      setCorrectCount((current) => current + 1);
    }
  }

  function nextQuestion() {
    regenerate(mode, settings);
  }

  function updateIntervalNumber(nextNumber: string) {
    setIntervalNumber(nextNumber);
    const nextQualities = getIntervalQualityOptions(nextNumber);
    if (!nextQualities.includes(intervalQuality)) {
      setIntervalQuality(nextQualities[0]);
    }
  }

  function toggleClef(clef: EarClef) {
    updateSettings((current) => {
      const nextClefs = current.clefs.includes(clef)
        ? current.clefs.filter((item) => item !== clef)
        : [...current.clefs, clef];

      current.clefs =
        nextClefs.length > 0 ? nextClefs : defaultTheorySettings.clefs;
      return current;
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold">Choose a drill</h2>

        <div className="mt-5 space-y-3">
          {modes.map((item) => (
            <button
              key={item.value}
              onClick={() => changeMode(item.value)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                mode === item.value
                  ? "border-violet-400/70 bg-violet-500/15"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
              }`}
            >
              <p className="font-medium text-white">{item.label}</p>
              {mode === item.value && (
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {item.description}
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Session score</p>
          <p className="mt-2 text-3xl font-semibold">
            {correctCount}/{totalCount}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{accuracy}% accuracy</p>

          <div className="mt-4 space-y-2 text-sm text-zinc-400">
            {modes.map((item) => {
              const stats = perModeStats[item.value];
              return (
                <div key={item.value} className="flex justify-between gap-3">
                  <span>{item.label}</span>
                  <span>
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">
              {modeLabel(mode).toUpperCase()} THEORY
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {question.prompt}
            </h2>
            <p className="mt-3 text-zinc-400">
              Read the staff, enter the best answer, then review the
              explanation.
            </p>
          </div>

          <details className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-4 open:bg-black/40">
            <summary className="cursor-pointer select-none text-lg font-semibold text-white">
              Exercise Settings
            </summary>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-zinc-300">Clefs</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {theoryOptionLists.clefs.map((clef) => (
                    <label
                      key={clef}
                      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300"
                    >
                      <input
                        type="checkbox"
                        checked={settings.clefs.includes(clef)}
                        onChange={() => toggleClef(clef)}
                      />
                      {clef.charAt(0).toUpperCase() + clef.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Low note
                  <select
                    value={settings.range.low}
                    onChange={(event) =>
                      updateSettings((current) => {
                        current.range.low = event.target.value;
                        return current;
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                  >
                    {theoryOptionLists.rangeNotes.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-zinc-300">
                  High note
                  <select
                    value={settings.range.high}
                    onChange={(event) =>
                      updateSettings((current) => {
                        current.range.high = event.target.value;
                        return current;
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                  >
                    {theoryOptionLists.rangeNotes.map((note) => (
                      <option key={note} value={note}>
                        {note}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {mode === "pitch" && (
                <div className="space-y-3">
                  <label className="block text-sm text-zinc-300">
                    Answer format
                    <select
                      value={settings.pitch.answerMode}
                      onChange={(event) =>
                        updateSettings((current) => {
                          current.pitch.answerMode = event.target
                            .value as TheorySettings["pitch"]["answerMode"];
                          return current;
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                    >
                      <option value="choices">Choice buttons</option>
                      <option value="keyboard">Keyboard</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={settings.pitch.allowEnharmonics}
                      onChange={(event) =>
                        updateSettings((current) => {
                          current.pitch.allowEnharmonics = event.target.checked;
                          return current;
                        })
                      }
                    />
                    Allow enharmonics
                  </label>
                </div>
              )}

              {mode === "interval" && (
                <>
                  <label className="block text-sm text-zinc-300">
                    Display type
                    <select
                      value={settings.interval.playbackType}
                      onChange={(event) =>
                        updateSettings((current) => {
                          current.interval.playbackType = event.target
                            .value as TheorySettings["interval"]["playbackType"];
                          return current;
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                    >
                      <option value="ascending">Ascending melodic</option>
                      <option value="descending">Descending melodic</option>
                      <option value="harmonic">Harmonic</option>
                    </select>
                  </label>

                  <details className="rounded-2xl border border-white/10 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-300">
                      Interval types
                    </summary>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {defaultTheorySettings.interval.enabledAnswers.map(
                        (answer) => (
                          <label
                            key={answer}
                            className="flex items-center gap-2 text-sm text-zinc-400"
                          >
                            <input
                              type="checkbox"
                              checked={settings.interval.enabledAnswers.includes(
                                answer,
                              )}
                              onChange={() =>
                                updateSettings((current) => {
                                  current.interval.enabledAnswers = toggleValue(
                                    current.interval.enabledAnswers,
                                    answer,
                                    defaultTheorySettings.interval
                                      .enabledAnswers,
                                  );
                                  return current;
                                })
                              }
                            />
                            {answer}
                          </label>
                        ),
                      )}
                    </div>
                  </details>
                </>
              )}

              {mode === "scale" && (
                <>
                  <label className="block text-sm text-zinc-300">
                    Display type
                    <select
                      value={settings.scale.playbackType}
                      onChange={(event) =>
                        updateSettings((current) => {
                          current.scale.playbackType = event.target
                            .value as TheorySettings["scale"]["playbackType"];
                          return current;
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                    >
                      <option value="ascending">Ascending</option>
                      <option value="descending">Descending</option>
                    </select>
                  </label>

                  <details className="rounded-2xl border border-white/10 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-300">
                      Scale types
                    </summary>
                    <div className="mt-3 space-y-4">
                      {(
                        Object.entries(theoryOptionLists.scaleGroups) as [
                          string,
                          string[],
                        ][]
                      ).map(([groupKey, groupItems]) => {
                        const label =
                          groupKey === "common"
                            ? "Common"
                            : groupKey === "special"
                              ? "Special"
                              : "Modes";
                        const allChecked = groupItems.every((answer) =>
                          settings.scale.enabledAnswers.includes(answer),
                        );
                        return (
                          <div
                            key={groupKey}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={(event) =>
                                  updateSettings((current) => {
                                    current.scale.enabledAnswers = event.target
                                      .checked
                                      ? Array.from(
                                          new Set([
                                            ...current.scale.enabledAnswers,
                                            ...groupItems,
                                          ]),
                                        )
                                      : current.scale.enabledAnswers.filter(
                                          (answer) =>
                                            !groupItems.includes(answer),
                                        );
                                    if (
                                      current.scale.enabledAnswers.length === 0
                                    ) {
                                      current.scale.enabledAnswers = [
                                        ...defaultTheorySettings.scale
                                          .enabledAnswers,
                                      ];
                                    }
                                    return current;
                                  })
                                }
                              />
                              {label}
                            </label>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {groupItems.map((answer) => (
                                <label
                                  key={answer}
                                  className="flex items-center gap-2 text-sm text-zinc-400"
                                >
                                  <input
                                    type="checkbox"
                                    checked={settings.scale.enabledAnswers.includes(
                                      answer,
                                    )}
                                    onChange={() =>
                                      updateSettings((current) => {
                                        current.scale.enabledAnswers =
                                          toggleValue(
                                            current.scale.enabledAnswers,
                                            answer,
                                            defaultTheorySettings.scale
                                              .enabledAnswers,
                                          );
                                        return current;
                                      })
                                    }
                                  />
                                  {answer}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </>
              )}

              {mode === "chord" && (
                <>
                  <label className="block text-sm text-zinc-300">
                    Display type
                    <select
                      value={settings.chord.playbackType}
                      onChange={(event) =>
                        updateSettings((current) => {
                          current.chord.playbackType = event.target
                            .value as TheorySettings["chord"]["playbackType"];
                          return current;
                        })
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
                    >
                      <option value="blocked">Blocked</option>
                      <option value="arpeggiated">Arpeggiated</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={settings.chord.includeInversions}
                      onChange={(event) =>
                        updateSettings((current) => {
                          current.chord.includeInversions =
                            event.target.checked;
                          return current;
                        })
                      }
                    />
                    Include inversions in questions and answers
                  </label>

                  <details className="rounded-2xl border border-white/10 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-300">
                      Chord types
                    </summary>
                    <div className="mt-3 space-y-4">
                      {(
                        Object.entries(theoryOptionLists.chordGroups) as [
                          string,
                          string[],
                        ][]
                      ).map(([groupKey, groupItems]) => {
                        const label =
                          groupKey === "triads" ? "Triads" : "7th chords";
                        const allChecked = groupItems.every((answer) =>
                          settings.chord.enabledAnswers.includes(answer),
                        );
                        return (
                          <div
                            key={groupKey}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={(event) =>
                                  updateSettings((current) => {
                                    current.chord.enabledAnswers = event.target
                                      .checked
                                      ? Array.from(
                                          new Set([
                                            ...current.chord.enabledAnswers,
                                            ...groupItems,
                                          ]),
                                        )
                                      : current.chord.enabledAnswers.filter(
                                          (answer) =>
                                            !groupItems.includes(answer),
                                        );
                                    if (
                                      current.chord.enabledAnswers.length === 0
                                    ) {
                                      current.chord.enabledAnswers = [
                                        ...defaultTheorySettings.chord
                                          .enabledAnswers,
                                      ];
                                    }
                                    return current;
                                  })
                                }
                              />
                              {label}
                            </label>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {groupItems.map((answer) => (
                                <label
                                  key={answer}
                                  className="flex items-center gap-2 text-sm text-zinc-400"
                                >
                                  <input
                                    type="checkbox"
                                    checked={settings.chord.enabledAnswers.includes(
                                      answer,
                                    )}
                                    onChange={() =>
                                      updateSettings((current) => {
                                        current.chord.enabledAnswers =
                                          toggleValue(
                                            current.chord.enabledAnswers,
                                            answer,
                                            defaultTheorySettings.chord
                                              .enabledAnswers,
                                          );
                                        return current;
                                      })
                                    }
                                  />
                                  {answer}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </>
              )}

              {mode === "cadence" && (
                <details className="rounded-2xl border border-white/10 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-zinc-300">
                    Cadence types
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {theoryOptionLists.cadences.map((answer) => (
                      <label
                        key={answer}
                        className="flex items-center gap-2 text-sm text-zinc-400"
                      >
                        <input
                          type="checkbox"
                          checked={settings.cadence.enabledAnswers.includes(
                            answer,
                          )}
                          onChange={() =>
                            updateSettings((current) => {
                              current.cadence.enabledAnswers = toggleValue(
                                current.cadence.enabledAnswers,
                                answer,
                                defaultTheorySettings.cadence.enabledAnswers,
                              );
                              return current;
                            })
                          }
                        />
                        {answer}
                      </label>
                    ))}
                  </div>
                </details>
              )}

              {mode === "key-signature" && (
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={settings.keySignature.includeRelativeMinor}
                    onChange={(event) =>
                      updateSettings((current) => {
                        current.keySignature.includeRelativeMinor =
                          event.target.checked;
                        return current;
                      })
                    }
                  />
                  Include relative major/minor questions
                </label>
              )}
            </div>
          </details>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Staff question
          </p>
          <StaffChoice
            notes={question.staffNotes}
            clef={question.clef}
            keySignature={question.keySignature}
            timeSignature={question.timeSignature}
            width={staffSize.width}
            height={staffSize.height}
          />
        </div>

        {mode === "interval" ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-zinc-300">
                Interval number
                <select
                  value={intervalNumber}
                  onChange={(event) => updateIntervalNumber(event.target.value)}
                  disabled={answered}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
                >
                  {theoryOptionLists.intervalNumbers.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-zinc-300">
                Quality
                <select
                  value={intervalQuality}
                  onChange={(event) => setIntervalQuality(event.target.value)}
                  disabled={answered}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
                >
                  {intervalQualityOptions.map((quality) => (
                    <option key={quality} value={quality}>
                      {qualityLabel(quality)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={() => submitAnswer()}
              disabled={answered}
              className="mt-6 rounded-full bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Submit interval
            </button>
          </div>
        ) : mode === "pitch" && settings.pitch.answerMode === "choices" ? (
          <PitchClassChoiceButtons
            selected={selected}
            answered={answered}
            answer={question.answer}
            allowEnharmonics={settings.pitch.allowEnharmonics}
            onSelect={submitAnswer}
          />
        ) : mode === "pitch" && settings.pitch.answerMode === "keyboard" ? (
          <RangeKeyboard
            low={settings.range.low}
            high={settings.range.high}
            selected={selected}
            answered={answered}
            answer={question.answer}
            onSelect={submitAnswer}
          />
        ) : mode === "key-signature" ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm font-medium text-zinc-300">
                Key letter
                <select
                  value={keyRootAnswer}
                  onChange={(event) => setKeyRootAnswer(event.target.value)}
                  disabled={answered}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
                >
                  {["C", "D", "E", "F", "G", "A", "B"].map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-zinc-300">
                Accidental
                <select
                  value={keyAccidentalAnswer}
                  onChange={(event) =>
                    setKeyAccidentalAnswer(event.target.value)
                  }
                  disabled={answered}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
                >
                  <option value="">Natural</option>
                  <option value="#">Sharp</option>
                  <option value="b">Flat</option>
                </select>
              </label>

              <label className="text-sm font-medium text-zinc-300">
                Major / minor
                <select
                  value={keyModeAnswer}
                  onChange={(event) => setKeyModeAnswer(event.target.value)}
                  disabled={answered}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </label>
            </div>
            <button
              onClick={() => submitAnswer()}
              disabled={answered}
              className="mt-6 rounded-full bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Submit key signature
            </button>
          </div>
        ) : (
          <div className="mt-8">
            {mode === "chord" && settings.chord.includeInversions && (
              <label className="mb-4 block max-w-xs text-sm font-medium text-zinc-300">
                Inversion
                <select
                  value={chordInversionAnswer}
                  onChange={(event) =>
                    setChordInversionAnswer(event.target.value)
                  }
                  disabled={answered}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
                >
                  {theoryOptionLists.chordInversions.map((inversion) => (
                    <option key={inversion} value={inversion}>
                      {inversion}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {question.choices.map((choice) => {
                const submittedChoice =
                  mode === "chord" && settings.chord.includeInversions
                    ? formatChordAnswer(choice, chordInversionAnswer)
                    : choice;
                const chosen =
                  selected === submittedChoice || selected === choice;
                const correctChoice = answered && choice === question.answer;
                const wrongChoice = answered && chosen && !correctChoice;

                return (
                  <button
                    key={choice}
                    onClick={() => submitAnswer(submittedChoice)}
                    disabled={answered}
                    className={`rounded-2xl border p-4 text-left text-base font-medium transition ${
                      correctChoice
                        ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100"
                        : wrongChoice
                          ? "border-red-400/70 bg-red-500/15 text-red-100"
                          : "border-white/10 bg-zinc-950 hover:bg-white/[0.06]"
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {answered && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <p
              className={`text-lg font-semibold ${
                isCorrect ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {isCorrect ? "Correct." : `Not quite. Answer: ${expectedAnswer}`}
            </p>

            <p className="mt-3 leading-8 text-zinc-300">
              {question.explanation}
            </p>

            <button
              onClick={nextQuestion}
              className="mt-6 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
            >
              Next question
            </button>
          </div>
        )}
      </section>
    </div>
  );
}