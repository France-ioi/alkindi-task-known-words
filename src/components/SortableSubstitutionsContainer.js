import React, {useRef} from 'react';
import {useDrop} from 'react-dnd';
import SubstitutionView from "./SubstitutionView";
import {SortableSubstitution} from "./SortableSubstitution";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export const SortableSubstitutionsContainer = ({substitutions, rowIndex, subLineIndex, maxSubstitutionsCount, moveSubstitution, editSubstitution}) => {
  const ref = useRef(null);

  const originalIndex = {rowIndex, subLineIndex, substitutionIndex: substitutions.length};

  const [, drop] = useDrop({
    accept: 'substitution',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }
      return {position: originalIndex};
    },
  });

  drop(ref);

  return (
    <div ref={ref} className="deciphered-substitutions-container">
      {substitutions.map(({type, count}, substitutionIndex) =>
        (subLineIndex > 0 ? <SortableSubstitution
          key={substitutionIndex}
          rowIndex={rowIndex}
          subLineIndex={subLineIndex}
          substitutionIndex={substitutionIndex}
          type={type}
          count={count}
          moveSubstitution={moveSubstitution}
          editSubstitution={editSubstitution}
        /> : <SubstitutionView
          bordered={true}
          key={substitutionIndex}
          type={type}
          count={count}
        />)
      )}
      {(substitutions.length < maxSubstitutionsCount) &&
        <span className="decipher-line-add">
          <a onClick={() => editSubstitution({rowIndex, subLineIndex})}>
            <FontAwesomeIcon icon="plus" />
          </a>
        </span>
      }
    </div>
  );
};
