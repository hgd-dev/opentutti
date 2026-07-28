"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import OpenTuttiMultiStaffScore, {
  OpenTuttiScoreTarget,
} from "@/components/OpenTuttiMultiStaffScore";
import {
  staffTemplates,
  StaffClef,
  StaffDuration,
  StaffNote,
  StaffPart,
  StaffTemplate,
} from "@/lib/music/staffTemplates";

type EditMode = "note" | "insert" | "erase";
type TripletDuration = "16" | "8" | "q";
type DragState = { staffId: string; noteIndex: number } | null;

const clefOptions: StaffClef[] = ["treble", "bass", "alto", "tenor"];
const timeSignatures = ["2/4", "3/4", "4/4", "6/8"];
const keySignatures = ["C", "G", "D", "A", "E", "B", "F#", "C#", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
const soundModes: StaffPart["instrument"][] = ["lead", "piano", "bass", "strings", "bell"];
const accidentalOptions = [
  { value: "-2", label: "-- (double flat)" },
  { value: "-1", label: "- (flat)" },
  { value: "0", label: "neutral (natural)" },
  { value: "1", label: "+ (sharp)" },
  { value: "2", label: "++ (double sharp)" },
];

const durationOptions: { value: StaffDuration; label: string }[] = [
  { value: "16", label: "16th" },
  { value: "8", label: "8th" },
  { value: "8d", label: "Dotted 8th" },
  { value: "q", label: "Quarter" },
  { value: "qd", label: "Dotted quarter" },
  { value: "h", label: "Half" },
  { value: "hd", label: "Dotted half" },
  { value: "w", label: "Whole" },
];

const tripletOptions: {
  value: TripletDuration;
  label: string;
  kind: NonNullable<StaffNote["tupletKind"]>;
  actualBeats: number;
}[] = [
  { value: "16", label: "16th triplet", kind: "sixteenth-triplet", actualBeats: 1 / 6 },
  { value: "8", label: "8th triplet", kind: "eighth-triplet", actualBeats: 1 / 3 },
  { value: "q", label: "Quarter triplet", kind: "quarter-triplet", actualBeats: 2 / 3 },
];

function durationToTone(duration: StaffDuration | string) {
  if (duration === "w") return "1n";
  if (duration === "hd" || duration === "h") return "2n";
  if (duration === "8" || duration === "8d") return "8n";
  if (duration === "16") return "16n";
  return "4n";
}

function durationToSeconds(duration: StaffDuration | string, tempo: number) {
  const quarter = 60 / tempo;
  if (duration === "w") return quarter * 4;
  if (duration === "hd") return quarter * 3;
  if (duration === "h") return quarter * 2;
  if (duration === "qd") return quarter * 1.5;
  if (duration === "q") return quarter;
  if (duration === "8d") return quarter * 0.75;
  if (duration === "8") return quarter / 2;
  return quarter / 4;
}

function noteBeats(duration: StaffDuration | string) {
  if (duration === "w") return 4;
  if (duration === "hd") return 3;
  if (duration === "h") return 2;
  if (duration === "qd") return 1.5;
  if (duration === "q") return 1;
  if (duration === "8d") return 0.75;
  if (duration === "8") return 0.5;
  return 0.25;
}

function staffNoteBeats(note: StaffNote) {
  return note.actualBeats ?? noteBeats(note.duration);
}

function timeSignatureBeats(timeSignature: string) {
  if (timeSignature === "2/4") return 2;
  if (timeSignature === "3/4") return 3;
  if (timeSignature === "6/8") return 3;
  return 4;
}

function pitchWithAccidental(basePitch: string, accidental: string) {
  return basePitch.replace(/^([A-G])/, `$1${accidental}`);
}

const keyAccidentals: Record<string, Record<string, string>> = {
  G: { F: "#" },
  D: { F: "#", C: "#" },
  A: { F: "#", C: "#", G: "#" },
  E: { F: "#", C: "#", G: "#", D: "#" },
  B: { F: "#", C: "#", G: "#", D: "#", A: "#" },
  "F#": { F: "#", C: "#", G: "#", D: "#", A: "#", E: "#" },
  "C#": { F: "#", C: "#", G: "#", D: "#", A: "#", E: "#", B: "#" },
  F: { B: "b" },
  Bb: { B: "b", E: "b" },
  Eb: { B: "b", E: "b", A: "b" },
  Ab: { B: "b", E: "b", A: "b", D: "b" },
  Db: { B: "b", E: "b", A: "b", D: "b", G: "b" },
  Gb: { B: "b", E: "b", A: "b", D: "b", G: "b", C: "b" },
  Cb: { B: "b", E: "b", A: "b", D: "b", G: "b", C: "b", F: "b" },
};

const naturalSemitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const sharpSpellings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const flatSpellings = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function parsePitch(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]{0,2})(-?\d)$/);
  return {
    letter: match?.[1] ?? "C",
    accidental: match?.[2] ?? "",
    octave: Number(match?.[3] ?? 4),
  };
}

