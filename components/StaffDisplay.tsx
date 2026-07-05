"use client";

import { useEffect, useRef } from "react";
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from "vexflow";
import type { StaffTemplate } from "@/lib/music/staffTemplates";

type StaffDisplayProps = {
  template: StaffTemplate;
};

function pitchToVexKey(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]?)(\d)$/);

  if (!match) {
    return "c/4";
  }

  const [, letter, accidental, octave] = match;
  return `${letter.toLowerCase()}${accidental}/${octave}`;
}

function createStaveNote(pitch: string, duration: string) {
  const match = pitch.match(/^([A-G])([#b]?)(\d)$/);
  const accidental = match?.[2];

  const note = new StaveNote({
    keys: [pitchToVexKey(pitch)],
    duration,
  });

  if (accidental) {
    note.addModifier(new Accidental(accidental), 0);
  }

  return note;
}

export default function StaffDisplay({ template }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const width = 880;
    const height = 180;

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();

    const stave = new Stave(20, 40, width - 40);
    stave
      .addClef(template.clef)
      .addTimeSignature(template.timeSignature)
      .addKeySignature(template.keySignature)
      .setContext(context)
      .draw();

    const notes = template.notes.map((note) =>
      createStaveNote(note.pitch, note.duration)
    );

    const voice = new Voice({
      numBeats: 16,
      beatValue: 4,
    });

    voice.setStrict(false);
    voice.addTickables(notes);

    new Formatter().joinVoices([voice]).format([voice], width - 120);
    voice.draw(context, stave);
  }, [template]);

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white p-4">
      <div ref={containerRef} className="min-w-[880px]" />
    </div>
  );
}