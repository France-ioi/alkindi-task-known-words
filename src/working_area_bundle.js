import React from 'react';
import {connect} from 'react-redux';
import {DroppableWordContainer} from "./components/DroppableWordContainer";
import {DraggableWord} from "./components/DraggableWord";

function taskInitReducer (state) {
  return {
    ...state,
    workingAreaWords: [],
  };
}

function taskRefreshReducer (state) {
  return {
    ...state,
  };
}

function workingAreaWordDroppedReducer (state, {payload: {word, coordinates}}) {
  console.log({word, coordinates});
  return state;
}

function WorkingAreaSelector (state) {
  const {
    actions: {
      workingAreaWordDropped,
    },
    workingAreaWords,
  } = state;

  return {
    workingAreaWords,

    workingAreaWordDropped,
  };
}

class WorkingAreaBundleView extends React.PureComponent {
  render () {
    const {workingAreaWords} = this.props;

    return (
      <div className="working-area">
        <DroppableWordContainer
          onDropWord={this.onDropWord}
        />
        {workingAreaWords.map((word, index) =>
          <DraggableWord
            index={index}
          />
        )}
      </div>
    );
  }

  onDropWord = (word, coordinates) => {
    this.props.dispatch({type: this.props.workingAreaWordDropped, payload: {word, coordinates}});
  }
}

export default {
  actions: {
    workingAreaWordDropped: 'WorkingArea.Word.Dropped',
  },
  actionReducers: {
    taskInit: taskInitReducer,
    taskRefresh: taskRefreshReducer,
    workingAreaWordDropped: workingAreaWordDroppedReducer,
  },
  views: {
    WorkingArea: connect(WorkingAreaSelector)(WorkingAreaBundleView)
  }
};
