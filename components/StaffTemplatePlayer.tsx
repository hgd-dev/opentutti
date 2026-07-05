"use client";

import { useMemo, useState } from "react";
import * as Tone from "tone";
import StaffDisplay from "@/components/StaffDisplay";
import {
  staffTemplates,
  StaffNote,
  StaffTemplate,
} from "@/lib/music/staffTemplates";

const pitchOptions = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
];

const durationOptions: {
  value: StaffNote["duration"];
  label: string;
}[] = [
  { value: "q", label: "Quarter" },
  { value: "h", label: "Half" },
  { value: "w", label: "Whole" },
  { value: "8", label: "Eighth" },
];

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

async function playTemplate(template: StaffTemplate) {
  await Tone.start();

  const synth = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.5,
      release: 0.5,
    },
  }).toDestination();

  const now = Tone.now();
  let offset = 0;

  template.notes.forEach((note) => {
    synth.triggerAttackRelease(
      note.pitch,
      durationToTone(note.duration),
      now + offset
    );

    offset += durationToSeconds(note.duration, template.tempo);
  });

  setTimeout(() => {
    synth.dispose();
  }, offset * 1000 + 1000);
}

function cloneTemplate(template: StaffTemplate): StaffTemplate {
  return {
    ...template,
    notes: template.notes.map((note) => ({ ...note })),
  };
}

export default function StaffTemplatePlayer() {
  const [selectedId, setSelectedId] = useState(staffTemplates[0].id);
  const [workingTemplate, setWorkingTemplate] = useState<StaffTemplate>(() =>
    cloneTemplate(staffTemplates[0])
  );
  const [selectedPitch, setSelectedPitch] = useState("C4");
  const [selectedDuration, setSelectedDuration] =
    useState<StaffNote["duration"]>("q");

  const selectedOriginal = useMemo(() => {
    return (
      staffTemplates.find((template) => template.id === selectedId) ??
      staffTemplates[0]
    );
  }, [selectedId]);

  function chooseTemplate(template: StaffTemplate) {
    setSelectedId(template.id);
    setWorkingTemplate(cloneTemplate(template));
  }

  function addNote() {
    setWorkingTemplate((current) => ({
      ...current,
      notes: [
        ...current.notes,
        {
          pitch: selectedPitch,
          duration: selectedDuration,
        },
      ],
    }));
  }

  function deleteLastNote() {
    setWorkingTemplate((current) => ({
      ...current,
      notes: current.notes.slice(0, -1),
    }));
  }

  function resetTemplate() {
    setWorkingTemplate(cloneTemplate(selectedOriginal));
  }

  function clearNotes() {
    setWorkingTemplate((current) => ({
      ...current,
      notes: [],
    }));
  }

  function changeTempo(value: string) {
    const tempo = Number(value);

    if (Number.isNaN(tempo)) return;

    setWorkingTemplate((current) => ({
      ...current,
      tempo,
    }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold">Teaching templates</h2>

        <div className="mt-5 space-y-3">
          {staffTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => chooseTemplate(template)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedId === template.id
                  ? "border-violet-400/70 bg-violet-500/15"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
              }`}
            >
              <p className="font-medium text-white">{template.title}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">STAFF LAB</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              {workingTemplate.title}
            </h2>
            <p className="mt-3 max-w-2xl leading-8 text-zinc-400">
              {workingTemplate.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-300">
              <span className="rounded-full border border-white/10 px-3 py-1">
                Key: {workingTemplate.keySignature}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Time: {workingTemplate.timeSignature}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Notes: {workingTemplate.notes.length}
              </span>
            </div>
          </div>

          <button
            onClick={() => playTemplate(workingTemplate)}
            disabled={workingTemplate.notes.length === 0}
            className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play
          </button>
        </div>

        <div className="mt-8">
          {workingTemplate.notes.length > 0 ? (
            <StaffDisplay template={workingTemplate} />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-10 text-center text-zinc-400">
              No notes yet. Add notes below to build a melody.
            </div>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <h3 className="text-lg font-semibold text-white">Edit notes</h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm text-zinc-400">Pitch</span>
              <select
                value={selectedPitch}
                onChange={(event) => setSelectedPitch(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              >
                {pitchOptions.map((pitch) => (
                  <option key={pitch} value={pitch}>
                    {pitch}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Duration</span>
              <select
                value={selectedDuration}
                onChange={(event) =>
                  setSelectedDuration(event.target.value as StaffNote["duration"])
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              >
                {durationOptions.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-400">Tempo</span>
              <input
                type="number"
                min="40"
                max="180"
                value={workingTemplate.tempo}
                onChange={(event) => changeTempo(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-violet-400"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={addNote}
              className="rounded-full bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
            >
              Add note
            </button>

            <button
              onClick={deleteLastNote}
              disabled={workingTemplate.notes.length === 0}
              className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete last note
            </button>

            <button
              onClick={resetTemplate}
              className="rounded-full border border-white/15 px-5 py-3 font-medium text-white hover:bg-white/10"
            >
              Reset template
            </button>

            <button
              onClick={clearNotes}
              className="rounded-full border border-red-400/40 px-5 py-3 font-medium text-red-200 hover:bg-red-500/10"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-5">
          <h3 className="font-semibold text-white">Current note sequence</h3>

          {workingTemplate.notes.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {workingTemplate.notes.map((note, index) => (
                <span
                  key={`${note.pitch}-${note.duration}-${index}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-zinc-200"
                >
                  {index + 1}. {note.pitch} / {note.duration}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-zinc-400">No notes in the current melody.</p>
          )}
        </div>
      </section>
    </div>
  );
}