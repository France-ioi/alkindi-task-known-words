import React, {useRef, useState, useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useDrop} from "react-dnd";
import {DraggableUsedLetter} from "./DraggableUsedLetter";
import {range} from 'range';



export const SubstitutionCell = ({
  staticChar,
  editableChar,
  isEditing,
  isConflict,
  onEditingStarted,
  rank,
  editRank,
  pinned,
  onChangeChar,
  onChangeLocked,
  symbolsPerLetterMax,
  symbolsLocked,
}) => {
  const [locksContainerOpen, setLocksContainerOpen] = useState(false);

  function useOutsideAlerter (ref) {
    useEffect(() => {
      function handleClickOutside (event) {
        if (ref.current && !ref.current.contains(event.target) && !(lockBottom.current && lockBottom.current.contains(event.target))) {
          setLocksContainerOpen(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [ref]);
  }

  const startEditing = (index) => {
    if (!(editableChar[index] && symbolsLocked[editableChar[index]]) && !isEditing) {
      onEditingStarted(editRank, pinned);
    }
  };
  const cellChanged = (value, position) => {
    onChangeChar(rank, position, value);
  };
  const lockClicked = (index) => {
    if (!editableChar[index]) {
      return;
    }

    onChangeLocked(editableChar[index], !(editableChar[index] && symbolsLocked[editableChar[index]]));
  };

  const toggleLockContainer = (e) => {
    if (editableChar.length === 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setLocksContainerOpen(!locksContainerOpen);
  };

  const ref = useRef(null);
  const locksContainerRef = useRef(null);
  const lockBottom = useRef(null);
  useOutsideAlerter(locksContainerRef);

  const staticCell = (
    <div className="substitution-letter-static letter-cell" key="static-cell">
      {staticChar || '\u00A0'}
    </div>
  );
  const lock = (
    <div
      className={`substitution-lock ${editableChar.length === 0 ? 'substitution-lock-empty' : ''}`}
      onClick={(e) => toggleLockContainer(e)}
      key="lock"
      ref={lockBottom}
    >
      <FontAwesomeIcon icon={editableChar.filter(symbol => symbolsLocked[symbol]).length ? 'lock' : 'lock-open'} />
    </div>
  );

  const [{canDrop, isOver}, drop] = useDrop({
    accept: ['used-letter', 'unused-letter'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item) => {
      if (item.letter) {
        onChangeChar(rank, item.position, item.letter, false);
        if (undefined !== item.rank) {
          onChangeChar(item.rank, item.position, null, false);
        }
      }
    },
  });

  drop(ref);

  const isActive = canDrop && isOver && editableChar.length < symbolsPerLetterMax;

  return (
    <div ref={ref} className={`substitution-letter ${isActive ? 'substitution-letter-hover' : ''}`}>
      {staticCell}
      {locksContainerOpen && <div className="substitution-locks-container" ref={locksContainerRef}>
        {range(0, Math.min(editableChar.length, symbolsPerLetterMax)).map((index) =>
          <div className="substitution-lock-symbol" onClick={() => lockClicked(index)} key={'locks' + index}>
            <FontAwesomeIcon icon={editableChar[index] && symbolsLocked[editableChar[index]] ? 'lock' : 'lock-open'} />
            <div className="substitution-lock-caret"/>
          </div>
        )}
      </div>}
      {range(0, Math.min(editableChar.length + 1, symbolsPerLetterMax)).map((index) =>
        <div
          key={'editable' + index}
          className={`
            substitution-letter-editable
            ${editableChar && editableChar[index] && !symbolsLocked[editableChar[index]] ? 'substitution-letter-movable' : ''}
            ${editableChar[index] && symbolsLocked[editableChar[index]] ? 'substitution-letter-locked' : ''}
          `}
        >
          <DraggableUsedLetter
            position={index}
            cellChanged={(value) => cellChanged(value, index)}
            startEditing={() => startEditing(index)}
            editableChar={editableChar[index]}
            isLocked={editableChar[index] && symbolsLocked[editableChar[index]]}
            isEditing={isEditing}
            rank={rank}
          />
        </div>
      )}
      {range(0, Math.max(symbolsPerLetterMax - editableChar.length - 1)).map((index) =>
        <div
          key={'remaining' + index}
          className={`
            substitution-letter-empty
          `}
        />
      )}
      {lock}
    </div>
  );
};
