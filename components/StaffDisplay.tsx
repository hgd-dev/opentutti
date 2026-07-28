"use client";

import { useEffect, useRef } from "react";
import {
  Accidental,
  Barline,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  StaveTie,
  Tuplet,
  Voice,
} from "vexflow";

type DisplayDuration = "16" | "8" | "8d" | "q" | "qd" | "h" | "hd" | "w";
type TupletKind = "eighth-triplet" | "sixteenth-triplet" | "quarter-triplet";
type DisplayClef = "treble" | "bass" | "alto" | "tenor";

type DisplayNote = {
  pitch: string;
  duration: DisplayDuration | string;
  isRest?: boolean;
  measureNumber?: number;
  actualBeats?: number;
  tupletGroup?: string;
  tupletKind?: TupletKind;
  tupletIndex?: number;
  tupletTotal?: number;
  tupletNotesOccupied?: number;
};

type RenderNote = DisplayNote & {
  duration: DisplayDuration;
  startBeat: number;
  actualBeats: number;
  tieGroup?: string;
};

type PreparedMeasure = {
  measureNumber: number;
  notes: DisplayNote[];
  renderNotes: RenderNote[];
  naturalWidth: number;
  width: number;
};

type StaffDisplayTemplate = {
  id?: string;
  title?: string;
  description?: string;
  clef?: DisplayClef | string;
  keySignature?: string;
  timeSignature?: string;
  tempo?: number;
  notes: DisplayNote[];
  settings?: {
    measures?: number;
  };
};

type StaffDisplayProps = {
  template: StaffDisplayTemplate;
  compact?: boolean;
};

