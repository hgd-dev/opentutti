import TheoryTester from "@/components/TheoryTester";

export default function TheoryPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10">
        <p className="text-sm font-medium text-violet-300">Practice</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Theory Tester
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Build basic theory fluency with short questions on notes, key
          signatures, intervals, triads, Roman numerals, and rhythm. Every
          answer includes an explanation so mistakes become review.
        </p>
      </div>

      <TheoryTester />
    </section>
  );
}