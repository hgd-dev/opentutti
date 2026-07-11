"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  defaultEarTrainingSettings,
  earTrainingOptionLists,
  EarTrainingSettings,
} from "@/lib/music/earTraining";
import {
  defaultTheorySettings,
  theoryOptionLists,
  TheorySettings,
} from "@/lib/music/theoryTraining";
import type {
  Assignment,
  AssignmentComment,
  AssignmentType,
  Attempt,
  ClassPost,
  ClassPostComment,
  ClassRecord,
  Profile,
} from "@/types/database";

type Tab = "discussion" | "assignments" | "roster";
type SortKey = "name" | "average" | "completed" | "missing";

type MemberWithProfile = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  profile: Profile | null;
};

type PostWithExtras = ClassPost & {
  author: Profile | null;
  comments: (ClassPostComment & { author: Profile | null })[];
};

type AssignmentWithStats = Assignment & {
  completionCount: number;
  averageScore: number | null;
  missingCount: number;
  unfinishedCount: number;
};

type RosterRow = {
  student: Profile;
  completed: number;
  missing: number;
  unfinished: number;
  average: number | null;
};

const assignmentTypes: { value: AssignmentType; label: string }[] = [
  { value: "ear_training", label: "Ear Training" },
  { value: "theory", label: "Theory" },
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
    { value: "pitch", label: "Pitch" },
    { value: "interval", label: "Intervals" },
    { value: "scale", label: "Scales" },
    { value: "chord", label: "Chords" },
    { value: "cadence", label: "Cadences" },
    { value: "key-signature", label: "Key Signatures" },
  ],
};

function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

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

