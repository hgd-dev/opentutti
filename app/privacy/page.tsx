export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>

      <p className="mt-5 leading-8 text-zinc-300">
        Audvyn is currently in beta. The goal is to collect only the minimum
        information needed for classroom practice, such as account role, class
        membership, assignments, and practice results.
      </p>

      <p className="mt-4 leading-8 text-zinc-300">
        Sight-singing audio should be analyzed in the browser whenever possible
        and should not be stored by default.
      </p>
    </section>
  );
}