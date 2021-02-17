import React, {useRef} from 'react';
import {useDrag, useDrop} from 'react-dnd';

export const DraggableTranspositionLetter = ({letter, index, moveLetter, locked}) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: 'transposition-letter',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover (item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 7;
      const clientOffset = monitor.getClientOffset();
      if (
        (hoverIndex > dragIndex && clientOffset.x - hoverBoundingRect.left >= hoverMiddleX)
        || (hoverIndex < dragIndex && hoverBoundingRect.right - clientOffset.x >= hoverMiddleX)
      ) {
        moveLetter(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }

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

  return (
    <div ref={ref} className="transposition-slot" style={{opacity}}>
      <div className={`transposition-letter letter-cell ${locked ? 'is-locked' : ''}`}>
        <span>{letter}</span>
      </div>
    </div>
  );
};
