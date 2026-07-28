import Image from "next/image";
import { siteConfig } from "@/lib/siteConfig";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <p className="text-sm font-medium text-violet-300">About Us</p>
      {/* <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        About OpenTutti
      </h1> */}
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-5.5">
          <p className="text-zinc-300 md:text-[30px]">
            About OpenTutti
          </p>
          <p className="leading-8 text-zinc-300">
            OpenTutti is a free music education platform built to connect written theory with real listening and practice.
            We believe music theory should not be memorized in isolation. Students should be able to hear it, recognize it, and use it in the music they perform.
          </p>
          <p className="mt-5 leading-8 text-zinc-300">
            Our mission is to make that kind of practical music learning accessible to every student.
          </p>
          <p className="mt-5 leading-8 text-zinc-300 md:text-[27px]">
            Founded by a Musician and Student
          </p>
          <p className="mt-5 leading-8 text-zinc-300">
            Hudson Dong, Founder of OpenTutti, is a pianist and composer of Stuyvesant High School's Class of 2027. He created OpenTutti after seeing how often music theory, ear training, and performance are sparsely taught and even then as separate subjects.
            <br />
            Hudson is a 2026 YoungArts Winner in Classical Solo Piano and earned second place in the 2026 MTNA Eastern Division Senior Piano Competition. In 2026, he was admitted into and attended the 2026 Aspen Music Festival and School Summer Program, awarded the full YoungArts Creative Opportunities Fellow scholarship there as well.  In 2025, he placed second nationally in the MTNA Junior Piano Competition and received the MTNA Ebony Award. He is also a multi-year winner in the New York MTNA Composition Competition and serves as Stuyvesant's choral accompanist.
            <br />
            His work also extends into mathematics and computer science, with first-place finishes in New York City mathematics competitions, recognition in the MCM and M3 modeling competitions, and achievement in the USACO Gold division.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-3">
          <Image
            src="/IMG_E8065.JPG"
            alt="Hudson Dong, founder of OpenTutti"
            width={900}
            height={1100}
            priority
            className="aspect-[4/5] w-full rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}
