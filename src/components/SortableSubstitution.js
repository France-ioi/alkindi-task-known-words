import React, {useRef} from 'react';
import {useDrag, useDrop} from 'react-dnd';
import SubstitutionView from "./SubstitutionView";

const style = {
  cursor: 'move',
  display: 'inline-block',
};

export const SortableSubstitution = ({type, count, rowIndex, subLineIndex, substitutionIndex, moveSubstitution, editSubstitution}) => {
  const ref = useRef(null);

  const originalIndex = {rowIndex, subLineIndex, substitutionIndex};

  const [{isDragging}, drag] = useDrag({
    item: {type: 'substitution', substitutionType: type, count, originalIndex},
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const {substitutionType, count, originalIndex} = monitor.getItem();
      const {rowIndex, subLineIndex, substitutionIndex} = originalIndex;
      const didDrop = monitor.didDrop();
      if (didDrop) {
        const {position} = monitor.getDropResult();
        moveSubstitution({type: substitutionType, count, rowIndex, subLineIndex, substitutionIndex}, position);
      } else {
        moveSubstitution({type: substitutionType, count, rowIndex, subLineIndex, substitutionIndex}, null);
      }
    },
  });

  const [, drop] = useDrop({
    accept: 'substitution',
    drop: () => {
      return {position: originalIndex};
    },
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return (
    <div ref={ref} style={{...style, opacity}}>
      <a
        className="sortable-substitution"
        onClick={() => editSubstitution({type, count, rowIndex, subLineIndex, substitutionIndex})}
      >
        <SubstitutionView
          bordered={true}
          draggable={true}
          type={type}
          count={count}
        />
      </a>
    </div>
  );
};
