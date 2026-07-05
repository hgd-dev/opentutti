"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Tone from "tone";
import { createClient } from "@/lib/supabase/client";
import {
  EarTrainingMode,
  EarTrainingQuestion,
  getRandomEarTrainingQuestion,
} from "@/lib/music/earTraining";
import {
  getRandomTheoryQuestion,
  TheoryMode,
  TheoryQuestion,
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

function generateAssignmentQuestions(assignment: Assignment): AssignmentQuestion[] {
  const questions: AssignmentQuestion[] = [];

  for (let i = 0; i < assignment.question_count; i++) {
    if (assignment.assignment_type === "ear_training") {
      questions.push({
        kind: "ear_training",
        question: getRandomEarTrainingQuestion(
          assignment.mode as EarTrainingMode
        ),
      });
    } else {
      questions.push({
        kind: "theory",
        question: getRandomTheoryQuestion(assignment.mode as TheoryMode),
      });
    }
  }

  return questions;
}

async function playEarQuestion(question: EarTrainingQuestion) {
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

function getAssignmentTypeLabel(type: string) {
  if (type === "ear_training") return "Ear Training";
  if (type === "theory") return "Theory Tester";
  return type;
}

function getModeLabel(mode: string) {
  const labels: Record<string, string> = {
    interval: "Intervals",
    chord: "Chords",
    cadence: "Cadences",
    notes: "Notes",
    keys: "Key Signatures",
    intervals: "Written Intervals",
    triads: "Triads",
    roman: "Roman Numerals",
    rhythm: "Rhythm",
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
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const rawQuestion = currentQuestion?.question;
  const isCorrect = selected === rawQuestion?.answer;

  const correctCount = useMemo(
    () => answerRecords.filter((record) => record.correct).length,
    [answerRecords]
  );

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
        answer: rawQuestion.answer,
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
      }
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
  }

  function restartAssignment() {
    if (!assignment) return;

    setQuestions(generateAssignmentQuestions(assignment));
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
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
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-violet-500 px-6 py-3 font-medium text-white hover:bg-violet-400"
        >
          Log in
        </Link>
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
          This assignment could not be loaded. It may not exist or you may not
          have access to it.
        </p>
        {message && (
          <p className="mt-4 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-yellow-100">
            {message}
          </p>
        )}
      </section>
    );
  }

  if (finished) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-16">
        <p className="text-sm font-medium text-violet-300">Assignment complete</p>
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
          </div>

          {currentQuestion.kind === "ear_training" && (
            <button
              onClick={() => playEarQuestion(currentQuestion.question)}
              className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
            >
              Play sound
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {rawQuestion.choices.map((choice) => {
            const chosen = selected === choice;
            const correctChoice = answered && choice === rawQuestion.answer;
            const wrongChoice = answered && chosen && choice !== rawQuestion.answer;

            return (
              <button
                key={choice}
                onClick={() => chooseAnswer(choice)}
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
              {isCorrect ? "Correct." : `Not quite. Answer: ${rawQuestion.answer}`}
            </p>

            <p className="mt-3 leading-8 text-zinc-300">
              {rawQuestion.explanation}
            </p>

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

      <div className="mt-6 rounded-full border border-white/10 bg-white/[0.03] p-2">
        <div
          className="h-2 rounded-full bg-violet-500 transition-all"
          style={{
            width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>
    </section>
  );
}