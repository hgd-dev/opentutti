"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as Tone from "tone";
import StaffChoice from "@/components/StaffChoice";
import {
  EarClef,
  EarTrainingMode,
  EarTrainingQuestion,
  EarTrainingSettings,
  defaultEarTrainingSettings,
  earTrainingOptionLists,
  getIntervalStaffNotesFromSelection,
  getRandomEarTrainingQuestion,
} from "@/lib/music/earTraining";

type DrillStats = {
  attempted: number;
  correct: number;
};

type SessionRecord = {
  id: string;
  mode: EarTrainingMode;
  prompt: string;
  answer: string;
  selected: string;
  correct: boolean;
  explanation: string;
  playbackStyle: string;
  title: string;
};

type SessionScreen = "practice" | "review" | "ended";
type PitchSubmode = "perfect" | "reference";

const modes: { value: EarTrainingMode; label: string; description: string }[] =
  [
    {
      value: "pitch",
      label: "Pitch",
      description:
        "Identify single pitches or compare notes against a reference pitch.",
    },
    {
      value: "interval",
      label: "Intervals",
      description:
        "Identify ascending, descending, and harmonic intervals from unison through octave.",
    },
    {
      value: "scale",
      label: "Scales",
      description:
        "Identify major, minor, modal, pentatonic, blues, chromatic, and whole tone scales.",
    },
    {
      value: "chord",
      label: "Chords",
      description:
        "Identify triads, sevenths, suspended chords, and sixth chords.",
    },
    {
      value: "cadence",
      label: "Cadences",
      description: "Identify authentic, half, plagal, and deceptive cadences.",
    },
  ];

const chromaticChoices = [
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

const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];

const blackKeys = [
  { note: "C#", left: "10.5%" },
  { note: "D#", left: "24.5%" },
  { note: "F#", left: "53%" },
  { note: "G#", left: "67%" },
  { note: "A#", left: "81%" },
];

const intervalNumbers = [
  { value: "1", label: "Unison / 1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
  { value: "6", label: "6th" },
  { value: "7", label: "7th" },
  { value: "8", label: "Octave / 8th" },
];

const intervalQualities = [
  { value: "diminished", label: "Diminished" },
  { value: "minor", label: "Minor" },
  { value: "perfect", label: "Perfect" },
  { value: "major", label: "Major" },
  { value: "augmented", label: "Augmented" },
];

const intervalQualityValuesByNumber: Record<string, string[]> = {
  "1": ["perfect"],
  "2": ["diminished", "minor", "major", "augmented"],
  "3": ["diminished", "minor", "major", "augmented"],
  "4": ["diminished", "perfect", "augmented"],
  "5": ["diminished", "perfect", "augmented"],
  "6": ["diminished", "minor", "major", "augmented"],
  "7": ["diminished", "minor", "major", "augmented"],
  "8": ["diminished", "perfect", "augmented"],
};

function getValidIntervalQualities(intervalNumber: string) {
  const validValues = intervalQualityValuesByNumber[intervalNumber] ?? [
    "perfect",
  ];
  return intervalQualities.filter((item) => validValues.includes(item.value));
}

const emptyStats: Record<EarTrainingMode, DrillStats> = {
  pitch: { attempted: 0, correct: 0 },
  keyboard: { attempted: 0, correct: 0 },
  interval: { attempted: 0, correct: 0 },
  scale: { attempted: 0, correct: 0 },
  chord: { attempted: 0, correct: 0 },
  cadence: { attempted: 0, correct: 0 },
};

function getModeLabel(mode: EarTrainingMode) {
  return modes.find((item) => item.value === mode)?.label ?? mode;
}

function getAccuracy(correct: number, attempted: number) {
  if (attempted === 0) return 0;
  return Math.round((correct / attempted) * 100);
}

function selectionToIntervalAnswer(quality: string, number: string) {
  const numberLabels: Record<string, string> = {
    "1": "Unison",
    "2": "2nd",
    "3": "3rd",
    "4": "4th",
    "5": "5th",
    "6": "6th",
    "7": "7th",
    "8": "Octave",
  };

  if (number === "1" && quality === "perfect") return "Unison";
  if (number === "4" && quality === "augmented") return "Tritone";
  if (number === "5" && quality === "diminished") return "Tritone";

  const intervalNumber = numberLabels[number] ?? number;
  const qualityLabel =
    intervalQualities.find((item) => item.value === quality)?.label ?? quality;

  return `${qualityLabel} ${intervalNumber}`;
}

function getPlaybackSpacing(question: EarTrainingQuestion) {
  if (question.playbackStyle === "progression") return 1.1;
  if (question.playbackStyle === "single") return 0;
  if (question.playbackStyle === "reference") return 0.9;
  if (question.playbackStyle === "scale-ascending") return 0.42;
  if (question.playbackStyle === "scale-descending") return 0.42;
  if (question.playbackStyle === "arpeggiated") return 0.55;
  return 0.85;
}

async function playQuestion(question: EarTrainingQuestion) {
  await Tone.start();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.45,
      release: 0.7,
    },
  }).toDestination();

  const now = Tone.now();
  const spacing = getPlaybackSpacing(question);

  question.notes.forEach((noteGroup, index) => {
    const duration =
      question.playbackStyle === "progression"
        ? "2n"
        : question.playbackStyle === "blocked"
          ? "2n"
          : question.playbackStyle === "single"
            ? "2n"
            : "4n";

    synth.triggerAttackRelease(noteGroup, duration, now + index * spacing);
  });

  setTimeout(
    () => {
      synth.dispose();
    },
    Math.max(1800, question.notes.length * 900 + 1400),
  );
}

