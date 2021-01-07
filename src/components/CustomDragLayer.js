import React from 'react';
import {useDragLayer} from 'react-dnd';
import {DraggableWord} from "./DraggableWord";

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};
function getItemStyles (initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  let {x, y} = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

export const CustomDragLayer = () => {
  const {item, itemType, isDragging, initialOffset, currentOffset} = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== 'word') {
    return null;
  }

  const {wordIndex, word} = item;

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        <DraggableWord
          wordIndex={wordIndex}
          word={word}
          onWordMoved={() => {}}
        />
      </div>
    </div>
  );
};
