"use client";

import { useState } from "react";
import * as Tone from "tone";
import StaffDisplay from "@/components/StaffDisplay";
import {
  generateSightReadingMelody,
  sightReadingLevels,
  SightReadingLevel,
  SightReadingMelody,
} from "@/lib/music/sightReading";

function durationToTone(duration: string) {
  if (duration === "w") return "1n";
  if (duration === "h") return "2n";
  if (duration === "8") return "8n";
  return "4n";
}

function durationToSeconds(duration: string, tempo: number) {
  const quarter = 60 / tempo;

  if (duration === "w") return quarter * 4;
  if (duration === "h") return quarter * 2;
  if (duration === "8") return quarter / 2;
  return quarter;
}

async function playStartingPitch(melody: SightReadingMelody) {
  await Tone.start();

  const synth = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.6,
      release: 0.8,
    },
  }).toDestination();

  synth.triggerAttackRelease(melody.notes[0].pitch, "2n");

  setTimeout(() => {
    synth.dispose();
  }, 1600);
}

async function playMelody(melody: SightReadingMelody) {
  await Tone.start();

  const synth = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.55,
      release: 0.45,
    },
  }).toDestination();

  const now = Tone.now();
  let offset = 0;

  melody.notes.forEach((note) => {
    synth.triggerAttackRelease(
      note.pitch,
      durationToTone(note.duration),
      now + offset
    );

    offset += durationToSeconds(note.duration, melody.tempo);
  });

  setTimeout(() => {
    synth.dispose();
  }, offset * 1000 + 1000);
}

export default function SightReadingCoach() {
  const [level, setLevel] = useState<SightReadingLevel>("level-1");
  const [melody, setMelody] = useState<SightReadingMelody>(() =>
    generateSightReadingMelody("level-1")
  );
  const [showAnswer, setShowAnswer] = useState(false);

  function changeLevel(nextLevel: SightReadingLevel) {
    setLevel(nextLevel);
    setMelody(generateSightReadingMelody(nextLevel));
    setShowAnswer(false);
  }

  function newMelody() {
    setMelody(generateSightReadingMelody(level));
    setShowAnswer(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold">Choose difficulty</h2>

        <div className="mt-5 space-y-3">
          {sightReadingLevels.map((item) => (
            <button
              key={item.value}
              onClick={() => changeLevel(item.value)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                level === item.value
                  ? "border-violet-400/70 bg-violet-500/15"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
              }`}
            >
              <p className="font-medium text-white">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {item.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">How to use this</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-300">
            <li>Look through the melody first.</li>
            <li>Play the starting pitch.</li>
            <li>Try to sing or play it yourself.</li>
            <li>Reveal notes or play the full melody to check.</li>
          </ol>
        </div>
      </aside>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">
              SIGHT-READING COACH
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {melody.title}
            </h2>
            <p className="mt-3 max-w-2xl leading-8 text-zinc-400">
              {melody.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-300">
              <span className="rounded-full border border-white/10 px-3 py-1">
                Key: {melody.keySignature}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Time: {melody.timeSignature}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Tempo: {melody.tempo}
              </span>
            </div>
          </div>

          <button
            onClick={newMelody}
            className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
          >
            New melody
          </button>
        </div>

        <div className="mt-8">
          <StaffDisplay template={melody} />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => playStartingPitch(melody)}
            className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
          >
            Play starting pitch
          </button>

          <button
            onClick={() => playMelody(melody)}
            className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
          >
            Play full melody
          </button>

          <button
            onClick={() => setShowAnswer((current) => !current)}
            className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
          >
            {showAnswer ? "Hide note names" : "Reveal note names"}
          </button>
        </div>

        {showAnswer && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <h3 className="font-semibold text-white">Note names</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {melody.noteNames.map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-zinc-200"
                >
                  {index + 1}. {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <h3 className="font-semibold text-white">Sight-reading tips</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-zinc-400">
            {melody.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}