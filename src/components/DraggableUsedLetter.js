import React, {useEffect, useRef} from 'react';
import {useDrag} from 'react-dnd';

export const DraggableUsedLetter = ({isConflict, isEditing, isLocked, keyDown, cellChanged, editableChar, startEditing, substitutionIndex, rank}) => {
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
    item: {type: 'used-letter', letter: editableChar, substitutionIndex, rank},
    canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        cellChanged('');
      }
    },
  });

  const opacity = isDragging ? 0 : 1;
  drag(ref);

  return (
    <div
      ref={ref}
      className={`
        substitution-letter-editable
        letter-cell
        ${canDrag ? 'substitution-letter-movable' : ''}
        ${isLocked ? 'substitution-letter-locked' : ''}
        ${isConflict ? 'substitution-letter-conflict' : ''}
      `}
      onClick={startEditing}
      style={{opacity}}
    >
      {isEditing
        ? <input ref={refInput} onChange={() => cellChanged(refInput.current.value.substr(-1))} onKeyDown={keyDown} type='text' value={editableChar || ''} />
        : (editableChar || '\u00A0')}
    </div>
  );
};
