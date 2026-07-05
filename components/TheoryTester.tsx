"use client";

import { useMemo, useState } from "react";
import {
  getRandomTheoryQuestion,
  TheoryMode,
  TheoryQuestion,
} from "@/lib/music/theoryTraining";

const modes: { value: TheoryMode; label: string; description: string }[] = [
  {
    value: "notes",
    label: "Notes",
    description: "Treble and bass clef note-name basics.",
  },
  {
    value: "keys",
    label: "Key Signatures",
    description: "Major keys, sharps, flats, and circle of fifths.",
  },
  {
    value: "intervals",
    label: "Intervals",
    description: "Written interval identification.",
  },
  {
    value: "triads",
    label: "Triads",
    description: "Major, minor, diminished, and augmented triads.",
  },
  {
    value: "roman",
    label: "Roman Numerals",
    description: "Basic harmonic function in major keys.",
  },
  {
    value: "rhythm",
    label: "Rhythm",
    description: "Note values, beats, and simple meter.",
  },
];

export default function TheoryTester() {
  const [mode, setMode] = useState<TheoryMode>("notes");
  const [question, setQuestion] = useState<TheoryQuestion>(() =>
    getRandomTheoryQuestion("notes")
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

  function changeMode(nextMode: TheoryMode) {
    setMode(nextMode);
    setQuestion(getRandomTheoryQuestion(nextMode));
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
    setQuestion(getRandomTheoryQuestion(mode));
    setSelected(null);
    setAnswered(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold">Choose a topic</h2>

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
        <div>
          <p className="text-sm font-medium text-violet-300">
            {mode.toUpperCase()} THEORY
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {question.prompt}
          </h2>
          <p className="mt-3 text-zinc-400">
            Choose the best answer, then review the explanation.
          </p>
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