function getQuestionRoot(question: EarTrainingQuestion) {
  if (question.rootNote) return question.rootNote;

  if (question.playbackStyle === "melodic-descending") {
    return question.notes[1]?.[0] ?? question.notes[0]?.[0] ?? "C4";
  }

  return question.notes[0]?.[0] ?? "C4";
}

function PianoKeyboard({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (note: string) => void;
}) {
  return (
    <div className="relative h-40 w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <div className="relative flex h-full">
        {whiteKeys.map((note) => (
          <button
            key={note}
            onClick={() => onSelect(note)}
            className={`flex flex-1 items-end justify-center rounded-b-xl border border-zinc-300 bg-white pb-3 text-sm font-semibold text-zinc-950 transition ${
              selected === note ? "ring-4 ring-violet-400" : ""
            }`}
          >
            {note}
          </button>
        ))}

        {blackKeys.map((key) => (
          <button
            key={key.note}
            onClick={() => onSelect(key.note)}
            className={`absolute top-0 z-10 flex h-[88px] w-[9%] items-end justify-center rounded-b-lg bg-zinc-950 pb-2 text-xs font-semibold text-white shadow-lg transition ${
              selected === key.note ? "ring-4 ring-violet-400" : ""
            }`}
            style={{ left: key.left }}
          >
            {key.note}
          </button>
        ))}
      </div>
    </div>
  );
}

