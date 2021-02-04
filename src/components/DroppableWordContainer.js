import React, {useRef} from "react";
import {useDrop} from "react-dnd";

export const DroppableWordContainer = ({
  onDropWord,
}) => {
  const ref = useRef(null);

  const [{canDrop, isOver}, drop] = useDrop({
    accept: ['word'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item, monitor) => {
      console.log('item');
      const offset = monitor.getSourceClientOffset();
      if (offset && ref.current) {
        const dropTargetXy = ref.current.getBoundingClientRect();
        const dropCoordinates = {
          x: offset.x - dropTargetXy.left,
          y: offset.y - dropTargetXy.top,
        };
        onDropWord(item, dropCoordinates);
      }
    },
  });

  drop(ref);

  return (
    <div ref={ref} className={`droppable-word-container`}>
      {/*{range(0, letters).map((letter, letterIndex) =>*/}
      {/*  <div className={`droppable-word-letter ${occupied && !occupied[position + letterIndex] ? 'droppable-word-letter-occupied' : ''}`} key={letterIndex}/>*/}
      {/*)}*/}
    </div>
  );
};