function accidentalToOffset(accidental: string) {
  if (accidental === "bb") return -2;
  if (accidental === "b") return -1;
  if (accidental === "#") return 1;
  if (accidental === "##") return 2;
  return 0;
}

function offsetToAccidental(offset: number) {
  if (offset <= -2) return "bb";
  if (offset === -1) return "b";
  if (offset === 1) return "#";
  if (offset >= 2) return "##";
  return "";
}

function controlOffset(value: string) {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? 0 : Math.max(-2, Math.min(2, numeric));
}

function applyAccidentalControl(basePitch: string, keySignature: string, controlValue: string) {
  const parsed = parsePitch(basePitch);
  const keyAccidental = keyAccidentals[keySignature]?.[parsed.letter] ?? "";
  const accidental = offsetToAccidental(accidentalToOffset(keyAccidental) + controlOffset(controlValue));
  return `${parsed.letter}${accidental}${parsed.octave}`;
}

function pitchToMidi(pitch: string) {
  const parsed = parsePitch(pitch);
  return (parsed.octave + 1) * 12 + (naturalSemitones[parsed.letter] ?? 0) + accidentalToOffset(parsed.accidental);
}

function midiToSpelledPitch(midi: number, direction: 1 | -1) {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const spelling = direction > 0 ? sharpSpellings[semitone] : flatSpellings[semitone];
  return `${spelling}${octave}`;
}

function transposePitch(pitch: string, direction: 1 | -1) {
  return midiToSpelledPitch(pitchToMidi(pitch) + direction, direction);
}

function pitchToTonePitch(pitch: string) {
  const midi = pitchToMidi(pitch);
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  return `${sharpSpellings[semitone]}${octave}`;
}

function cloneTemplate(template: StaffTemplate): StaffTemplate {
  const staves = (template.staves?.length
    ? template.staves
    : [
        {
          id: "staff-1",
          name: "Staff 1",
          clef: template.clef,
          instrument: "lead",
          notes: template.notes,
        } as StaffPart,
      ]
  ).map((staff) => ({
    ...staff,
    notes: staff.notes.map((note) => ({ ...note })),
  }));

  const base = {
    ...template,
    notes: staves[0]?.notes.map((note) => ({ ...note })) ?? [],
    staves,
  };

  return {
    ...base,
    measureCount: Math.max(template.measureCount ?? 1, neededMeasuresForTemplate(base)),
  };
}

function normalizeTemplate(template: StaffTemplate): StaffTemplate {
  const cloned = cloneTemplate(template);
  return { ...cloned, notes: cloned.staves?.[0]?.notes ?? cloned.notes };
}

function synthForMode(mode: StaffPart["instrument"]) {
  if (mode === "bass") {
    return new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.02, decay: 0.12, sustain: 0.7, release: 0.45 },
    }).toDestination();
  }

  if (mode === "strings") {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.08, decay: 0.18, sustain: 0.72, release: 0.8 },
    }).toDestination();
  }

  if (mode === "bell") {
    return new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 0.45, sustain: 0.12, release: 1.1 },
    }).toDestination();
  }

  if (mode === "piano") {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.22, sustain: 0.22, release: 0.55 },
    }).toDestination();
  }

  return new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.5 },
  }).toDestination();
}

