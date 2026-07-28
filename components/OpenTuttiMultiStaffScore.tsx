"use client";

import { useMemo, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type {
  StaffClef,
  StaffNote,
  StaffPart,
  StaffTemplate,
} from "@/lib/music/staffTemplates";

export type OpenTuttiEditMode = "note" | "insert" | "erase";

export type OpenTuttiScoreTarget = {
  staffId: string;
  pitch: string;
  insertionIndex: number;
  nearestNoteIndex: number | null;
  step: number;
  x: number;
  y: number;
};

type DragState = { staffId: string; noteIndex: number } | null;

type OpenTuttiMultiStaffScoreProps = {
  score: StaffTemplate;
  staves: StaffPart[];
  selectedStaffId: string;
  selectedNoteIndex: number | null;
  selectedAccidental: string;
  editMode: OpenTuttiEditMode;
  isRestInput: boolean;
  draggingNote: DragState;
  onSelectStaff: (staffId: string) => void;
  onScoreTargetClick: (target: OpenTuttiScoreTarget) => void;
  onNotePointerDown: (staff: StaffPart, noteIndex: number) => void;
  onDragPitch: (staffId: string, noteIndex: number, pitch: string) => void;
  onStopDrag: () => void;
};

const STAFF_LINE_LEFT = 78;
const LEFT_CONNECTOR_X = 38;
const CLEF_X = 94;
const KEY_X = 130;
const BASE_TIME_X = 166;
const BASE_MEASURE_START_X = 230;
const KEY_SIGNATURE_SPACING = 13;
const STAFF_TOP_PADDING = 74;
const STAFF_ROW_GAP = 126;
const STAFF_LINE_GAP = 10;
const DIATONIC_STEP_PX = STAFF_LINE_GAP / 2;
const STAFF_BOTTOM_STEP = 8;
const MEASURE_WIDTH = 350;
const SCORE_RIGHT_PADDING = 70;
const ACTIVE_BAND_TOP = -34;
const ACTIVE_BAND_BOTTOM = 72;

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

const keySignatureShape: Record<string, { type: "#" | "b"; count: number }> = {
  G: { type: "#", count: 1 },
  D: { type: "#", count: 2 },
  A: { type: "#", count: 3 },
  E: { type: "#", count: 4 },
  B: { type: "#", count: 5 },
  "F#": { type: "#", count: 6 },
  "C#": { type: "#", count: 7 },
  F: { type: "b", count: 1 },
  Bb: { type: "b", count: 2 },
  Eb: { type: "b", count: 3 },
  Ab: { type: "b", count: 4 },
  Db: { type: "b", count: 5 },
  Gb: { type: "b", count: 6 },
  Cb: { type: "b", count: 7 },
};

const keySignaturePitches: Record<StaffClef, { sharp: string[]; flat: string[] }> = {
  treble: {
    sharp: ["F5", "C5", "G5", "D5", "A4", "E5", "B4"],
    flat: ["B4", "E5", "A4", "D5", "G4", "C5", "F4"],
  },
  bass: {
    sharp: ["F3", "C4", "G3", "D4", "A3", "E4", "B3"],
    flat: ["B3", "E4", "A3", "D4", "G3", "C4", "F3"],
  },
  alto: {
    sharp: ["F4", "C5", "G4", "D5", "A4", "E5", "B4"],
    flat: ["B4", "E5", "A4", "D5", "G4", "C5", "F4"],
  },
  tenor: {
    sharp: ["F4", "C5", "G4", "D5", "A4", "E5", "B4"],
    flat: ["B4", "E5", "A4", "D5", "G4", "C5", "F4"],
  },
};

function accidentalToOffset(accidental: string) {
  if (accidental === "bb") return -2;
  if (accidental === "b") return -1;
  if (accidental === "#") return 1;
  if (accidental === "##") return 2;
  return 0;
}

function controlOffset(value: string) {
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return Math.max(-2, Math.min(2, numeric));
  if (value === "bb") return -2;
  if (value === "b") return -1;
  if (value === "#") return 1;
  if (value === "##") return 2;
  return 0;
}

function offsetToAccidental(offset: number) {
  if (offset <= -2) return "bb";
  if (offset === -1) return "b";
  if (offset === 1) return "#";
  if (offset >= 2) return "##";
  return "";
}

function keySignatureLength(keySignature: string) {
  return keySignatureShape[keySignature]?.count ?? 0;
}

function keySignatureItems(keySignature: string, clef: StaffClef) {
  const shape = keySignatureShape[keySignature];
  if (!shape) return [];

  const positions = keySignaturePitches[clef] ?? keySignaturePitches.treble;
  const source = shape.type === "#" ? positions.sharp : positions.flat;
  return source.slice(0, shape.count).map((pitch) => ({
    pitch,
    glyph: shape.type === "#" ? "♯" : "♭",
  }));
}

function displayAccidentalGlyph(accidental: string) {
  if (accidental === "bb") return "𝄫";
  if (accidental === "b") return "♭";
  if (accidental === "#") return "♯";
  if (accidental === "##") return "𝄪";
  if (accidental === "n") return "♮";
  return "";
}

function writtenAccidentalForPitch(pitch: string, keySignature: string) {
  const parsed = parsePitch(pitch);
  const keyAccidental = keyAccidentals[keySignature]?.[parsed.letter] ?? "";

  if (parsed.accidental === keyAccidental) return "";
  if (!parsed.accidental && keyAccidental) return "n";
  return parsed.accidental;
}

const clefTopLinePitch: Record<StaffClef, string> = {
  treble: "F5",
  bass: "A3",
  alto: "G4",
  tenor: "E4",
};

const clefGlyph: Record<StaffClef, string> = {
  treble: "𝄞",
  bass: "𝄢",
  alto: "𝄡",
  tenor: "𝄡",
};

const letters = ["C", "D", "E", "F", "G", "A", "B"];

function parsePitch(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]{0,2})(-?\d)$/);
  return {
    letter: match?.[1] ?? "C",
    accidental: match?.[2] ?? "",
    octave: Number(match?.[3] ?? 4),
  };
}

