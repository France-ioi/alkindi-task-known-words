import React, {useRef} from 'react';
import {useDrag} from 'react-dnd';

export const DraggableWord = ({word, wordIndex, minimal, onWordMoved}) => {
  const ref = useRef(null);

  const [{isDragging}, drag] = useDrag({
    item: {type: 'word', word, wordIndex},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop && onWordMoved) {
        onWordMoved(wordIndex, null, null);
      }
    },
  });

  const opacity = isDragging ? 0 : 1;
  drag(ref);

  return (
    <div ref={ref} className={`draggable-word letter-cell ${minimal ? 'is-minimal' : ''}`} style={{opacity, marginBottom: '2px'}}>
      {!minimal &&
        <div className="draggable-word-handle">
          <svg x="0px" y="0px" width="10px" height="20px" viewBox="0 0 20 40" version="1.1" xmlns="http://www.w3.org/2000/svg">>
            <circle fill="#EEEEEE" opacity="0.7" cx="10" cy="12" r="3"></circle>
            <circle fill="#EEEEEE" opacity="0.7" cx="10" cy="20" r="3"></circle>
            <circle fill="#EEEEEE" opacity="0.7" cx="10" cy="28" r="3"></circle>
          </svg>
        </div>
      }
      <div className="draggable-word-value">
        {word.split('').map((letter, letterIndex) =>
          <div className="draggable-word-letter" key={letterIndex}>{letter}</div>
        )}
      </div>
    </div>
  );
};
