import programmeOrientationPack, {
  programmeOrientationSegments,
  programmeOrientationSlides,
} from "@/lib/training-scripts/programme-orientation";
import type { SegmentBlock, SlideScript } from "@/lib/training-scripts/types";

function findSegmentForSlide(slideNumber: number): SegmentBlock {
  return (
    programmeOrientationSegments.find(
      (block) => slideNumber >= block.start && slideNumber <= block.end,
    ) ?? programmeOrientationSegments[programmeOrientationSegments.length - 1]
  );
}

function findSlideScript(slideIndex: number): SlideScript {
  const slideNumber = slideIndex + 1;
  return (
    programmeOrientationSlides.find((slide) => slide.slideNumber === slideNumber) ??
    programmeOrientationSlides[programmeOrientationSlides.length - 1]
  );
}

function noteFromSegment(block: SegmentBlock) {
  return {
    start: block.start,
    end: block.end,
    label: block.label,
    objective: block.objective,
    talkTrack: [block.delivery, ...block.facilitatorMoves],
    facilitationMoves: block.facilitatorMoves,
    debrief: block.debrief,
  };
}

export function getProgrammeOrientationNote(slideIndex: number) {
  const slideNumber = slideIndex + 1;
  return noteFromSegment(findSegmentForSlide(slideNumber));
}

export function getProgrammeOrientationNoteBlocks() {
  return programmeOrientationSegments.map(noteFromSegment);
}

export function getProgrammeOrientationSlideScript(slideIndex: number): SlideScript {
  return findSlideScript(slideIndex);
}

export function getProgrammeOrientationQuestions(slideIndex: number): string[] {
  const slide = findSlideScript(slideIndex);
  if (slide.askThis && slide.askThis.length > 0) {
    return slide.askThis;
  }
  return [
    `What is the single most important thing this slide should change in your real work, given ${slide.coreMessage.toLowerCase()}?`,
  ];
}

export const programmeOrientationFacilitatorPack = programmeOrientationPack;
