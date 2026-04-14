export type TrainingFacilitatorNoteBlock = {
  start: number;
  end: number;
  label: string;
  objective: string;
  talkTrack: string[];
  facilitationMoves: string[];
  debrief?: string[];
};

export function buildTrainingFacilitatorKit(input: {
  moduleTitle: string;
  slideTitles: readonly string[];
  noteBlocks: TrainingFacilitatorNoteBlock[];
}) {
  function getNote(slideIndex: number) {
    const slideNumber = slideIndex + 1;
    return (
      input.noteBlocks.find((block) => slideNumber >= block.start && slideNumber <= block.end) ??
      input.noteBlocks[input.noteBlocks.length - 1]
    );
  }

  function getNoteBlocks() {
    return input.noteBlocks;
  }

  function getSlideScript(slideIndex: number) {
    const currentNote = getNote(slideIndex);
    const title = input.slideTitles[slideIndex] ?? `Slide ${slideIndex + 1}`;

    return [
      `Use this slide to advance ${input.moduleTitle.toLowerCase()} with a clear focus on ${currentNote.objective.toLowerCase()}.`,
      `Keep ${title.toLowerCase()} grounded in realistic banking decisions, operating controls, and practical delivery choices.`,
      `Before moving on, make sure the room can explain why this point matters in practice and what action or judgement it should change.`,
    ];
  }

  function getQuestions(slideIndex: number) {
    const currentNote = getNote(slideIndex);
    const title = input.slideTitles[slideIndex] ?? `Slide ${slideIndex + 1}`;

    return [
      `What is the most important judgement issue underneath ${title.toLowerCase()}?`,
      "What would make this approach harder to govern, operate, or explain in a banking environment?",
      `How should this part of the module change the participant's recommendation quality? ${currentNote.objective}`,
    ];
  }

  return {
    getNote,
    getNoteBlocks,
    getSlideScript,
    getQuestions,
  };
}
