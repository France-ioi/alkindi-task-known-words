import React, {useEffect, useRef} from 'react';
import {useDrag} from 'react-dnd';

export const DraggableUsedLetter = ({isLocked, cellChanged, editableChar, startEditing, rank, position}) => {
  const ref = useRef(null);

  const refInput = React.createRef();

  useEffect(() => {
    if (refInput && refInput.current) {
      refInput.current.select();
      refInput.current.focus();
    }
  });

  const canDrag = editableChar && !isLocked;

  const [{isDragging}, drag] = useDrag({
    item: {type: 'used-letter', letter: editableChar, rank, position},
    canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        cellChanged(null);
      }
    },
  });

  const opacity = isDragging ? 0 : 1;
  if (canDrag) {
    drag(ref);
  }

  return (
    <div
      ref={ref}
      className={`
        substitution-letter-editable-inside
        letter-cell
       
      `}
      onClick={startEditing}
      style={{opacity}}
    >
      {editableChar || '\u00A0'}
    </div>
  );
};
