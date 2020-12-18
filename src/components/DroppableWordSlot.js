import React, {useRef} from "react";
import {useDrop} from "react-dnd";

export const DroppableWordSlot = ({
  rowIndex,
  position,
  ciphered,
  onWordMoved,
}) => {
  const ref = useRef(null);

  const [{canDrop, isOver}, drop] = useDrop({
    accept: ['word'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item) => {
      onWordMoved(item.wordIndex, rowIndex, position);
      // if (item.rank) {
      //   onChangeChar(item.rank, item.position, null);
      // }
    },
  });

  drop(ref);

  const isActive = canDrop && isOver;

  return (
    <div ref={ref} className={`droppable-word-slot ${isActive ? 'substitution-letter-hover' : ''} ${ciphered === ' ' ? 'is-space' : ''}`}>
    </div>
  );
};
