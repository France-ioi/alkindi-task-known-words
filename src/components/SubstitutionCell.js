import React, {useRef, useState, useEffect} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useDrop} from "react-dnd";
import {DraggableUsedLetter} from "./DraggableUsedLetter";
import {range} from 'range';
import {Form} from 'react-bootstrap';

export const SubstitutionCell = ({
  staticChar,
  editableChar,
  isEditing,
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
  const lockClicked = (index, newValue) => {
    if (!editableChar[index]) {
      return;
    }

    onChangeLocked(editableChar[index], newValue);
  };

  const toggleLockContainer = (e) => {
    if (editableChar.length === 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (symbolsPerLetterMax === 1) {
      lockClicked(0, !symbolsLocked[editableChar[0]]);
    } else {
      setLocksContainerOpen(!locksContainerOpen);
    }
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
          <div className="substitution-lock-symbol" key={'locks' + index} onClick={() => lockClicked(index, !(editableChar[index] && symbolsLocked[editableChar[index]]))}>
            <FontAwesomeIcon icon="lock-open" className="lock-open"/>
            <Form.Check
              id={"switch" + index}
              size="xs"
              type="switch"
              checked={!!(editableChar[index] && symbolsLocked[editableChar[index]])}
              onChange={() => lockClicked(index, (editableChar[index] && symbolsLocked[editableChar[index]]))}
            />
            <FontAwesomeIcon icon="lock"/>
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
