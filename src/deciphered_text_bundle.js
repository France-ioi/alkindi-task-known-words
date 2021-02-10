import React from 'react';
import {connect} from 'react-redux';
import update from 'immutability-helper';
import {range} from 'range';
import {applySubstitutionToText, wrapAroundLines, applyTranspositionToWords} from './utils';
import DecipheredTextCell from "./components/DecipheredTextCell";
import {put, select, takeEvery} from "redux-saga/effects";
import {DraggableWord} from "./components/DraggableWord";
import {DroppableWordSlot} from "./components/DroppableWordSlot";
import {Collapsable} from '@france-ioi/react-task-lib';
import Tutorial from "./components/Tutorial";
import {DroppableWordContainer} from "./components/DroppableWordContainer";
import {DraggableCipheredWord} from "./components/DraggableCipheredWord";

const cellWidth = 22; // px
const cellHeight = 24; // px
const pageRows = 4;
const height = 370;
const heightWords = 210;
const wordsRowHeight = 60; // px

function appInitReducer (state, _action) {
  return {
    ...state,
    decipheredText: {
      scrollTop: 0,
      scrollTopWords: 0,
    },
  };
}

function taskInitReducer (state) {
  let {decipheredText} = state;
  if (!decipheredText) {
    return state;
  }

  decipheredText = {
    ...decipheredText,
    decipheredLetters: {},
    placedWords: {},
    selectedWord: null,
    selectedDecipheredWord: null,
    workingAreaWords: {},
  };

  let newState = {...state, decipheredText, editingDecipher: null};
  newState = decipheredTextResizedReducer(newState, {payload: {width: newState.decipheredText.width}});

  return applyRefreshedData(newState);
}

