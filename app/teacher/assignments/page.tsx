"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Assignment,
  AssignmentType,
  Attempt,
  ClassRecord,
  Profile,
} from "@/types/database";

const assignmentTypes: {
  value: AssignmentType;
  label: string;
  description: string;
}[] = [
  {
    value: "ear_training",
    label: "Ear Training",
    description: "Intervals, chords, and cadences.",
  },
  {
    value: "theory",
    label: "Theory Tester",
    description: "Notes, keys, intervals, triads, Roman numerals, and rhythm.",
  },
];

const modesByType: Record<AssignmentType, { value: string; label: string }[]> = {
  ear_training: [
    { value: "pitch", label: "Pitch" },
    { value: "interval", label: "Intervals" },
    { value: "scale", label: "Scales" },
    { value: "chord", label: "Chords" },
    { value: "cadence", label: "Cadences" },
  ],
  theory: [
    { value: "notes", label: "Notes" },
    { value: "keys", label: "Key Signatures" },
    { value: "intervals", label: "Written Intervals" },
    { value: "triads", label: "Triads" },
    { value: "roman", label: "Roman Numerals" },
    { value: "rhythm", label: "Rhythm" },
  ],
};

type AssignmentWithClass = Assignment & {
  classes?: ClassRecord | ClassRecord[] | null;
};

type RosterResult = {
  student: Profile;
  attempt: Attempt | null;
};

