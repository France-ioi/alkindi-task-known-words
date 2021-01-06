import React from 'react';
import {connect} from 'react-redux';
import {range} from 'range';

const cellWidth = 22;
const cellHeight = 30;
const pageRows = 6;
const textWidth = 138; // px

function appInitReducer (state, _action) {
  return {
    ...state,
    cipheredText: {
      scrollTop: 0,
    }
  };
}

function taskInitReducer (state) {
  let {cipheredText} = state;
  if (!cipheredText) {
    return state;
  }

  return {...state, cipheredText};
}

function taskRefreshReducer (state) {
  return taskInitReducer(state);
}

function cipheredTextResizedReducer (state, {payload: {width}}) {
  let {cipheredText} = state;
  cipheredText = {...cipheredText, width};
  return {...state, cipheredText};
}

function cipheredTextScrolledReducer (state, {payload: {scrollTop}}) {
  let {cipheredText} = state;
  cipheredText = {...cipheredText, scrollTop};

  return {...state, cipheredText};
}

function CipherTextViewSelector (state) {
  const {actions, cipheredText, taskData: {cipherTextLines}} = state;
  const {cipheredTextResized, cipheredTextScrolled} = actions;
  const {width, scrollTop} = cipheredText;

  return {
    cipherTextLines,
    cipheredTextResized,
    cipheredTextScrolled,
    width,
    scrollTop,
  };
}

class CipherTextView extends React.PureComponent {

  render () {
    const {width, scrollTop, cipherTextLines} = this.props;

    const height = pageRows * cellHeight;
    const pageColumns = Math.max(5, Math.floor((width - 20) / cellWidth));
    const rowsCount = cipherTextLines.length;
    const bottom = rowsCount * cellHeight;
    const maxTop = Math.max(0, bottom + 1 - pageRows * cellHeight);
    const minMaxedScrollTop = Math.min(maxTop, scrollTop);
    const firstRow = Math.floor(minMaxedScrollTop / cellHeight);
    const lastRow = Math.min(firstRow + pageRows + 1, rowsCount);
    const visibleRows = range(firstRow, lastRow);

    return (
      <div>
        <div
          ref={this.refTextBox}
          onScroll={this.onScroll}
          className="custom-scrollable"
          style={{
            position: 'relative',
            width: '100%',
            height: height && `${height}px`,
            overflowY: 'auto',
            background: 'white',
          }}>
          {(visibleRows || []).map((index) =>
            <div
              key={index}
              style={{position: 'absolute', top: `${index * cellHeight}px`, width: '100%', height: `${cellHeight}px`}}
              className={`cipher-line`}
              data-index={index}
            >
              {cipherTextLines[index].split('').slice(0, pageColumns).map((cell, index) =>
                <div key={index} className="letter-cell letter-cell-not-bold" style={{
                  position: 'absolute',
                  left: `${textWidth + index * cellWidth}px`,
                  top: '0px',
                  width: `${cellWidth}px`,
                  height: `${cellHeight}px`,
                  lineHeight: `${cellHeight}px`,
                  textAlign: 'center'
                }}>
                  {cell || ' '}
                </div>)}
            </div>)}
          <div style={{position: 'absolute', top: `${bottom}px`, width: '1px', height: '1px'}}/>
        </div>
      </div>
    );
  }

  refTextBox = (element) => {
    this._textBox = element;
    const width = element.clientWidth;
    const height = element.clientHeight;
    this.props.dispatch({type: this.props.cipheredTextResized, payload: {width, height}});
  };
  onScroll = () => {
    const scrollTop = this._textBox.scrollTop;
    this.props.dispatch({type: this.props.cipheredTextScrolled, payload: {scrollTop}});
  };
  componentDidUpdate () {
    this._textBox.scrollTop = this.props.scrollTop;
  }
}

export default {
  actions: {
    cipheredTextResized: 'CipheredText.Resized' /* {width: number, height: number} */,
    cipheredTextScrolled: 'CipheredText.Scrolled' /* {scrollTop: number} */,
  },
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer,
    taskRefresh: taskRefreshReducer,
    cipheredTextResized: cipheredTextResizedReducer,
    cipheredTextScrolled: cipheredTextScrolledReducer,
  },
  views: {
    CipheredText: connect(CipherTextViewSelector)(CipherTextView),
  }
};
