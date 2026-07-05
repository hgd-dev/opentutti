import type { ReactNode } from "react";
import Link from "next/link";

type FeatureCardProps = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
};

export default function FeatureCard({
  title,
  description,
  href,
  icon,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-violet-400/60 hover:bg-white/[0.06]"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
        {icon}
      </div>

      <h3 className="text-xl font-semibold text-white">{title}</h3>

      <p className="mt-3 leading-7 text-zinc-400">{description}</p>

      <p className="mt-5 text-sm font-medium text-violet-300 group-hover:text-violet-200">
        Open tool →
      </p>
    </Link>
  );
}