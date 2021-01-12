import React from 'react';
import {connect} from 'react-redux';
import update from 'immutability-helper';
import {range} from 'range';
import {applySubstitutionToText, wrapAroundLines} from './utils';
import DecipheredTextCell from "./components/DecipheredTextCell";
import {put, select, takeEvery} from "redux-saga/effects";
import {DraggableWord} from "./components/DraggableWord";
import {DroppableWordSlot} from "./components/DroppableWordSlot";
import {CustomDragLayer} from "./components/CustomDragLayer";
import {Collapsable} from '@france-ioi/react-task-lib';

const cellWidth = 22; // px
const cellHeight = 24; // px
const pageRows = 4;
const height = 300;

function appInitReducer (state, _action) {
  return {
    ...state,
    decipheredText: {
      scrollTop: 0,
      substitutionCells: null,
      decipheredLetters: {},
      placedWords: {},
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
  let {taskData: {cipherTextLines, alphabet, hints, clearWords}, decipheredText, substitution, symbolsLocked} = state;
  const {decipheredLetters, placedWords} = decipheredText;

  const hintsIndex = buildHintsIndex(hints);

  let wordsByRow = {};
  for (let wordIndex of Object.keys(placedWords)) {
    const {rowIndex, position} = placedWords[wordIndex];
    if (!(rowIndex in wordsByRow)) {
      wordsByRow[rowIndex] = {};
    }
    const word = clearWords[wordIndex];
    for (let i = 0; i < word.length; i++) {
      wordsByRow[rowIndex][position+i] = word.substring(i, i+1);
    }
  }

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
        word: rowIndex in wordsByRow && position in wordsByRow[rowIndex] ? wordsByRow[rowIndex][position] : null,
      };
    });

    let substitutionResult = applySubstitutionToText(substitution, currentCipherText, alphabet, symbolsLocked);
    for (let i = 0; i < substitutionResult.length; i++) {
      deciphered[i].result = substitutionResult[i].value;
    }

    substitutionResult = substitutionResult.map((cell, position) => {
      if (!cell.value) {
        return cell;
      }

      if (
        (deciphered[position].hint && deciphered[position].hint !== cell.value)
        || (deciphered[position].value && deciphered[position].value !== cell.value)
        || (rowIndex in wordsByRow && position in wordsByRow[rowIndex] && wordsByRow[rowIndex][position] !== cell.value)
      ) {
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
      words: rowIndex in wordsByRow ? wordsByRow[rowIndex] : {},
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

function decipheredWordMovedReducer (state, {payload: {wordIndex, rowIndex, position}}) {
  const {decipheredText: {lines, placedWords}, taskData: {clearWords, cipherTextLines}} = state;
  const newWord = clearWords[wordIndex];
  let alreadyWordIndex = null;

  if (null === rowIndex) {
    const newState = update(state, {decipheredText: {placedWords: {$unset: [wordIndex]}}});

    return applyRefreshedData(newState);
  }

  const newLine = lines[rowIndex].words;
  for (let i = 0; i < newWord.length; i++) {
    const newPosition = position + i;
    if (newPosition > lines[rowIndex].ciphered.length - 1 || cipherTextLines[rowIndex].substring(newPosition, newPosition+1) === ' ') {
      return state;
    }

    if (newLine[newPosition] && !alreadyWordIndex) {
      alreadyWordIndex = Object.keys(placedWords).find(wordIndex => placedWords[wordIndex].rowIndex === rowIndex && placedWords[wordIndex].position === newPosition);
    }
  }

  let newState = state;
  if (null !== alreadyWordIndex) {
    newState = update(newState, {decipheredText: {placedWords: {$unset: [alreadyWordIndex]}}});
  }

  newState = update(newState, {decipheredText: {placedWords: {[wordIndex]: {$set: {rowIndex, position}}}}});

  return applyRefreshedData(newState);
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
    schedulingJump,
    decipheredWordMoved,
  } = actions;
  const {width, scrollTop, lines, pageColumns, placedWords} = decipheredText;

  return {
    decipheredCellEditStarted, decipheredCellEditCancelled, decipheredCellCharChanged,
    decipheredCellEditMoved,
    decipheredWordMoved,
    version,
    decipheredTextResized, decipheredTextScrolled, schedulingJump,
    editingDecipher, width, scrollTop, lines, pageColumns, clearWords, placedWords
  };
}

class DecipheredTextView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {dragElement: null};
  }
  render () {
    const {pageColumns, scrollTop, lines, editingDecipher, version, clearWords, placedWords} = this.props;
    const rowsCount = lines.length;
    const linesHeight = [];

    let currentTop = 0;
    let firstRow = 0;
    for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
      let lineHeight = (false !== version.clearTextLine ? 4 : 3) * cellHeight + 20;
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

    let wordsByRow = {};
    for (let wordIndex of Object.keys(placedWords)) {
      const {rowIndex, position} = placedWords[wordIndex];
      if (!(rowIndex in wordsByRow)) {
        wordsByRow[rowIndex] = [];
      }
      wordsByRow[rowIndex].push({position, wordIndex});
    }

    let wordSlotId = 0;
    const wordSlotsByRow = lines.map(line => {
      const words = line.ciphered.join('').slice(0, pageColumns).split(' ');
      const slots = [];
      let currentPosition = 0;
      for (let word of words) {
        slots.push({
          position: currentPosition,
          letters: word.length,
          wordSlotId: 'word-slot-' + wordSlotId,
        });
        currentPosition += word.length + 1;
        wordSlotId++;
      }

      return slots;
    });

    return (
      <div>
        <div className="main-block">
          <Collapsable title={<div className="main-block-header">{"Déchiffrement"}</div>}>
            <div>
              <div
                ref={this.refTextBox}
                onScroll={this.onScroll}
                className="custom-scrollable"
                style={{position: 'relative', width: '100%', height: height && `${height}px`, overflowY: 'auto', overflowX: 'hidden', background: 'white'}}
              >
                {(visibleRows || []).map((rowIndex) =>
                  <div
                    key={rowIndex}
                    className="cipher-line is-bordered"
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
                        Substitution
                      </div>
                      {false !== version.clearTextLine &&
                        <div>
                          Clair
                        </div>
                      }
                    </div>
                    <div>
                      <div style={{position: 'relative', width: `100%`, height: `${linesHeight[rowIndex].height - 20 - 2}px`}}>
                        {/*Ciphered*/}
                        <div style={{position: 'absolute', top: `0px`}}>
                          {lines[rowIndex].ciphered.slice(0, pageColumns).map((value, resultIndex) =>
                            <div
                              key={resultIndex}
                              className={`letter-cell deciphered-ciphered-cell ${value === ' ' ? 'is-space' : ''}`}
                              style={{position: 'absolute', left: `${resultIndex * cellWidth}px`, width: `${cellWidth}px`, height: `${cellHeight - 10}px`, lineHeight: `${cellHeight - 12}px`, textAlign: 'center', top: '4px', borderRadius: '2px'}}
                            >
                              {value}
                            </div>
                          )}
                        </div>
                        {/*Words*/}
                        <div style={{position: 'absolute', top: `${cellHeight}px`}}>
                          {wordSlotsByRow[rowIndex].map(({position, letters, wordSlotId}, resultIndex) =>
                            <div
                              key={resultIndex}
                              className={`
                                droppable-word-container
                              `}
                              style={{position: 'absolute', left: `${position * cellWidth}px`, height: `${cellHeight - 10}px`, lineHeight: `${cellHeight - 10}px`, textAlign: 'center', top: '4px'}}
                            >
                              <DroppableWordSlot
                                wordSlotId={wordSlotId}
                                rowIndex={rowIndex}
                                position={position}
                                occupied={lines[rowIndex].words[position] ? lines[rowIndex].words : null}
                                letters={letters}
                                draggingWord={this.state.dragElement}
                              />
                            </div>
                          )}
                          {rowIndex in wordsByRow && wordsByRow[rowIndex].map(({position, wordIndex}) =>
                            <div
                              key={wordIndex}
                              style={{position: 'absolute', left: `${position * cellWidth}px`, width: `${cellWidth}px`, top: '2px'}}
                              className={`word-container`}
                            >
                              <DraggableWord
                                minimal={true}
                                wordIndex={wordIndex}
                                wordSlotsByRow={wordSlotsByRow}
                                word={clearWords[wordIndex]}
                                onWordMoved={this.onWordMoved}
                                onDragStart={(item) => this.setDragElement(item)}
                                onDragEnd={() => this.setDragElement(null)}
                              />
                            </div>
                          )}
                        </div>
                        {/*Result*/}
                        <div style={{position: 'absolute', top: `${2*cellHeight}px`}}>
                          {lines[rowIndex].substitutionResult.slice(0, pageColumns).map(({value, locked, conflict}, resultIndex) =>
                            <div
                              key={resultIndex}
                              className={`deciphered-result-cell letter-cell ${locked ? ' deciphered-locked' : ''}${conflict ? ' deciphered-conflict' : ''}${false !== version.frequencyAnalysis && !version.frequencyAnalysisWhole ? ' deciphered-selectable' : ''}`}
                              style={{left: `${resultIndex * cellWidth}px`, width: `${cellWidth}px`}}
                            >
                              {value ? value : (lines[rowIndex].ciphered[resultIndex] !== ' ' ? <span className="deciphered-underscore">_</span> : '')}
                            </div>
                          )}
                        </div>
                        {/*Clear text row*/}
                        {false !== version.clearTextLine &&
                          <div style={{position: 'absolute', top: `${3*cellHeight}px`}}>
                            {lines[rowIndex].deciphered.slice(0, pageColumns).map(({ciphered, value, hint, result, word}, resultIndex) =>
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
                                  result={result}
                                  word={word}
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
                        }
                      </div>
                    </div>
                  </div>)}
                <div style={{position: 'absolute', top: `${bottom}px`, width: '1px', height: '1px'}} />
              </div>
            </div>
          </Collapsable>
        </div>
        <div className="main-block">
          <Collapsable title={<div className="main-block-header">{"Mots du clair"}</div>}>
            <div
              className="custom-scrollable words-container"
            >
              {range(0, 2).map(column =>
                <div className="word-column" key={column}>
                  {(0 === column ? clearWords.slice(0, Math.round(clearWords.length / 2)) : clearWords.slice(Math.round(clearWords.length / 2), 100)).map((word, wordIndex) =>
                    <div
                      key={column * Math.round(clearWords.length / 2) + wordIndex}
                      className={`word-container ${(column * Math.round(clearWords.length / 2) + wordIndex) in placedWords ? 'word-used' : ''}`}
                    >
                      <DraggableWord
                        wordIndex={column * Math.round(clearWords.length / 2) + wordIndex}
                        wordSlotsByRow={wordSlotsByRow}
                        word={word}
                        onWordMoved={this.onWordMoved}
                        onDragStart={(item) => this.setDragElement(item)}
                        onDragEnd={() => this.setDragElement(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Collapsable>
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
  setDragElement = (item) => {
    this.setState({
      dragElement: item,
    });
  };
  onScroll = () => {
    const scrollTop = this._textBox.scrollTop;
    this.props.dispatch({type: this.props.decipheredTextScrolled, payload: {scrollTop}});
  };
  componentDidUpdate () {
    this._textBox.scrollTop = this.props.scrollTop;
  }
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
  onWordMoved = (wordIndex, rowIndex, position) => {
    this.props.dispatch({type: this.props.decipheredWordMoved, payload: {wordIndex, rowIndex, position}});
  };
}

export default {
  actions: {
    decipheredTextResized: 'DecipheredText.Resized' /* {width: number, height: number} */,
    decipheredTextScrolled: 'DecipheredText.Scrolled' /* {scrollTop: number} */,
    decipheredCellEditStarted: 'DecipheredText.Cell.Edit.Started',
    decipheredCellEditCancelled: 'DecipheredText.Cell.Edit.Cancelled',
    decipheredCellCharChanged: 'DecipheredText.Cell.Char.Changed',
    decipheredCellEditMoved: 'DecipheredText.Cell.Edit.Moved',
    decipheredWordMoved: 'DecipheredText.Word.Moved',
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
    decipheredWordMoved: decipheredWordMovedReducer,
  },
  lateReducer: decipheredTextLateReducer,
  saga: function* () {
    const actions = yield select(({actions}) => actions);
    yield takeEvery(actions.decipheredWordMoved, function* () {
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
