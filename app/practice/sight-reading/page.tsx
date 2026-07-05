import SightReadingCoach from "@/components/SightReadingCoach";

export default function SightReadingPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10">
        <p className="text-sm font-medium text-violet-300">Practice</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Sight-Reading Coach
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Generate short melodies, hear the starting pitch, practice reading
          before playback, and reveal note names when you are ready to check
          yourself.
        </p>
      </div>

      <SightReadingCoach />
    </section>
  );
}