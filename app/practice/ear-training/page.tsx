import EarTrainingGym from "@/components/EarTrainingGym";

export default function EarTrainingPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10">
        <p className="text-sm font-medium text-violet-300">Practice</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Ear Training Gym
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Train your ear with short, repeatable drills for intervals, chords,
          and cadences. Each answer includes a quick explanation so the practice
          feels less like guessing.
        </p>
      </div>

      <EarTrainingGym />
    </section>
  );
}