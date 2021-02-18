import React, {useRef} from 'react';
import {useDrag} from 'react-dnd';

export const DraggableTranspositionLetter = ({letter, index, moveLetter, locked}) => {
  const ref = useRef(null);

  const [{isDragging}, drag] = useDrag({
    item: {type: 'transposition-letter', index},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleCardMove = React.useCallback((event) => {
    const eventX = event.clientX || event.targetTouches[0].clientX;
    if (eventX === 0) {
      return;
    }
    const slots = document.getElementsByClassName('transposition-slot');
    if (index > 0 && eventX <= slots[index - 1].getBoundingClientRect().right) {
      moveLetter(index, index - 1);
      index--;
    }
    if (index < slots.length - 1 && eventX >= slots[index + 1].getBoundingClientRect().left) {
      moveLetter(index, index + 1);
      index++;
    }
  }, [index]);

  React.useEffect(() => {
    const supportsTouch = (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));

    if (isDragging) {
      window.addEventListener(supportsTouch ? 'touchmove' : 'drag', handleCardMove);
    }
    else {
      window.removeEventListener(supportsTouch ? 'touchmove' : 'drag', handleCardMove);
    }
    return () => {
      window.removeEventListener(supportsTouch ? 'touchmove' : 'drag', handleCardMove);
    };
  }, [isDragging, handleCardMove]);

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
