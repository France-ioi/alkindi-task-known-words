import React, {useRef} from 'react';
import {useDrag, useDragLayer} from 'react-dnd';

export const DraggableTranspositionLetter = ({letter, index, moveLetter, locked}) => {
  const ref = useRef(null);

  const [{isDragging}, drag] = useDrag({
    item: {type: 'transposition-letter', index},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const {clientOffset} = useDragLayer((monitor) => ({
    clientOffset: monitor.getClientOffset(),
  }));

  React.useEffect(() => {
    if (isDragging) {
      const clientOffsetX = clientOffset.x;
      const slots = document.getElementsByClassName('transposition-slot');
      if (index > 0 && clientOffsetX <= slots[index - 1].getBoundingClientRect().right) {
        moveLetter(index, index - 1);
        index--;
      }
      if (index < slots.length - 1 && clientOffsetX >= slots[index + 1].getBoundingClientRect().left) {
        moveLetter(index, index + 1);
        index++;
      }
    }
  }, [isDragging, clientOffset ? clientOffset.x : null]);

  const opacity = isDragging ? 0 : 1;
  drag(ref);

  return (
    <div ref={ref} className="transposition-slot" style={{opacity}}>
      <div className={`transposition-letter letter-cell ${locked ? 'is-locked' : ''}`}>
        <span>{letter}</span>
      </div>
    </div>
  );
};
