"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClassRecord, Profile } from "@/types/database";

type MemberWithProfile = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  profiles: Profile | null;
};

function generateJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

export default function TeacherClassesPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);

  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

    if (!selectedClass && classData && classData.length > 0) {
      setSelectedClass(classData[0]);
      await loadMembers(classData[0].id);
    }

    setLoading(false);
  }

  async function loadMembers(classId: string) {
    setMessage(null);

    const { data: memberData, error: memberError } = await supabase
      .from("class_members")
      .select("id, class_id, student_id, joined_at")
      .eq("class_id", classId)
      .order("joined_at", { ascending: false });

    if (memberError) {
      setMessage(memberError.message);
      return;
    }

    const studentIds = (memberData ?? []).map((member) => member.student_id);

    if (studentIds.length === 0) {
      setMembers([]);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds);

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    const normalizedMembers: MemberWithProfile[] = (memberData ?? []).map(
      (member) => ({
        id: member.id,
        class_id: member.class_id,
        student_id: member.student_id,
        joined_at: member.joined_at,
        profiles:
          profileData?.find((profile) => profile.id === member.student_id) ??
          null,
      })
    );

    setMembers(normalizedMembers);
  }

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    setCreating(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("classes")
      .insert({
        teacher_id: profile.id,
        name: className,
        join_code: generateJoinCode(),
      })
      .select("*")
      .single();

    if (error) {
      setMessage(error.message);
      setCreating(false);
      return;
    }

    setClassName("");
    setClasses((current) => [data, ...current]);
    setSelectedClass(data);
    setMembers([]);
    setCreating(false);
  }

  async function chooseClass(classRecord: ClassRecord) {
    setSelectedClass(classRecord);
    await loadMembers(classRecord.id);
  }

  useEffect(() => {
    loadTeacherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-zinc-400">Loading classes...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Log in needed</h1>
        <p className="mt-4 text-zinc-400">
          Please log in as a teacher to manage classes.
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
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Classes</h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Create a class, share the join code with students, and view your
          roster as students join.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
          {message}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6">
          <form
            onSubmit={createClass}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="text-lg font-semibold">Create class</h2>

            <label className="mt-5 block">
              <span className="text-sm text-zinc-400">Class name</span>
              <input
                required
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="Period 3 Music Theory"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              />
            </label>

            <button
              type="submit"
              disabled={creating}
              className="mt-5 w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create class"}
            </button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">Your classes</h2>

            <div className="mt-5 space-y-3">
              {classes.length === 0 ? (
                <p className="text-sm leading-6 text-zinc-400">
                  No classes yet. Create your first class above.
                </p>
              ) : (
                classes.map((classRecord) => (
                  <button
                    key={classRecord.id}
                    onClick={() => chooseClass(classRecord)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedClass?.id === classRecord.id
                        ? "border-violet-400/70 bg-violet-500/15"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
                    }`}
                  >
                    <p className="font-medium text-white">
                      {classRecord.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      Code: {classRecord.join_code}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <main className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          {selectedClass ? (
            <>
              <p className="text-sm font-medium text-violet-300">
                SELECTED CLASS
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {selectedClass.name}
              </h2>

              <div className="mt-5 rounded-3xl border border-violet-400/30 bg-violet-500/10 p-5">
                <p className="text-sm text-violet-200">Student join code</p>
                <p className="mt-2 text-4xl font-semibold tracking-widest text-white">
                  {selectedClass.join_code}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  Students enter this code from their Student Dashboard.
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold">Roster</h3>

                {members.length === 0 ? (
                  <p className="mt-4 text-zinc-400">
                    No students have joined this class yet.
                  </p>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-zinc-300">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">School</th>
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((member) => (
                          <tr
                            key={member.id}
                            className="border-t border-white/10 text-zinc-300"
                          >
                            <td className="px-4 py-3">
                              {member.profiles?.display_name ?? "Student"}
                            </td>
                            <td className="px-4 py-3">
                              {member.profiles?.school_name ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {new Date(member.joined_at).toLocaleDateString()}
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
              <h2 className="text-2xl font-semibold">No class selected</h2>
              <p className="mt-3 text-zinc-400">
                Create or select a class to view its join code and roster.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}