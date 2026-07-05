import Link from "next/link";
import { Music2 } from "lucide-react";

const navItems = [
  { href: "/practice/ear-training", label: "Ear Training" },
  { href: "/practice/theory", label: "Theory" },
  { href: "/practice/sight-reading", label: "Sight-Reading" },
  { href: "/staff-lab", label: "Staff Lab" },
  { href: "/teacher", label: "Teacher" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Audvyn</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
        >
          Log in
        </Link>
      </div>
    </header>
  );
}