function totalSecondsForTemplate(template: StaffTemplate) {
  const staves = template.staves?.length ? template.staves : [{ notes: template.notes } as StaffPart];
  return Math.max(
    0,
    ...staves.map((staff) =>
      staff.notes.reduce((sum, note) => sum + durationToSeconds(note.duration, template.tempo), 0),
    ),
  );
}

function neededMeasuresForTemplate(template: StaffTemplate) {
  const beatsPerMeasure = timeSignatureBeats(template.timeSignature);
  const staves = template.staves?.length ? template.staves : [{ notes: template.notes } as StaffPart];
  const maxBeats = Math.max(
    0,
    ...staves.map((staff) => staff.notes.reduce((sum, note) => sum + staffNoteBeats(note), 0)),
  );
  return Math.max(1, Math.ceil(maxBeats / beatsPerMeasure));
}

function measureMessage(
  notes: StaffNote[],
  insertionIndex: number,
  duration: StaffDuration,
  timeSignature: string,
  autoJump: boolean,
) {
  const beatsPerMeasure = timeSignatureBeats(timeSignature);
  const beatsBefore = notes.slice(0, insertionIndex).reduce((sum, note) => sum + staffNoteBeats(note), 0);
  const usedInMeasure = beatsBefore % beatsPerMeasure;
  const nextBeats = noteBeats(duration);

  if (usedInMeasure + nextBeats > beatsPerMeasure + 0.001) {
    return autoJump
      ? "That note would overflow this measure, so OpenTuttiLab will continue into the next measure."
      : "Heads up: that input overfills the current measure. Turn on auto-measure jumping or use a shorter duration.";
  }

  return "";
}

function displayDuration(duration: StaffDuration | string) {
  return durationOptions.find((item) => item.value === duration)?.label ?? duration;
}

function toolbarButtonClass(active: boolean, tone: "green" | "violet" | "red" | "white" = "white") {
  if (active && tone === "green") return "border-emerald-400 bg-emerald-500/15 text-emerald-100";
  if (active && tone === "violet") return "border-violet-400 bg-violet-500/15 text-white";
  if (active && tone === "red") return "border-red-400 bg-red-500/15 text-red-100";
  return "border-white/15 text-white hover:bg-white/10";
}

