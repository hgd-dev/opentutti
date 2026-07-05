"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [displayName, setDisplayName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  async function createProfile(userId: string) {
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      display_name: displayName || email.split("@")[0],
      role,
      school_name: schoolName || null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function getProfileRole(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.role as "student" | "teacher";
  }

  async function handleSignup() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      setMessage(
        "Account created. Check your email to confirm your account, then log in."
      );
      return;
    }

    await createProfile(data.user.id);

    setDebug(`Signed up user: ${data.user.id}`);
    router.push(role === "teacher" ? "/teacher" : "/student");
    router.refresh();
  }

  async function handleLogin() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Login succeeded but no user object was returned.");
    }

    const userRole = await getProfileRole(data.user.id);

    setDebug(`Logged in user: ${data.user.id}`);
    router.push(userRole === "teacher" ? "/teacher" : "/student");
    router.refresh();
  }

  async function testConnection() {
    setLoading(true);
    setMessage(null);
    setDebug(null);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw new Error(error.message);
      }

      setMessage("Supabase connection works.");
      setDebug(
        data.session
          ? `Current session user: ${data.session.user.email}`
          : "No active session yet."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);
    setDebug(null);

    try {
      if (mode === "signup") {
        await handleSignup();
      } else {
        await handleLogin();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-5 py-16">
      <p className="text-sm font-medium text-violet-300">Account</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        {mode === "signup" ? "Create your Audvyn account" : "Log in"}
      </h1>

      <p className="mt-4 leading-8 text-zinc-400">
        Use a student or teacher account to test Audvyn classroom tools.
      </p>

      <div className="mt-8 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            mode === "signup"
              ? "bg-violet-500 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign up
        </button>

        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            mode === "login"
              ? "bg-violet-500 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Log in
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {mode === "signup" && (
          <>
            <label className="block">
              <span className="text-sm text-zinc-400">I am a</span>
              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "student" | "teacher")
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Test Student"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              />
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">
                School name optional
              </span>
              <input
                value={schoolName}
                onChange={(event) => setSchoolName(event.target.value)}
                placeholder="Audvyn Test School"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="text-sm text-zinc-400">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-400">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
          />
        </label>

        {message && (
          <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
            {message}
          </div>
        )}

        {debug && (
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4 text-xs leading-6 text-zinc-400">
            {debug}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Working..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>

        <button
          type="button"
          onClick={testConnection}
          disabled={loading}
          className="w-full rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Test Supabase connection
        </button>
      </form>
    </section>
  );
}