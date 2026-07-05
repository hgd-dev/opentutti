import StaffTemplatePlayer from "@/components/StaffTemplatePlayer";

export default function StaffLabPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-10">
        <p className="text-sm font-medium text-violet-300">Create</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Staff Lab
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
          Use simple staff-based templates to teach scales, intervals, triads,
          cadences, rhythm, and dictation. This is the foundation for Audvyn’s
          classroom staff workspace.
        </p>
      </div>

      <StaffTemplatePlayer />
    </section>
  );
}