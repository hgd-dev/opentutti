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
import type { EarClef } from "@/lib/music/earTraining";

export type StaffChoiceNote = string | string[];

type StaffChoiceProps = {
  notes: StaffChoiceNote[];
  clef?: EarClef;
  keySignature?: string;
  timeSignature?: string;
  width?: number;
  height?: number;
};

function pitchToVexKey(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]{0,2})(\d)$/);

  if (!match) {
    return "c/4";
  }

  const [, letter, accidental, octave] = match;
  return `${letter.toLowerCase()}${accidental}/${octave}`;
}

function createStaveNote(input: StaffChoiceNote, clef: EarClef) {
  const pitches = Array.isArray(input) ? input : [input];

  const note = new StaveNote({
    keys: pitches.map((pitch) => pitchToVexKey(pitch)),
    duration: "q",
    clef,
  });

  pitches.forEach((pitch, index) => {
    const match = pitch.match(/^([A-G])([#b]{0,2})(\d)$/);
    const accidental = match?.[2];

    if (!accidental) return;

    try {
      note.addModifier(new Accidental(accidental), index);
    } catch {
      note.addModifier(new Accidental(accidental));
    }
  });

  return note;
}

export default function StaffChoice({
  notes,
  clef = "treble",
  keySignature,
  timeSignature,
  width = 300,
  height = 125,
}: StaffChoiceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();

    const stave = new Stave(8, 10, width - 16);
    stave.addClef(clef);

    if (keySignature) {
      stave.addKeySignature(keySignature);
    }

    if (timeSignature) {
      stave.addTimeSignature(timeSignature);
    }

    stave.setContext(context).draw();

    const staveNotes = notes.map((pitch) => createStaveNote(pitch, clef));

    if (staveNotes.length > 0) {
      const voice = new Voice({
        numBeats: Math.max(staveNotes.length, 1),
        beatValue: 4,
      });

      voice.setStrict(false);
      voice.addTickables(staveNotes);

      new Formatter().joinVoices([voice]).format([voice], Math.max(120, width - 92));
      voice.draw(context, stave);
    }

    const svg = containerRef.current.querySelector("svg");

    if (svg) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
    }
  }, [notes, clef, keySignature, timeSignature, width, height]);

  return (
    <div
      className="overflow-hidden rounded-3xl bg-white p-2"
      style={{ maxWidth: width, width: "100%" }}
    >
      <div ref={containerRef} />
    </div>
  );
}
