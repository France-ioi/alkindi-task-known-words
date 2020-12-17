import React from 'react';
import {connect} from 'react-redux';
import {range} from 'range';

const cellWidth = 22; // px
const cellHeight = 30; // px
const lineNumberWidth = 20; //px
const subsWidth = 160; // px
const scrollBarWidth = 20; // px
const lineEndWidth = 20; // px
const pageRows = 4;

function appInitReducer (state, _action) {
  return {
    ...state,
    selectionText: {
      scrollTop: 0,
    },
  };
}

function selectionTextResizedReducer (state, {payload: {width}}) {
  let {selectionText} = state;
  selectionText = {...selectionText, width};
  return {...state, selectionText};
}

function selectionTextScrolledReducer (state, {payload: {scrollTop}}) {
  let {selectionText} = state;
  selectionText = {...selectionText, scrollTop};

  return {...state, selectionText};
}

function SelectionTextViewSelector (state) {
  const {actions, selectionText, decipheredText} = state;
  const {selectionTextResized, selectionTextScrolled} = actions;
  const {width, scrollTop} = selectionText;

  return {
    selectionTextResized,
    selectionTextScrolled,
    width,
    scrollTop,
    selectedRows: decipheredText.selectedRows,
    decipheredLines: decipheredText.lines,
  };
}

class SelectionTextView extends React.PureComponent {

  render () {
    const {width, scrollTop, selectedRows, decipheredLines} = this.props;

    const flattenedSelectedRows = [];
    for (let rowIndex in selectedRows) {
      for (let subLineIndex of selectedRows[rowIndex]) {
        if (subLineIndex in decipheredLines[rowIndex].substitutionLines) {
          flattenedSelectedRows.push({rowIndex, subLineIndex});
        }
      }
    }

    const rowsCount = flattenedSelectedRows.length;
    const height = pageRows * cellHeight;
    const extraWidth = lineNumberWidth + subsWidth + lineEndWidth + scrollBarWidth;
    const pageColumns = Math.max(5, Math.floor((width - extraWidth) / cellWidth));
    const bottom = rowsCount * cellHeight - 1;
    const maxTop = Math.max(0, bottom + 1 - pageRows * cellHeight);
    const minMaxedScrollTop = Math.min(maxTop, scrollTop);
    const firstRow = Math.floor(minMaxedScrollTop / cellHeight);
    const lastRow = Math.min(firstRow + pageRows + 1, rowsCount);
    const visibleRows = range(firstRow, lastRow);
    const visibleRowsIndexed = visibleRows.map(index => {
      return {
        index,
        rowIndex: flattenedSelectedRows[index].rowIndex,
        subLineIndex: flattenedSelectedRows[index].subLineIndex,
      };
    });

    return (
        <div>
          <div
              ref={this.refTextBox}
              onScroll={this.onScroll}
              className="custom-scrollable"
              style={{
                position: 'relative',
                width: 'width: 100%',
                height: height && `${height}px`,
                overflowY: 'auto',
                background: 'white',
              }}>
            {(visibleRowsIndexed||[]).map(({index, rowIndex, subLineIndex}) =>
              <div
                  key={index}
                  style={{position: 'absolute', top: `${index * cellHeight}px`, width: '100%', height: `${cellHeight}px`}}
                  className="cipher-line"
              >
                <div key="lineBeginning" className="cipher-line-index" style={{position: 'absolute', left: `0px`, width: `${lineNumberWidth + subsWidth}px`, height: `${cellHeight-1}px`, textAlign: 'center', lineHeight: `${cellHeight}px`}}>
                  {Number(rowIndex)+1}.{Number(subLineIndex)+1}
                </div>
                {decipheredLines[rowIndex].substitutionLines[subLineIndex].result.slice(0, pageColumns).map(({value}, colIndex) =>
                  <div key={colIndex} className="letter-cell" style={{position: 'absolute', left: `${lineNumberWidth + subsWidth + 10 + colIndex * cellWidth}px`, width: `${cellWidth}px`, height: `${cellHeight}px`, lineHeight: `${cellHeight}px`, textAlign: 'center'}}>
                    {value || ' '}
                  </div>)}
                <div key="lineEnd" className="cipher-line-end" style={{position: 'absolute', left: `${lineNumberWidth + subsWidth + 10 + pageColumns * cellWidth}px`, width: `${lineEndWidth}px`, height: `${cellHeight}px`, lineHeight: `${cellHeight}px`, textAlign: 'center'}}>
                  ...
                </div>
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
    this.props.dispatch({type: this.props.selectionTextResized, payload: {width, height}});
  };
  onScroll = () => {
    const scrollTop = this._textBox.scrollTop;
    this.props.dispatch({type: this.props.selectionTextScrolled, payload: {scrollTop}});
  };
  componentDidUpdate () {
    this._textBox.scrollTop = this.props.scrollTop;
  }
}

export default {
  actions: {
    selectionTextResized: 'SelectionText.Resized' /* {width: number, height: number} */,
    selectionTextScrolled: 'SelectionText.Scrolled' /* {scrollTop: number} */,
  },
  actionReducers: {
    appInit: appInitReducer,
    selectionTextResized: selectionTextResizedReducer,
    selectionTextScrolled: selectionTextScrolledReducer,
  },
  views: {
    SelectionText: connect(SelectionTextViewSelector)(SelectionTextView),
  }
};
