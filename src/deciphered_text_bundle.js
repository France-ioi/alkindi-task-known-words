import React from 'react';
import {connect} from 'react-redux';
import update from 'immutability-helper';
import {range} from 'range';
import {applySubstitutionToText, wrapAround} from './utils';
import {SortableSubstitution} from "./components/SortableSubstitution";
import SubstitutionView from "./components/SubstitutionView";
import DecipheredTextCell from "./components/DecipheredTextCell";
import {put, select, takeEvery} from "redux-saga/effects";
import {SortableSubstitutionsContainer} from "./components/SortableSubstitutionsContainer";

const cellWidth = 22; // px
const cellHeight = 32; // px
const pageRows = 4;
const height = 400;
const maxSubstitutionsCount = 2;
const lineNumberWidth = 30; //px
const subsWidth = 160; // px
const lineEndWidth = 20; // px
const headerRowHeight = 40; // px

function appInitReducer (state, _action) {
  return {
    ...state,
    decipheredText: {
      scrollTop: 0,
      substitutionCells: null,
      decipheredLetters: {},
      selectedRows: {},
      appliedSubstitutions: {},
      lastSubstitutionsUsed: [],
    },
  };
}

function taskInitReducer (state) {
  let {decipheredText, taskData: {version, cipherTextLines}} = state;
  if (!decipheredText) {
    return state;
  }

  let newState = state;
  if (version.applyInverse) {
    let appliedSubstitutions = {};
    for (let i = 0; i < cipherTextLines.length; i++) {
      const line = cipherTextLines[i];
      const inverseSubstitutions = [];
      for (let {count, type} of line.substitutions) {
        inverseSubstitutions.push({count, type: type + 2});
      }
      appliedSubstitutions[i] = [inverseSubstitutions];
    }

    newState = update(state, {decipheredText: {appliedSubstitutions: {$set: appliedSubstitutions}}});
  }

  return applyRefreshedData({...newState});
}

function taskRefreshReducer (state) {
  return taskInitReducer(state);
}

function decipheredTextResizedReducer (state, {payload: {width}}) {
  let {decipheredText, taskData: {cipherTextLines}} = state;
  const extraWidth = lineNumberWidth + subsWidth + lineEndWidth;
  const pageColumns = Math.min(cipherTextLines[0].length, Math.max(5, Math.floor((width - extraWidth) / cellWidth)));

  decipheredText = {...decipheredText, width, pageColumns};

  return {...state, decipheredText};
}

function decipheredTextScrolledReducer (state, {payload: {scrollTop}}) {
  let {decipheredText} = state;
  decipheredText = {...decipheredText, scrollTop};

  return {...state, decipheredText};
}

function decipheredSelectionChangedReducer (state, {payload: {rowIndex, subLineIndex}}) {
  let {decipheredText, taskData: {version}} = state;
  let {selectedRows} = decipheredText;

  if (false === version.frequencyAnalysis || version.frequencyAnalysisWhole) {
    return state;
  }

  let selectedSubLines;
  if (!(rowIndex in selectedRows)) {
    selectedSubLines = [subLineIndex];
  } else {
    selectedSubLines = selectedRows[rowIndex];
    const position = selectedSubLines.indexOf(subLineIndex);
    if (position === -1) {
      selectedSubLines = [...selectedSubLines, subLineIndex];
    } else {
      selectedSubLines = [...selectedSubLines.slice(0, position), ...selectedSubLines.slice(position + 1)];
    }
  }

  selectedRows = {
    ...selectedRows,
    [rowIndex]: selectedSubLines,
  };

  decipheredText = {...decipheredText, selectedRows};

  return applyRefreshedData({...state, decipheredText});
}

function decipheredTextLateReducer (state, _action) {
  if (!state.taskData) return state;
  let {decipheredText} = state;

  return applyRefreshedData({...state, decipheredText});
}

