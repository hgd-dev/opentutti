import TheoryTester from "@/components/TheoryTester";

export default function TheoryPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10">
        <p className="text-sm font-medium text-violet-300">Practice</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Theory Testing Gym
        </h1>
        <p className="mt-4 max-w-3xl leading-8 text-zinc-400">
          Build written music theory fluency with staff-based drills for pitch,
          intervals, scales, chords, cadences, and key signatures. Every question
          shows notation first, then explains the answer after you submit.
        </p>
      </div>

      <TheoryTester />
    </section>
  );
}
