import React, {useRef} from 'react';
import {useDrag, useDrop} from 'react-dnd';

export const DraggableTranspositionLetter = ({letter, index, moveLetter, locked}) => {
  const ref = useRef(null);

  let currentIndex = index;

  const [, drop] = useDrop({
    accept: 'transposition-letter',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });
  const [{isDragging}, drag] = useDrag({
    item: {type: 'transposition-letter', index},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleCardMove = React.useCallback((event) => {
    const slots = document.getElementsByClassName('transposition-slot');
    const eventX = event.clientX;
    if (currentIndex > 0 && eventX <= slots[currentIndex - 1].getBoundingClientRect().right) {
      moveLetter(currentIndex, currentIndex - 1);
      currentIndex--;
    }
    if (currentIndex < slots.length - 1 && eventX >= slots[currentIndex + 1].getBoundingClientRect().left) {
      moveLetter(currentIndex, currentIndex + 1);
      currentIndex++;
    }
  }, []);

  React.useEffect(() => {
    if (isDragging) window.addEventListener("drag", handleCardMove);
    else window.removeEventListener("drag", handleCardMove);
    return () => window.removeEventListener("drag", handleCardMove);
  }, [isDragging, handleCardMove]);

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