function getAdvice(records: SessionRecord[]) {
  if (records.length === 0) {
    return ["Complete at least a few questions before reviewing target areas."];
  }

  const missed = records.filter((record) => !record.correct);

  if (missed.length === 0) {
    return [
      "Excellent accuracy. Try increasing the range or adding more exercise types.",
      "Answer from first impression more often to build faster recognition.",
    ];
  }

  const missedByMode = modes
    .map((mode) => {
      const attempted = records.filter((record) => record.mode === mode.value);
      const wrong = attempted.filter((record) => !record.correct);

      return {
        label: mode.label,
        attempted: attempted.length,
        wrong: wrong.length,
      };
    })
    .filter((item) => item.attempted > 0)
    .sort((a, b) => b.wrong / b.attempted - a.wrong / a.attempted);

  const weakest = missedByMode[0];

  const advice = [
    `Your main target area is ${weakest.label}. Isolate that drill before mixing it with other modes.`,
  ];

  if (records.some((record) => record.mode === "pitch" && !record.correct)) {
    advice.push(
      "For Pitch, compare neighboring notes slowly. In Pitch Reference, focus on the distance from the reference before naming the note.",
    );
  }

  if (records.some((record) => record.mode === "interval" && !record.correct)) {
    advice.push(
      "For intervals, first decide whether the distance feels small, medium, or wide, then choose quality and number.",
    );
  }

  if (records.some((record) => record.mode === "scale" && !record.correct)) {
    advice.push(
      "For scales, listen for signature color notes: raised 4 for Lydian, lowered 2 for Phrygian, lowered 7 for Mixolydian.",
    );
  }

  if (records.some((record) => record.mode === "chord" && !record.correct)) {
    advice.push(
      "For chords, first separate triads from sevenths, then listen for major/minor color and tension level.",
    );
  }

  return advice;
}

