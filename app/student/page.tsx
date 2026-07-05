"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Assignment, Attempt, ClassRecord, Profile } from "@/types/database";

type MembershipWithClass = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  classes: ClassRecord | null;
};

type AssignmentWithAttempt = Assignment & {
  attempt: Attempt | null;
  class_name: string;
};

export default function StudentPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<MembershipWithClass[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithAttempt[]>([]);
  const [joinCode, setJoinCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStudentData() {
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

    const { data: membershipData, error: membershipError } = await supabase
      .from("class_members")
      .select("id, class_id, student_id, joined_at, classes(*)")
      .eq("student_id", authData.user.id)
      .order("joined_at", { ascending: false });

    if (membershipError) {
      setMessage(membershipError.message);
      setLoading(false);
      return;
    }

    const normalizedMemberships: MembershipWithClass[] = (
      membershipData ?? []
    ).map((membership) => ({
      id: membership.id,
      class_id: membership.class_id,
      student_id: membership.student_id,
      joined_at: membership.joined_at,
      classes: Array.isArray(membership.classes)
        ? membership.classes[0] ?? null
        : membership.classes,
    }));

    setMemberships(normalizedMemberships);

    const classIds = normalizedMemberships.map((membership) => membership.class_id);

    if (classIds.length === 0) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("*")
      .in("class_id", classIds)
      .order("created_at", { ascending: false });

    if (assignmentError) {
      setMessage(assignmentError.message);
      setLoading(false);
      return;
    }

    const assignmentIds = (assignmentData ?? []).map(
      (assignment) => assignment.id
    );

    let attemptData: Attempt[] = [];

    if (assignmentIds.length > 0) {
      const { data: attempts, error: attemptError } = await supabase
        .from("attempts")
        .select("*")
        .eq("student_id", authData.user.id)
        .in("assignment_id", assignmentIds);

      if (attemptError) {
        setMessage(attemptError.message);
        setLoading(false);
        return;
      }

      attemptData = attempts ?? [];
    }

    const assignmentsWithAttempts: AssignmentWithAttempt[] = (
      assignmentData ?? []
    ).map((assignment) => {
      const matchingClass = normalizedMemberships.find(
        (membership) => membership.class_id === assignment.class_id
      );

      const matchingAttempt =
        attemptData.find((attempt) => attempt.assignment_id === assignment.id) ??
        null;

      return {
        ...assignment,
        class_name: matchingClass?.classes?.name ?? "Class",
        attempt: matchingAttempt,
      };
    });

    setAssignments(assignmentsWithAttempts);
    setLoading(false);
  }

  async function joinClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    setJoining(true);
    setMessage(null);

    const normalizedCode = joinCode.trim().toUpperCase();

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("join_code", normalizedCode)
      .single();

    if (classError || !classData) {
      setMessage("No class found with that join code.");
      setJoining(false);
      return;
    }

    const { error: memberError } = await supabase.from("class_members").insert({
      class_id: classData.id,
      student_id: profile.id,
    });

    if (memberError) {
      if (memberError.message.includes("duplicate")) {
        setMessage("You already joined this class.");
      } else {
        setMessage(memberError.message);
      }

      setJoining(false);
      return;
    }

    setJoinCode("");
    setMessage(`Joined ${classData.name}.`);
    await loadStudentData();
    setJoining(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
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

  useEffect(() => {
    loadStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-zinc-400">Loading student dashboard...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm font-medium text-violet-300">Dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Student Dashboard
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Please log in as a student to join classes and track your practice.
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
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Student access only
        </h1>
        <p className="mt-4 text-zinc-400">
          This dashboard is for student accounts. Your current account is a
          teacher account.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-300">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Student Dashboard
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            Welcome, {profile.display_name}. Join classes, complete assignments,
            and keep practicing.
          </p>
        </div>

        <button
          onClick={signOut}
          className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
        >
          Sign out
        </button>
      </div>

      {message && (
        <div className="mt-8 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
          {message}
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <form
            onSubmit={joinClass}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="text-lg font-semibold">Join a class</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Enter the code your teacher gave you.
            </p>

            <label className="mt-5 block">
              <span className="text-sm text-zinc-400">Class code</span>
              <input
                required
                value={joinCode}
                onChange={(event) =>
                  setJoinCode(event.target.value.toUpperCase())
                }
                placeholder="ABC123"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white uppercase tracking-widest outline-none focus:border-violet-400"
              />
            </label>

            <button
              type="submit"
              disabled={joining}
              className="mt-5 w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join class"}
            </button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">My classes</h2>

            {memberships.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                You have not joined any classes yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="rounded-2xl border border-white/10 bg-zinc-950 p-4"
                  >
                    <p className="font-medium text-white">
                      {membership.classes?.name ?? "Class"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Joined{" "}
                      {new Date(membership.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <Link
              href="/practice/ear-training"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06]"
            >
              <h2 className="text-lg font-semibold">Free Ear Training</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Practice intervals, chords, and cadences outside assignments.
              </p>
            </Link>

            <Link
              href="/practice/theory"
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06]"
            >
              <h2 className="text-lg font-semibold">Free Theory Practice</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Review notes, keys, triads, Roman numerals, and rhythm.
              </p>
            </Link>
          </div>
        </aside>

        <main className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Assigned work</h2>

          {assignments.length === 0 ? (
            <p className="mt-4 leading-7 text-zinc-400">
              You do not have any assignments yet. Once your teacher assigns
              practice, it will appear here.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-3xl border border-white/10 bg-zinc-950 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {assignment.class_name} ·{" "}
                        {getAssignmentTypeLabel(assignment.assignment_type)} ·{" "}
                        {getModeLabel(assignment.mode)} ·{" "}
                        {assignment.question_count} questions
                      </p>

                      {assignment.due_date && (
                        <p className="mt-1 text-sm text-zinc-500">
                          Due{" "}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      )}

                      {assignment.attempt ? (
                        <p className="mt-3 text-sm font-medium text-emerald-300">
                          Completed: {assignment.attempt.correct_count}/
                          {assignment.attempt.total_questions} (
                          {Math.round(Number(assignment.attempt.score))}%)
                        </p>
                      ) : (
                        <p className="mt-3 text-sm font-medium text-yellow-200">
                          Not completed yet
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="rounded-full bg-violet-500 px-5 py-3 text-center font-medium text-white hover:bg-violet-400"
                    >
                      {assignment.attempt ? "Retake" : "Start"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}