function pitchToVexKey(pitch: string) {
  const match = pitch.match(/^([A-G])([#b]{0,2})(\d)$/);

  if (!match) {
    return "c/4";
  }

  const [, letter, accidental, octave] = match;
  return `${letter.toLowerCase()}${accidental}/${octave}`;
}

function normalizeDuration(duration: string): DisplayDuration {
  if (
    duration === "16" ||
    duration === "8" ||
    duration === "8d" ||
    duration === "q" ||
    duration === "qd" ||
    duration === "h" ||
    duration === "hd" ||
    duration === "w"
  ) {
    return duration;
  }

  return "q";
}

function baseDuration(duration: DisplayDuration) {
  if (duration === "8d") return "8";
  if (duration === "qd") return "q";
  if (duration === "hd") return "h";
  return duration;
}

function isDottedDuration(duration: DisplayDuration) {
  return duration === "8d" || duration === "qd" || duration === "hd";
}

function durationToVexDuration(duration: DisplayDuration, isRest?: boolean) {
  const base = baseDuration(duration);
  return isRest ? `${base}r` : base;
}

function createStaveNote(input: RenderNote, clef: string) {
  const isRest = Boolean(input.isRest);
  const pitch = isRest ? "B4" : input.pitch;
  const match = pitch.match(/^([A-G])([#b]{0,2})(\d)$/);
  const accidental = match?.[2];

  const note = new StaveNote({
    keys: [isRest ? "b/4" : pitchToVexKey(pitch)],
    duration: durationToVexDuration(input.duration, isRest),
    clef,
  });

  if (isDottedDuration(input.duration)) {
    note.addModifier(new Dot(), 0);
  }

  if (!isRest && accidental) {
    note.addModifier(new Accidental(accidental), 0);
  }

  return note;
}

function durationBeats(durationInput: string) {
  const duration = normalizeDuration(durationInput);
  if (duration === "w") return 4;
  if (duration === "hd") return 3;
  if (duration === "h") return 2;
  if (duration === "qd") return 1.5;
  if (duration === "q") return 1;
  if (duration === "8d") return 0.75;
  if (duration === "8") return 0.5;
  return 0.25;
}

function noteBeats(note: DisplayNote) {
  return note.actualBeats ?? durationBeats(note.duration);
}

function timeSignatureBeats(timeSignature?: string) {
  if (timeSignature === "2/4") return 2;
  if (timeSignature === "3/4") return 3;
  if (timeSignature === "6/8") return 3;
  return 4;
}

function beatUnit(timeSignature?: string) {
  return timeSignature === "6/8" ? 1.5 : 1;
}

function groupByMeasure(notes: DisplayNote[], timeSignature?: string, targetMeasures = 1) {
  const explicit = notes.some((note) => typeof note.measureNumber === "number");

  if (explicit) {
    const groups = new Map<number, DisplayNote[]>();

    notes.forEach((note) => {
      const measure = note.measureNumber ?? 1;
      groups.set(measure, [...(groups.get(measure) ?? []), note]);
    });

    const maxMeasure = Math.max(targetMeasures, ...Array.from(groups.keys()));
    return Array.from({ length: maxMeasure }, (_, index) => {
      const measureNumber = index + 1;
      return { measureNumber, notes: groups.get(measureNumber) ?? [] };
    });
  }

  const beatsPerMeasure = timeSignatureBeats(timeSignature);
  const measures: { measureNumber: number; notes: DisplayNote[] }[] = [];
  let current = { measureNumber: 1, notes: [] as DisplayNote[] };
  let used = 0;

  notes.forEach((note) => {
    const beats = noteBeats(note);

    if (used > 0 && used + beats > beatsPerMeasure + 0.001) {
      measures.push(current);
      current = { measureNumber: current.measureNumber + 1, notes: [] };
      used = 0;
    }

    current.notes.push(note);
    used += beats;

    if (used >= beatsPerMeasure - 0.001) {
      measures.push(current);
      current = { measureNumber: current.measureNumber + 1, notes: [] };
      used = 0;
    }
  });

  if (current.notes.length > 0) {
    measures.push(current);
  }

  if (measures.length === 0) {
    return Array.from({ length: Math.max(1, targetMeasures) }, (_, index) => ({
      measureNumber: index + 1,
      notes: [] as DisplayNote[],
    }));
  }

  while (measures.length < targetMeasures) {
    measures.push({ measureNumber: measures.length + 1, notes: [] });
  }

  return measures;
}

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.001;
}

function nearlyInteger(value: number) {
  return nearlyEqual(value, Math.round(value));
}

function startsOnCompoundBeat(value: number) {
  return nearlyEqual(value % 1.5, 0) || nearlyEqual(value % 1.5, 1.5);
}

function canKeepSingleNote(note: DisplayNote, startBeat: number, timeSignature?: string) {
  if (note.tupletGroup || note.tupletKind) return true;

  const duration = noteBeats(note);
  const normalizedDuration = normalizeDuration(note.duration);

  if (duration <= 0.25) return true;

  if (timeSignature === "6/8") {
    if (duration === 3) return nearlyEqual(startBeat, 0);
    if (duration === 1.5) return startsOnCompoundBeat(startBeat);
    if (duration === 0.75) return true;
    if (duration <= 1) return true;
    return false;
  }

  const startsOnSimpleBeat = nearlyInteger(startBeat);

  if (normalizedDuration === "8d") {
    return Math.abs((startBeat + duration) - Math.ceil(startBeat + duration - 0.001)) > 0.001;
  }

  return (
    (duration === 0.5 || duration === 1 || duration === 1.5 || duration === 2 || duration === 3 || duration === 4) &&
    startsOnSimpleBeat
  );
}

function decomposeChunk(chunkBeats: number, timeSignature?: string) {
  const pieces: number[] = [];
  let remaining = chunkBeats;

  while (remaining > 0.001) {
    if (timeSignature === "6/8" && remaining >= 1.5 - 0.001) {
      pieces.push(1.5);
      remaining -= 1.5;
    } else if (remaining >= 2 - 0.001) {
      pieces.push(2);
      remaining -= 2;
    } else if (remaining >= 1 - 0.001) {
      pieces.push(1);
      remaining -= 1;
    } else if (remaining >= 0.75 - 0.001) {
      pieces.push(0.75);
      remaining -= 0.75;
    } else if (remaining >= 0.5 - 0.001) {
      pieces.push(0.5);
      remaining -= 0.5;
    } else {
      pieces.push(0.25);
      remaining -= 0.25;
    }
  }

  return pieces;
}

function beatsToDuration(beats: number, timeSignature?: string): DisplayDuration {
  if (timeSignature === "6/8") {
    if (beats >= 3 - 0.001) return "hd";
    if (beats >= 1.5 - 0.001) return "qd";
  }

  if (beats >= 3 - 0.001) return "hd";
  if (beats >= 2 - 0.001) return "h";
  if (beats >= 1.5 - 0.001) return "qd";
  if (beats >= 1 - 0.001) return "q";
  if (beats >= 0.75 - 0.001) return "8d";
  if (beats >= 0.5 - 0.001) return "8";
  return "16";
}

function splitMeasureNotes(notes: DisplayNote[], timeSignature?: string) {
  const processed: RenderNote[] = [];
  let used = 0;
  const unit = beatUnit(timeSignature);

  notes.forEach((note, noteIndex) => {
    const originalDuration = normalizeDuration(note.duration);
    const totalBeats = noteBeats(note);
    const sourceId = `m${note.measureNumber ?? 1}-n${noteIndex}`;

    if (canKeepSingleNote(note, used, timeSignature)) {
      processed.push({
        ...note,
        duration: originalDuration,
        actualBeats: totalBeats,
        startBeat: used,
      });
      used += totalBeats;
      return;
    }

    let remaining = totalBeats;
    let localStart = used;

    while (remaining > 0.001) {
      const beatBoundaryEnd = (Math.floor(localStart / unit) + 1) * unit;
      const untilBoundary = Math.max(0.25, beatBoundaryEnd - localStart);
      const chunkBeats = Math.min(remaining, untilBoundary);
      const pieces = decomposeChunk(chunkBeats, timeSignature);

      pieces.forEach((piece) => {
        processed.push({
          ...note,
          duration: beatsToDuration(piece, timeSignature),
          actualBeats: piece,
          startBeat: localStart,
          tieGroup: note.isRest ? undefined : sourceId,
          tupletGroup: undefined,
          tupletKind: undefined,
          tupletIndex: undefined,
          tupletTotal: undefined,
          tupletNotesOccupied: undefined,
        });
        localStart += piece;
      });

      remaining -= chunkBeats;
    }

    used += totalBeats;
  });

  return processed;
}

function measureComplexity(renderNotes: RenderNote[], isFirstMeasureOfSystem: boolean) {
  const noteSpace = renderNotes.reduce((sum, note) => {
    const accidentalExtra = /[#b]/.test(note.pitch) && !note.isRest ? 12 : 0;
    const tupletExtra = note.tupletGroup ? 6 : 0;
    const durationExtra =
      note.duration === "16"
        ? 8
        : note.duration === "8" || note.duration === "8d"
          ? 7
          : note.duration === "qd" || note.duration === "hd"
            ? 9
            : 0;

    return sum + 34 + accidentalExtra + durationExtra + tupletExtra;
  }, 0);

  const headerSpace = isFirstMeasureOfSystem ? 112 : 26;
  return Math.max(isFirstMeasureOfSystem ? 210 : 145, headerSpace + noteSpace);
}

function prepareMeasures(measures: { measureNumber: number; notes: DisplayNote[] }[], timeSignature?: string) {
  return measures.map((measure) => {
    const renderNotes = splitMeasureNotes(measure.notes, timeSignature);
    return {
      ...measure,
      renderNotes,
      naturalWidth: measureComplexity(renderNotes, false),
      width: 0,
    };
  });
}

function systemCapacity(totalMeasures: number, prepared: PreparedMeasure[], usableWidth: number) {
  const averageComplexity =
    prepared.reduce((sum, measure) => sum + measure.naturalWidth, 0) / Math.max(prepared.length, 1);

  if (averageComplexity > usableWidth * 0.34) return 2;
  if (totalMeasures <= 3) return totalMeasures;
  return usableWidth > 1150 ? 4 : 3;
}

function distributeSystemWidth(system: PreparedMeasure[], usableWidth: number, isFinalSystem: boolean) {
  const naturalWidths = system.map((measure, index) => measureComplexity(measure.renderNotes, index === 0));
  const naturalTotal = naturalWidths.reduce((sum, width) => sum + width, 0);
  const shouldFillLine = !isFinalSystem || system.length > 1;
  const targetWidth = shouldFillLine ? usableWidth : Math.min(usableWidth, naturalTotal);
  const scale = targetWidth / Math.max(naturalTotal, 1);

  return system.map((measure, index) => ({
    ...measure,
    width: naturalWidths[index] * scale,
  }));
}

function makeSystems(prepared: PreparedMeasure[], usableWidth: number) {
  const capacity = systemCapacity(prepared.length, prepared, usableWidth);
  const rawSystems: PreparedMeasure[][] = [];
  let current: PreparedMeasure[] = [];
  let currentWidth = 0;

  prepared.forEach((measure) => {
    const naturalWidth = measureComplexity(measure.renderNotes, current.length === 0);
    const wouldOverflow = current.length > 0 && currentWidth + naturalWidth > usableWidth;
    const wouldExceedCapacity = current.length >= capacity;

    if (wouldOverflow || wouldExceedCapacity) {
      rawSystems.push(current);
      current = [measure];
      currentWidth = measureComplexity(measure.renderNotes, true);
      return;
    }

    current.push(measure);
    currentWidth += naturalWidth;
  });

  if (current.length > 0) rawSystems.push(current);

  return rawSystems.map((system, index) =>
    distributeSystemWidth(system, usableWidth, index === rawSystems.length - 1),
  );
}

function isBeamable(note: RenderNote) {
  return !note.isRest && (note.duration === "16" || note.duration === "8" || note.duration === "8d");
}

function buildTuplets(renderNotes: RenderNote[], vexNotes: StaveNote[]) {
  const groups = new Map<string, { notes: StaveNote[]; total: number; occupied: number }>();

  renderNotes.forEach((note, index) => {
    if (!note.tupletGroup || !note.tupletKind) return;

    const group = groups.get(note.tupletGroup) ?? {
      notes: [],
      total: note.tupletTotal ?? 3,
      occupied: note.tupletNotesOccupied ?? 2,
    };

    group.notes.push(vexNotes[index]);
    groups.set(note.tupletGroup, group);
  });

  return Array.from(groups.values())
    .filter((group) => group.notes.length > 1)
    .map(
      (group) =>
        new Tuplet(group.notes, {
          numNotes: group.total,
          notesOccupied: group.occupied,
        }),
    );
}

function buildBeamGroups(renderNotes: RenderNote[], vexNotes: StaveNote[], timeSignature?: string) {
  const groups: StaveNote[][] = [];
  const unit = beatUnit(timeSignature);
  let currentGroup: StaveNote[] = [];
  let currentBucket: string | null = null;

  renderNotes.forEach((note, index) => {
    if (!isBeamable(note)) {
      if (currentGroup.length > 1) groups.push(currentGroup);
      currentGroup = [];
      currentBucket = null;
      return;
    }

    const bucket = note.tupletGroup
      ? `tuplet-${note.tupletGroup}`
      : `beat-${Math.floor((note.startBeat + 0.0001) / unit)}`;

    if (currentBucket === bucket) {
      currentGroup.push(vexNotes[index]);
      return;
    }

    if (currentGroup.length > 1) groups.push(currentGroup);
    currentGroup = [vexNotes[index]];
    currentBucket = bucket;
  });

  if (currentGroup.length > 1) groups.push(currentGroup);

  return groups.map((group) => new Beam(group));
}

export default function StaffDisplay({ template, compact = false }: StaffDisplayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const rawMeasures = groupByMeasure(template.notes, template.timeSignature, template.settings?.measures ?? 1);
    const clef = template.clef || "treble";
    const parentWidth = container.parentElement?.clientWidth ?? 960;
    const leftPadding = compact ? 18 : 18;
    const rightPadding = compact ? 42 : 36;
    const prepared = prepareMeasures(rawMeasures, template.timeSignature);

    const compactFirstMeasureWidth = 560;
    const compactMeasureWidth = 430;
    const compactNaturalWidth =
      leftPadding +
      rightPadding +
      prepared.reduce((sum, measure, index) => {
        const floorWidth = index === 0 ? compactFirstMeasureWidth : compactMeasureWidth;
        return sum + Math.max(floorWidth, measureComplexity(measure.renderNotes, index === 0));
      }, 0);

    const width = compact
      ? Math.max(parentWidth - 24, compactNaturalWidth)
      : Math.max(720, Math.min(1800, parentWidth - 24));
    const usableWidth = width - leftPadding - rightPadding;
    const systems = compact
      ? [
          prepared.map((measure, index) => ({
            ...measure,
            width: Math.max(
              index === 0 ? compactFirstMeasureWidth : compactMeasureWidth,
              measureComplexity(measure.renderNotes, index === 0),
            ),
          })),
        ]
      : makeSystems(prepared, usableWidth);
    const systemHeight = compact ? 122 : 136;
    const height = Math.max(compact ? 128 : 156, systems.length * systemHeight + (compact ? 8 : 20));

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();

    systems.forEach((systemMeasures, systemIndex) => {
      const y = (compact ? 42 : 38) + systemIndex * systemHeight;
      let x = leftPadding;

      systemMeasures.forEach((measure, measureIndex) => {
        const isFirstMeasureOfSystem = measureIndex === 0;
        const isFirstMeasureOverall = systemIndex === 0 && measureIndex === 0;
        const isLastMeasureOverall =
          systemIndex === systems.length - 1 &&
          measureIndex === systemMeasures.length - 1;
        const staveWidth = measure.width;

        const stave = new Stave(x, y, staveWidth);

        if (isFirstMeasureOfSystem) {
          stave.addClef(clef).addKeySignature(template.keySignature || "C");

          if (isFirstMeasureOverall) {
            stave.addTimeSignature(template.timeSignature || "4/4");
          }
        }

        if (isLastMeasureOverall) {
          stave.setEndBarType(Barline.type.END);
        }

        stave.setContext(context).draw();

        context.setFont("Arial", 9, "");
        context.fillText(String(measure.measureNumber), x + 6, y + (compact ? -6 : 24));

        if (measure.renderNotes.length > 0) {
          const vexNotes = measure.renderNotes.map((note) => createStaveNote(note, clef));
          const tuplets = buildTuplets(measure.renderNotes, vexNotes);
          const beams = buildBeamGroups(measure.renderNotes, vexNotes, template.timeSignature);

          const voice = new Voice({
            numBeats: timeSignatureBeats(template.timeSignature),
            beatValue: 4,
          });

          voice.setStrict(false);
          voice.addTickables(vexNotes);

          const notationPadding = isFirstMeasureOfSystem ? 104 : 34;
          const formatWidth = Math.max(120, staveWidth - notationPadding);

          new Formatter().joinVoices([voice]).format([voice], formatWidth);
          voice.draw(context, stave);
          beams.forEach((beam) => beam.setContext(context).draw());
          tuplets.forEach((tuplet) => tuplet.setContext(context).draw());

          for (let index = 0; index < measure.renderNotes.length - 1; index += 1) {
            const current = measure.renderNotes[index];
            const next = measure.renderNotes[index + 1];

            if (
              current.tieGroup &&
              next.tieGroup &&
              current.tieGroup === next.tieGroup &&
              !current.isRest &&
              !next.isRest
            ) {
              new StaveTie({
                firstNote: vexNotes[index],
                lastNote: vexNotes[index + 1],
                firstIndexes: [0],
                lastIndexes: [0],
              }).setContext(context).draw();
            }
          }
        }

        x += staveWidth;
      });
    });
  }, [template, compact]);

  return (
    <div className={compact ? "inline-block bg-white px-2 py-0" : "rounded-3xl border border-white/10 bg-white p-4"}>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}