export default function TeacherAssignmentsPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithClass[]>([]);

  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentWithClass | null>(null);
  const [rosterResults, setRosterResults] = useState<RosterResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [assignmentType, setAssignmentType] =
    useState<AssignmentType>("ear_training");
  const [mode, setMode] = useState("interval");
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const modeOptions = useMemo(
    () => modesByType[assignmentType],
    [assignmentType]
  );

  function getClassName(assignment: AssignmentWithClass) {
    const classData = Array.isArray(assignment.classes)
      ? assignment.classes[0]
      : assignment.classes;

    return classData?.name ?? "Class";
  }

  function getAssignmentTypeLabel(type: AssignmentType) {
    return assignmentTypes.find((item) => item.value === type)?.label ?? type;
  }

  function getModeLabel(type: AssignmentType, assignmentMode: string) {
    return (
      modesByType[type].find((item) => item.value === assignmentMode)?.label ??
      assignmentMode
    );
  }

  function getAverageScore(results: RosterResult[]) {
    const completed = results.filter((result) => result.attempt);

    if (completed.length === 0) return null;

    const total = completed.reduce(
      (sum, result) => sum + Number(result.attempt?.score ?? 0),
      0
    );

    return Math.round(total / completed.length);
  }

  async function loadTeacherData() {
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

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (classError) {
      setMessage(classError.message);
      setLoading(false);
      return;
    }

    setClasses(classData ?? []);

    if (classData && classData.length > 0) {
      setClassId((current) => current || classData[0].id);
    }

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("*, classes(*)")
      .eq("teacher_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (assignmentError) {
      setMessage(assignmentError.message);
      setLoading(false);
      return;
    }

    const loadedAssignments = (assignmentData ?? []) as unknown as AssignmentWithClass[];
    setAssignments(loadedAssignments);

    if (loadedAssignments.length > 0) {
      setSelectedAssignment(loadedAssignments[0]);
      await loadAssignmentResults(loadedAssignments[0]);
    }

    setLoading(false);
  }

  async function loadAssignmentResults(assignment: AssignmentWithClass) {
    setLoadingResults(true);
    setMessage(null);
    setSelectedAssignment(assignment);

    const { data: membersData, error: membersError } = await supabase
      .from("class_members")
      .select("id, class_id, student_id, joined_at")
      .eq("class_id", assignment.class_id)
      .order("joined_at", { ascending: true });

    if (membersError) {
      setMessage(membersError.message);
      setLoadingResults(false);
      return;
    }

    const studentIds = (membersData ?? []).map((member) => member.student_id);

    if (studentIds.length === 0) {
      setRosterResults([]);
      setLoadingResults(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds)
      .order("display_name", { ascending: true });

    if (profilesError) {
      setMessage(profilesError.message);
      setLoadingResults(false);
      return;
    }

    const { data: attemptsData, error: attemptsError } = await supabase
      .from("attempts")
      .select("*")
      .eq("assignment_id", assignment.id)
      .in("student_id", studentIds);

    if (attemptsError) {
      setMessage(attemptsError.message);
      setLoadingResults(false);
      return;
    }

    const results: RosterResult[] = (profilesData ?? []).map((student) => ({
      student,
      attempt:
        (attemptsData ?? []).find(
          (attempt) => attempt.student_id === student.id
        ) ?? null,
    }));

    setRosterResults(results);
    setLoadingResults(false);
  }

  async function createAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    if (!classId) {
      setMessage("Create a class before making assignments.");
      return;
    }

    setCreating(true);
    setMessage(null);

    const finalTitle =
      title.trim() ||
      `${getAssignmentTypeLabel(assignmentType)}: ${getModeLabel(
        assignmentType,
        mode
      )}`;

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        class_id: classId,
        teacher_id: profile.id,
        title: finalTitle,
        assignment_type: assignmentType,
        mode,
        question_count: questionCount,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      })
      .select("*, classes(*)")
      .single();

    if (error) {
      setMessage(error.message);
      setCreating(false);
      return;
    }

    const newAssignment = data as unknown as AssignmentWithClass;

    setAssignments((current) => [newAssignment, ...current]);
    setSelectedAssignment(newAssignment);
    setTitle("");
    setDueDate("");
    setMessage("Assignment created.");
    setCreating(false);

    await loadAssignmentResults(newAssignment);
  }

  function handleTypeChange(nextType: AssignmentType) {
    setAssignmentType(nextType);
    setMode(modesByType[nextType][0].value);
  }

  useEffect(() => {
    loadTeacherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = rosterResults.filter((result) => result.attempt).length;
  const averageScore = getAverageScore(rosterResults);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-zinc-400">Loading assignments...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Log in needed</h1>
        <p className="mt-4 text-zinc-400">
          Please log in as a teacher to create assignments.
        </p>
      </section>
    );
  }

  if (profile.role !== "teacher") {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Teacher access only
        </h1>
        <p className="mt-4 text-zinc-400">
          This page is only available for teacher accounts.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-10">
        <p className="text-sm font-medium text-violet-300">Teacher</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Assignments
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Create practice sets and review student completion, scores, and
          progress for each class.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-6">
          <form
            onSubmit={createAssignment}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="text-lg font-semibold">Create assignment</h2>

            {classes.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
                You need to create a class first before assigning practice.
              </div>
            ) : (
              <>
                <label className="mt-5 block">
                  <span className="text-sm text-zinc-400">Class</span>
                  <select
                    required
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                  >
                    {classes.map((classRecord) => (
                      <option key={classRecord.id} value={classRecord.id}>
                        {classRecord.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="text-sm text-zinc-400">
                    Assignment title optional
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Interval Basics"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm text-zinc-400">
                    Assignment type
                  </span>
                  <select
                    value={assignmentType}
                    onChange={(event) =>
                      handleTypeChange(event.target.value as AssignmentType)
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                  >
                    {assignmentTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="text-sm text-zinc-400">Mode</span>
                  <select
                    value={mode}
                    onChange={(event) => setMode(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                  >
                    {modeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="text-sm text-zinc-400">
                    Number of questions
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={questionCount}
                    onChange={(event) =>
                      setQuestionCount(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm text-zinc-400">
                    Due date optional
                  </span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
                  />
                </label>

                <button
                  type="submit"
                  disabled={creating}
                  className="mt-5 w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create assignment"}
                </button>
              </>
            )}
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Assignments</h2>

            {assignments.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                No assignments yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => loadAssignmentResults(assignment)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedAssignment?.id === assignment.id
                        ? "border-violet-400/70 bg-violet-500/15"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="font-medium text-white">
                      {assignment.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {getClassName(assignment)} ·{" "}
                      {getAssignmentTypeLabel(assignment.assignment_type)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          {selectedAssignment ? (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-300">
                    RESULTS
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                    {selectedAssignment.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {getClassName(selectedAssignment)} ·{" "}
                    {getAssignmentTypeLabel(
                      selectedAssignment.assignment_type
                    )}{" "}
                    ·{" "}
                    {getModeLabel(
                      selectedAssignment.assignment_type,
                      selectedAssignment.mode
                    )}{" "}
                    · {selectedAssignment.question_count} questions
                  </p>
                </div>

                <button
                  onClick={() => loadAssignmentResults(selectedAssignment)}
                  className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
                >
                  Refresh results
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                  <p className="text-sm text-zinc-400">Completed</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {completedCount}/{rosterResults.length}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                  <p className="text-sm text-zinc-400">Average score</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {averageScore === null ? "—" : `${averageScore}%`}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                  <p className="text-sm text-zinc-400">Due date</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {selectedAssignment.due_date
                      ? new Date(
                          selectedAssignment.due_date
                        ).toLocaleDateString()
                      : "None"}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold">Student results</h3>

                {loadingResults ? (
                  <p className="mt-4 text-zinc-400">Loading results...</p>
                ) : rosterResults.length === 0 ? (
                  <p className="mt-4 leading-7 text-zinc-400">
                    No students are currently in this class.
                  </p>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-zinc-300">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rosterResults.map((result) => (
                          <tr
                            key={result.student.id}
                            className="border-t border-white/10 text-zinc-300"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-white">
                                  {result.student.display_name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {result.student.school_name ?? "No school"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {result.attempt ? (
                                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                                  Completed
                                </span>
                              ) : (
                                <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-100">
                                  Missing
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {result.attempt
                                ? `${result.attempt.correct_count}/${result.attempt.total_questions} (${Math.round(Number(result.attempt.score))}%)`
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {result.attempt
                                ? new Date(
                                    result.attempt.completed_at
                                  ).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <h2 className="text-2xl font-semibold">No assignment selected</h2>
              <p className="mt-3 text-zinc-400">
                Create or select an assignment to view results.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}