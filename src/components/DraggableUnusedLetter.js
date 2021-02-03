import React, {useRef} from 'react';
import {useDrag} from 'react-dnd';

export const DraggableUnusedLetter = ({letter}) => {
  const ref = useRef(null);

  const [{isDragging}, drag] = useDrag({
    item: {type: 'unused-letter', letter},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(ref);

  return (
    <div ref={ref} className="unused-letter letter-cell" style={{opacity, marginBottom: '2px'}}>
      <svg x="0px" y="0px" width="10px" height="20px" viewBox="0 0 20 40" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <circle fill="#30242B" opacity="0.7" cx="10" cy="12" r="3"></circle>
        <circle fill="#30242B" opacity="0.7" cx="10" cy="20" r="3"></circle>
        <circle fill="#30242B" opacity="0.7" cx="10" cy="28" r="3"></circle>
      </svg>
      <span className="unused-letter-value">{letter}</span>
    </div>
  );
};