export default function StaffTemplatePlayer() {
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(staffTemplates[0].id);
  const [score, setScore] = useState<StaffTemplate>(() => normalizeTemplate(staffTemplates[0]));
  const [selectedStaffId, setSelectedStaffId] = useState(score.staves?.[0]?.id ?? "staff-1");
  const [selectedDuration, setSelectedDuration] = useState<StaffDuration>("q");
  const [selectedAccidental, setSelectedAccidental] = useState("0");
  const [isRestInput, setIsRestInput] = useState(false);
  const [autoMeasureJump, setAutoMeasureJump] = useState(true);
  const [editMode, setEditMode] = useState<EditMode>("note");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [draggingNote, setDraggingNote] = useState<DragState>(null);
  const [labMessage, setLabMessage] = useState(
    "Click inside a staff to add notes. Hover outside a staff is ignored so nearby staves do not misfire.",
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopHandles = useRef<ReturnType<typeof setTimeout>[]>([]);

  const staves = score.staves?.length ? score.staves : [];
  const selectedStaff = staves.find((staff) => staff.id === selectedStaffId) ?? staves[0];
  const totalSeconds = totalSecondsForTemplate(score);
  const progressPercent = totalSeconds > 0 ? Math.min(100, (playheadSeconds / totalSeconds) * 100) : 0;

  const selectedOriginal = useMemo(
    () => staffTemplates.find((template) => template.id === selectedTemplateId) ?? staffTemplates[0],
    [selectedTemplateId],
  );

  function stopPlayback() {
    stopHandles.current.forEach((handle) => clearTimeout(handle));
    stopHandles.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
  }

  useEffect(() => () => stopPlayback(), []);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable) return;
      if (!selectedStaff || selectedNoteIndex === null) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        transposeSelectedNote(1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        transposeSelectedNote(-1);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        turnSelectedNoteIntoRest();
      } else if (event.key === "Delete") {
        event.preventDefault();
        removeNoteAt(selectedStaff.id, selectedNoteIndex);
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [selectedStaff, selectedNoteIndex, staves, score]);

  function chooseTemplate(template: StaffTemplate) {
    stopPlayback();
    const next = normalizeTemplate(template);
    setSelectedTemplateId(template.id);
    setScore(next);
    setSelectedStaffId(next.staves?.[0]?.id ?? "staff-1");
    setSelectedNoteIndex(null);
    setPlayheadSeconds(0);
    setLabMessage(template.id === "blank-score" ? "Blank score ready. Click the connected staff system to start writing." : `${template.title} loaded.`);
  }

  function updateScore(update: (current: StaffTemplate) => StaffTemplate) {
    setScore((current) => {
      const next = update(current);
      return { ...next, notes: next.staves?.[0]?.notes ?? next.notes };
    });
  }

  function updateSelectedStaff(update: (staff: StaffPart) => StaffPart) {
    updateScore((current) => ({
      ...current,
      staves: (current.staves ?? []).map((staff) => (staff.id === selectedStaffId ? update(staff) : staff)),
    }));
  }

  function setScoreField<K extends keyof Pick<StaffTemplate, "title" | "description" | "keySignature" | "timeSignature" | "tempo">>(
    key: K,
    value: StaffTemplate[K],
  ) {
    updateScore((current) => ({ ...current, [key]: value }));
  }

  function addStaff(clef: StaffClef = "treble") {
    updateScore((current) => {
      const id = `staff-${Date.now()}`;
      const nextStaff: StaffPart = {
        id,
        name: `Staff ${(current.staves?.length ?? 0) + 1}`,
        clef,
        instrument: clef === "bass" ? "bass" : "lead",
        notes: [],
      };
      setSelectedStaffId(id);
      setSelectedNoteIndex(null);
      return { ...current, staves: [...(current.staves ?? []), nextStaff] };
    });
  }

  function removeSelectedStaff() {
    if (staves.length <= 1 || !selectedStaff) return;
    updateScore((current) => {
      const nextStaves = (current.staves ?? []).filter((staff) => staff.id !== selectedStaff.id);
      setSelectedStaffId(nextStaves[0]?.id ?? "staff-1");
      setSelectedNoteIndex(null);
      return { ...current, staves: nextStaves };
    });
  }

  function clearSelectedStaff() {
    updateSelectedStaff((staff) => ({ ...staff, notes: [] }));
    setSelectedNoteIndex(null);
    setLabMessage("Selected staff cleared.");
  }

  function clearAllStaves() {
    updateScore((current) => ({
      ...current,
      staves: (current.staves ?? []).map((staff) => ({ ...staff, notes: [] })),
    }));
    setSelectedNoteIndex(null);
    setLabMessage("All staves cleared.");
  }

  function addMeasure() {
    updateScore((current) => ({ ...current, measureCount: Math.max(1, (current.measureCount ?? 1) + 1) }));
    setLabMessage("Added one empty measure to the right side of the connected score.");
  }

  function removeMeasure() {
    updateScore((current) => {
      const required = neededMeasuresForTemplate(current);
      const nextCount = Math.max(1, (current.measureCount ?? required) - 1);
      if (nextCount < required) {
        setLabMessage("That measure is needed by existing notes. Delete notes first to remove it.");
        return { ...current, measureCount: required };
      }
      setLabMessage("Removed one empty measure from the right side of the score.");
      return { ...current, measureCount: nextCount };
    });
  }

  function resetTemplate() {
    chooseTemplate(selectedOriginal);
  }

  function insertNote(staff: StaffPart, pitch: string, index: number) {
    const newNote: StaffNote = { pitch, duration: selectedDuration, isRest: isRestInput };
    const warning = measureMessage(staff.notes, index, selectedDuration, score.timeSignature, autoMeasureJump);

    updateScore((current) => {
      const nextStaves = (current.staves ?? []).map((currentStaff) =>
        currentStaff.id === staff.id
          ? {
              ...currentStaff,
              notes: [
                ...currentStaff.notes.slice(0, index),
                newNote,
                ...currentStaff.notes.slice(index),
              ],
            }
          : currentStaff,
      );
      const nextScore = { ...current, staves: nextStaves };
      const needed = neededMeasuresForTemplate(nextScore);
      return {
        ...nextScore,
        measureCount: autoMeasureJump ? Math.max(current.measureCount ?? 1, needed) : current.measureCount,
      };
    });

    setSelectedStaffId(staff.id);
    setSelectedNoteIndex(index);
    setLabMessage(warning || `Inserted ${isRestInput ? "rest" : pitch} at position ${index + 1}.`);
  }

  function removeNoteAt(staffId: string, index: number | null) {
    if (index === null) return;
    const sourceStaff = staves.find((staff) => staff.id === staffId);
    if (!sourceStaff || index < 0 || index >= sourceStaff.notes.length) return;
    const removed = sourceStaff.notes[index];

    updateScore((current) => ({
      ...current,
      staves: (current.staves ?? []).map((staff) =>
        staff.id === staffId
          ? { ...staff, notes: staff.notes.filter((_, noteIndex) => noteIndex !== index) }
          : staff,
      ),
    }));

    setSelectedStaffId(staffId);
    setSelectedNoteIndex(null);
    setLabMessage(`Removed ${removed.isRest ? "rest" : removed.pitch}.`);
  }

  function updateNotePitch(staffId: string, noteIndex: number, pitch: string) {
    updateScore((current) => ({
      ...current,
      staves: (current.staves ?? []).map((staff) =>
        staff.id === staffId
          ? {
              ...staff,
              notes: staff.notes.map((note, index) =>
                index === noteIndex && !note.isRest ? { ...note, pitch } : note,
              ),
            }
          : staff,
      ),
    }));
  }

  function handleNotePointerDown(staff: StaffPart, noteIndex: number) {
    setSelectedStaffId(staff.id);
    setSelectedNoteIndex(noteIndex);
    setDraggingNote({ staffId: staff.id, noteIndex });
    setLabMessage("Drag the note up or down on its staff to change pitch.");
  }

  function stopNoteDrag() {
    if (draggingNote) setLabMessage("Note pitch updated.");
    setDraggingNote(null);
  }

  function addTriplet(duration: TripletDuration) {
    if (!selectedStaff) return;
    const option = tripletOptions.find((item) => item.value === duration) ?? tripletOptions[1];
    const group = `triplet-${Date.now()}`;
    const middle = Math.max(0, Math.floor(selectedStaff.notes.length / 2));
    const pitches = ["E4", "G4", "B4"].map((pitch) => applyAccidentalControl(pitch, score.keySignature, selectedAccidental));
    const tripletNotes: StaffNote[] = pitches.map((pitch, index) => ({
      pitch,
      duration: option.value,
      actualBeats: option.actualBeats,
      tupletGroup: group,
      tupletKind: option.kind,
      tupletIndex: index,
      tupletTotal: 3,
      tupletNotesOccupied: 2,
    }));

    updateSelectedStaff((staff) => ({
      ...staff,
      notes: [...staff.notes.slice(0, middle), ...tripletNotes, ...staff.notes.slice(middle)],
    }));
    setSelectedNoteIndex(middle);
    setLabMessage(`Added a ${option.label} group. Select and drag each note to adjust pitch.`);
  }

  function handleScoreTargetClick(target: OpenTuttiScoreTarget) {
    const targetStaff = staves.find((staff) => staff.id === target.staffId);
    if (!targetStaff) return;

    setSelectedStaffId(target.staffId);

    if (editMode === "erase") {
      removeNoteAt(target.staffId, target.nearestNoteIndex);
      return;
    }

    insertNote(targetStaff, target.pitch, target.insertionIndex);
  }

  function updateSelectedNote(update: (note: StaffNote) => StaffNote) {
    if (!selectedStaff || selectedNoteIndex === null) return;

    updateScore((current) => ({
      ...current,
      staves: (current.staves ?? []).map((staff) =>
        staff.id === selectedStaff.id
          ? {
              ...staff,
              notes: staff.notes.map((note, index) => (index === selectedNoteIndex ? update(note) : note)),
            }
          : staff,
      ),
    }));
  }

  function transposeSelectedNote(direction: 1 | -1) {
    if (!selectedStaff || selectedNoteIndex === null) return;
    const selected = selectedStaff.notes[selectedNoteIndex];
    if (!selected || selected.isRest) return;

    const nextPitch = transposePitch(selected.pitch, direction);
    updateSelectedNote((note) => ({ ...note, pitch: nextPitch, isRest: false }));
    setLabMessage(`Selected note moved ${direction > 0 ? "up" : "down"} to ${nextPitch}.`);
  }

  function turnSelectedNoteIntoRest() {
    updateSelectedNote((note) => ({ ...note, isRest: true }));
    setLabMessage("Selected note changed into a rest.");
  }

  async function playScore(startAtSeconds = playheadSeconds) {
    if (totalSeconds <= 0) return;
    stopPlayback();
    await Tone.start();
    setIsPlaying(true);
    setPlayheadSeconds(startAtSeconds);

    const activeStaves = staves.filter((staff) => !staff.muted);
    const soloStaves = activeStaves.filter((staff) => staff.solo);
    const playbackStaves = soloStaves.length > 0 ? soloStaves : activeStaves;
    const startedAt = Date.now() - startAtSeconds * 1000;

    playbackStaves.forEach((staff) => {
      const synth = synthForMode(staff.instrument);
      let offset = 0;

      staff.notes.forEach((note) => {
        const noteStart = offset;
        const noteLength = durationToSeconds(note.duration, score.tempo);
        const delay = noteStart - startAtSeconds;

        if (delay >= -0.001 && !note.isRest) {
          const handle = setTimeout(
            () => synth.triggerAttackRelease(pitchToTonePitch(note.pitch), durationToTone(note.duration)),
            Math.max(0, delay * 1000),
          );
          stopHandles.current.push(handle);
        }

        offset += noteLength;
      });

      const disposeHandle = setTimeout(
        () => synth.dispose(),
        Math.max(1000, (offset - startAtSeconds) * 1000 + 1200),
      );
      stopHandles.current.push(disposeHandle);
    });

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      if (elapsed >= totalSeconds) {
        setPlayheadSeconds(totalSeconds);
        stopPlayback();
        return;
      }
      setPlayheadSeconds(elapsed);
    }, 80);
  }

  return (
    <div className="space-y-6">
      <details
        open={templatesOpen}
        onToggle={(event) => setTemplatesOpen(event.currentTarget.open)}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
      >
        <summary className="cursor-pointer text-lg font-semibold text-white">Templates</summary>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Load a starter score, then edit it in OpenTuttiLab. Descriptions appear only for the selected template.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {staffTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => chooseTemplate(template)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedTemplateId === template.id
                  ? "border-violet-400/70 bg-violet-500/15"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]"
              }`}
            >
              <p className="font-medium text-white">{template.title}</p>
              {selectedTemplateId === template.id && (
                <p className="mt-2 text-sm leading-6 text-zinc-400">{template.description}</p>
              )}
              <p className="mt-3 text-xs text-zinc-500">
                {template.staves?.length ?? 1} staff/staves · {template.timeSignature} · {template.keySignature}
              </p>
            </button>
          ))}
        </div>
      </details>

      <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-300">OPENTUTTILAB</p>
            <input
              value={score.title}
              onChange={(event) => setScoreField("title", event.target.value)}
              className="mt-3 w-full max-w-2xl bg-transparent text-3xl font-semibold tracking-tight text-white outline-none focus:text-violet-100"
            />
            <textarea
              value={score.description}
              onChange={(event) => setScoreField("description", event.target.value)}
              rows={2}
              className="mt-3 w-full max-w-3xl resize-none bg-transparent leading-7 text-zinc-400 outline-none focus:text-zinc-200"
            />
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950 p-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            <label className="text-xs text-zinc-400">
              Key
              <select
                value={score.keySignature}
                onChange={(event) => setScoreField("keySignature", event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
              >
                {keySignatures.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-zinc-400">
              Time
              <select
                value={score.timeSignature}
                onChange={(event) => setScoreField("timeSignature", event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
              >
                {timeSignatures.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-zinc-400">
              Tempo
              <input
                type="number"
                min={36}
                max={220}
                value={score.tempo}
                onChange={(event) => setScoreField("tempo", Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>

            <label className="text-xs text-zinc-400">
              Duration
              <select
                value={selectedDuration}
                onChange={(event) => setSelectedDuration(event.target.value as StaffDuration)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
              >
                {durationOptions.map((duration) => (
                  <option key={duration.value} value={duration.value}>{duration.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-zinc-400">
              Accidental
              <select
                value={selectedAccidental}
                onChange={(event) => setSelectedAccidental(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white"
              >
                {accidentalOptions.map((accidental) => (
                  <option key={accidental.value} value={accidental.value}>{accidental.label}</option>
                ))}
              </select>
            </label>

            <label className="flex items-end gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
              <input type="checkbox" checked={isRestInput} onChange={(event) => setIsRestInput(event.target.checked)} /> Rest
            </label>

            <label className="flex items-end gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
              <input type="checkbox" checked={autoMeasureJump} onChange={(event) => setAutoMeasureJump(event.target.checked)} /> Auto-measure jump
            </label>

          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950 p-3">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-xs">
            <span className="mr-1 shrink-0 font-semibold uppercase tracking-[0.16em] text-zinc-500">Staff</span>
            <select
              value={selectedStaffId}
              onChange={(event) => {
                setSelectedStaffId(event.target.value);
                setSelectedNoteIndex(null);
              }}
              className="shrink-0 rounded-full border border-violet-400/50 bg-zinc-900 px-3 py-1.5 text-white outline-none"
            >
              {staves.map((staff) => (
                <option key={staff.id} value={staff.id}>{staff.name}</option>
              ))}
            </select>

            <button onClick={() => addStaff()} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-white hover:bg-white/10">Add staff</button>
            <button onClick={removeSelectedStaff} disabled={staves.length <= 1} className="shrink-0 rounded-full border border-red-400/40 px-3 py-1.5 text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">Remove staff</button>
            <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
            <button onClick={() => setEditMode("note")} className={`shrink-0 rounded-full border px-3 py-1.5 font-medium ${toolbarButtonClass(editMode === "note", "green")}`}>♪ Add note</button>
            <button onClick={() => setEditMode("insert")} className={`shrink-0 rounded-full border px-3 py-1.5 font-medium ${toolbarButtonClass(editMode === "insert", "violet")}`}>↔ Insert</button>
            <button onClick={() => setEditMode("erase")} className={`shrink-0 rounded-full border px-3 py-1.5 font-medium ${toolbarButtonClass(editMode === "erase", "red")}`}>⌫ Erase</button>
            <button onClick={addMeasure} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-white hover:bg-white/10">+ Measure</button>
            <button onClick={removeMeasure} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-white hover:bg-white/10">- Measure</button>

            <span className="ml-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Triplets</span>
            {tripletOptions.map((triplet) => (
              <button
                key={triplet.value}
                type="button"
                onClick={() => addTriplet(triplet.value)}
                className="shrink-0 rounded-full border border-sky-400/40 px-3 py-1.5 text-sky-100 hover:bg-sky-500/10"
              >
                {triplet.value === "16" ? "16th" : triplet.value === "8" ? "8th" : "Quarter"}
              </button>
            ))}

            <button onClick={clearSelectedStaff} disabled={!selectedStaff || selectedStaff.notes.length === 0} className="shrink-0 rounded-full border border-red-400/40 px-3 py-1.5 text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">Clear staff</button>
            <button onClick={clearAllStaves} className="shrink-0 rounded-full border border-red-400/40 px-3 py-1.5 text-red-200 hover:bg-red-500/10">Clear all</button>
          </div>

          {selectedStaff && (
            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_0.9fr_0.9fr_0.9fr]">
              <input
                value={selectedStaff.name}
                onChange={(event) => updateSelectedStaff((staff) => ({ ...staff, name: event.target.value }))}
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
              <select
                value={selectedStaff.clef}
                onChange={(event) => updateSelectedStaff((staff) => ({ ...staff, clef: event.target.value as StaffClef }))}
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                {clefOptions.map((clef) => (
                  <option key={clef} value={clef}>{clef}</option>
                ))}
              </select>
              <select
                value={selectedStaff.instrument}
                onChange={(event) => updateSelectedStaff((staff) => ({ ...staff, instrument: event.target.value as StaffPart["instrument"] }))}
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                {soundModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSelectedStaff((staff) => ({ ...staff, muted: !staff.muted }))}
                  className={`flex-1 rounded-full border px-3 py-2 text-sm ${selectedStaff.muted ? "border-red-400/50 bg-red-500/10 text-red-100" : "border-white/15 text-white"}`}
                >
                  {selectedStaff.muted ? "Muted" : "Mute"}
                </button>
                <button
                  onClick={() => updateSelectedStaff((staff) => ({ ...staff, solo: !staff.solo }))}
                  className={`flex-1 rounded-full border px-3 py-2 text-sm ${selectedStaff.solo ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100" : "border-white/15 text-white"}`}
                >
                  {selectedStaff.solo ? "Solo on" : "Solo"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => playScore()}
                disabled={isPlaying || totalSeconds <= 0}
                className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Play
              </button>
              <button
                onClick={stopPlayback}
                disabled={!isPlaying}
                className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Stop
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                <span>Playback</span>
                <span>{playheadSeconds.toFixed(1)}s / {totalSeconds.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(totalSeconds, 0.1)}
                step={0.05}
                value={Math.min(playheadSeconds, Math.max(totalSeconds, 0.1))}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPlayheadSeconds(next);
                  if (isPlaying) playScore(next);
                }}
                className="w-full accent-violet-500"
              />
              <div className="mt-1 h-1 rounded-full bg-white/10">
                <div className="h-1 rounded-full bg-violet-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">{labMessage}</p>
        </div>

        <div className="mt-5">
          <OpenTuttiMultiStaffScore
            score={score}
            staves={staves}
            selectedStaffId={selectedStaffId}
            selectedNoteIndex={selectedNoteIndex}
            selectedAccidental={selectedAccidental}
            editMode={editMode}
            isRestInput={isRestInput}
            draggingNote={draggingNote}
            onSelectStaff={(staffId) => {
              setSelectedStaffId(staffId);
              if (staffId !== selectedStaffId) setSelectedNoteIndex(null);
            }}
            onScoreTargetClick={handleScoreTargetClick}
            onNotePointerDown={handleNotePointerDown}
            onDragPitch={updateNotePitch}
            onStopDrag={stopNoteDrag}
          />
        </div>

        {selectedStaff && selectedStaff.notes.length > 0 && (
          <div className="mt-5 rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <h3 className="font-semibold text-white">Selected staff sequence</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedStaff.notes.map((note, index) => (
                <button
                  key={`${note.pitch}-${note.duration}-${index}`}
                  onMouseDown={() => handleNotePointerDown(selectedStaff, index)}
                  onClick={() => setSelectedNoteIndex(index)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    selectedNoteIndex === index
                      ? "border-violet-400 bg-violet-500/20 text-white"
                      : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.07]"
                  }`}
                >
                  {index + 1}. {note.isRest ? "Rest" : note.pitch} / {displayDuration(note.duration)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
