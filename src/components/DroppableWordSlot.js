import React from "react";
import {range} from 'range';

export const DroppableWordSlot = ({
  wordSlotId,
  position,
  letters,
  occupied,
  draggingWord,
}) => {
  const isActive = draggingWord && draggingWord.length === letters;

  return (
    <div id={wordSlotId} className={`droppable-word-slot ${isActive ? 'droppable-word-slot-hover' : ''}`}>
      {range(0, letters).map((letter, letterIndex) =>
        <div className={`droppable-word-letter ${occupied && !occupied[position + letterIndex] ? 'droppable-word-letter-occupied' : ''}`} key={letterIndex}/>
      )}
    </div>
  );
};
