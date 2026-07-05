"use client";

import { useMemo, useState } from "react";
import * as Tone from "tone";
import {
  EarTrainingMode,
  EarTrainingQuestion,
  getRandomEarTrainingQuestion,
} from "@/lib/music/earTraining";

const modes: { value: EarTrainingMode; label: string; description: string }[] = [
  {
    value: "interval",
    label: "Intervals",
    description: "Melodic interval recognition.",
  },
  {
    value: "chord",
    label: "Chords",
    description: "Major, minor, diminished, and augmented triads.",
  },
  {
    value: "cadence",
    label: "Cadences",
    description: "Authentic, half, plagal, and deceptive cadences.",
  },
];

async function playQuestion(question: EarTrainingQuestion) {
  await Tone.start();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.4,
      release: 0.7,
    },
  }).toDestination();

  const now = Tone.now();

  question.notes.forEach((noteGroup, index) => {
    synth.triggerAttackRelease(noteGroup, "2n", now + index * 0.9);
  });

  setTimeout(() => {
    synth.dispose();
  }, question.notes.length * 1000 + 1500);
}

export default function EarTrainingGym() {
  const [mode, setMode] = useState<EarTrainingMode>("interval");
  const [question, setQuestion] = useState<EarTrainingQuestion>(() =>
    getRandomEarTrainingQuestion("interval")
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const isCorrect = selected === question.answer;

  const accuracy = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((correctCount / totalCount) * 100);
  }, [correctCount, totalCount]);

  function changeMode(nextMode: EarTrainingMode) {
    setMode(nextMode);
    setQuestion(getRandomEarTrainingQuestion(nextMode));
    setSelected(null);
    setAnswered(false);
  }

  function submitAnswer(choice: string) {
    if (answered) return;

    setSelected(choice);
    setAnswered(true);
    setTotalCount((current) => current + 1);

    if (choice === question.answer) {
      setCorrectCount((current) => current + 1);
    }
  }

  function nextQuestion() {
    setQuestion(getRandomEarTrainingQuestion(mode));
    setSelected(null);
    setAnswered(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
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
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Session score</p>
          <p className="mt-2 text-3xl font-semibold">
            {correctCount}/{totalCount}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{accuracy}% accuracy</p>
        </div>
      </aside>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">
              {mode.toUpperCase()} TRAINING
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {question.prompt}
            </h2>
            <p className="mt-3 text-zinc-400">
              Listen carefully, then choose the best answer.
            </p>
          </div>

          <button
            onClick={() => playQuestion(question)}
            className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
          >
            Play sound
          </button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {question.choices.map((choice) => {
            const chosen = selected === choice;
            const correctChoice = answered && choice === question.answer;
            const wrongChoice = answered && chosen && choice !== question.answer;

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

        {answered && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <p
              className={`text-lg font-semibold ${
                isCorrect ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {isCorrect ? "Correct." : `Not quite. Answer: ${question.answer}`}
            </p>

            <p className="mt-3 leading-8 text-zinc-300">
              {question.explanation}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
  );
}