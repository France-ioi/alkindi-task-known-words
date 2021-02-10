import React from 'react';
import {DragLayer} from 'react-dnd';
import {DraggableWord} from "./DraggableWord";
import {DraggableCipheredWord} from "./DraggableCipheredWord";

let subscribedToOffsetChange = false;
let dragPreviewRef = null;

const onOffsetChange = monitor => () => {
  if (!dragPreviewRef) return;

  const offset = monitor.getSourceClientOffset();
  if (!offset) return;

  const transform = `translate(${offset.x}px, ${offset.y}px)`;
  dragPreviewRef.style["transform"] = transform;
  dragPreviewRef.style["-webkit-transform"] = transform;
};

export default DragLayer(monitor => {
  if (!subscribedToOffsetChange) {
    monitor.subscribeToOffsetChange(onOffsetChange(monitor));
    subscribedToOffsetChange = true;
  }

  return {
    itemBeingDragged: monitor.getItem(),
    componentType: monitor.getItemType(),
    beingDragged: monitor.isDragging(),
    monitor,
  };
})(
  class CustomDragLayer extends React.PureComponent {
    componentDidUpdate () {
      dragPreviewRef = this.rootNode;
    }
    render () {
      if (!this.props.beingDragged || -1 === ['word', 'ciphered-word'].indexOf(this.props.componentType)) {
        return null;
      }

      const offset = this.props.monitor.getSourceClientOffset();

      const {wordIndex, rowIndex, word, content} = this.props.itemBeingDragged;
      return (
        <div
          role="presentation"
          ref={el => (this.rootNode = el)}
          style={{
            position: "fixed",
            pointerEvents: "none",
            top: 0,
            left: 0,
            zIndex: 100,
            display: 'inline-block',
            transform: `translate(${offset && offset.x ? offset.x : 0}px, ${offset && offset.y ? offset.y : 0}px)`,
          }}
        >
          <div id="custom-drag-layer" className="custom-drag-layer">
            {'word' === this.props.componentType ? <DraggableWord
              wordIndex={wordIndex}
              word={word}
              onWordMoved={() => {}}
            /> : null}
            {'ciphered-word' === this.props.componentType ? <DraggableCipheredWord
              rowIndex={rowIndex}
              wordIndex={wordIndex}
              content={content}
            /> : null}
          </div>
        </div>
      );
    }
  }
);
