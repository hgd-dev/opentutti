export default function DemoPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-sm font-medium text-violet-300">Demo</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        OpenTutti Demo
      </h1>
      <p className="mt-4 max-w-3xl leading-8 text-zinc-400">
        Watch a walkthrough of OpenTutti&apos;s classroom practice tools, teacher
        and student workflows, sight-reading generator, and OpenTuttiLab workspace.
      </p>

      <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-black/30">
        <video
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black"
        >
          <source src="/OpenTuttiDemoFinal.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