export default function EarTrainingGym() {
  const [screen, setScreen] = useState<SessionScreen>("practice");
  const [mode, setMode] = useState<EarTrainingMode>("pitch");
  const [pitchSubmode, setPitchSubmode] = useState<PitchSubmode>("perfect");
  const [pitchSelectionMode, setPitchSelectionMode] = useState<
    "choice" | "keyboard"
  >("choice");

  const [settings, setSettings] = useState<EarTrainingSettings>(
    defaultEarTrainingSettings,
  );

  const [question, setQuestion] = useState<EarTrainingQuestion>(() =>
    getRandomEarTrainingQuestion("pitch", defaultEarTrainingSettings),
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const [stats, setStats] =
    useState<Record<EarTrainingMode, DrillStats>>(emptyStats);
  const [records, setRecords] = useState<SessionRecord[]>([]);

  const [intervalQuality, setIntervalQuality] = useState("perfect");
  const [intervalNumber, setIntervalNumber] = useState("1");

  const totalCount = records.length;
  const correctCount = records.filter((record) => record.correct).length;
  const isCorrect = selected === question.answer;

  const accuracy = useMemo(
    () => getAccuracy(correctCount, totalCount),
    [correctCount, totalCount],
  );

  const advice = useMemo(() => getAdvice(records), [records]);

  const effectivePitchSelectionMode = pitchSelectionMode;

  function getCurrentSettings(
    nextPitchSubmode = pitchSubmode,
    nextPitchSelectionMode = pitchSelectionMode,
  ): EarTrainingSettings {
    return {
      ...settings,
      pitch: {
        ...settings.pitch,
        submode: nextPitchSubmode,
        answerMode: nextPitchSelectionMode,
      },
    };
  }

  function getNextQuestion(nextMode = mode) {
    return getRandomEarTrainingQuestion(nextMode, getCurrentSettings());
  }

  function changeMode(nextMode: EarTrainingMode) {
    setMode(nextMode);
    setQuestion(getRandomEarTrainingQuestion(nextMode, getCurrentSettings()));
    setSelected(null);
    setAnswered(false);
    setIntervalQuality("perfect");
    setIntervalNumber("1");
  }

  function changePitchSubmode(nextSubmode: PitchSubmode) {
    setPitchSubmode(nextSubmode);

    if (mode === "pitch") {
      setQuestion(
        getRandomEarTrainingQuestion(
          "pitch",
          getCurrentSettings(nextSubmode, pitchSelectionMode),
        ),
      );
      setSelected(null);
      setAnswered(false);
    }
  }

  function submitAnswer(choice: string) {
    if (answered) return;

    const correct = choice === question.answer;

    setSelected(choice);
    setAnswered(true);

    setStats((current) => ({
      ...current,
      [mode]: {
        attempted: current[mode].attempted + 1,
        correct: current[mode].correct + (correct ? 1 : 0),
      },
    }));

    setRecords((current) => [
      ...current,
      {
        id: `${question.id}-${Date.now()}`,
        mode,
        prompt: question.prompt,
        answer: question.answer,
        selected: choice,
        correct,
        explanation: question.explanation,
        playbackStyle: question.playbackStyle,
        title: question.title,
      },
    ]);
  }

  function submitIntervalAnswer() {
    const answer = selectionToIntervalAnswer(intervalQuality, intervalNumber);
    submitAnswer(answer);
  }

  function nextQuestion() {
    setQuestion(getNextQuestion(mode));
    setSelected(null);
    setAnswered(false);
    setIntervalQuality("perfect");
    setIntervalNumber("1");
  }

  function startNewSession() {
    setScreen("practice");
    setMode("pitch");
    setPitchSubmode("perfect");
    setPitchSelectionMode("choice");
    setSettings(defaultEarTrainingSettings);
    setQuestion(
      getRandomEarTrainingQuestion("pitch", defaultEarTrainingSettings),
    );
    setSelected(null);
    setAnswered(false);
    setStats(emptyStats);
    setRecords([]);
    setIntervalQuality("perfect");
    setIntervalNumber("1");
  }

  function toggleClef(clef: EarClef, checked: boolean) {
    const nextClefs = checked
      ? [...settings.clefs, clef]
      : settings.clefs.filter((item) => item !== clef);

    if (nextClefs.length === 0) return;

    setSettings((current) => ({
      ...current,
      clefs: nextClefs,
    }));
  }

  function toggleOption(
    group: "interval" | "scale" | "chord",
    value: string,
    checked: boolean,
  ) {
    setSettings((current) => {
      const currentList = current[group].enabledAnswers;
      const nextList = checked
        ? Array.from(new Set([...currentList, value]))
        : currentList.filter((item) => item !== value);

      if (nextList.length === 0) return current;

      return {
        ...current,
        [group]: {
          ...current[group],
          enabledAnswers: nextList,
        },
      };
    });
  }

  const rootNote = getQuestionRoot(question);

  const validIntervalQualities = useMemo(
    () => getValidIntervalQualities(intervalNumber),
    [intervalNumber],
  );

  const selectedIntervalStaffNotes =
    mode === "interval"
      ? getIntervalStaffNotesFromSelection(
          rootNote,
          intervalQuality,
          intervalNumber,
          question.playbackStyle,
        )
      : [];

  const exerciseSettingsPanel = (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <p className="text-sm font-medium text-white">Exercise Settings</p>

      {mode === "interval" && (
        <label className="mt-4 block">
          <span className="text-xs text-zinc-500">Playback type</span>
          <select
            value={settings.interval.playback}
            onChange={(event) => {
              const playback = event.target
                .value as EarTrainingSettings["interval"]["playback"];
              const nextSettings: EarTrainingSettings = {
                ...settings,
                interval: {
                  ...settings.interval,
                  playback,
                  ascending: playback === "ascending",
                  descending: playback === "descending",
                  harmonic: playback === "harmonic",
                },
              };

              setSettings(nextSettings);
              setQuestion(getRandomEarTrainingQuestion("interval", nextSettings));
              setSelected(null);
              setAnswered(false);
              setIntervalQuality("perfect");
              setIntervalNumber("1");
            }}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white"
          >
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
            <option value="harmonic">Harmonic</option>
          </select>
        </label>
      )}

      {mode === "scale" && (
        <label className="mt-4 block">
          <span className="text-xs text-zinc-500">Playback type</span>
          <select
            value={settings.scale.playback}
            onChange={(event) => {
              const playback = event.target
                .value as EarTrainingSettings["scale"]["playback"];
              const nextSettings: EarTrainingSettings = {
                ...settings,
                scale: {
                  ...settings.scale,
                  playback,
                  ascending: playback === "ascending",
                  descending: playback === "descending",
                },
              };

              setSettings(nextSettings);
              setQuestion(getRandomEarTrainingQuestion("scale", nextSettings));
              setSelected(null);
              setAnswered(false);
            }}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white"
          >
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
          </select>
        </label>
      )}

      {mode === "chord" && (
        <label className="mt-4 block">
          <span className="text-xs text-zinc-500">Playback type</span>
          <select
            value={settings.chord.playback}
            onChange={(event) => {
              const playback = event.target.value as "blocked" | "arpeggiated";
              const nextSettings: EarTrainingSettings = {
                ...settings,
                chord: {
                  ...settings.chord,
                  playback,
                },
              };

              setSettings(nextSettings);
              setQuestion(getRandomEarTrainingQuestion("chord", nextSettings));
              setSelected(null);
              setAnswered(false);
            }}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white"
          >
            <option value="blocked">Blocked</option>
            <option value="arpeggiated">Arpeggiated</option>
          </select>
        </label>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-zinc-300">
          Clefs and range
        </summary>

        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {earTrainingOptionLists.clefs.map((clef) => (
              <label
                key={clef}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={settings.clefs.includes(clef)}
                  onChange={(event) => toggleClef(clef, event.target.checked)}
                />
                {clef}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="text-xs text-zinc-500">Low</span>
              <select
                value={settings.range.low}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    range: {
                      ...current.range,
                      low: event.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white"
              >
                {earTrainingOptionLists.rangeNotes.map((note) => (
                  <option key={note}>{note}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs text-zinc-500">High</span>
              <select
                value={settings.range.high}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    range: {
                      ...current.range,
                      high: event.target.value,
                    },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white"
              >
                {earTrainingOptionLists.rangeNotes.map((note) => (
                  <option key={note}>{note}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </details>

      {mode === "interval" && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-zinc-300">
            Interval types
          </summary>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {earTrainingOptionLists.intervals.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={settings.interval.enabledAnswers.includes(item)}
                  onChange={(event) =>
                    toggleOption("interval", item, event.target.checked)
                  }
                />
                {item}
              </label>
            ))}
          </div>
        </details>
      )}

      {mode === "scale" && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-zinc-300">
            Scale types
          </summary>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {earTrainingOptionLists.scales.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={settings.scale.enabledAnswers.includes(item)}
                  onChange={(event) =>
                    toggleOption("scale", item, event.target.checked)
                  }
                />
                {item}
              </label>
            ))}
          </div>
        </details>
      )}

      {mode === "chord" && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-zinc-300">
            Chord types
          </summary>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {earTrainingOptionLists.chords.map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={settings.chord.enabledAnswers.includes(item)}
                  onChange={(event) =>
                    toggleOption("chord", item, event.target.checked)
                  }
                />
                {item}
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  );

  if (screen === "review" || screen === "ended") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">
              {screen === "ended" ? "SESSION COMPLETE" : "SESSION REVIEW"}
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">
              Ear Training Session Summary
            </h2>
            <p className="mt-3 text-zinc-400">
              {totalCount} questions completed · {correctCount} correct ·{" "}
              {accuracy}% accuracy
            </p>
          </div>

          {screen === "review" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setScreen("practice")}
                className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
              >
                Continue working
              </button>
              <button
                onClick={() => setScreen("ended")}
                className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
              >
                End session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/student"
                className="rounded-full border border-white/15 px-5 py-3 text-center font-medium text-white hover:bg-white/10"
              >
                Back to dashboard
              </Link>
              <button
                onClick={startNewSession}
                className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
              >
                New session
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {modes.map((item) => {
            const drill = stats[item.value];
            const drillAccuracy = getAccuracy(drill.correct, drill.attempted);

            return (
              <div
                key={item.value}
                className="rounded-3xl border border-white/10 bg-zinc-950 p-5"
              >
                <p className="text-sm text-zinc-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {drill.correct}/{drill.attempted}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {drillAccuracy}% accuracy
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <h3 className="text-2xl font-semibold">Question review</h3>

            {records.length === 0 ? (
              <p className="mt-4 text-zinc-400">No questions completed yet.</p>
            ) : (
              <div className="mt-5 max-h-[480px] space-y-3 overflow-y-auto pr-2">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-zinc-500">
                        Question {index + 1} · {getModeLabel(record.mode)}
                      </p>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${
                          record.correct
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                            : "border-red-400/40 bg-red-500/10 text-red-200"
                        }`}
                      >
                        {record.correct ? "Correct" : "Missed"}
                      </span>
                    </div>

                    <p className="mt-2 font-medium text-white">
                      {record.prompt}
                    </p>

                    <p className="mt-2 text-sm text-zinc-300">
                      Your answer:{" "}
                      <span
                        className={
                          record.correct ? "text-emerald-300" : "text-red-300"
                        }
                      >
                        {record.selected}
                      </span>
                    </p>

                    {!record.correct && (
                      <p className="mt-1 text-sm text-zinc-300">
                        Correct answer:{" "}
                        <span className="text-emerald-300">
                          {record.answer}
                        </span>
                      </p>
                    )}

                    {!record.correct && (
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {record.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <h3 className="text-2xl font-semibold">Target areas</h3>

            <div className="mt-5 space-y-3">
              {advice.map((item) => (
                <p
                  key={item}
                  className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-50/90"
                >
                  {item}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-violet-300">PRACTICE TOOL</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Ear Training Gym
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Choose a drill, adjust the settings, listen, and review the answer
            after each response.
          </p>
        </div>

        <div className="w-full md:max-w-xl">{exerciseSettingsPanel}</div>
      </div>

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

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {modes.map((item) => {
                const drill = stats[item.value];

                return (
                  <div
                    key={item.value}
                    className="flex items-center justify-between text-xs text-zinc-400"
                  >
                    <span>{item.label}</span>
                    <span>
                      {drill.correct}/{drill.attempted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setScreen("review")}
            className="mt-5 w-full rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white hover:bg-white/10"
          >
            Review and end session
          </button>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
              <div className="min-w-0 md:w-[52%]">
                <p className="text-sm font-medium text-violet-300">
                  {mode === "pitch"
                    ? "PITCH"
                    : `${mode.toUpperCase()} TRAINING`}
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  {question.prompt}
                </h2>
              </div>

              <div className="min-w-0 md:flex-1">
                <p className="text-sm leading-6 text-zinc-400">
                  Listen carefully, then enter the best answer.
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Playback: {question.playbackStyle.replaceAll("-", " ")}
                </p>
              </div>
            </div>

            <button
              onClick={() => playQuestion(question)}
              className="shrink-0 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
            >
              Play sound
            </button>
          </div>

          {mode === "pitch" && (
            <div className="mt-5">
              {mode === "pitch" && (
                <div className="mb-5 flex flex-col gap-4 lg:flex-row">
                  <label className="block max-w-xs">
                    <span className="text-sm text-zinc-400">Pitch mode</span>
                    <select
                      value={pitchSubmode}
                      onChange={(event) =>
                        changePitchSubmode(event.target.value as PitchSubmode)
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                    >
                      <option value="perfect">Pitch Perfect</option>
                      <option value="reference">Pitch Reference (C)</option>
                    </select>
                  </label>

                  <label className="block max-w-xs">
                    <span className="text-sm text-zinc-400">
                      Selection type
                    </span>
                    <select
                      value={pitchSelectionMode}
                      onChange={(event) => {
                        const value = event.target.value as
                          "choice" | "keyboard";
                        setPitchSelectionMode(value);
                        setSettings((current) => ({
                          ...current,
                          pitch: {
                            ...current.pitch,
                            answerMode: value,
                          },
                        }));
                      }}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                    >
                      <option value="choice">Choice selection</option>
                      <option value="keyboard">Keyboard selection</option>
                    </select>
                  </label>
                </div>
              )}

              {effectivePitchSelectionMode === "choice" ? (
                <div className="flex flex-wrap gap-2">
                  {chromaticChoices.map((choice) => {
                    const chosen = selected === choice;
                    const correctChoice =
                      answered && choice === question.answer;
                    const wrongChoice =
                      answered && chosen && choice !== question.answer;

                    return (
                      <button
                        key={choice}
                        onClick={() => submitAnswer(choice)}
                        className={`rounded-2xl border px-4 py-3 text-base font-semibold transition ${
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
              ) : (
                <PianoKeyboard selected={selected} onSelect={submitAnswer} />
              )}
            </div>
          )}

          {mode === "interval" && (
            <div className="mt-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="text-sm text-zinc-400">
                        Interval number
                      </span>
                      <select
                        value={intervalNumber}
                        onChange={(event) => {
                          const nextNumber = event.target.value;
                          const nextQualities =
                            getValidIntervalQualities(nextNumber);

                          setIntervalNumber(nextNumber);

                          if (
                            !nextQualities.some(
                              (item) => item.value === intervalQuality,
                            )
                          ) {
                            setIntervalQuality(
                              nextQualities[0]?.value ?? "perfect",
                            );
                          }
                        }}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                      >
                        {intervalNumbers.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="text-sm text-zinc-400">Quality</span>
                      <select
                        value={intervalQuality}
                        onChange={(event) =>
                          setIntervalQuality(event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                      >
                        {validIntervalQualities.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <button
                    onClick={submitIntervalAnswer}
                    disabled={answered}
                    className="mt-5 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
                  >
                    Submit interval
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4">
                  <p className="mb-3 text-sm text-zinc-400">Your response</p>
                  <StaffChoice
                    notes={selectedIntervalStaffNotes}
                    clef={question.clef ?? "treble"}
                    width={250}
                    height={170}
                  />
                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Preview follows the current question direction:{" "}
                    {question.playbackStyle === "harmonic"
                      ? "harmonic"
                      : question.playbackStyle === "melodic-descending"
                        ? "descending"
                        : "ascending"}
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {(mode === "scale" || mode === "chord" || mode === "cadence") && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {question.choices.map((choice) => {
                const chosen = selected === choice;
                const correctChoice = answered && choice === question.answer;
                const wrongChoice =
                  answered && chosen && choice !== question.answer;

                return (
                  <button
                    key={choice}
                    onClick={() => submitAnswer(choice)}
                    className={`rounded-2xl border p-5 text-left text-lg font-medium transition ${
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
          )}

          {answered && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5">
              <p
                className={`text-lg font-semibold ${
                  isCorrect ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {isCorrect
                  ? "Correct."
                  : `Not quite. Answer: ${question.answer}`}
              </p>

              <p className="mt-3 leading-8 text-zinc-300">
                {question.explanation}
              </p>

              {mode === "interval" && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-3 text-sm text-zinc-400">Your response</p>
                    <StaffChoice
                      notes={selectedIntervalStaffNotes}
                      clef={question.clef ?? "treble"}
                      width={300}
                      height={170}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-3 text-sm text-zinc-400">Correct answer</p>
                    <StaffChoice
                      notes={question.staffAnswerNotes ?? []}
                      clef={question.clef ?? "treble"}
                      width={300}
                      height={170}
                    />
                  </div>
                </div>
              )}

              {mode !== "interval" &&
                question.staffAnswerNotes &&
                question.staffAnswerNotes.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="mb-3 text-sm text-zinc-400">Answer staff</p>
                    <StaffChoice
                      notes={question.staffAnswerNotes}
                      clef={question.clef ?? "treble"}
                      width={360}
                      height={150}
                    />
                  </div>
                )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => playQuestion(question)}
                  className="rounded-full border border-white/15 px-5 py-3 font-medium hover:bg-white/10"
                >
                  Replay
                </button>

                <button
                  onClick={nextQuestion}
                  className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
                >
                  Next question
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
