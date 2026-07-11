"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  Assignment,
  AssignmentType,
  Attempt,
  ClassPost,
  ClassPostComment,
  ClassRecord,
  Profile,
} from "@/types/database";

type Tab = "discussion" | "assignments" | "roster";

type MembershipWithClass = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  classes: ClassRecord | null;
};

type PostWithExtras = ClassPost & {
  author: Profile | null;
  comments: (ClassPostComment & { author: Profile | null })[];
};

type Classmate = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  profile: Profile | null;
};

function dueValue(assignment: Assignment) {
  return assignment.due_at ?? assignment.due_date ?? null;
}

function isPastDue(assignment: Assignment) {
  const due = dueValue(assignment);
  return Boolean(due && new Date(due).getTime() < Date.now());
}

function attemptCompleted(attempt: Attempt | null | undefined) {
  return Boolean(attempt && (attempt.status === "completed" || attempt.completed_at));
}

function assignmentStatus(assignment: Assignment, attempt: Attempt | null | undefined) {
  if (attemptCompleted(attempt)) return "Assigned; Completed";
  if (isPastDue(assignment)) return "Missing";
  if (attempt) return "Assigned; Unfinished";
  return "Assigned; Not started";
}

function statusClass(status: string) {
  if (status.includes("Completed")) return "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  if (status.includes("Unfinished")) return "border-sky-400/40 bg-sky-500/10 text-sky-200";
  if (status === "Missing") return "border-red-400/40 bg-red-500/10 text-red-200";
  return "border-yellow-400/40 bg-yellow-500/10 text-yellow-100";
}

function formatDueDateTime(assignment: Assignment) {
  const due = dueValue(assignment);
  return due ? new Date(due).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "None";
}

function getAssignmentTypeLabel(type: AssignmentType | string) {
  if (type === "ear_training") return "Ear Training";
  if (type === "theory") return "Theory";
  return type;
}

function getModeLabel(mode: string) {
  const labels: Record<string, string> = {
    pitch: "Pitch",
    interval: "Intervals",
    scale: "Scales",
    chord: "Chords",
    cadence: "Cadences",
    "key-signature": "Key Signatures",
  };
  return labels[mode] ?? mode;
}