function pitchToDiatonicValue(pitch: string) {
  const parsed = parsePitch(pitch.replace(/[#b]+/, ""));
  const letterIndex = Math.max(0, letters.indexOf(parsed.letter));
  return parsed.octave * 7 + letterIndex;
}

function diatonicValueToPitch(value: number) {
  const octave = Math.floor(value / 7);
  const rawIndex = value % 7;
  const index = rawIndex < 0 ? rawIndex + 7 : rawIndex;
  const fixedOctave = rawIndex < 0 ? octave - 1 : octave;
  return `${letters[index]}${fixedOctave}`;
}

function pitchWithAccidental(basePitch: string, accidental: string) {
  return basePitch.replace(/^([A-G])/, `$1${accidental}`);
}

function pitchFromStep(step: number, clef: StaffClef, keySignature: string, selectedAccidental: string) {
  const topValue = pitchToDiatonicValue(clefTopLinePitch[clef] ?? clefTopLinePitch.treble);
  const naturalPitch = diatonicValueToPitch(topValue - step);
  const keyAccidental = keyAccidentals[keySignature]?.[naturalPitch.charAt(0)] ?? "";
  const accidental = offsetToAccidental(accidentalToOffset(keyAccidental) + controlOffset(selectedAccidental));
  return pitchWithAccidental(naturalPitch, accidental);
}

function stepForPitch(pitch: string, clef: StaffClef) {
  const topValue = pitchToDiatonicValue(clefTopLinePitch[clef] ?? clefTopLinePitch.treble);
  return topValue - pitchToDiatonicValue(pitch);
}

function timeSignatureBeats(timeSignature: string) {
  if (timeSignature === "2/4") return 2;
  if (timeSignature === "3/4") return 3;
  if (timeSignature === "6/8") return 3;
  return 4;
}

function noteBeats(duration: string) {
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

function measureCountFor(score: StaffTemplate) {
  const staves = score.staves?.length ? score.staves : [{ notes: score.notes } as StaffPart];
  const beatsPerMeasure = timeSignatureBeats(score.timeSignature);
  const needed = Math.max(
    1,
    ...staves.map((staff) =>
      Math.ceil(staff.notes.reduce((sum, note) => sum + staffNoteBeats(note), 0) / beatsPerMeasure),
    ),
  );
  return Math.max(score.measureCount ?? 1, needed);
}

function staffTopY(staffIndex: number) {
  return STAFF_TOP_PADDING + staffIndex * STAFF_ROW_GAP;
}

function noteXFromBeat(beatStart: number, beatsPerMeasure: number, measureStartX: number) {
  const measureIndex = Math.floor(beatStart / beatsPerMeasure);
  const beatOffset = beatStart - measureIndex * beatsPerMeasure;
  const innerLeft = 26;
  const innerWidth = MEASURE_WIDTH - 54;
  return measureStartX + measureIndex * MEASURE_WIDTH + innerLeft + (beatOffset / beatsPerMeasure) * innerWidth;
}

function beatFromX(x: number, measureCount: number, beatsPerMeasure: number, measureStartX: number) {
  const clampedX = Math.max(measureStartX, Math.min(measureStartX + measureCount * MEASURE_WIDTH, x));
  const rawMeasure = Math.floor((clampedX - measureStartX) / MEASURE_WIDTH);
  const measureIndex = Math.max(0, Math.min(measureCount - 1, rawMeasure));
  const xInMeasure = clampedX - (measureStartX + measureIndex * MEASURE_WIDTH);
  const innerLeft = 26;
  const innerWidth = MEASURE_WIDTH - 54;
  const beatOffset = Math.max(0, Math.min(1, (xInMeasure - innerLeft) / innerWidth)) * beatsPerMeasure;
  return measureIndex * beatsPerMeasure + beatOffset;
}

function notePositions(staff: StaffPart, beatsPerMeasure: number, measureStartX: number) {
  let beatCursor = 0;
  return staff.notes.map((note, index) => {
    const duration = staffNoteBeats(note);
    const x = noteXFromBeat(beatCursor, beatsPerMeasure, measureStartX);
    const step = stepForPitch(note.pitch, staff.clef);
    beatCursor += duration;
    return {
      index,
      note,
      x,
      step,
      beatStart: beatCursor - duration,
      beatMiddle: beatCursor - duration / 2,
    };
  });
}

function insertionIndexForBeat(staff: StaffPart, targetBeat: number) {
  let beatCursor = 0;
  for (let index = 0; index < staff.notes.length; index += 1) {
    const duration = staffNoteBeats(staff.notes[index]);
    if (targetBeat <= beatCursor + duration / 2) return index;
    beatCursor += duration;
  }
  return staff.notes.length;
}

function nearestNoteIndexForBeat(staff: StaffPart, targetBeat: number) {
  if (staff.notes.length === 0) return null;
  let beatCursor = 0;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  staff.notes.forEach((note, index) => {
    const duration = staffNoteBeats(note);
    const middle = beatCursor + duration / 2;
    const distance = Math.abs(middle - targetBeat);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
    beatCursor += duration;
  });

  return nearestIndex;
}

function ledgerSteps(step: number) {
  const result: number[] = [];

  if (step < 0) {
    for (let current = -2; current >= step; current -= 2) {
      result.push(current);
    }
  }

  if (step > STAFF_BOTTOM_STEP) {
    for (let current = STAFF_BOTTOM_STEP + 2; current <= step; current += 2) {
      result.push(current);
    }
  }

  return result;
}

function noteShouldBeHollow(duration: string) {
  return duration === "w" || duration === "h" || duration === "hd";
}

function noteHasStem(duration: string) {
  return duration !== "w";
}

function noteFlagCount(duration: string) {
  if (duration === "16") return 2;
  if (duration === "8" || duration === "8d") return 1;
  return 0;
}

function svgPoint(event: PointerEvent<SVGSVGElement> | MouseEvent<SVGSVGElement>, width: number, height: number) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * width,
    y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * height,
  };
}

function displayPitch(pitch: string) {
  return pitch
    .replace("##", "𝄪")
    .replace("bb", "𝄫")
    .replace("#", "♯")
    .replace("b", "♭");
}

function splitTime(timeSignature: string) {
  const [top = "4", bottom = "4"] = timeSignature.split("/");
  return { top, bottom };
}

export default function OpenTuttiMultiStaffScore({
  score,
  staves,
  selectedStaffId,
  selectedNoteIndex,
  selectedAccidental,
  editMode,
  isRestInput,
  draggingNote,
  onSelectStaff,
  onScoreTargetClick,
  onNotePointerDown,
  onDragPitch,
  onStopDrag,
}: OpenTuttiMultiStaffScoreProps) {
  const [hoverTarget, setHoverTarget] = useState<OpenTuttiScoreTarget | null>(null);
  const beatsPerMeasure = timeSignatureBeats(score.timeSignature);
  const measureCount = measureCountFor(score);
  const keySignatureSize = keySignatureLength(score.keySignature);
  const timeX = Math.max(BASE_TIME_X, KEY_X + keySignatureSize * KEY_SIGNATURE_SPACING + 28);
  const measureStartX = Math.max(BASE_MEASURE_START_X, timeX + 50);
  const scoreWidth = measureStartX + measureCount * MEASURE_WIDTH + SCORE_RIGHT_PADDING;
  const scoreHeight = Math.max(236, STAFF_TOP_PADDING + Math.max(staves.length, 1) * STAFF_ROW_GAP + 28);

  const staffBands = useMemo(
    () =>
      staves.map((staff, index) => {
        const topY = staffTopY(index);
        return {
          staff,
          topY,
          bandTop: topY + ACTIVE_BAND_TOP,
          bandBottom: topY + ACTIVE_BAND_BOTTOM,
        };
      }),
    [staves],
  );

  function targetFromPoint(x: number, y: number): OpenTuttiScoreTarget | null {
    const band = staffBands.find((item) => y >= item.bandTop && y <= item.bandBottom);
    if (!band) return null;

    const step = Math.round((y - band.topY) / DIATONIC_STEP_PX);
    const snappedY = band.topY + step * DIATONIC_STEP_PX;
    const pitch = pitchFromStep(step, band.staff.clef, score.keySignature, selectedAccidental);
    const targetBeat = beatFromX(x, measureCount, beatsPerMeasure, measureStartX);

    return {
      staffId: band.staff.id,
      pitch,
      insertionIndex: insertionIndexForBeat(band.staff, targetBeat),
      nearestNoteIndex: nearestNoteIndexForBeat(band.staff, targetBeat),
      step,
      x: Math.max(measureStartX, Math.min(scoreWidth - SCORE_RIGHT_PADDING, x)),
      y: snappedY,
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const point = svgPoint(event, scoreWidth, scoreHeight);
    const target = targetFromPoint(point.x, point.y);
    setHoverTarget(target);

    if (target && draggingNote && draggingNote.staffId === target.staffId) {
      onDragPitch(draggingNote.staffId, draggingNote.noteIndex, target.pitch);
    }
  }

  function handlePointerLeave() {
    setHoverTarget(null);
    onStopDrag();
  }

  function handlePointerUp() {
    onStopDrag();
  }

  function handleSvgClick(event: MouseEvent<SVGSVGElement>) {
    const point = svgPoint(event, scoreWidth, scoreHeight);
    const target = targetFromPoint(point.x, point.y);
    if (!target) return;
    onSelectStaff(target.staffId);
    onScoreTargetClick(target);
  }

  const firstTop = staffBands[0]?.topY ?? STAFF_TOP_PADDING;
  const lastBottom = (staffBands[staffBands.length - 1]?.topY ?? STAFF_TOP_PADDING) + STAFF_BOTTOM_STEP * DIATONIC_STEP_PX;

  return (
    <div className="max-h-[720px] overflow-auto rounded-3xl border border-white/10 bg-white p-4">
      <div className="min-w-max rounded-2xl bg-white px-3 py-3 text-zinc-900">
        <div className="mb-2 flex items-center justify-between px-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <span>{score.title || "Untitled score"}</span>
          <span>{measureCount} measure{measureCount === 1 ? "" : "s"}</span>
        </div>

        <svg
          width={scoreWidth}
          height={scoreHeight}
          viewBox={`0 0 ${scoreWidth} ${scoreHeight}`}
          className="block select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerUp={handlePointerUp}
          onClick={handleSvgClick}
        >
          <rect width={scoreWidth} height={scoreHeight} fill="white" />

          {staves.length > 0 && (
            <line
              x1={LEFT_CONNECTOR_X}
              x2={LEFT_CONNECTOR_X}
              y1={firstTop - 34}
              y2={lastBottom + 34}
              stroke="#111827"
              strokeWidth={2.5}
            />
          )}

          {staffBands.map(({ staff, topY }) => {
            const isSelectedStaff = selectedStaffId === staff.id;
            const time = splitTime(score.timeSignature);
            const positions = notePositions(staff, beatsPerMeasure, measureStartX);
            const groupedTuplets = new Map<string, typeof positions>();

            positions.forEach((position) => {
              if (!position.note.tupletGroup) return;
              groupedTuplets.set(position.note.tupletGroup, [
                ...(groupedTuplets.get(position.note.tupletGroup) ?? []),
                position,
              ]);
            });

            return (
              <g key={staff.id}>
                <text
                  x={STAFF_LINE_LEFT - 6}
                  y={topY - 25}
                  fill={isSelectedStaff ? "#7c3aed" : "#6b7280"}
                  fontSize={12}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  letterSpacing={2}
                >
                  {staff.name}
                </text>
                <text
                  x={scoreWidth - SCORE_RIGHT_PADDING}
                  y={topY - 25}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize={10}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  letterSpacing={2}
                >
                  {staff.clef.toUpperCase()} · {staff.instrument.toUpperCase()}
                </text>

                {Array.from({ length: 5 }, (_, lineIndex) => (
                  <line
                    key={`line-${staff.id}-${lineIndex}`}
                    x1={STAFF_LINE_LEFT}
                    x2={scoreWidth - SCORE_RIGHT_PADDING}
                    y1={topY + lineIndex * STAFF_LINE_GAP}
                    y2={topY + lineIndex * STAFF_LINE_GAP}
                    stroke="#111827"
                    strokeWidth={1.25}
                  />
                ))}

                {Array.from({ length: measureCount + 1 }, (_, measureIndex) => {
                  const x = measureStartX + measureIndex * MEASURE_WIDTH;
                  return (
                    <line
                      key={`bar-${staff.id}-${measureIndex}`}
                      x1={x}
                      x2={x}
                      y1={topY}
                      y2={topY + STAFF_BOTTOM_STEP * DIATONIC_STEP_PX}
                      stroke="#111827"
                      strokeWidth={measureIndex === measureCount ? 2.2 : 1.2}
                    />
                  );
                })}

                {Array.from({ length: measureCount }, (_, measureIndex) => (
                  <text
                    key={`measure-${staff.id}-${measureIndex}`}
                    x={measureStartX + measureIndex * MEASURE_WIDTH + 8}
                    y={topY - 5}
                    fill="#111827"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {measureIndex + 1}
                  </text>
                ))}

                <text
                  x={CLEF_X}
                  y={topY + 37}
                  fill="#000"
                  fontSize={58}
                  fontFamily="Georgia, 'Times New Roman', serif"
                  textAnchor="middle"
                >
                  {clefGlyph[staff.clef]}
                </text>

                {keySignatureItems(score.keySignature, staff.clef).map((item, itemIndex) => (
                  <text
                    key={`key-${staff.id}-${itemIndex}`}
                    x={KEY_X + itemIndex * KEY_SIGNATURE_SPACING}
                    y={topY + stepForPitch(item.pitch, staff.clef) * DIATONIC_STEP_PX + 6}
                    fill="#111827"
                    fontSize={22}
                    fontFamily="Georgia, 'Times New Roman', serif"
                    textAnchor="middle"
                  >
                    {item.glyph}
                  </text>
                ))}

                <text x={timeX} y={topY + 17} fill="#000" fontSize={28} fontWeight={800} textAnchor="middle">
                  {time.top}
                </text>
                <text x={timeX} y={topY + 42} fill="#000" fontSize={28} fontWeight={800} textAnchor="middle">
                  {time.bottom}
                </text>

                {Array.from(groupedTuplets.values()).map((group) => {
                  if (group.length < 2) return null;
                  const first = group[0];
                  const last = group[group.length - 1];
                  const midX = (first.x + last.x) / 2;
                  const minY = Math.min(...group.map((item) => topY + item.step * DIATONIC_STEP_PX));
                  return (
                    <text key={`tuplet-${staff.id}-${first.note.tupletGroup}`} x={midX} y={minY - 16} textAnchor="middle" fontSize={12} fontWeight={700} fill="#111827">
                      3
                    </text>
                  );
                })}

                {positions.map(({ note, index, x, step }) => {
                  const y = topY + step * DIATONIC_STEP_PX;
                  const isSelected = isSelectedStaff && selectedNoteIndex === index;
                  const stemUp = step >= 4;
                  const hollow = noteShouldBeHollow(note.duration);
                  const flags = noteFlagCount(note.duration);
                  const stemX = stemUp ? x + 7 : x - 7;
                  const stemEndY = stemUp ? y - 34 : y + 34;
                  const accidental = writtenAccidentalForPitch(note.pitch, score.keySignature);

                  return (
                    <g key={`${staff.id}-${index}-${note.pitch}-${note.duration}`}>
                      {ledgerSteps(step).map((ledgerStep) => (
                        <line
                          key={`note-ledger-${ledgerStep}`}
                          x1={x - 18}
                          x2={x + 18}
                          y1={topY + ledgerStep * DIATONIC_STEP_PX}
                          y2={topY + ledgerStep * DIATONIC_STEP_PX}
                          stroke="#111827"
                          strokeWidth={1.2}
                        />
                      ))}

                      {note.isRest ? (
                        <text x={x} y={topY + 25} textAnchor="middle" fontSize={22} fill="#111827">
                          𝄽
                        </text>
                      ) : (
                        <>
                          {accidental && (
                            <text
                              x={x - 15}
                              y={y + 6}
                              textAnchor="middle"
                              fontSize={20}
                              fill="#111827"
                              fontFamily="Georgia, 'Times New Roman', serif"
                            >
                              {displayAccidentalGlyph(accidental)}
                            </text>
                          )}
                          <ellipse
                            cx={x}
                            cy={y}
                            rx={7.1}
                            ry={4.9}
                            fill={hollow ? "white" : "#000"}
                            stroke="#000"
                            strokeWidth={1.45}
                            transform={`rotate(-20 ${x} ${y})`}
                          />
                          {noteHasStem(note.duration) && (
                            <line x1={stemX} x2={stemX} y1={y} y2={stemEndY} stroke="#000" strokeWidth={1.8} />
                          )}
                          {Array.from({ length: flags }, (_, flagIndex) => (
                            <path
                              key={`flag-${flagIndex}`}
                              d={
                                stemUp
                                  ? `M ${stemX} ${stemEndY + flagIndex * 8} C ${stemX + 20} ${stemEndY + 5 + flagIndex * 8}, ${stemX + 18} ${stemEndY + 18 + flagIndex * 8}, ${stemX + 4} ${stemEndY + 21 + flagIndex * 8}`
                                  : `M ${stemX} ${stemEndY - flagIndex * 8} C ${stemX - 20} ${stemEndY - 5 - flagIndex * 8}, ${stemX - 18} ${stemEndY - 18 - flagIndex * 8}, ${stemX - 4} ${stemEndY - 21 - flagIndex * 8}`
                              }
                              fill="none"
                              stroke="#000"
                              strokeWidth={1.6}
                            />
                          ))}
                        </>
                      )}

                      {isSelected && <circle cx={x} cy={y} r={15} fill="none" stroke="#7c3aed" strokeWidth={2} />}
                      <circle
                        cx={x}
                        cy={y}
                        r={19}
                        fill="transparent"
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onSelectStaff(staff.id);
                          onNotePointerDown(staff, index);
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onSelectStaff(staff.id);
                        }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {hoverTarget && (
            <g pointerEvents="none">
              {ledgerSteps(hoverTarget.step).map((step) => {
                const band = staffBands.find((item) => item.staff.id === hoverTarget.staffId);
                if (!band) return null;
                return (
                  <line
                    key={`ghost-ledger-${step}`}
                    x1={hoverTarget.x - 18}
                    x2={hoverTarget.x + 18}
                    y1={band.topY + step * DIATONIC_STEP_PX}
                    y2={band.topY + step * DIATONIC_STEP_PX}
                    stroke={editMode === "erase" ? "#ef4444" : editMode === "insert" ? "#8b5cf6" : "#10b981"}
                    strokeWidth={1.4}
                  />
                );
              })}
              <circle
                cx={hoverTarget.x}
                cy={hoverTarget.y}
                r={6.5}
                fill="white"
                stroke={editMode === "erase" ? "#ef4444" : editMode === "insert" ? "#8b5cf6" : "#10b981"}
                strokeWidth={2.2}
              />
              <g transform={`translate(${hoverTarget.x} ${hoverTarget.y})`}>
                <path
                  d="M 16 -52 H 76 Q 86 -52 86 -42 V -26 Q 86 -16 76 -16 H 36 L 8 -4 L 21 -16 H 16 Q 6 -16 6 -26 V -42 Q 6 -52 16 -52 Z"
                  fill={editMode === "erase" ? "#ef4444" : editMode === "insert" ? "#8b5cf6" : "#10b981"}
                />
                <text x={46} y={-31} textAnchor="middle" fill="white" fontSize={13} fontWeight={700}>
                  {editMode === "erase" ? "erase" : isRestInput ? "rest" : displayPitch(hoverTarget.pitch)}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
