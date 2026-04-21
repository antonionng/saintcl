import pythonForDataPack, {
  pythonForDataSegments,
  pythonForDataSlides,
} from "@/lib/training-scripts/python-for-data";
import type { SegmentBlock, SlideScript } from "@/lib/training-scripts/types";

function findSegmentForSlide(slideNumber: number): SegmentBlock {
  return (
    pythonForDataSegments.find(
      (block) => slideNumber >= block.start && slideNumber <= block.end,
    ) ?? pythonForDataSegments[pythonForDataSegments.length - 1]
  );
}

function findSlideScript(slideIndex: number): SlideScript {
  const slideNumber = slideIndex + 1;
  return (
    pythonForDataSlides.find((slide) => slide.slideNumber === slideNumber) ??
    pythonForDataSlides[pythonForDataSlides.length - 1]
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

export function getPythonFacilitatorNote(slideIndex: number) {
  const slideNumber = slideIndex + 1;
  return noteFromSegment(findSegmentForSlide(slideNumber));
}

export function getPythonFacilitatorNoteBlocks() {
  return pythonForDataSegments.map(noteFromSegment);
}

export function getPythonFacilitatorSlideScript(slideIndex: number): SlideScript {
  return findSlideScript(slideIndex);
}

export function getPythonFacilitatorQuestions(slideIndex: number): string[] {
  const slide = findSlideScript(slideIndex);
  if (slide.askThis && slide.askThis.length > 0) {
    return slide.askThis;
  }
  return [
    `What is the single most important thing this slide should change in your real work, given ${slide.coreMessage.toLowerCase()}?`,
  ];
}

export const pythonFacilitatorPack = pythonForDataPack;
