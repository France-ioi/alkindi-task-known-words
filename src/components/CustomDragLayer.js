import React from 'react';
import {DragLayer} from 'react-dnd';
import {DraggableWord} from "./DraggableWord";

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
    beingDragged: monitor.isDragging()
  };
})(
  class CustomDragLayer extends React.PureComponent {
    componentDidUpdate () {
      dragPreviewRef = this.rootNode;
    }
    render () {
      if (!this.props.beingDragged || this.props.componentType !== 'word') {
        return null;
      }

      const {wordIndex, word} = this.props.itemBeingDragged;
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
          }}
        >
          <div id="custom-drag-layer">
            <DraggableWord
              wordIndex={wordIndex}
              word={word}
              onWordMoved={() => {}}
            />
          </div>
        </div>
      );
    }
  }
);
