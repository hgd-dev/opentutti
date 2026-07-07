"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Tone from "tone";
import StaffChoice from "@/components/StaffChoice";
import { createClient } from "@/lib/supabase/client";
import {
  EarTrainingMode,
  EarTrainingQuestion,
  EarTrainingSettings,
  getRandomEarTrainingQuestion,
} from "@/lib/music/earTraining";
import {
  getRandomTheoryQuestion,
  TheoryMode,
  TheoryQuestion,
  TheorySettings,
} from "@/lib/music/theoryTraining";
import type { Assignment, Attempt, Profile } from "@/types/database";

type AssignmentQuestion =
  | {
      kind: "ear_training";
      question: EarTrainingQuestion;
    }
  | {
      kind: "theory";
      question: TheoryQuestion;
    };

type AnswerRecord = {
  prompt: string;
  selected: string;
  answer: string;
  correct: boolean;
};

function generateAssignmentQuestions(
  assignment: Assignment,
): AssignmentQuestion[] {
  const questions: AssignmentQuestion[] = [];

  for (let i = 0; i < assignment.question_count; i++) {
    if (assignment.assignment_type === "ear_training") {
      questions.push({
        kind: "ear_training",
        question: getRandomEarTrainingQuestion(
          assignment.mode as EarTrainingMode,
          (assignment.settings_json ?? undefined) as
            Partial<EarTrainingSettings> | undefined,
        ),
      });
    } else {
      questions.push({
        kind: "theory",
        question: getRandomTheoryQuestion(
          assignment.mode as TheoryMode,
          (assignment.settings_json ?? undefined) as TheorySettings | undefined,
        ),
      });
    }
  }

  return questions;
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

async function playEarQuestion(question: EarTrainingQuestion) {
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

function getAssignmentTypeLabel(type: string) {
  if (type === "ear_training") return "Ear Training";
  if (type === "theory") return "Theory Tester";
  return type;
}

function getModeLabel(mode: string) {
  const labels: Record<string, string> = {
    pitch: "Pitch",
    keyboard: "Keyboard",
    interval: "Intervals",
    scale: "Scales",
    chord: "Chords",
    cadence: "Cadences",
    "key-signature": "Key Signatures",
  };

  return labels[mode] ?? mode;
}

export default function AssignmentRunner({
  assignmentId,
}: {
  assignmentId: string;
}) {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingAttempt, setExistingAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [chordInversionAnswer, setChordInversionAnswer] =
    useState("Root position");
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const rawQuestion = currentQuestion?.question;
  const expectedAnswer = getExpectedAnswer();
  const isCorrect = selected === expectedAnswer;

  const correctCount = useMemo(
    () => answerRecords.filter((record) => record.correct).length,
    [answerRecords],
  );

  function formatChordAnswer(chord: string, inversion: string) {
    return `${chord} — ${inversion}`;
  }

  function requiresChordInversion() {
    return Boolean(
      rawQuestion &&
      rawQuestion.mode === "chord" &&
      rawQuestion.prompt.toLowerCase().includes("inversion") &&
      rawQuestion.chordInversion,
    );
  }

  function getExpectedAnswer() {
    if (rawQuestion && requiresChordInversion() && rawQuestion.chordInversion) {
      return formatChordAnswer(rawQuestion.answer, rawQuestion.chordInversion);
    }

    return rawQuestion?.answer ?? "";
  }

  const score = useMemo(() => {
    if (!assignment || assignment.question_count === 0) return 0;
    return Math.round((correctCount / assignment.question_count) * 100);
  }, [assignment, correctCount]);

  async function loadAssignment() {
    setLoading(true);
    setMessage(null);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (assignmentError) {
      setMessage(assignmentError.message);
      setLoading(false);
      return;
    }

    setAssignment(assignmentData);
    setQuestions(generateAssignmentQuestions(assignmentData));

    const { data: attemptData, error: attemptError } = await supabase
      .from("attempts")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("student_id", authData.user.id)
      .maybeSingle();

    if (attemptError) {
      setMessage(attemptError.message);
      setLoading(false);
      return;
    }

    setExistingAttempt(attemptData);
    setLoading(false);
  }

  function chooseAnswer(choice: string) {
    if (!rawQuestion || answered) return;

    setSelected(choice);
    setAnswered(true);

    setAnswerRecords((current) => [
      ...current,
      {
        prompt: rawQuestion.prompt,
        selected: choice,
        answer: getExpectedAnswer(),
        correct: choice === rawQuestion.answer,
      },
    ]);
  }

  async function saveAttempt() {
    if (!assignment || !profile) return;

    setSaving(true);
    setMessage(null);

    const totalQuestions = assignment.question_count;
    const finalCorrectCount = correctCount;
    const finalScore =
      totalQuestions === 0
        ? 0
        : Math.round((finalCorrectCount / totalQuestions) * 100);

    const { error } = await supabase.from("attempts").upsert(
      {
        assignment_id: assignment.id,
        student_id: profile.id,
        score: finalScore,
        correct_count: finalCorrectCount,
        total_questions: totalQuestions,
        details_json: {
          answers: answerRecords,
          assignment_type: assignment.assignment_type,
          mode: assignment.mode,
        },
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "assignment_id,student_id",
      },
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setFinished(true);
    setSaving(false);
  }

  async function nextQuestion() {
    if (!assignment) return;

    if (currentIndex + 1 >= questions.length) {
      await saveAttempt();
      return;
    }

    setCurrentIndex((current) => current + 1);
    setSelected(null);
    setAnswered(false);
    setChordInversionAnswer("Root position");
    setChordInversionAnswer("Root position");
  }

  function restartAssignment() {
    if (!assignment) return;

    setQuestions(generateAssignmentQuestions(assignment));
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setChordInversionAnswer("Root position");
    setChordInversionAnswer("Root position");
    setAnswerRecords([]);
    setFinished(false);
    setMessage(null);
  }

  useEffect(() => {
    loadAssignment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-zinc-400">Loading assignment...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Log in needed</h1>
        <p className="mt-4 text-zinc-400">
          Please log in as a student to complete this assignment.
        </p>
      </section>
    );
  }

  if (profile.role !== "student") {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Student access only
        </h1>
        <p className="mt-4 text-zinc-400">
          Teacher accounts cannot complete student assignments.
        </p>
      </section>
    );
  }

  if (!assignment || !rawQuestion) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Assignment unavailable
        </h1>
        <p className="mt-4 text-zinc-400">
          This assignment could not be loaded.
        </p>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-sm font-medium text-violet-300">
          Assignment complete
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {assignment.title}
        </h1>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-zinc-400">Final score</p>
          <p className="mt-2 text-6xl font-semibold text-white">{score}%</p>
          <p className="mt-4 text-lg text-zinc-300">
            You answered {correctCount} out of {assignment.question_count}{" "}
            correctly.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={restartAssignment}
              className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
            >
              Retake assignment
            </button>

            <Link
              href="/student"
              className="rounded-full bg-violet-500 px-5 py-3 text-center font-medium text-white hover:bg-violet-400"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const isEarTraining = currentQuestion.kind === "ear_training";

  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-violet-300">
          {getAssignmentTypeLabel(assignment.assignment_type)} ·{" "}
          {getModeLabel(assignment.mode)}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {assignment.title}
        </h1>
        <p className="mt-4 text-zinc-400">
          Question {currentIndex + 1} of {assignment.question_count}
        </p>

        {existingAttempt && (
          <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
            You previously completed this assignment with{" "}
            {existingAttempt.correct_count}/{existingAttempt.total_questions} (
            {Math.round(Number(existingAttempt.score))}%). Retaking will replace
            your saved score.
          </div>
        )}

        {message && (
          <div className="mt-5 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
            {message}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">
              QUESTION {currentIndex + 1}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {rawQuestion.prompt}
            </h2>
            <p className="mt-3 text-zinc-400">
              Choose the best answer. You will see an explanation after
              answering.
            </p>

            {isEarTraining && (
              <p className="mt-2 text-sm text-zinc-500">
                Playback:{" "}
                {currentQuestion.question.playbackStyle.replaceAll("-", " ")}
              </p>
            )}
          </div>

          {isEarTraining && (
            <button
              onClick={() => playEarQuestion(currentQuestion.question)}
              className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
            >
              Play sound
            </button>
          )}
        </div>

        {!isEarTraining && currentQuestion.kind === "theory" && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Staff question
            </p>
            <StaffChoice
              notes={currentQuestion.question.staffNotes}
              clef={currentQuestion.question.clef}
              keySignature={currentQuestion.question.keySignature}
              timeSignature={currentQuestion.question.timeSignature}
              width={currentQuestion.question.mode === "scale" ? 720 : 420}
              height={140}
            />
          </div>
        )}

        {requiresChordInversion() && (
          <label className="mt-8 block max-w-xs text-sm font-medium text-zinc-300">
            Inversion
            <select
              value={chordInversionAnswer}
              onChange={(event) => setChordInversionAnswer(event.target.value)}
              disabled={answered}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-lg text-white"
            >
              {[
                "Root position",
                "1st inversion",
                "2nd inversion",
                "3rd inversion",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {rawQuestion.choices.map((choice) => {
            const submittedChoice = requiresChordInversion()
              ? formatChordAnswer(choice, chordInversionAnswer)
              : choice;
            const chosen = selected === submittedChoice || selected === choice;
            const correctChoice = answered && choice === rawQuestion.answer;
            const wrongChoice = answered && chosen && !correctChoice;

            return (
              <button
                key={choice}
                onClick={() => chooseAnswer(submittedChoice)}
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
              {isCorrect ? "Correct." : `Not quite. Answer: ${expectedAnswer}`}
            </p>

            <p className="mt-3 leading-8 text-zinc-300">
              {rawQuestion.explanation}
            </p>

            {isEarTraining &&
              currentQuestion.question.staffAnswerNotes &&
              currentQuestion.question.staffAnswerNotes.length > 0 && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-3 text-sm text-zinc-400">Answer staff</p>
                  <StaffChoice
                    notes={currentQuestion.question.staffAnswerNotes}
                    clef={currentQuestion.question.clef ?? "treble"}
                    width={360}
                    height={150}
                  />
                </div>
              )}

            <button
              onClick={nextQuestion}
              disabled={saving}
              className="mt-6 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : currentIndex + 1 >= questions.length
                  ? "Finish assignment"
                  : "Next question"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