export default function StudentPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<MembershipWithClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [teacherProfile, setTeacherProfile] = useState<Profile | null>(null);
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [posts, setPosts] = useState<PostWithExtras[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState<Tab>("assignments");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [postBody, setPostBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedMembership = useMemo(
    () => memberships.find((membership) => membership.class_id === selectedClassId) ?? null,
    [memberships, selectedClassId],
  );

  const selectedClass = selectedMembership?.classes ?? null;

  const rows = useMemo(() => {
    return assignments.map((assignment) => {
      const attempt = attempts.find((item) => item.assignment_id === assignment.id) ?? null;
      return { assignment, attempt, status: assignmentStatus(assignment, attempt) };
    });
  }, [assignments, attempts]);

  const selectedAssignmentRow = useMemo(
    () => rows.find((row) => row.assignment.id === selectedAssignmentId) ?? null,
    [rows, selectedAssignmentId],
  );

  const completedCount = rows.filter((row) => row.status.includes("Completed")).length;
  const unfinishedCount = rows.filter((row) => row.status.includes("Unfinished")).length;
  const missingCount = rows.filter((row) => row.status === "Missing").length;
  const completedRows = rows.filter((row) => attemptCompleted(row.attempt));
  const averageScore = completedRows.length
    ? Math.round(completedRows.reduce((sum, row) => sum + Number(row.attempt?.score ?? 0), 0) / completedRows.length)
    : null;

  async function loadStudentData(preferredClassId?: string) {
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

    const loadedMemberships: MembershipWithClass[] = (membershipData ?? []).map((membership) => ({
      id: membership.id,
      class_id: membership.class_id,
      student_id: membership.student_id,
      joined_at: membership.joined_at,
      classes: Array.isArray(membership.classes) ? membership.classes[0] ?? null : membership.classes,
    }));

    setMemberships(loadedMemberships);
    const nextClassId = preferredClassId || selectedClassId || loadedMemberships[0]?.class_id || "";
    setSelectedClassId(nextClassId);
    if (nextClassId) await loadClassWorkspace(nextClassId, loadedMemberships, authData.user.id);
    setLoading(false);
  }

  async function loadClassWorkspace(classId: string, knownMemberships = memberships, studentId = profile?.id) {
    const membership = knownMemberships.find((item) => item.class_id === classId);
    const classRecord = membership?.classes;
    if (!classRecord) return;

    const { data: teacherData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", classRecord.teacher_id)
      .maybeSingle();
    setTeacherProfile((teacherData as Profile | null) ?? null);

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (assignmentError) {
      setMessage(assignmentError.message);
      return;
    }

    const loadedAssignments = (assignmentData ?? []) as Assignment[];
    setAssignments(loadedAssignments);

    if (loadedAssignments.length > 0 && studentId) {
      const { data: attemptData, error: attemptError } = await supabase
        .from("attempts")
        .select("*")
        .eq("student_id", studentId)
        .in("assignment_id", loadedAssignments.map((assignment) => assignment.id));
      if (attemptError) setMessage(attemptError.message);
      setAttempts((attemptData ?? []) as Attempt[]);
    } else {
      setAttempts([]);
    }

    await loadPosts(classId);
    await loadRoster(classId);
  }

  async function loadPosts(classId: string) {
    const { data: postData, error: postError } = await supabase
      .from("class_posts")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (postError) {
      setPosts([]);
      if (!postError.message.includes("relation")) setMessage(postError.message);
      return;
    }

    const loadedPosts = (postData ?? []) as ClassPost[];
    const postIds = loadedPosts.map((post) => post.id);
    const authorIds = loadedPosts.map((post) => post.author_id);
    const { data: commentsData } = postIds.length
      ? await supabase.from("class_post_comments").select("*").in("post_id", postIds).order("created_at", { ascending: true })
      : { data: [] };

    const comments = (commentsData ?? []) as ClassPostComment[];
    comments.forEach((comment) => authorIds.push(comment.author_id));

    const { data: profilesData } = authorIds.length
      ? await supabase.from("profiles").select("*").in("id", Array.from(new Set(authorIds)))
      : { data: [] };
    const profiles = (profilesData ?? []) as Profile[];

    setPosts(
      loadedPosts.map((post) => ({
        ...post,
        author: profiles.find((item) => item.id === post.author_id) ?? null,
        comments: comments
          .filter((comment) => comment.post_id === post.id)
          .map((comment) => ({ ...comment, author: profiles.find((item) => item.id === comment.author_id) ?? null })),
      })),
    );
  }

  async function loadRoster(classId: string) {
    const { data: memberData, error: memberError } = await supabase
      .from("class_members")
      .select("id, class_id, student_id, joined_at")
      .eq("class_id", classId)
      .order("joined_at", { ascending: true });

    if (memberError) {
      setClassmates([]);
      return;
    }

    const ids = (memberData ?? []).map((member) => member.student_id);
    const { data: profilesData } = ids.length
      ? await supabase.from("profiles").select("*").in("id", ids)
      : { data: [] };

    setClassmates((memberData ?? []).map((member) => ({
      ...member,
      profile: (profilesData ?? []).find((item) => item.id === member.student_id) ?? null,
    })));
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
      setMessage(memberError.message.includes("duplicate") ? "You already joined this class." : memberError.message);
      setJoining(false);
      return;
    }

    setJoinCode("");
    setMessage(`Joined ${classData.name}.`);
    await loadStudentData(classData.id);
    setJoining(false);
  }

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !selectedClass || !postBody.trim()) return;
    const { error } = await supabase.from("class_posts").insert({
      class_id: selectedClass.id,
      author_id: profile.id,
      body: postBody.trim(),
    });
    if (error) setMessage(error.message);
    setPostBody("");
    await loadPosts(selectedClass.id);
  }

  async function createComment(postId: string) {
    if (!profile || !selectedClass || !commentDrafts[postId]?.trim()) return;
    const { error } = await supabase.from("class_post_comments").insert({
      post_id: postId,
      class_id: selectedClass.id,
      author_id: profile.id,
      body: commentDrafts[postId].trim(),
    });
    if (error) setMessage(error.message);
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    await loadPosts(selectedClass.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  useEffect(() => {
    loadStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <section className="mx-auto max-w-7xl px-5 py-16 text-zinc-400">Loading classroom...</section>;

  if (!profile) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Student Dashboard</h1>
        <p className="mt-4 text-zinc-400">Please log in as a student to join classes and complete assignments.</p>
        <Link href="/login" className="mt-8 inline-flex rounded-full bg-violet-500 px-6 py-3 font-medium text-white hover:bg-violet-400">Log in</Link>
      </section>
    );
  }

  if (profile.role !== "student") {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Student access only</h1>
        <p className="mt-4 text-zinc-400">This dashboard is for student accounts.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-300">Student Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Classroom</h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">Welcome, {profile.display_name}. Join classes, follow discussions, and complete assigned work.</p>
        </div>
        <button onClick={signOut} className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10">Sign out</button>
      </div>

      {message && <div className="mb-6 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">{message}</div>}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <details className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">Join a class</summary>
            <form onSubmit={joinClass} className="mt-4 space-y-3">
              <input required value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ABC123" className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white uppercase tracking-widest outline-none focus:border-violet-400" />
              <button disabled={joining} className="w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60">{joining ? "Joining..." : "Join class"}</button>
            </form>
          </details>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">My classes</h2>
            <div className="mt-4 space-y-3">
              {memberships.length === 0 ? <p className="text-sm leading-6 text-zinc-400">You have not joined any classes yet.</p> : memberships.map((membership) => (
                <button key={membership.id} onClick={() => { setSelectedClassId(membership.class_id); setSelectedAssignmentId(null); loadClassWorkspace(membership.class_id); }} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedClassId === membership.class_id ? "border-violet-400/70 bg-violet-500/15" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"}`}>
                  <p className="font-medium text-white">{membership.classes?.name ?? "Class"}</p>
                  <p className="mt-1 text-sm text-zinc-500">Joined {new Date(membership.joined_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Link href="/practice/ear-training" className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06]"><h2 className="text-lg font-semibold">Free Ear Training</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Practice outside assignments.</p></Link>
            <Link href="/practice/theory" className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06]"><h2 className="text-lg font-semibold">Free Theory Practice</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Review written theory skills.</p></Link>
          </div>
        </aside>

        <main className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          {!selectedClass ? (
            <div className="py-16 text-center"><h2 className="text-2xl font-semibold">No class selected</h2><p className="mt-3 text-zinc-400">Join or select a class to see work.</p></div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-violet-300">Selected class</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">{selectedClass.name}</h2>
                <p className="mt-2 text-sm text-zinc-500">Teacher: {teacherProfile?.display_name ?? "Teacher"}</p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4"><p className="text-xs text-zinc-500">Completed</p><p className="mt-1 text-2xl font-semibold">{completedCount}</p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4"><p className="text-xs text-zinc-500">Unfinished</p><p className="mt-1 text-2xl font-semibold">{unfinishedCount}</p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4"><p className="text-xs text-zinc-500">Missing</p><p className="mt-1 text-2xl font-semibold">{missingCount}</p></div>
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4"><p className="text-xs text-zinc-500">Average score</p><p className="mt-1 text-2xl font-semibold">{averageScore === null ? "—" : `${averageScore}%`}</p></div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-zinc-950 p-2">
                {(["discussion", "assignments", "roster"] as Tab[]).map((item) => <button key={item} onClick={() => { setTab(item); if (item !== "assignments") setSelectedAssignmentId(null); }} className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${tab === item ? "bg-violet-500 text-white" : "text-zinc-300 hover:bg-white/10"}`}>{item}</button>)}
              </div>

              {tab === "discussion" && (
                <div className="mt-6 space-y-5">
                  {selectedClass.students_can_post_discussion ? (
                    <form onSubmit={createPost} className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                      <textarea value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder="Post to the class discussion..." className="min-h-24 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-violet-400" />
                      <button className="mt-3 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400">Post</button>
                    </form>
                  ) : <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-400">Only the teacher can create discussion posts in this class, but students can still comment.</p>}

                  {posts.length === 0 ? <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-400">No discussion posts yet.</p> : posts.map((post) => (
                    <article key={post.id} className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                      <div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{post.author?.display_name ?? "User"}</p><p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</p></div>
                      <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-300">{post.body}</p>
                      <div className="mt-5 space-y-3">
                        {post.comments.map((comment) => <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm"><p className="font-medium text-zinc-200">{comment.author?.display_name ?? "User"}</p><p className="mt-1 text-zinc-400">{comment.body}</p></div>)}
                        <div className="flex gap-2"><input value={commentDrafts[post.id] ?? ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Add a comment..." className="min-w-0 flex-1 rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white outline-none focus:border-violet-400" /><button onClick={() => createComment(post.id)} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Comment</button></div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {tab === "assignments" && (
                <div className="mt-6">
                  {selectedAssignmentRow ? (
                    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
                      <button
                        onClick={() => setSelectedAssignmentId(null)}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                      >
                        Return to class
                      </button>

                      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-violet-300">Assignment details</p>
                          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">{selectedAssignmentRow.assignment.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {getAssignmentTypeLabel(selectedAssignmentRow.assignment.assignment_type)} · {getModeLabel(selectedAssignmentRow.assignment.mode)} · {selectedAssignmentRow.assignment.question_count} questions
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Due {formatDueDateTime(selectedAssignmentRow.assignment)}
                          </p>
                        </div>
                        <span className={`w-fit rounded-full border px-4 py-2 text-sm ${statusClass(selectedAssignmentRow.status)}`}>
                          {selectedAssignmentRow.status}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-black p-4">
                          <p className="text-xs text-zinc-500">Score</p>
                          <p className="mt-1 text-2xl font-semibold text-white">
                            {attemptCompleted(selectedAssignmentRow.attempt) ? `${Math.round(Number(selectedAssignmentRow.attempt?.score ?? 0))}%` : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black p-4">
                          <p className="text-xs text-zinc-500">Correct</p>
                          <p className="mt-1 text-2xl font-semibold text-white">
                            {attemptCompleted(selectedAssignmentRow.attempt) ? `${selectedAssignmentRow.attempt?.correct_count}/${selectedAssignmentRow.attempt?.total_questions}` : "—"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black p-4">
                          <p className="text-xs text-zinc-500">Class average</p>
                          <p className="mt-1 text-2xl font-semibold text-white">{averageScore === null ? "—" : `${averageScore}%`}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black p-4">
                          <p className="text-xs text-zinc-500">Completed</p>
                          <p className="mt-1 text-2xl font-semibold text-white">
                            {selectedAssignmentRow.attempt?.completed_at ? new Date(selectedAssignmentRow.attempt.completed_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                      </div>

                      {attemptCompleted(selectedAssignmentRow.attempt) && (
                        <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm leading-6 text-emerald-100">
                          You completed this assignment. Retaking will replace your saved score.
                        </div>
                      )}

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <Link
                          href={`/student/assignments/${selectedAssignmentRow.assignment.id}`}
                          className="rounded-full bg-violet-500 px-5 py-3 text-center font-medium text-white hover:bg-violet-400"
                        >
                          {attemptCompleted(selectedAssignmentRow.attempt) ? "Review / Retake" : selectedAssignmentRow.attempt ? "Continue" : "Start"}
                        </Link>
                        <button
                          onClick={() => setSelectedAssignmentId(null)}
                          className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
                        >
                          Return to class
                        </button>
                      </div>
                    </div>
                  ) : rows.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-400">No assignments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {rows.map(({ assignment, attempt, status }) => (
                        <button
                          key={assignment.id}
                          onClick={() => setSelectedAssignmentId(assignment.id)}
                          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4 text-left transition hover:border-violet-400/60 hover:bg-white/[0.04]"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-zinc-400">{getAssignmentTypeLabel(assignment.assignment_type)} · {getModeLabel(assignment.mode)} · {assignment.question_count} questions</p>
                              <p className="mt-1 text-sm text-zinc-500">Due {formatDueDateTime(assignment)}</p>
                              {attemptCompleted(attempt) && <p className="mt-3 text-sm font-medium text-emerald-300">Score: {attempt?.correct_count}/{attempt?.total_questions} ({Math.round(Number(attempt?.score ?? 0))}%)</p>}
                            </div>
                            <span className={`w-fit rounded-full border px-3 py-1 text-xs ${statusClass(status)}`}>{status}</span>
                          </div>
                          <p className="mt-4 text-sm text-violet-300">Open details</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "roster" && (
                <div className="mt-6">
                  {selectedClass.students_can_see_roster ? (
                    classmates.length === 0 ? <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-400">No roster entries yet.</p> : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {classmates.map((classmate) => <div key={classmate.id} className="rounded-2xl border border-white/10 bg-zinc-950 p-4"><p className="font-medium text-white">{classmate.profile?.display_name ?? "Student"}</p><p className="mt-1 text-sm text-zinc-500">Joined {new Date(classmate.joined_at).toLocaleDateString()}</p></div>)}
                      </div>
                    )
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                      <p className="text-sm text-zinc-500">Roster hidden by teacher</p>
                      <p className="mt-2 text-xl font-semibold text-white">{teacherProfile?.display_name ?? "Teacher"}</p>
                      <p className="mt-1 text-sm text-zinc-400">Teacher</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </section>
  );
}