function formatSettingValue(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    if (value.length > 8) return `${value.length} selected: ${value.slice(0, 8).join(", ")}...`;
    return value.join(", ");
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nestedRecord(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return isRecord(value) ? value : {};
}

function settingsRowsForAssignment(assignment: Assignment) {
  if (!isRecord(assignment.settings_json) || Object.keys(assignment.settings_json).length === 0) {
    return [{ label: "Settings", value: "No custom settings were saved for this older assignment." }];
  }

  const settings = assignment.settings_json;
  const rows: { label: string; value: string }[] = [
    { label: "Clefs", value: formatSettingValue(settings.clefs) },
  ];

  const range = nestedRecord(settings, "range");
  if (range.low || range.high) rows.push({ label: "Range", value: `${formatSettingValue(range.low)}-${formatSettingValue(range.high)}` });

  if (assignment.assignment_type === "ear_training") {
    const pitch = nestedRecord(settings, "pitch");
    const interval = nestedRecord(settings, "interval");
    const scale = nestedRecord(settings, "scale");
    const chord = nestedRecord(settings, "chord");

    if (assignment.mode === "pitch") {
      rows.push({ label: "Pitch mode", value: formatSettingValue(pitch.submode) });
      rows.push({ label: "Answer mode", value: formatSettingValue(pitch.answerMode) });
      rows.push({ label: "Reference note", value: formatSettingValue(pitch.referenceNote) });
    }

    if (assignment.mode === "interval") {
      rows.push({ label: "Playback", value: formatSettingValue(interval.playback) });
      rows.push({ label: "Allowed intervals", value: formatSettingValue(interval.enabledAnswers) });
    }

    if (assignment.mode === "scale") {
      rows.push({ label: "Playback", value: formatSettingValue(scale.playback) });
      rows.push({ label: "Allowed scales", value: formatSettingValue(scale.enabledAnswers) });
    }

    if (assignment.mode === "chord") {
      rows.push({ label: "Playback", value: formatSettingValue(chord.playback) });
      rows.push({ label: "Include inversions", value: formatSettingValue(chord.includeInversions) });
      rows.push({ label: "Allowed chords", value: formatSettingValue(chord.enabledAnswers) });
    }
  } else {
    const pitch = nestedRecord(settings, "pitch");
    const interval = nestedRecord(settings, "interval");
    const scale = nestedRecord(settings, "scale");
    const chord = nestedRecord(settings, "chord");
    const keySignature = nestedRecord(settings, "keySignature");

    if (assignment.mode === "pitch") {
      rows.push({ label: "Answer mode", value: formatSettingValue(pitch.answerMode) });
      rows.push({ label: "Allow enharmonics", value: formatSettingValue(pitch.allowEnharmonics) });
    }
    if (assignment.mode === "interval") {
      rows.push({ label: "Display type", value: formatSettingValue(interval.playbackType) });
      rows.push({ label: "Allowed intervals", value: formatSettingValue(interval.enabledAnswers) });
    }
    if (assignment.mode === "scale") {
      rows.push({ label: "Display type", value: formatSettingValue(scale.playbackType) });
      rows.push({ label: "Allowed scales", value: formatSettingValue(scale.enabledAnswers) });
    }
    if (assignment.mode === "chord") {
      rows.push({ label: "Display type", value: formatSettingValue(chord.playbackType) });
      rows.push({ label: "Include inversions", value: formatSettingValue(chord.includeInversions) });
      rows.push({ label: "Allowed chords", value: formatSettingValue(chord.enabledAnswers) });
    }
    if (assignment.mode === "key-signature") rows.push({ label: "Relative minor", value: formatSettingValue(keySignature.includeRelativeMinor) });
  }

  return rows;
}

function modeLabel(type: AssignmentType, mode: string) {
  return modesByType[type].find((item) => item.value === mode)?.label ?? mode;
}

export default function TeacherPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [posts, setPosts] = useState<PostWithExtras[]>([]);
  const [assignmentComments, setAssignmentComments] = useState<AssignmentComment[]>([]);

  const [tab, setTab] = useState<Tab>("discussion");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [creatingClass, setCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [postBody, setPostBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [zoomCode, setZoomCode] = useState<string | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [assignmentDetailOpen, setAssignmentDetailOpen] = useState(false);
  const [studentNote, setStudentNote] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<SortKey>("name");

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("ear_training");
  const [assignmentMode, setAssignmentMode] = useState("interval");
  const [questionCount, setQuestionCount] = useState(10);
  const [dueDate, setDueDate] = useState("");
  const [earSettings, setEarSettings] = useState<EarTrainingSettings>(defaultEarTrainingSettings);
  const [theorySettings, setTheorySettings] = useState<TheorySettings>(defaultTheorySettings);

  function getCurrentAssignmentSettings() {
    return assignmentType === "ear_training" ? earSettings : theorySettings;
  }

  function handleAssignmentTypeChange(nextType: AssignmentType) {
    setAssignmentType(nextType);
    setAssignmentMode(modesByType[nextType][0].value);
  }

  function toggleEarClef(clef: EarTrainingSettings["clefs"][number]) {
    setEarSettings((current) => {
      const next = current.clefs.includes(clef)
        ? current.clefs.filter((item) => item !== clef)
        : [...current.clefs, clef];
      return { ...current, clefs: next.length > 0 ? next : [clef] };
    });
  }

  function toggleTheoryClef(clef: TheorySettings["clefs"][number]) {
    setTheorySettings((current) => {
      const next = current.clefs.includes(clef)
        ? current.clefs.filter((item) => item !== clef)
        : [...current.clefs, clef];
      return { ...current, clefs: next.length > 0 ? next : [clef] };
    });
  }

  function setGroupedEarScale(groupItems: readonly string[], checked: boolean) {
    setEarSettings((current) => {
      const next = checked
        ? Array.from(new Set([...current.scale.enabledAnswers, ...groupItems]))
        : current.scale.enabledAnswers.filter((item) => !groupItems.includes(item));
      return {
        ...current,
        scale: {
          ...current.scale,
          enabledAnswers: next.length > 0 ? next : [...earTrainingOptionLists.scales],
        },
      };
    });
  }

  function setGroupedEarChord(groupItems: readonly string[], checked: boolean) {
    setEarSettings((current) => {
      const next = checked
        ? Array.from(new Set([...current.chord.enabledAnswers, ...groupItems]))
        : current.chord.enabledAnswers.filter((item) => !groupItems.includes(item));
      return {
        ...current,
        chord: {
          ...current.chord,
          enabledAnswers: next.length > 0 ? next : [...earTrainingOptionLists.chords],
        },
      };
    });
  }

  function setGroupedTheoryScale(groupItems: readonly string[], checked: boolean) {
    setTheorySettings((current) => {
      const next = checked
        ? Array.from(new Set([...current.scale.enabledAnswers, ...groupItems]))
        : current.scale.enabledAnswers.filter((item) => !groupItems.includes(item));
      return {
        ...current,
        scale: {
          ...current.scale,
          enabledAnswers: next.length > 0 ? next : [...defaultTheorySettings.scale.enabledAnswers],
        },
      };
    });
  }

  function setGroupedTheoryChord(groupItems: readonly string[], checked: boolean) {
    setTheorySettings((current) => {
      const next = checked
        ? Array.from(new Set([...current.chord.enabledAnswers, ...groupItems]))
        : current.chord.enabledAnswers.filter((item) => !groupItems.includes(item));
      return {
        ...current,
        chord: {
          ...current.chord,
          enabledAnswers: next.length > 0 ? next : [...defaultTheorySettings.chord.enabledAnswers],
        },
      };
    });
  }

  const selectedClass = useMemo(
    () => classes.find((classRecord) => classRecord.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null,
    [assignments, selectedAssignmentId],
  );

  const studentIds = useMemo(() => members.map((member) => member.student_id), [members]);

  const assignmentRows = useMemo<AssignmentWithStats[]>(() => {
    return assignments.map((assignment) => {
      const relatedAttempts = attempts.filter((attempt) => attempt.assignment_id === assignment.id);
      const completed = relatedAttempts.filter(attemptCompleted);
      const averageScore = completed.length
        ? Math.round(completed.reduce((sum, attempt) => sum + Number(attempt.score ?? 0), 0) / completed.length)
        : null;
      const missingCount = studentIds.filter((id) => {
        const attempt = relatedAttempts.find((item) => item.student_id === id);
        return assignmentStatus(assignment, attempt) === "Missing";
      }).length;
      const unfinishedCount = studentIds.filter((id) => {
        const attempt = relatedAttempts.find((item) => item.student_id === id);
        return assignmentStatus(assignment, attempt) === "Assigned; Unfinished";
      }).length;

      return {
        ...assignment,
        completionCount: completed.length,
        averageScore,
        missingCount,
        unfinishedCount,
      };
    });
  }, [assignments, attempts, studentIds]);

  const rosterRows = useMemo<RosterRow[]>(() => {
    const rows = members
      .map((member) => member.profile)
      .filter(Boolean)
      .map((student) => {
        const studentAttempts = attempts.filter((attempt) => attempt.student_id === student!.id);
        const completedAttempts = studentAttempts.filter(attemptCompleted);
        const average = completedAttempts.length
          ? Math.round(completedAttempts.reduce((sum, attempt) => sum + Number(attempt.score ?? 0), 0) / completedAttempts.length)
          : null;
        const missing = assignments.filter((assignment) => {
          const attempt = studentAttempts.find((item) => item.assignment_id === assignment.id);
          return assignmentStatus(assignment, attempt) === "Missing";
        }).length;
        const unfinished = assignments.filter((assignment) => {
          const attempt = studentAttempts.find((item) => item.assignment_id === assignment.id);
          return assignmentStatus(assignment, attempt) === "Assigned; Unfinished";
        }).length;
        return { student: student!, completed: completedAttempts.length, missing, unfinished, average };
      });

    return rows.sort((a, b) => {
      if (sortKey === "average") return (b.average ?? -1) - (a.average ?? -1);
      if (sortKey === "completed") return b.completed - a.completed;
      if (sortKey === "missing") return b.missing - a.missing;
      return a.student.display_name.localeCompare(b.student.display_name);
    });
  }, [assignments, attempts, members, sortKey]);

  const completedAttempts = useMemo(() => attempts.filter(attemptCompleted), [attempts]);

  const classAverageScore = useMemo(() => {
    if (completedAttempts.length === 0) return null;
    const total = completedAttempts.reduce((sum, attempt) => sum + Number(attempt.score ?? 0), 0);
    return Math.round(total / completedAttempts.length);
  }, [completedAttempts]);

  async function loadTeacherData(preferredClassId?: string) {
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

    const loadedClasses = (classData ?? []) as ClassRecord[];
    setClasses(loadedClasses);
    const nextClassId = preferredClassId || selectedClassId || loadedClasses[0]?.id || "";
    setSelectedClassId(nextClassId);

    if (nextClassId) await loadClassWorkspace(nextClassId);
    setLoading(false);
  }

  async function loadClassWorkspace(classId: string) {
    setMessage(null);

    const { data: memberData, error: memberError } = await supabase
      .from("class_members")
      .select("id, class_id, student_id, joined_at")
      .eq("class_id", classId)
      .order("joined_at", { ascending: true });

    if (memberError) {
      setMessage(memberError.message);
      return;
    }

    const ids = (memberData ?? []).map((member) => member.student_id);
    const { data: profileData, error: profilesError } = ids.length
      ? await supabase.from("profiles").select("*").in("id", ids)
      : { data: [], error: null };

    if (profilesError) {
      setMessage(profilesError.message);
      return;
    }

    setMembers(
      (memberData ?? []).map((member) => ({
        ...member,
        profile: (profileData ?? []).find((item) => item.id === member.student_id) ?? null,
      })),
    );

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
    setSelectedAssignmentId((current) => current && loadedAssignments.some((item) => item.id === current) ? current : loadedAssignments[0]?.id ?? null);

    const assignmentIds = loadedAssignments.map((assignment) => assignment.id);
    if (assignmentIds.length && ids.length) {
      const { data: attemptData, error: attemptError } = await supabase
        .from("attempts")
        .select("*")
        .in("assignment_id", assignmentIds)
        .in("student_id", ids);
      if (attemptError) setMessage(attemptError.message);
      setAttempts((attemptData ?? []) as Attempt[]);
    } else {
      setAttempts([]);
    }

    await loadPosts(classId);
    await loadAssignmentComments(assignmentIds);
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
    const authorIds = Array.from(new Set(loadedPosts.map((post) => post.author_id)));
    const postIds = loadedPosts.map((post) => post.id);

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
        author: profiles.find((profile) => profile.id === post.author_id) ?? null,
        comments: comments
          .filter((comment) => comment.post_id === post.id)
          .map((comment) => ({
            ...comment,
            author: profiles.find((profile) => profile.id === comment.author_id) ?? null,
          })),
      })),
    );
  }

  async function loadAssignmentComments(assignmentIds: string[]) {
    if (!assignmentIds.length) {
      setAssignmentComments([]);
      return;
    }

    const { data, error } = await supabase
      .from("assignment_comments")
      .select("*")
      .in("assignment_id", assignmentIds)
      .order("created_at", { ascending: false });

    if (error) {
      setAssignmentComments([]);
      return;
    }

    setAssignmentComments((data ?? []) as AssignmentComment[]);
  }

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !newClassName.trim()) return;
    setCreatingClass(true);
    const { data, error } = await supabase
      .from("classes")
      .insert({
        teacher_id: profile.id,
        name: newClassName.trim(),
        join_code: generateJoinCode(),
        students_can_post_discussion: true,
        students_can_see_roster: true,
      })
      .select("*")
      .single();
    setCreatingClass(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewClassName("");
    await loadTeacherData(data.id);
  }

  async function updateClassSetting(field: "students_can_post_discussion" | "students_can_see_roster", value: boolean) {
    if (!selectedClass) return;
    setClasses((current) => current.map((item) => item.id === selectedClass.id ? { ...item, [field]: value } : item));
    const { error } = await supabase.from("classes").update({ [field]: value }).eq("id", selectedClass.id);
    if (error) setMessage(error.message);
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

  async function createAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !selectedClass) return;
    const title = assignmentTitle.trim() || `${assignmentTypes.find((item) => item.value === assignmentType)?.label}: ${modeLabel(assignmentType, assignmentMode)}`;
    const due = dueDate ? new Date(dueDate).toISOString() : null;
    const { data, error } = await supabase
      .from("assignments")
      .insert({
        class_id: selectedClass.id,
        teacher_id: profile.id,
        title,
        assignment_type: assignmentType,
        mode: assignmentMode,
        question_count: questionCount,
        due_date: due,
        due_at: due,
        settings_json: getCurrentAssignmentSettings(),
      })
      .select("*")
      .single();
    if (error) {
      setMessage(error.message);
      return;
    }
    setAssignmentTitle("");
    setDueDate("");
    setAssignments((current) => [data as Assignment, ...current]);
    setSelectedAssignmentId(data.id);
  }

  async function addStudentAssignmentNote(studentId: string) {
    if (!profile || !selectedAssignment || !studentNote[studentId]?.trim()) return;
    const { error } = await supabase.from("assignment_comments").insert({
      assignment_id: selectedAssignment.id,
      student_id: studentId,
      author_id: profile.id,
      body: studentNote[studentId].trim(),
      comment_type: "comment",
    });
    if (error) setMessage(error.message);
    setStudentNote((current) => ({ ...current, [studentId]: "" }));
    await loadAssignmentComments(assignments.map((assignment) => assignment.id));
  }

  useEffect(() => {
    loadTeacherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <section className="mx-auto max-w-7xl px-5 py-16 text-zinc-400">Loading classroom...</section>;

  if (!profile) {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Log in needed</h1>
        <p className="mt-4 text-zinc-400">Please log in as a teacher to manage your classroom.</p>
      </section>
    );
  }

  if (profile.role !== "teacher") {
    return (
      <section className="mx-auto max-w-7xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Teacher access only</h1>
        <p className="mt-4 text-zinc-400">This dashboard is only available for teacher accounts.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-300">Teacher Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Classroom</h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">Manage classes, discussions, assignments, progress, and rosters from one workspace.</p>
        </div>
      </div>

      {message && <div className="mb-6 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">{message}</div>}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <details className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">Create new class</summary>
            <form onSubmit={createClass} className="mt-4 space-y-3">
              <input
                required
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="Period 3 Music Theory"
                className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              />
              <button disabled={creatingClass} className="w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60">
                {creatingClass ? "Creating..." : "Create class"}
              </button>
            </form>
          </details>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Classes</h2>
            <div className="mt-4 space-y-3">
              {classes.length === 0 ? <p className="text-sm leading-6 text-zinc-400">No classes yet.</p> : classes.map((classRecord) => (
                <button
                  key={classRecord.id}
                  onClick={() => { setSelectedClassId(classRecord.id); setAssignmentDetailOpen(false); loadClassWorkspace(classRecord.id); }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedClassId === classRecord.id ? "border-violet-400/70 bg-violet-500/15" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"}`}
                >
                  <p className="font-medium text-white">{classRecord.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{classRecord.join_code}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          {!selectedClass ? (
            <div className="py-16 text-center">
              <h2 className="text-2xl font-semibold">No class selected</h2>
              <p className="mt-3 text-zinc-400">Create or select a class to begin.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-300">Selected class</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">{selectedClass.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-400">
                    <span className="rounded-full border border-white/10 px-3 py-1">{members.length} student{members.length === 1 ? "" : "s"}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">{assignments.length} assignment{assignments.length === 1 ? "" : "s"}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1">Class avg: {classAverageScore === null ? "—" : `${classAverageScore}%`}</span>
                  </div>
                </div>
                <button onClick={() => setZoomCode(selectedClass.join_code)} className="rounded-3xl border border-violet-400/40 bg-violet-500/10 px-6 py-4 text-left hover:bg-violet-500/20">
                  <p className="text-sm text-violet-200">Join code</p>
                  <p className="mt-1 text-3xl font-semibold tracking-[0.25em] text-white">{selectedClass.join_code}</p>
                  <p className="mt-1 text-xs text-zinc-400">Click to zoom for Smartboard</p>
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-zinc-950 p-2">
                {(["discussion", "assignments", "roster"] as Tab[]).map((item) => (
                  <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-medium capitalize ${tab === item ? "bg-violet-500 text-white" : "text-zinc-300 hover:bg-white/10"}`}>{item}</button>
                ))}
              </div>

              {tab === "discussion" && (
                <div className="mt-6 space-y-5">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4 text-sm text-zinc-300">
                    <input type="checkbox" checked={selectedClass.students_can_post_discussion ?? true} onChange={(event) => updateClassSetting("students_can_post_discussion", event.target.checked)} />
                    Students can post in Discussion
                  </label>

                  <form onSubmit={createPost} className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                    <textarea value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder="Post an announcement or discussion prompt..." className="min-h-28 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-violet-400" />
                    <button className="mt-3 rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400">Post to class</button>
                  </form>

                  {posts.length === 0 ? <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-400">No discussion posts yet.</p> : posts.map((post) => (
                    <article key={post.id} className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{post.author?.display_name ?? "Teacher"}</p>
                        <p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</p>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-300">{post.body}</p>
                      <div className="mt-5 space-y-3">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                            <p className="font-medium text-zinc-200">{comment.author?.display_name ?? "User"}</p>
                            <p className="mt-1 text-zinc-400">{comment.body}</p>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input value={commentDrafts[post.id] ?? ""} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Add a comment..." className="min-w-0 flex-1 rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white outline-none focus:border-violet-400" />
                          <button onClick={() => createComment(post.id)} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Comment</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {tab === "assignments" && (
                <div className={`mt-6 grid gap-6 ${assignmentDetailOpen ? "" : "xl:grid-cols-[420px_1fr]"}`}>
                  <aside className={`space-y-5 ${assignmentDetailOpen ? "hidden" : ""}`}>
                    <details className="rounded-3xl border border-white/10 bg-zinc-950 p-5">
                      <summary className="cursor-pointer font-semibold text-white">Create assignment</summary>
                      <form onSubmit={createAssignment} className="mt-4 space-y-4 text-sm">
                        <input
                          value={assignmentTitle}
                          onChange={(event) => setAssignmentTitle(event.target.value)}
                          placeholder="Assignment title optional"
                          className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-violet-400"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="text-xs text-zinc-400">
                            Type
                            <select
                              value={assignmentType}
                              onChange={(event) => handleAssignmentTypeChange(event.target.value as AssignmentType)}
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
                            >
                              {assignmentTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                          </label>
                          <label className="text-xs text-zinc-400">
                            Mode
                            <select
                              value={assignmentMode}
                              onChange={(event) => setAssignmentMode(event.target.value)}
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
                            >
                              {modesByType[assignmentType].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs text-zinc-400">
                            Questions
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={questionCount}
                              onChange={(event) => setQuestionCount(Number(event.target.value))}
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
                            />
                          </label>
                          <label className="text-xs text-zinc-400">
                            Due date and time
                            <input
                              type="datetime-local"
                              value={dueDate}
                              onChange={(event) => setDueDate(event.target.value)}
                              className="mt-1 w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
                            />
                          </label>
                        </div>

                        <details className="rounded-2xl border border-white/10 bg-black/40 p-4" open>
                          <summary className="cursor-pointer font-semibold text-white">Exercise settings</summary>
                          <div className="mt-4 space-y-5 text-zinc-300">
                            {assignmentType === "ear_training" ? (
                              <>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Clefs</p>
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    {earTrainingOptionLists.clefs.map((clef) => (
                                      <label key={clef} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs">
                                        <input type="checkbox" checked={earSettings.clefs.includes(clef)} onChange={() => toggleEarClef(clef)} />
                                        {clef}
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-xs text-zinc-400">
                                    Low
                                    <select value={earSettings.range.low} onChange={(event) => setEarSettings((current) => ({ ...current, range: { ...current.range, low: event.target.value } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                      {earTrainingOptionLists.rangeNotes.map((note) => <option key={note} value={note}>{note}</option>)}
                                    </select>
                                  </label>
                                  <label className="text-xs text-zinc-400">
                                    High
                                    <select value={earSettings.range.high} onChange={(event) => setEarSettings((current) => ({ ...current, range: { ...current.range, high: event.target.value } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                      {earTrainingOptionLists.rangeNotes.map((note) => <option key={note} value={note}>{note}</option>)}
                                    </select>
                                  </label>
                                </div>

                                {assignmentMode === "pitch" && (
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <label className="text-xs text-zinc-400">
                                      Pitch mode
                                      <select value={earSettings.pitch.submode} onChange={(event) => setEarSettings((current) => ({ ...current, pitch: { ...current.pitch, submode: event.target.value as EarTrainingSettings["pitch"]["submode"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="perfect">Pitch Perfect</option>
                                        <option value="reference">Pitch Reference (C)</option>
                                      </select>
                                    </label>
                                    <label className="text-xs text-zinc-400">
                                      Answer format
                                      <select value={earSettings.pitch.answerMode} onChange={(event) => setEarSettings((current) => ({ ...current, pitch: { ...current.pitch, answerMode: event.target.value as EarTrainingSettings["pitch"]["answerMode"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="choice">Choice buttons</option>
                                        <option value="keyboard">Keyboard</option>
                                      </select>
                                    </label>
                                  </div>
                                )}

                                {assignmentMode === "interval" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Playback type
                                      <select value={earSettings.interval.playback} onChange={(event) => setEarSettings((current) => ({ ...current, interval: { ...current.interval, playback: event.target.value as EarTrainingSettings["interval"]["playback"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="ascending">Ascending</option>
                                        <option value="descending">Descending</option>
                                        <option value="harmonic">Harmonic</option>
                                      </select>
                                    </label>
                                    <details className="rounded-xl border border-white/10 p-3">
                                      <summary className="cursor-pointer text-xs font-medium text-zinc-200">Allowed interval answers</summary>
                                      <div className="mt-3 grid grid-cols-2 gap-2">
                                        {earTrainingOptionLists.intervals.map((answer) => (
                                          <label key={answer} className="flex items-center gap-2 text-xs">
                                            <input type="checkbox" checked={earSettings.interval.enabledAnswers.includes(answer)} onChange={(event) => setEarSettings((current) => {
                                              const next = event.target.checked ? [...current.interval.enabledAnswers, answer] : current.interval.enabledAnswers.filter((item) => item !== answer);
                                              return { ...current, interval: { ...current.interval, enabledAnswers: next.length ? next : [...earTrainingOptionLists.intervals] } };
                                            })} />
                                            {answer}
                                          </label>
                                        ))}
                                      </div>
                                    </details>
                                  </div>
                                )}

                                {assignmentMode === "scale" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Playback type
                                      <select value={earSettings.scale.playback} onChange={(event) => setEarSettings((current) => ({ ...current, scale: { ...current.scale, playback: event.target.value as EarTrainingSettings["scale"]["playback"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="ascending">Ascending</option>
                                        <option value="descending">Descending</option>
                                      </select>
                                    </label>
                                    {(Object.entries(earTrainingOptionLists.scaleGroups) as [string, readonly string[]][]).map(([group, items]) => (
                                      <label key={group} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={items.every((item) => earSettings.scale.enabledAnswers.includes(item))} onChange={(event) => setGroupedEarScale(items, event.target.checked)} />
                                        {group === "common" ? "Common scales" : group === "special" ? "Special scales" : "Modes"}
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {assignmentMode === "chord" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Playback type
                                      <select value={earSettings.chord.playback} onChange={(event) => setEarSettings((current) => ({ ...current, chord: { ...current.chord, playback: event.target.value as EarTrainingSettings["chord"]["playback"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="blocked">Blocked</option>
                                        <option value="arpeggiated">Arpeggiated</option>
                                      </select>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={earSettings.chord.includeInversions} onChange={(event) => setEarSettings((current) => ({ ...current, chord: { ...current.chord, includeInversions: event.target.checked } }))} /> Include inversions</label>
                                    {(Object.entries(earTrainingOptionLists.chordGroups) as [string, readonly string[]][]).map(([group, items]) => (
                                      <label key={group} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={items.every((item) => earSettings.chord.enabledAnswers.includes(item))} onChange={(event) => setGroupedEarChord(items, event.target.checked)} />
                                        {group === "triads" ? "Triads" : "7th chords"}
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {assignmentMode === "cadence" && (
                                  <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-400">Cadence assignments use the current cadence set: Authentic, Half, Plagal, and Deceptive.</p>
                                )}
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Clefs</p>
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    {theoryOptionLists.clefs.map((clef) => (
                                      <label key={clef} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs">
                                        <input type="checkbox" checked={theorySettings.clefs.includes(clef)} onChange={() => toggleTheoryClef(clef)} />
                                        {clef}
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <label className="text-xs text-zinc-400">
                                    Low
                                    <select value={theorySettings.range.low} onChange={(event) => setTheorySettings((current) => ({ ...current, range: { ...current.range, low: event.target.value } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                      {theoryOptionLists.rangeNotes.map((note) => <option key={note} value={note}>{note}</option>)}
                                    </select>
                                  </label>
                                  <label className="text-xs text-zinc-400">
                                    High
                                    <select value={theorySettings.range.high} onChange={(event) => setTheorySettings((current) => ({ ...current, range: { ...current.range, high: event.target.value } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                      {theoryOptionLists.rangeNotes.map((note) => <option key={note} value={note}>{note}</option>)}
                                    </select>
                                  </label>
                                </div>

                                {assignmentMode === "pitch" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Answer format
                                      <select value={theorySettings.pitch.answerMode} onChange={(event) => setTheorySettings((current) => ({ ...current, pitch: { ...current.pitch, answerMode: event.target.value as TheorySettings["pitch"]["answerMode"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="choices">Choice buttons</option>
                                        <option value="keyboard">Keyboard</option>
                                      </select>
                                    </label>
                                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
                                      <input type="checkbox" checked={theorySettings.pitch.allowEnharmonics} onChange={(event) => setTheorySettings((current) => ({ ...current, pitch: { ...current.pitch, allowEnharmonics: event.target.checked } }))} />
                                      Allow enharmonics
                                    </label>
                                  </div>
                                )}

                                {assignmentMode === "interval" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Display type
                                      <select value={theorySettings.interval.playbackType} onChange={(event) => setTheorySettings((current) => ({ ...current, interval: { ...current.interval, playbackType: event.target.value as TheorySettings["interval"]["playbackType"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="ascending">Ascending</option>
                                        <option value="descending">Descending</option>
                                        <option value="harmonic">Harmonic</option>
                                      </select>
                                    </label>
                                    <details className="rounded-xl border border-white/10 p-3">
                                      <summary className="cursor-pointer text-xs font-medium text-zinc-200">Allowed interval answers</summary>
                                      <div className="mt-3 grid grid-cols-2 gap-2">
                                        {defaultTheorySettings.interval.enabledAnswers.map((answer) => (
                                          <label key={answer} className="flex items-center gap-2 text-xs">
                                            <input type="checkbox" checked={theorySettings.interval.enabledAnswers.includes(answer)} onChange={(event) => setTheorySettings((current) => {
                                              const next = event.target.checked ? [...current.interval.enabledAnswers, answer] : current.interval.enabledAnswers.filter((item) => item !== answer);
                                              return { ...current, interval: { ...current.interval, enabledAnswers: next.length ? next : [...defaultTheorySettings.interval.enabledAnswers] } };
                                            })} />
                                            {answer}
                                          </label>
                                        ))}
                                      </div>
                                    </details>
                                  </div>
                                )}

                                {assignmentMode === "scale" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Display type
                                      <select value={theorySettings.scale.playbackType} onChange={(event) => setTheorySettings((current) => ({ ...current, scale: { ...current.scale, playbackType: event.target.value as TheorySettings["scale"]["playbackType"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="ascending">Ascending</option>
                                        <option value="descending">Descending</option>
                                      </select>
                                    </label>
                                    {(Object.entries(theoryOptionLists.scaleGroups) as [string, readonly string[]][]).map(([group, items]) => (
                                      <label key={group} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={items.every((item) => theorySettings.scale.enabledAnswers.includes(item))} onChange={(event) => setGroupedTheoryScale(items, event.target.checked)} />
                                        {group === "common" ? "Common scales" : group === "special" ? "Special scales" : "Modes"}
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {assignmentMode === "chord" && (
                                  <div className="space-y-3">
                                    <label className="text-xs text-zinc-400">
                                      Display type
                                      <select value={theorySettings.chord.playbackType} onChange={(event) => setTheorySettings((current) => ({ ...current, chord: { ...current.chord, playbackType: event.target.value as TheorySettings["chord"]["playbackType"] } }))} className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white">
                                        <option value="blocked">Blocked</option>
                                        <option value="arpeggiated">Arpeggiated</option>
                                      </select>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={theorySettings.chord.includeInversions} onChange={(event) => setTheorySettings((current) => ({ ...current, chord: { ...current.chord, includeInversions: event.target.checked } }))} /> Include inversions</label>
                                    {(Object.entries(theoryOptionLists.chordGroups) as [string, readonly string[]][]).map(([group, items]) => (
                                      <label key={group} className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={items.every((item) => theorySettings.chord.enabledAnswers.includes(item))} onChange={(event) => setGroupedTheoryChord(items, event.target.checked)} />
                                        {group === "triads" ? "Triads" : "7th chords"}
                                      </label>
                                    ))}
                                  </div>
                                )}

                                {assignmentMode === "key-signature" && (
                                  <label className="flex items-center gap-2 text-xs">
                                    <input type="checkbox" checked={theorySettings.keySignature.includeRelativeMinor} onChange={(event) => setTheorySettings((current) => ({ ...current, keySignature: { ...current.keySignature, includeRelativeMinor: event.target.checked } }))} />
                                    Include relative minor questions
                                  </label>
                                )}

                                {assignmentMode === "cadence" && (
                                  <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-400">Cadence assignments use Authentic, Half, Plagal, and Deceptive cadence choices.</p>
                                )}
                              </>
                            )}
                          </div>
                        </details>

                        <button className="w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400">Create assignment</button>
                      </form>
                    </details>

                    <div className="space-y-3">
                      {assignmentRows.length === 0 ? <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-sm text-zinc-400">No assignments yet.</p> : assignmentRows.map((assignment) => (
                        <button key={assignment.id} onClick={() => { setSelectedAssignmentId(assignment.id); setAssignmentDetailOpen(true); }} className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedAssignmentId === assignment.id ? "border-violet-400/70 bg-violet-500/15" : "border-white/10 bg-zinc-950 hover:bg-white/[0.06]"}`}>
                          <p className="font-medium text-white">{assignment.title}</p>
                          <p className="mt-1 text-sm text-zinc-400">{modeLabel(assignment.assignment_type, assignment.mode)} · {assignment.completionCount}/{members.length} complete</p>
                          <p className="mt-1 text-xs text-zinc-500">Avg {assignment.averageScore === null ? "—" : `${assignment.averageScore}%`} · {assignment.unfinishedCount} unfinished · {assignment.missingCount} missing</p>
                        </button>
                      ))}
                    </div>
                  </aside>

                  <main className="min-w-0 rounded-3xl border border-white/10 bg-zinc-950 p-5 md:p-7">
                    {!selectedAssignment ? <p className="text-zinc-400">Select an assignment.</p> : (
                      <>
                        {assignmentDetailOpen && (
                          <button
                            onClick={() => setAssignmentDetailOpen(false)}
                            className="mb-5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                          >
                            Return to class
                          </button>
                        )}
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-2xl font-semibold">{selectedAssignment.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{assignmentTypes.find((item) => item.value === selectedAssignment.assignment_type)?.label} · {modeLabel(selectedAssignment.assignment_type, selectedAssignment.mode)} · {selectedAssignment.question_count} questions</p>
                            <p className="mt-1 text-sm text-zinc-500">Due {formatDueDateTime(selectedAssignment)}</p>
                          </div>
                          <details className="w-full rounded-2xl border border-white/15 bg-black/40 p-4 text-sm text-zinc-300 md:max-w-md">
                            <summary className="cursor-pointer font-medium text-white">Settings saved with assignment</summary>
                            <div className="mt-3 space-y-2">
                              {settingsRowsForAssignment(selectedAssignment).map((row) => (
                                <div key={`${row.label}-${row.value}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{row.label}</p>
                                  <p className="mt-1 leading-6 text-zinc-200">{row.value}</p>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-black p-4"><p className="text-xs text-zinc-500">Complete</p><p className="mt-1 text-2xl font-semibold">{assignmentRows.find((item) => item.id === selectedAssignment.id)?.completionCount ?? 0}/{members.length}</p></div>
                          <div className="rounded-2xl border border-white/10 bg-black p-4"><p className="text-xs text-zinc-500">Average</p><p className="mt-1 text-2xl font-semibold">{assignmentRows.find((item) => item.id === selectedAssignment.id)?.averageScore === null || assignmentRows.find((item) => item.id === selectedAssignment.id)?.averageScore === undefined ? "—" : `${assignmentRows.find((item) => item.id === selectedAssignment.id)?.averageScore}%`}</p></div>
                          <div className="rounded-2xl border border-white/10 bg-black p-4"><p className="text-xs text-zinc-500">Unfinished</p><p className="mt-1 text-2xl font-semibold">{assignmentRows.find((item) => item.id === selectedAssignment.id)?.unfinishedCount ?? 0}</p></div>
                          <div className="rounded-2xl border border-white/10 bg-black p-4"><p className="text-xs text-zinc-500">Missing</p><p className="mt-1 text-2xl font-semibold">{assignmentRows.find((item) => item.id === selectedAssignment.id)?.missingCount ?? 0}</p></div>
                        </div>

                        <div className={`mt-6 grid gap-3 ${assignmentDetailOpen ? "xl:grid-cols-2" : ""}`}>
                          {members.map((member) => {
                            const attempt = attempts.find((item) => item.assignment_id === selectedAssignment.id && item.student_id === member.student_id);
                            const status = assignmentStatus(selectedAssignment, attempt);
                            const notes = assignmentComments.filter((comment) => comment.assignment_id === selectedAssignment.id && comment.student_id === member.student_id);
                            return (
                              <div key={member.id} className="rounded-2xl border border-white/10 bg-black p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <p className="font-medium text-white">{member.profile?.display_name ?? "Student"}</p>
                                    <p className="mt-1 text-sm text-zinc-500">{attemptCompleted(attempt) ? `${attempt?.correct_count}/${attempt?.total_questions} · ${Math.round(Number(attempt?.score ?? 0))}%` : "No completed score"}</p>
                                  </div>
                                  <span className={`rounded-full border px-3 py-1 text-xs ${statusClass(status)}`}>{status}</span>
                                </div>
                                <details className="mt-3">
                                  <summary className="cursor-pointer text-sm text-zinc-300">Student work notes / reassignment comments</summary>
                                  <div className="mt-3 space-y-2">
                                    {notes.map((note) => <p key={note.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">{note.body}</p>)}
                                    <div className="flex gap-2">
                                      <input value={studentNote[member.student_id] ?? ""} onChange={(event) => setStudentNote((current) => ({ ...current, [member.student_id]: event.target.value }))} placeholder="Comment, intervention, or reassignment note..." className="min-w-0 flex-1 rounded-full border border-white/10 bg-zinc-950 px-4 py-2 text-sm text-white" />
                                      <button onClick={() => addStudentAssignmentNote(member.student_id)} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">Add</button>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </main>
                </div>
              )}

              {tab === "roster" && (
                <div className="mt-6 space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4 md:flex-row md:items-center md:justify-between">
                    <label className="flex items-center gap-3 text-sm text-zinc-300">
                      <input type="checkbox" checked={selectedClass.students_can_see_roster ?? true} onChange={(event) => updateClassSetting("students_can_see_roster", event.target.checked)} />
                      Students can see roster
                    </label>
                    <label className="text-sm text-zinc-400">
                      Sort by{" "}
                      <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="rounded-xl border border-white/10 bg-black px-3 py-2 text-white">
                        <option value="name">Name</option>
                        <option value="average">Average</option>
                        <option value="completed">Completed</option>
                        <option value="missing">Missing</option>
                      </select>
                    </label>
                  </div>

                  {rosterRows.length === 0 ? <p className="rounded-2xl border border-white/10 bg-zinc-950 p-5 text-zinc-400">No students have joined yet.</p> : (
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/[0.04] text-zinc-300"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Average</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Unfinished</th><th className="px-4 py-3">Missing</th></tr></thead>
                        <tbody>{rosterRows.map((row) => <tr key={row.student.id} className="border-t border-white/10 text-zinc-300"><td className="px-4 py-3"><p className="font-medium text-white">{row.student.display_name}</p><p className="text-xs text-zinc-500">{row.student.school_name ?? "No school"}</p></td><td className="px-4 py-3">{row.average === null ? "—" : `${row.average}%`}</td><td className="px-4 py-3">{row.completed}</td><td className="px-4 py-3">{row.unfinished}</td><td className="px-4 py-3">{row.missing}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {zoomCode && (
        <button onClick={() => setZoomCode(null)} className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6 text-center">
          <div className="rounded-[2rem] border border-violet-400/50 bg-zinc-950 p-10 shadow-2xl">
            <p className="text-lg text-violet-200">Student join code</p>
            <p className="mt-4 text-7xl font-bold tracking-[0.35em] text-white md:text-9xl">{zoomCode}</p>
            <p className="mt-6 text-sm text-zinc-400">Click anywhere to close</p>
          </div>
        </button>
      )}
    </section>
  );
}
