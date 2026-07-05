import Link from "next/link";

export default function TeacherPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-sm font-medium text-violet-300">Dashboard</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Teacher Dashboard
      </h1>
      <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
        Create classes, assign practice sets, and track student progress.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/teacher/classes"
          className="rounded-full bg-violet-500 px-6 py-3 text-center font-medium text-white hover:bg-violet-400"
        >
          Classes
        </Link>

        <Link
          href="/teacher/assignments"
          className="rounded-full border border-white/15 px-6 py-3 text-center font-medium text-white hover:bg-white/10"
        >
          Assignments
        </Link>
      </div>
    </section>
  );
}