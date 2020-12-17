import React, {useRef} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useDrop} from "react-dnd";
import {DraggableUsedLetter} from "./DraggableUsedLetter";
import {range} from 'range';

export const SubstitutionCell = ({
  staticChar,
  editableChar,
  isLocked,
  isEditing,
  isConflict,
  onEditingStarted,
  rank,
  editRank,
  pinned,
  onChangeChar,
  onChangeLocked,
  symbolsPerLetterMax,
}) => {
  const startEditing = () => {
    if (!isLocked && !isEditing) {
      onEditingStarted(editRank, pinned);
    }
  };
  const cellChanged = (value, position) => {
    onChangeChar(rank, position, value);
  };
  const lockClicked = () => {
    onChangeLocked(rank, !isLocked);
  };

  const staticCell = (
    <div className="substitution-letter-static letter-cell">
      {staticChar || '\u00A0'}
    </div>
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
        onChangeChar(rank, item.position, item.letter);
        if (item.rank) {
          onChangeChar(item.rank, item.position, null);
        }
      }
    },
  });

  drop(ref);

  const isActive = canDrop && isOver && editableChar.length < symbolsPerLetterMax;

  return (
    <div ref={ref} className={`substitution-letter ${isActive ? 'substitution-letter-hover' : ''}`}>
      {staticCell}
      {range(0, editableChar.length).map((index) =>
        <DraggableUsedLetter
          key={index}
          position={index}
          cellChanged={(value) => cellChanged(value, index)}
          startEditing={startEditing}
          editableChar={editableChar[index]}
          isEditing={isEditing}
          isLocked={isLocked}
          isConflict={isConflict}
          rank={rank}
        />
      )}
      {lock}
    </div>
  );
};
