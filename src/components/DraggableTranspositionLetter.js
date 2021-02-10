import React, {useRef} from 'react';
import {useDrag, useDrop} from 'react-dnd';

export const DraggableTranspositionLetter = ({letter, index, moveLetter, locked}) => {
  const ref = useRef(null);

  const [{canDrop, isOver}, drop] = useDrop({
    accept: 'transposition-letter',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item) => {
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      moveLetter(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  const [{isDragging}, drag] = useDrag({
    item: {type: 'transposition-letter', index},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  const isActive = canDrop && isOver;

  return (
    <div ref={ref} className="transposition-slot" style={{opacity}}>
      <div className={`transposition-letter letter-cell ${isActive ? 'substitution-letter-hover' : ''} ${locked ? 'is-locked' : ''}`}>
        <span>{letter}</span>
      </div>
    </div>
  );
};
