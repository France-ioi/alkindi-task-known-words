import React, {useRef, useEffect} from 'react';
import {useDrag} from 'react-dnd';
import {getEmptyImage} from 'react-dnd-html5-backend';

function getStyles (isDragging) {
  return {
    opacity: isDragging ? 0 : 1,
    marginBottom: '2px',
  };
}

export const DraggableWord = ({word, wordIndex, minimal, onWordMoved, onDragStart, onDragEnd, wordSlotsByRow, innerRef, onWordSelected, selected}) => {
  const ref = innerRef ? innerRef : useRef(null);

  const [{isDragging}, drag, preview] = useDrag({
    item: {type: 'word', word, wordIndex},
    begin () {
      onDragStart(word);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      let dragLayerRef = document.getElementById('custom-drag-layer');
      const itemPosition = dragLayerRef.getBoundingClientRect();
      const possibleWords = [];
      for (let rowIndex of Object.keys(wordSlotsByRow)) {
        const row = wordSlotsByRow[rowIndex];
        for (let {position, wordSlotId} of row) {
          const element = document.getElementById(wordSlotId);
          if (element) {
            const wordPosition = element.getBoundingClientRect();
            const overlap = !(itemPosition.right < wordPosition.left ||
              itemPosition.left > wordPosition.right ||
              itemPosition.bottom < wordPosition.top ||
              itemPosition.top > wordPosition.bottom);
            if (overlap) {
              const overlapDistance =
                Math.min(itemPosition.right - wordPosition.left, wordPosition.right - itemPosition.left)
                + Math.min(itemPosition.bottom - wordPosition.top, wordPosition.bottom - itemPosition.top);
              possibleWords.push({
                overlapDistance,
                rowIndex,
                position,
              });
            }
          }
        }
      }

      if (!possibleWords.length) {
        onDragEnd();
        onWordMoved(wordIndex, null, null);
        return;
      }

      possibleWords.sort((a, b) => {
        return b.overlapDistance - a.overlapDistance;
      });

      const {rowIndex, position} = possibleWords[0];
      onDragEnd();
      onWordMoved(wordIndex, rowIndex, position);
    },
  });

  useEffect(() => {
    preview(getEmptyImage(), {captureDraggingState: true});
  }, []);

  drag(ref);

  return (
    <div
      ref={ref}
      className={`draggable-word letter-cell ${minimal ? 'is-minimal' : ''} ${selected ? 'is-selected' : ''}`}
      style={getStyles(isDragging)}
      onClick={() => onWordSelected(wordIndex)}
    >
      {!minimal &&
        <div className="draggable-word-handle">
          <svg x="0px" y="0px" width="10px" height="20px" viewBox="0 0 20 40" version="1.1" xmlns="http://www.w3.org/2000/svg">
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
