import React, {useRef} from "react";
import {useDrop} from "react-dnd";

export const DroppableWordContainer = ({
  onDropWord,
  children,
}) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ['word', 'ciphered-word'],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    drop: (item, monitor) => {
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
      {children}
    </div>
  );
};