function applyRefreshedData (state) {
  let {taskData: {cipherTextLines, alphabet, hints, version}, decipheredText, substitutions} = state;
  const {decipheredLetters} = decipheredText;

  const hintsIndex = buildHintsIndex(hints);

  let decipheredTextLines = cipherTextLines.map((line, rowIndex) => {
    return {
      index: rowIndex,
      ciphered: line.split(''),
      deciphered: [],
    };

    const cipherText = line.cipherText.split('');

    let currentCipherText = cipherText.map(letter => {
      return {
        value: letter,
      };
    });

    let substitutionLines = [];
    substitutionLines.push({
      subLineIndex: 0,
      substitutions: line.substitutions,
      result: currentCipherText,
      editable: false,
    });

    if (rowIndex in decipheredText.appliedSubstitutions) {
      let rowSubstitutions = decipheredText.appliedSubstitutions[rowIndex];
      for (let [index, subLineSubstitutions] of rowSubstitutions.entries()) {
        for (let {count, type} of subLineSubstitutions) {
          for (let k = 0; k < count; k++) {
            currentCipherText = applySubstitutionToText(substitutions[type-2], currentCipherText, alphabet);
          }
        }

        substitutionLines.push({
          subLineIndex: index + 1,
          substitutions: subLineSubstitutions,
          result: currentCipherText,
          editable: !version.applyInverse,
        });
      }
    }

    const deciphered = currentCipherText.map((letter, position) => {
      return {
        ciphered: letter.value,
        value: rowIndex in decipheredLetters && position in decipheredLetters[rowIndex] ? decipheredLetters[rowIndex][position] : null,
        hint: rowIndex in hintsIndex && position in hintsIndex[rowIndex] ? hintsIndex[rowIndex][position] : null,
      };
    });

    if (substitutionLines.length > 1) {
      substitutionLines[substitutionLines.length - 1].result = substitutionLines[substitutionLines.length - 1].result.map((cell, position) => {
        if (!cell.value) {
          return cell;
        }

        if ((deciphered[position].hint && deciphered[position].hint !== cell.value) || (deciphered[position].value && deciphered[position].value !== cell.value)) {
          return {
            ...cell,
            conflict: true,
          };
        }

        return cell;
      });
    }

    return {
      index: rowIndex,
      ciphered: cipherText,
      deciphered,
      substitutionLines,
    };
  });

  decipheredText = {
    ...decipheredText,
    lines: decipheredTextLines,
  };

  return {...state, decipheredText};
}

function buildHintsIndex (hints) {
  let hintsIndex = {};
  for (let hint of hints) {
    let {rowIndex, position, value, type} = hint;
    if (null === rowIndex) {
      continue;
    }
    let rowIndexElements = [];
    if (Array.isArray(rowIndex)) {
      rowIndexElements = rowIndex;
    } else {
      rowIndexElements = [rowIndex];
    }

    for (let i = 0; i < rowIndexElements.length; i++) {
      let rowIndexElement = rowIndexElements[i];
      if (!(rowIndexElement in hintsIndex)) {
        hintsIndex[rowIndexElement] = {};
      }
      let elementValue = Array.isArray(rowIndex) ? value[i] : value;
      if ('type_1' === type) {
        hintsIndex[rowIndexElement][position] = elementValue;
      } else if ('type_2' === type || 'type_3' === type) {
        for (let i = 0; i < elementValue.length; i++) {
          hintsIndex[rowIndexElement][i] = elementValue.substring(i, i+1);
        }
      }
    }
  }

  return hintsIndex;
}

function decipheredCellEditStartedReducer (state, {payload: {rowIndex, position}}) {
  return update(state, {editingDecipher: {$set: {rowIndex, position}}});
}

function decipheredCellEditCancelledReducer (state, _action) {
  return update(state, {editingDecipher: {$set: {}}});
}

function decipheredCellEditMovedReducer (state, {payload: {rowIndex, position, cellMove}}) {
  let {decipheredText: {lines, pageColumns}} = state;
  const cellStop = position;
  let cellRank = position;
  let cell;

  do {
    cellRank = wrapAround(cellRank + cellMove, pageColumns);
    cell = lines[rowIndex].deciphered[cellRank];
    /* If we looped back to the starting point, the move is impossible. */
    if (cellStop === cellRank) return state;
  } while (cell.hint);

  return update(state, {editingDecipher: {$set: {rowIndex, position: cellRank}}});
}

function decipheredCellCharChangedReducer (state, {payload: {rowIndex, position, symbol}}) {
  let {taskData: {alphabet}, decipheredText: {decipheredLetters}} = state;
  if (symbol.length !== 1 || -1 === alphabet.indexOf(symbol)) {
    symbol = null;
  }

  let newState;
  if (rowIndex in decipheredLetters) {
    newState = update(state, {
      decipheredText: {
        decipheredLetters: {[rowIndex]: {[position]: {$set: symbol}}},
      },
    });
  } else {
    newState = update(state, {
      decipheredText: {
        decipheredLetters: {[rowIndex]: {$set: {[position]: symbol}}},
      },
    });
  }

  if (symbol !== null) {
    newState = decipheredCellEditMovedReducer(newState, {payload: {rowIndex, position, cellMove: 1}});
  }

  return applyRefreshedData(newState);
}

