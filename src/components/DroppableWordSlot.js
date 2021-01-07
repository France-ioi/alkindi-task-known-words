import React, {useState, useRef} from "react";
import {useDrop} from "react-dnd";
import {range} from 'range';

export const DroppableWordSlot = ({
  rowIndex,
  position,
  letters,
  occupied,
  onWordMoved,
}) => {
  const ref = useRef(null);

  const [validItem, setValidItem] = useState(false);

  const [{canDrop, isOver}, drop] = useDrop({
    accept: ['word'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover: (item) => {
      if (item && item.word.length === letters) {
        setValidItem(true);
      } else {
        setValidItem(false);
      }
    },
    drop: (item) => {
      onWordMoved(item.wordIndex, rowIndex, position);
    },
  });

  drop(ref);

  const isActive = canDrop && isOver && validItem;

  return (
    <div ref={ref} className={`droppable-word-slot ${isActive ? 'substitution-letter-hover' : ''}`}>
      {range(0, letters).map((letter, letterIndex) =>
        <div className={`droppable-word-letter ${occupied && !occupied[position + letterIndex] ? 'droppable-word-letter-occupied' : ''}`} key={letterIndex}/>
      )}
    </div>
  );
};
