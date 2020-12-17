import React, {useRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useDrop} from "react-dnd";
import {DraggableUsedLetter} from "./DraggableUsedLetter";

export const SubstitutionCell = ({
  staticChar,
  editableChar,
  isLocked,
  isEditing,
  isConflict,
  substitutionIndex,
  onEditingStarted,
  onEditingCancelled,
  onEditingMoved,
  rank,
  editRank,
  pinned,
  onChangeChar,
  onChangeLocked,
}) => {
  const startEditing = () => {
    if (!isLocked && !isEditing) {
      onEditingStarted(substitutionIndex, editRank, pinned);
    }
  };
  const keyDown = (event) => {
    let handled = true;
    if (event.key === 'ArrowRight') {
      onEditingMoved(substitutionIndex, 0, 1);
    } else if (event.key === 'ArrowLeft') {
      onEditingMoved(substitutionIndex, 0, -1);
    } else if (event.key === 'ArrowUp') {
      onEditingMoved(substitutionIndex, -1, 0);
    } else if (event.key === 'ArrowDown') {
      onEditingMoved(substitutionIndex, 1, 0);
    } else if (event.key === 'Escape' || event.key === 'Enter') {
      onEditingCancelled(substitutionIndex);
    } else if (event.key === 'Backspace') {
      onChangeChar(substitutionIndex, rank, '');
      onEditingMoved(substitutionIndex, 0, -1);
    } else if (event.key === 'Delete') {
      onChangeChar(substitutionIndex, rank, '');
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const cellChanged = (value) => {
    onChangeChar(substitutionIndex, rank, value);
  };
  const lockClicked = () => {
    onChangeLocked(substitutionIndex, rank, !isLocked);
  };

  const staticCell = (
    <div className="substitution-letter-static letter-cell">
      {staticChar || '\u00A0'}
    </div>
  );
  const editableCell = (
    <DraggableUsedLetter
      cellChanged={cellChanged}
      keyDown={keyDown}
      startEditing={startEditing}
      editableChar={editableChar}
      isEditing={isEditing}
      isLocked={isLocked}
      isConflict={isConflict}
      substitutionIndex={substitutionIndex}
      rank={rank}
    />
  );
  const lock = (
    <div className="substitution-lock" onClick={lockClicked} key={isLocked}>
      <FontAwesomeIcon icon={isLocked ? 'lock' : 'lock-open'} />
    </div>
  );

  const ref = useRef(null);

  const [{canDrop, isOver}, drop] = useDrop({
    accept: ['used-letter', 'unused-letter'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item) => {
      if (item.letter && !isLocked) {
        const previousChar = editableChar;
        onChangeChar(substitutionIndex, rank, item.letter);
        if (item.substitutionIndex !== undefined && item.substitutionIndex !== null) {
          onChangeChar(item.substitutionIndex, item.rank, previousChar ? previousChar : '', false);
        }
      }
    },
  });

  drop(ref);

  const isActive = canDrop && isOver;

  return (
    <div ref={ref} className={`substitution-letter ${isActive ? 'substitution-letter-hover' : ''}`}>
      {staticCell}{editableCell}{lock}
    </div>
  );
};
