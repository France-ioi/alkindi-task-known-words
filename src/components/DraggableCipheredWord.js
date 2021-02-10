import React, {useRef, useEffect} from 'react';
import {useDrag} from 'react-dnd';
import {getEmptyImage} from 'react-dnd-html5-backend';
import {range} from 'range';

function getStyles (isDragging) {
  return {
    opacity: isDragging ? 0 : 1,
    marginBottom: '2px',
  };
}

export const DraggableCipheredWord = ({rowIndex, wordIndex, content, onWordRemoved}) => {
  const ref = useRef(null);

  const [{isDragging}, drag, preview] = useDrag({
    item: {type: 'ciphered-word', rowIndex, wordIndex, content, lettersCount: content.length, id: rowIndex + '-' + wordIndex},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop && onWordRemoved) {
        onWordRemoved(item);
      }
    },
  });

  useEffect(() => {
    preview(getEmptyImage(), {captureDraggingState: true});
  }, []);

  drag(ref);

  return (
    <div
      ref={ref}
      className={`draggable-word draggable-ciphered-word letter-cell`}
      style={getStyles(isDragging)}
    >
      <div className="draggable-word-handle">
        <svg x="0px" y="0px" width="10px" height="20px" viewBox="0 0 20 40" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <circle fill="#EEEEEE" opacity="0.7" cx="10" cy="12" r="3"></circle>
          <circle fill="#EEEEEE" opacity="0.7" cx="10" cy="20" r="3"></circle>
          <circle fill="#EEEEEE" opacity="0.7" cx="10" cy="28" r="3"></circle>
        </svg>
      </div>
      <div className="draggable-word-value">
        <div className="draggable-word-symbols">
          {range(0, content.length).map((letterIndex) =>
            <div className="draggable-word-letter" key={letterIndex}>{content[letterIndex].ciphered}</div>
          )}
        </div>
        <div className="draggable-word-result">
          {range(0, content.length).map((letterIndex) =>
            <div className={`draggable-word-letter ${content[letterIndex].hint ? 'is-hint' : (content[letterIndex].value ? 'is-value' : 'is-ciphered')}`} key={letterIndex}>
              {content[letterIndex].hint || content[letterIndex].value || content[letterIndex].result || ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
