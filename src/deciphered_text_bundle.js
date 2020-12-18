import React from 'react';
import {connect} from 'react-redux';
import update from 'immutability-helper';
import {range} from 'range';
import {applySubstitutionToText, wrapAroundLines} from './utils';
import DecipheredTextCell from "./components/DecipheredTextCell";
import {put, select, takeEvery} from "redux-saga/effects";

const cellWidth = 22; // px
const cellHeight = 32; // px
const pageRows = 4;
const height = 400;

function appInitReducer (state, _action) {
  return {
    ...state,
    decipheredText: {
      scrollTop: 0,
      substitutionCells: null,
      decipheredLetters: {},
    },
  };
}

function taskInitReducer (state) {
  let {decipheredText} = state;
  if (!decipheredText) {
    return state;
  }

  return applyRefreshedData({...state});
}

function taskRefreshReducer (state) {
  return taskInitReducer(state);
}

function decipheredTextResizedReducer (state, {payload: {width}}) {
  let {decipheredText, taskData: {cipherTextLines}} = state;
  const maxLength = cipherTextLines.reduce((current, next) => Math.max(current, next.length), 0);
  const pageColumns = Math.min(maxLength, Math.max(5, Math.floor((width - 20) / cellWidth)));

  decipheredText = {...decipheredText, width, pageColumns};

  return {...state, decipheredText};
}

function decipheredTextScrolledReducer (state, {payload: {scrollTop}}) {
  let {decipheredText} = state;
  decipheredText = {...decipheredText, scrollTop};

  return {...state, decipheredText};
}

function decipheredTextLateReducer (state, _action) {
  if (!state.taskData) return state;
  let {decipheredText} = state;

  return applyRefreshedData({...state, decipheredText});
}

function applyRefreshedData (state) {
  let {taskData: {cipherTextLines, alphabet, hints}, decipheredText, substitution} = state;
  const {decipheredLetters} = decipheredText;

  const hintsIndex = buildHintsIndex(hints);

  let decipheredTextLines = cipherTextLines.map((line, rowIndex) => {
    const cipherText = line.split('');

    let currentCipherText = cipherText.map(letter => {
      return {
        value: letter,
      };
    });

    const deciphered = currentCipherText.map((letter, position) => {
      return {
        ciphered: letter.value,
        value: rowIndex in decipheredLetters && position in decipheredLetters[rowIndex] ? decipheredLetters[rowIndex][position] : null,
        hint: rowIndex in hintsIndex && position in hintsIndex[rowIndex] ? hintsIndex[rowIndex][position] : null,
      };
    });

    let substitutionResult = applySubstitutionToText(substitution, currentCipherText, alphabet);
    substitutionResult = substitutionResult.map((cell, position) => {
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

    return {
      index: rowIndex,
      ciphered: cipherText,
      substitutionResult,
      deciphered,
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
  let {decipheredText: {lines}, taskData: {cipherTextLines}} = state;
  const cellStop = {rowIndex, position};
  let cellRank = {rowIndex, position};
  let cell;

  do {
    cellRank = wrapAroundLines(cellRank, cellMove, cipherTextLines);
    cell = lines[cellRank.rowIndex].deciphered[cellRank.position];
    /* If we looped back to the starting point, the move is impossible. */
    if (cellStop.rowIndex === cellRank.rowIndex && cellStop.position === cellRank.position) return state;
  } while (cell.hint || cell.ciphered === ' ');

  return update(state, {editingDecipher: {$set: {rowIndex: cellRank.rowIndex, position: cellRank.position}}});
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
    decipheredSubstitutionAdded,
  } = actions;
  const {width, scrollTop, lines, pageColumns} = decipheredText;

  return {
    decipheredCellEditStarted, decipheredCellEditCancelled, decipheredCellCharChanged,
    decipheredSubstitutionAdded, decipheredCellEditMoved,
    decipheredSubstitutionMoved,
    version,
    decipheredTextResized, decipheredTextScrolled, schedulingJump,
    editingDecipher, width, scrollTop, lines, pageColumns, clearWords
  };
}

class DecipheredTextView extends React.PureComponent {
  render () {
    const {pageColumns, scrollTop, lines, editingDecipher, version, clearWords} = this.props;
    const rowsCount = lines.length;
    const linesHeight = [];

    let currentTop = 0;
    let firstRow = 0;
    for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
      let lineHeight = 4 * cellHeight;
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
                  className="cipher-line"
                  style={{position: 'absolute', top: `${linesHeight[rowIndex].top}px`, width: '100%'}}
                >
                  <div className="cipher-line-subrows">
                    <div>
                      Chiffré
                    </div>
                    <div>
                      Mots placés
                    </div>
                    <div>
                      Résultat
                    </div>
                    <div>
                      Clair
                    </div>
                  </div>
                  <div>
                    <div style={{position: 'relative', width: `100%`, height: `${linesHeight[rowIndex].height - 2}px`}}>
                      {/*Ciphered*/}
                      <div style={{position: 'absolute', top: `0px`}}>
                        {lines[rowIndex].ciphered.slice(0, pageColumns).map((value, resultIndex) =>
                          <div
                            key={resultIndex}
                            className={`letter-cell`}
                            style={{position: 'absolute', left: `${resultIndex * cellWidth}px`, width: `${cellWidth}px`, height: `${cellHeight - 10}px`, lineHeight: `${cellHeight - 10}px`, textAlign: 'center', top: '4px', borderRadius: '2px'}}
                          >
                            {value}
                          </div>
                        )}
                      </div>
                      {/*Result*/}
                      <div style={{position: 'absolute', top: `${2*cellHeight}px`}}>
                        {lines[rowIndex].substitutionResult.slice(0, pageColumns).map(({value, locked, conflict}, resultIndex) =>
                          <div
                            key={resultIndex}
                            className={`letter-cell ${locked ? ' deciphered-locked' : ''}${conflict ? ' deciphered-conflict' : ''}${false !== version.frequencyAnalysis && !version.frequencyAnalysisWhole ? ' deciphered-selectable' : ''}`}
                            style={{position: 'absolute', left: `${resultIndex * cellWidth}px`, width: `${cellWidth}px`, height: `${cellHeight - 10}px`, lineHeight: `${cellHeight - 10}px`, textAlign: 'center', top: '4px', borderRadius: '2px'}}
                          >
                            {value}
                          </div>
                        )}
                      </div>
                      {/*Clear text row*/}
                      <div style={{position: 'absolute', top: `${3*cellHeight}px`}}>
                        {lines[rowIndex].deciphered.slice(0, pageColumns).map(({ciphered, value, hint}, resultIndex) =>
                          <div
                            key={resultIndex}
                            style={{
                              position: 'absolute',
                              left: `${resultIndex * cellWidth}px`,
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
              className="custom-scrollable"
              style={{position: 'relative', width: '100%', height: height && `${height}px`, overflowY: 'auto', overflowX: 'hidden', background: 'white'}}
            >
              {clearWords.map((word, wordIndex) =>
                <div key={wordIndex}>{word}</div>
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
}

export default {
  actions: {
    decipheredTextResized: 'DecipheredText.Resized' /* {width: number, height: number} */,
    decipheredTextScrolled: 'DecipheredText.Scrolled' /* {scrollTop: number} */,
    decipheredCellEditStarted: 'DecipheredText.Cell.Edit.Started',
    decipheredCellEditCancelled: 'DecipheredText.Cell.Edit.Cancelled',
    decipheredCellCharChanged: 'DecipheredText.Cell.Char.Changed',
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
  },
  views: {
    DecipheredText: connect(DecipheredTextViewSelector)(DecipheredTextView),
  }
};