function DecipheredTextViewSelector (state) {
  const {actions, decipheredText, editingDecipher, taskData: {version, clearWords}} = state;
  const {
    decipheredCellEditStarted,
    decipheredCellEditCancelled,
    decipheredCellCharChanged,
    decipheredTextResized,
    decipheredTextScrolled,
    decipheredCellEditMoved,
    decipheredSubstitutionMoved,
    schedulingJump,
    decipheredSelectionChanged,
    decipheredSubstitutionAdded,
  } = actions;
  const {width, scrollTop, lines, selectedRows, pageColumns, lastSubstitutionsUsed} = decipheredText;

  return {
    decipheredCellEditStarted, decipheredCellEditCancelled, decipheredCellCharChanged,
    decipheredSelectionChanged, decipheredSubstitutionAdded, decipheredCellEditMoved,
    decipheredSubstitutionMoved,
    version,
    decipheredTextResized, decipheredTextScrolled, schedulingJump,
    editingDecipher, width, scrollTop, lines, selectedRows, pageColumns, lastSubstitutionsUsed, clearWords
  };
}

class DecipheredTextView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.substitutionModal = React.createRef();
    this.state = {
      modalShow: false,
      currentEditedSubstitution: null,
    };
  }

  render () {
    const {pageColumns, scrollTop, lines, selectedRows, editingDecipher, lastSubstitutionsUsed, version, clearWords} = this.props;
    const {modalShow} = this.state;
    const rowsCount = lines.length;
    const linesHeight = [];

    let currentTop = 0;
    let firstRow = 0;
    for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
      const line = lines[rowIndex];
      let lineHeight = 2 * cellHeight + 5;
      linesHeight.push({
        height: lineHeight,
        top: currentTop,
      });
      currentTop += lineHeight;
      if (currentTop <= scrollTop) {
        firstRow = rowIndex;
      }
    }
    const bottom = currentTop - 1;
    const lastRow = Math.min(firstRow + pageRows + 2, rowsCount);
    const visibleRows = range(firstRow, lastRow);

    return (
      <div>
        <div className="block-header-row">
          <div>
            <div className="block-header-category">
              Texte chiffré
            </div>
            <div
              ref={this.refTextBox}
              onScroll={this.onScroll}
              className="custom-scrollable"
              style={{position: 'relative', width: '100%', height: height && `${height}px`, overflowY: 'auto', overflowX: 'hidden', background: 'white'}}
            >
              {(visibleRows || []).map((rowIndex) =>
                <div
                  key={rowIndex}
                  className={`cipher-line`}
                  style={{position: 'absolute', top: `${linesHeight[rowIndex].top}px`, width: '100%'}}
                >
                  <div style={{width: `${lineNumberWidth + cellWidth * pageColumns}px`, height: `${linesHeight[rowIndex].height - 2}px`}}>
                    <div
                      key="lineBeginning"
                      className="cipher-line-index"
                      style={{
                        position: 'absolute',
                        left: `0px`,
                        width: `${lineNumberWidth}px`,
                        height: `${linesHeight[rowIndex].height-1}px`,
                        textAlign: 'center',
                        lineHeight: `${linesHeight[rowIndex].height}px`
                      }}
                    >
                      {rowIndex+1}
                    </div>
                    {/*Clear text row*/}
                    <div style={{position: 'absolute', top: `${cellHeight}px`}}>
                      {lines[rowIndex].deciphered.slice(0, pageColumns).map(({ciphered, value, hint}, resultIndex) =>
                        <div
                          key={resultIndex}
                          style={{
                            position: 'absolute',
                            left: `${lineNumberWidth + subsWidth + resultIndex * cellWidth}px`,
                            width: `${cellWidth}px`,
                            height: `${cellHeight}px`,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <DecipheredTextCell
                            key={resultIndex}
                            rowIndex={rowIndex}
                            position={resultIndex}
                            editing={editingDecipher && editingDecipher.rowIndex === rowIndex && editingDecipher.position === resultIndex}
                            ciphered={ciphered}
                            value={value}
                            hint={hint}
                            cellWidth={cellWidth}
                            onChangeChar={this.onChangeChar}
                            onEditingStarted={this.onEditingStarted}
                            onEditingCancelled={this.onEditingCancelled}
                            onEditingMoved={this.onEditingMoved}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>)}
              <div style={{position: 'absolute', top: `${bottom}px`, width: '1px', height: '1px'}} />
            </div>
          </div>
          <div>
            <div className="block-header-category">
              Mots du clair
            </div>
            <div
              ref={this.refTextBox}
              className="custom-scrollable"
              style={{position: 'relative', width: '100%', height: height && `${height}px`, overflowY: 'auto', overflowX: 'hidden', background: 'white'}}
            >
              {clearWords.map(word =>
                <div>{word}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  refTextBox = (element) => {
    this._textBox = element;
    const width = element.clientWidth;
    const height = element.clientHeight;
    this.props.dispatch({type: this.props.decipheredTextResized, payload: {width, height}});
  };
  onScroll = () => {
    const scrollTop = this._textBox.scrollTop;
    this.props.dispatch({type: this.props.decipheredTextScrolled, payload: {scrollTop}});
  };
  componentDidUpdate () {
    this._textBox.scrollTop = this.props.scrollTop;
  }
  moveSubstitution = (substitution, position) => {
    this.props.dispatch({type: this.props.decipheredSubstitutionMoved, payload: {substitution, position}});
  };
  onEditingStarted = (rowIndex, position) => {
    this.props.dispatch({type: this.props.decipheredCellEditStarted, payload: {rowIndex, position}});
  };
  onEditingCancelled = () => {
    this.props.dispatch({type: this.props.decipheredCellEditCancelled});
  };
  onChangeChar = (rowIndex, position, symbol) => {
    symbol = symbol.toUpperCase();
    this.props.dispatch({type: this.props.decipheredCellCharChanged, payload: {rowIndex, position, symbol}});
  };
  onEditingMoved = (rowIndex, position, cellMove) => {
    this.props.dispatch({type: this.props.decipheredCellEditMoved, payload: {rowIndex, position, cellMove}});
  };
  rowClicked = (rowIndex, subLineIndex) => {
    this.props.dispatch({type: this.props.decipheredSelectionChanged, payload: {rowIndex, subLineIndex}});
  };
  openSubstitutionModal = (currentEditedSubstitution) => {
    if (currentEditedSubstitution.count) {
      this.substitutionModal.current.updateSubstitution({count: currentEditedSubstitution.count, type: currentEditedSubstitution.type});
    }
    this.setModalShow(true);
    this.setState({
      currentEditedSubstitution,
    });
  };
  setModalShow = (modalShow) => {
    this.setState({
      modalShow,
    });
  }
  addEditSubstitution = (substitution) => {
    let {count, type} = substitution;
    if (null === type || count < 1) {
      return;
    }

    this.props.dispatch({type: this.props.decipheredSubstitutionAdded, payload: {
      ...substitution,
      rowIndex: this.state.currentEditedSubstitution.rowIndex,
      subLineIndex: this.state.currentEditedSubstitution.subLineIndex,
      substitutionIndex: this.state.currentEditedSubstitution.substitutionIndex,
    }});
    this.setModalShow(false);
  };
}


export default {
  actions: {
    decipheredTextResized: 'DecipheredText.Resized' /* {width: number, height: number} */,
    decipheredTextScrolled: 'DecipheredText.Scrolled' /* {scrollTop: number} */,
    decipheredCellEditStarted: 'DecipheredText.Cell.Edit.Started',
    decipheredCellEditCancelled: 'DecipheredText.Cell.Edit.Cancelled',
    decipheredCellCharChanged: 'DecipheredText.Cell.Char.Changed',
    decipheredSelectionChanged: 'DecipheredText.Selection.Changed',
    decipheredSubstitutionAdded: 'DecipheredText.Substitution.Added',
    decipheredCellEditMoved: 'DecipheredText.Cell.Edit.Moved',
    decipheredSubstitutionMoved: 'DecipheredText.Substitution.Moved',
  },
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer,
    taskRefresh: taskRefreshReducer,
    decipheredTextResized: decipheredTextResizedReducer,
    decipheredTextScrolled: decipheredTextScrolledReducer,
    decipheredCellEditStarted: decipheredCellEditStartedReducer,
    decipheredCellEditCancelled: decipheredCellEditCancelledReducer,
    decipheredCellCharChanged: decipheredCellCharChangedReducer,
    decipheredSelectionChanged: decipheredSelectionChangedReducer,
    decipheredCellEditMoved: decipheredCellEditMovedReducer,
  },
  lateReducer: decipheredTextLateReducer,
  saga: function* () {
    const actions = yield select(({actions}) => actions);
    yield takeEvery(actions.decipheredSubstitutionMoved, function* () {
      yield put({type: actions.hintRequestFeedbackCleared});
    });
    yield takeEvery(actions.decipheredCellEditStarted, function* () {
      yield put({type: actions.hintRequestFeedbackCleared});
    });
    yield takeEvery(actions.decipheredCellCharChanged, function* () {
      yield put({type: actions.hintRequestFeedbackCleared});
    });
    yield takeEvery(actions.decipheredSelectionChanged, function* () {
      yield put({type: actions.hintRequestFeedbackCleared});
    });
  },
  views: {
    DecipheredText: connect(DecipheredTextViewSelector)(DecipheredTextView),
  }
};