function taskRefreshReducer (state) {
  const newState = decipheredTextResizedReducer(state, {payload: {width: state.decipheredText.width}});

  return applyRefreshedData({
    ...newState,
    decipheredText: {
      ...newState.decipheredText,
      selectedWord: null,
      selectedDecipheredWord: null,
    },
    editingDecipher: null,
  });
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

function decipheredTextScrolledWordsReducer (state, {payload: {scrollTop}}) {
  let {decipheredText} = state;
  decipheredText = {...decipheredText, scrollTopWords: scrollTop};

  return {...state, decipheredText};
}

function decipheredTextLateReducer (state, _action) {
  if (!state.taskData || !state.decipheredText.decipheredLetters) return state;
  let {decipheredText} = state;

  return applyRefreshedData({...state, decipheredText});
}

function applyRefreshedData (state) {
  let {taskData: {cipherTextLines, alphabet, hints, clearWords}, decipheredText, substitution, symbolsLocked, transposition} = state;
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

    let currentCipherText = cipherText.map((letter) => {
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
      deciphered[i].substitutionResult = substitutionResult[i].value;
      deciphered[i].substitutionResultLocked = substitutionResult[i].locked;
    }

    let finalResult = substitutionResult;
    if (transposition) {
      const words = [];
      let lastPosition = 0;
      for (let i = 0; i < deciphered.length; i++) {
        if (deciphered[i].ciphered === ' ') {
          const word = substitutionResult.slice(lastPosition, i);
          lastPosition = i + 1;
          words.push(word);
        }
      }

      const word = substitutionResult.slice(lastPosition, deciphered.length);
      words.push(word);

      const transpositionResult = applyTranspositionToWords(transposition, words);
      let recombinedChain = [];
      let first = true;
      for (let word of transpositionResult) {
        if (first) {
          recombinedChain = [...word];
        } else {
          recombinedChain = [...recombinedChain, {value: null, locked: false}, ...word];
        }
        first = false;
      }

      finalResult = recombinedChain;
    }

    for (let i = 0; i < finalResult.length; i++) {
      deciphered[i].result = finalResult[i].value;
    }

    finalResult = finalResult.map((cell, position) => {
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
      finalResult,
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
  const {decipheredText: {lines, placedWords, selectedWord}, taskData: {clearWords, cipherTextLines}} = state;
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
  if (selectedWord === wordIndex) {
    newState = update(newState, {decipheredText: {selectedWord: {$set: null}}});
  }

  return applyRefreshedData(newState);
}

function decipheredWordSelectedReducer (state, {payload: {wordIndex}}) {
  const {decipheredText: {selectedWord}} = state;

  if (selectedWord === wordIndex) {
    return update(state, {decipheredText: {selectedWord: {$set: null}}});
  }

  return update(state, {decipheredText: {selectedWord: {$set: wordIndex}}});
}

function decipheredDecipheredWordSelectedReducer (state, {payload: {rowIndex, wordIndex}}) {
  const {decipheredText: {selectedDecipheredWord}} = state;

  if (selectedDecipheredWord && selectedDecipheredWord.rowIndex === rowIndex && selectedDecipheredWord.wordIndex === wordIndex) {
    return update(state, {decipheredText: {selectedDecipheredWord: {$set: null}}});
  }

  return update(state, {decipheredText: {selectedDecipheredWord: {$set: {rowIndex, wordIndex}}}});
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

function decipheredWorkingAreaWordDroppedReducer (state, {payload: {item, coordinates}}) {
  const {decipheredText: {workingAreaWords}} = state;
  const identifier = item.type + '-' + item.id;
  const gridCellWidth = 22; // px
  const snappedCoordinates = {
    x: Math.round(coordinates.x / gridCellWidth) * gridCellWidth,
    y: Math.round(coordinates.y  / gridCellWidth) * gridCellWidth,
  };

  if (snappedCoordinates.x < 0 || snappedCoordinates.x + (21 * (item.lettersCount + 1)) > 770 || snappedCoordinates.y < 0 || snappedCoordinates.y > 220) {
    return state;
  }

  for (let [id, {item: {type, lettersCount}, coordinates: otherCoordinates}] of Object.entries(workingAreaWords)) {
    if (id === identifier) {
      continue;
    }

    const selfWidth = 21 * (item.lettersCount + 1);
    const otherWidth = 21 * (lettersCount + 1);
    const selfHeight = 'ciphered-word' === item.type ? 40 : 20;
    const otherHeight = 'ciphered-word' === type ? 40 : 20;

    const overlap = !(snappedCoordinates.x + selfWidth <= otherCoordinates.x ||
      snappedCoordinates.x >= otherCoordinates.x + otherWidth ||
      snappedCoordinates.y + selfHeight <= otherCoordinates.y ||
      snappedCoordinates.y >= otherCoordinates.y + otherHeight);

    if (overlap) {
      return state;
    }
  }

  if (identifier in workingAreaWords) {
    // remove ?
    return update(state, {decipheredText: {workingAreaWords: {[identifier]: {$set: {item, coordinates: snappedCoordinates}}}}});
  } else {
    return update(state, {decipheredText: {workingAreaWords: {[identifier]: {$set: {item, coordinates: snappedCoordinates}}}}});
  }
}

function decipheredWorkingAreaWordRemovedReducer (state, {payload: {item}}) {
  const {decipheredText: {workingAreaWords}} = state;
  const identifier = item.type + '-' + item.id;

  if (identifier in workingAreaWords) {
    return update(state, {decipheredText: {workingAreaWords: {$unset: [identifier]}}});
  }

  return state;
}

function DecipheredTextViewSelector (state) {
  const {actions, decipheredText, editingDecipher, taskData: {version, clearWords}} = state;
  const {
    decipheredCellEditStarted,
    decipheredCellEditCancelled,
    decipheredCellCharChanged,
    decipheredTextResized,
    decipheredTextScrolled,
    decipheredTextScrolledWords,
    decipheredCellEditMoved,
    decipheredWordMoved,
    decipheredWordSelected,
    decipheredDecipheredWordSelected,
    decipheredWorkingAreaWordDropped,
    decipheredWorkingAreaWordRemoved,
  } = actions;
  const {width, scrollTop, scrollTopWords, lines, pageColumns, placedWords, selectedWord, selectedDecipheredWord, workingAreaWords} = decipheredText;

  return {
    decipheredCellEditStarted,
    decipheredCellEditCancelled,
    decipheredCellCharChanged,
    decipheredCellEditMoved,
    decipheredWordMoved,
    decipheredWordSelected,
    decipheredDecipheredWordSelected,
    decipheredTextResized,
    decipheredTextScrolled,
    decipheredTextScrolledWords,
    decipheredWorkingAreaWordDropped,
    decipheredWorkingAreaWordRemoved,

    version, editingDecipher, width, scrollTop, scrollTopWords, lines, pageColumns, clearWords,
    placedWords, selectedWord, selectedDecipheredWord, workingAreaWords,
  };
}

class DecipheredTextView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {dragElement: null};
  }
  render () {
    const {pageColumns, scrollTop, scrollTopWords, lines, editingDecipher, version, clearWords, placedWords, selectedWord, selectedDecipheredWord, workingAreaWords} = this.props;
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

    const firstRowWords = Math.floor(scrollTopWords / wordsRowHeight);
    const lastRowWords = Math.min(firstRowWords + pageRows + 2, rowsCount);
    const visibleRowsWords = range(firstRowWords, lastRowWords);

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
          content: line.deciphered.slice(currentPosition, currentPosition + word.length),
        });
        currentPosition += word.length + 1;
        wordSlotId++;
      }

      return slots;
    });

    return (
      <div>
        <div className="main-block">
          <Collapsable
            title={<div className="main-block-header">{"Déchiffrement"}</div>}
            tutorial={
              <Tutorial
                category="deciphered"
                version={this.props.version}
              />
            }
          >
            <div style={{paddingTop: '20px'}}>
              <div
                id="deciphered-scrollable"
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
                        {false !== version.transposition ? 'Résultat' : 'Substitution'}
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
                                draggingWord={this.state.dragElement || clearWords[selectedWord]}
                              />
                              <div
                                className={`deciphered-word-selectable ${selectedDecipheredWord && selectedDecipheredWord.rowIndex === rowIndex && selectedDecipheredWord.wordIndex === resultIndex ? 'deciphered-word-selected' : ''}`}
                                style={{position: 'absolute', width: `calc(100% + 13px)`, height: `${linesHeight[rowIndex].height - 20 + 14}px`}}
                                onClick={() => this.selectDecipheredWord(rowIndex, resultIndex)}
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
                          {lines[rowIndex].finalResult.slice(0, pageColumns).map(({value, locked, conflict}, resultIndex) =>
                            <div
                              key={resultIndex}
                              className={`deciphered-result-cell letter-cell ${locked ? ' deciphered-locked' : ''}${conflict ? ' deciphered-conflict' : ''}`}
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
          <Collapsable
            title={<div className="main-block-header">{"Mots connus"}</div>}
            tutorial={
              <Tutorial
                category="words"
                version={this.props.version}
              />
            }
          >
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
                        selected={(column * Math.round(clearWords.length / 2) + wordIndex) === selectedWord}
                        onWordSelected={this.onWordSelected}
                        onWordMoved={this.onWordMoved}
                        onDragStart={(item) => this.setDragElement(item)}
                        onDragEnd={() => this.setDragElement(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="words-explanation">
              Glissez les mots vers l'outil "Déchiffrement".
            </div>
          </Collapsable>
        </div>
        {version.workingArea !== false &&
          <div className="main-block">
            <Collapsable title={<div className="main-block-header">{"Plan de travail"}</div>}>
              <div>
                <div className="working-area">
                  <DroppableWordContainer
                    onDropWord={this.onDropWordWorkingArea}
                  >
                    {Object.entries(workingAreaWords).map(([key, {item, coordinates}]) =>
                      <div
                        key={key}
                        style={{position: 'absolute', left: coordinates.x, top: coordinates.y}}
                      >
                        {'word' === item.type ? <DraggableWord
                          key={key}
                          wordIndex={item.wordIndex}
                          wordSlotsByRow={wordSlotsByRow}
                          word={clearWords[item.wordIndex]}
                          selected={item.wordIndex === selectedWord}
                          onWordSelected={this.onWordSelected}
                          onWordMoved={this.onWordMoved}
                          onDragStart={(item) => this.setDragElement(item)}
                          onDragEnd={() => this.setDragElement(null)}
                          onWordRemoved={this.onWordRemovedWorkingArea}
                        /> : null}
                        {'ciphered-word' === item.type ? <DraggableCipheredWord
                          key={key}
                          rowIndex={item.rowIndex}
                          wordIndex={item.wordIndex}
                          content={wordSlotsByRow[item.rowIndex][item.wordIndex].content}
                          onWordRemoved={this.onWordRemovedWorkingArea}
                          draggingWord={clearWords[selectedWord]}
                        /> : null}
                      </div>
                    )}
                  </DroppableWordContainer>
                </div>

                <hr/>

                <div className="working-area-words">
                  <div>Mots du chiffré</div>
                  <div
                    id="deciphered-words-scrollable"
                    ref={this.refTextBoxWords}
                    onScroll={this.onScrollWords}
                    className="custom-scrollable"
                    style={{position: 'relative', width: '100%', height: heightWords && `${heightWords}px`, overflowY: 'auto', overflowX: 'hidden', background: 'white'}}
                  >
                    {(visibleRowsWords || []).map((rowIndex) =>
                      <div
                        key={rowIndex}
                        className="deciphered-words-line is-bordered"
                        style={{position: 'absolute', top: `${wordsRowHeight * rowIndex}px`, width: '100%', height: `${wordsRowHeight}px`}}
                      >
                        <div>
                          {wordSlotsByRow[rowIndex].map(({position, content}, resultIndex) =>
                            <div
                              key={resultIndex}
                              className={`
                                droppable-word-container
                              `}
                              style={{position: 'absolute', left: `${position * cellWidth + (6 * resultIndex)}px`, top: '4px'}}
                            >
                              <DraggableCipheredWord
                                content={content}
                                rowIndex={rowIndex}
                                wordIndex={resultIndex}
                                draggingWord={clearWords[selectedWord]}
                              />
                            </div>
                          )}
                        </div>
                      </div>)}
                    <div style={{position: 'absolute', top: `${wordsRowHeight * lines.length - 1}px`, width: '1px', height: '1px'}} />
                  </div>
                </div>
              </div>
            </Collapsable>
          </div>
        }
      </div>
    );
  }
  refTextBox = (element) => {
    this._textBox = element;
    const width = element.clientWidth;
    const height = element.clientHeight;
    this.props.dispatch({type: this.props.decipheredTextResized, payload: {width, height}});
  };
  refTextBoxWords = (element) => {
    this._textBoxWords = element;
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
  onScrollWords = () => {
    if (!this._textBoxWords) {
      return;
    }
    const scrollTop = this._textBoxWords.scrollTop;
    this.props.dispatch({type: this.props.decipheredTextScrolledWords, payload: {scrollTop}});
  };
  componentDidUpdate () {
    this._textBox.scrollTop = this.props.scrollTop;
    if (this._textBoxWords) {
      this._textBoxWords.scrollTop = this.props.scrollTopWords;
    }
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
  onWordSelected = (wordIndex) => {
    this.props.dispatch({type: this.props.decipheredWordSelected, payload: {wordIndex}});
  };
  selectDecipheredWord = (rowIndex, wordIndex) => {
    this.props.dispatch({type: this.props.decipheredDecipheredWordSelected, payload: {rowIndex, wordIndex}});
  };
  onDropWordWorkingArea = (item, coordinates) => {
    this.props.dispatch({type: this.props.decipheredWorkingAreaWordDropped, payload: {item, coordinates}});
  };
  onWordRemovedWorkingArea = (item) => {
    this.props.dispatch({type: this.props.decipheredWorkingAreaWordRemoved, payload: {item}});
  };
}

export default {
  actions: {
    decipheredTextResized: 'DecipheredText.Resized' /* {width: number, height: number} */,
    decipheredTextScrolled: 'DecipheredText.Scrolled' /* {scrollTop: number} */,
    decipheredTextScrolledWords: 'DecipheredText.Scrolled.Words' /* {scrollTop: number} */,
    decipheredCellEditStarted: 'DecipheredText.Cell.Edit.Started',
    decipheredCellEditCancelled: 'DecipheredText.Cell.Edit.Cancelled',
    decipheredCellCharChanged: 'DecipheredText.Cell.Char.Changed',
    decipheredCellEditMoved: 'DecipheredText.Cell.Edit.Moved',
    decipheredWordMoved: 'DecipheredText.Word.Moved',
    decipheredWordSelected: 'DecipheredText.Word.Selected',
    decipheredDecipheredWordSelected: 'DecipheredText.DecipheredWord.Selected',
    decipheredWorkingAreaWordDropped: 'DecipheredText.WorkingArea.Word.Dropped',
    decipheredWorkingAreaWordRemoved: 'DecipheredText.WorkingArea.Word.Removed',
  },
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer,
    taskRefresh: taskRefreshReducer,
    decipheredTextResized: decipheredTextResizedReducer,
    decipheredTextScrolled: decipheredTextScrolledReducer,
    decipheredTextScrolledWords: decipheredTextScrolledWordsReducer,
    decipheredCellEditStarted: decipheredCellEditStartedReducer,
    decipheredCellEditCancelled: decipheredCellEditCancelledReducer,
    decipheredCellCharChanged: decipheredCellCharChangedReducer,
    decipheredCellEditMoved: decipheredCellEditMovedReducer,
    decipheredWordMoved: decipheredWordMovedReducer,
    decipheredWordSelected: decipheredWordSelectedReducer,
    decipheredDecipheredWordSelected: decipheredDecipheredWordSelectedReducer,
    decipheredWorkingAreaWordDropped: decipheredWorkingAreaWordDroppedReducer,
    decipheredWorkingAreaWordRemoved: decipheredWorkingAreaWordRemovedReducer,
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
