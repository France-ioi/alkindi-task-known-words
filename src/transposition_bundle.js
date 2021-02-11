import React from 'react';
import {connect} from 'react-redux';
import {range} from 'range';
import {DraggableTranspositionLetter} from "./components/DraggableTranspositionLetter";
import update from 'immutability-helper';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function taskInitReducer (state) {
  const {taskData: {longestWordLength}} = state;

  const transposition = range(0, longestWordLength);

  return {
    ...state,
    transposition,
    transpositionHistory: [transposition],
    transpositionHistoryPosition: 0,
    taskReady: true,
  };
}

function taskRefreshReducer (state) {
  return {
    ...state,
    transpositionHistory: [state.transposition],
    transpositionHistoryPosition: 0,
  };
}

function transpositionLetterMovedReducer (state, {payload: {oldPosition, newPosition}}) {
  const {transposition, transpositionHistory, transpositionHistoryPosition} = state;
  const previousLetter = transposition[oldPosition];
  const letterNewPosition = transposition[newPosition];
  const newTransposition = update(transposition, {
    $splice: [
      [oldPosition, 1, letterNewPosition],
      [newPosition, 1, previousLetter],
    ],
  });

  return {
    ...state,
    transposition: newTransposition,
    transpositionHistory: [
      ...transpositionHistory.slice(0, transpositionHistoryPosition + 1),
      newTransposition,
    ],
    transpositionHistoryPosition: transpositionHistoryPosition + 1,
  };
}

function transpositionUndoReducer (state) {
  const {transpositionHistory, transpositionHistoryPosition} = state;

  return {
    ...state,
    transposition: transpositionHistory[transpositionHistoryPosition - 1],
    transpositionHistoryPosition: transpositionHistoryPosition - 1,
  };
}

function transpositionRedoReducer (state) {
  const {transpositionHistory, transpositionHistoryPosition} = state;

  return {
    ...state,
    transposition: transpositionHistory[transpositionHistoryPosition + 1],
    transpositionHistoryPosition: transpositionHistoryPosition + 1,
  };
}

function TranspositionSelector (state) {
  const {
    actions: {
      transpositionLetterMoved,
      transpositionUndo,
      transpositionRedo,
    },
    transposition,
    transpositionHistory,
    transpositionHistoryPosition,
    decipheredText: {selectedDecipheredWord, lines},
    taskData: {longestWordLength},
  } = state;

  let exampleWord = null;
  if (selectedDecipheredWord) {
    const line = lines[selectedDecipheredWord.rowIndex];
    const wordIndexBeginning = line.ciphered.join('').split(' ', selectedDecipheredWord.wordIndex).join('').length + selectedDecipheredWord.wordIndex;
    const wordLength = line.ciphered.slice(wordIndexBeginning).join('').split(' ')[0].length;
    exampleWord = line.deciphered.slice(wordIndexBeginning, wordIndexBeginning + wordLength);
  }

  return {
    transposition,
    transpositionHistory,
    transpositionHistoryPosition,
    longestWordLength,
    exampleWord,

    transpositionLetterMoved,
    transpositionUndo,
    transpositionRedo,
  };
}

class TranspositionBundleView extends React.PureComponent {
  render () {
    const {transposition, transpositionHistory, transpositionHistoryPosition, longestWordLength, exampleWord} = this.props;

    const letterWidth = 20 + 4*2; // px
    const letterHeight = 20; // px
    const marginOriginDestination = 60 + 6; // px

    const paths = range(0, longestWordLength).map(index => {
      return {
        origin: {
          x: transposition[index] * letterWidth + letterWidth / 2,
          y: letterHeight / 2,
        },
        destination: {
          x: index * letterWidth + letterWidth / 2,
          y: letterHeight / 2 + marginOriginDestination,
        },
      };
    });

    return (
      <div className="transposition">
        <div className="visual">
          <div className="symbols">
            {range(0, longestWordLength).map(i =>
              <div className="original-letter letter-cell" key={i}>
                {exampleWord && i < exampleWord.length ? (exampleWord[i].ciphered ? exampleWord[i].ciphered : '_') : ''}
              </div>
            )}
          </div>
          <div className="original">
            {range(0, longestWordLength).map(i =>
              <div className={`transposition-letter original-letter letter-cell ${exampleWord && i < exampleWord.length && exampleWord[i].substitutionResultLocked ? 'is-locked' : ''}`} key={i}>
                {exampleWord && i < exampleWord.length ? (exampleWord[i].substitutionResult ? exampleWord[i].substitutionResult : '_') : ''}
              </div>
            )}
            <div className="arrows">
              <svg
                width={`${longestWordLength * letterWidth}px`}
                height={`${marginOriginDestination + letterWidth}px`}
                viewBox={`0 0 ${longestWordLength * letterWidth} ${marginOriginDestination + letterWidth}`}
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                {range(0, longestWordLength).map(i =>
                  <path
                    key={i}
                    d={`M${paths[i].origin.x} ${paths[i].origin.y} L ${paths[i].destination.x} ${paths[i].destination.y}`}
                    stroke="#88BB88"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>
          </div>
          <div className="transposed">
            {range(0, longestWordLength).map(i =>
              <DraggableTranspositionLetter
                key={transposition[i]}
                index={i}
                locked={exampleWord && transposition[i] < exampleWord.length && exampleWord[transposition[i]].substitutionResultLocked}
                letter={exampleWord && transposition[i] < exampleWord.length ? (exampleWord[transposition[i]].substitutionResult ? exampleWord[transposition[i]].substitutionResult : '_') : ''}
                moveLetter={this.moveLetter}
              />
            )}
          </div>
        </div>
        {exampleWord && <div className="example">
          <div style={{marginTop: '15px'}}>
            <div>
              Mot de départ
            </div>
            <div>
              <div className="is-flex">
                {range(0, exampleWord.length).map(i =>
                  <div className="transposition-letter letter-cell" key={i}>
                    {exampleWord[i].substitutionResult ? exampleWord[i].substitutionResult : '_'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div>
              Ajout d'espaces
            </div>
            <div>
              <div className="is-flex">
                {range(0, longestWordLength).map(i =>
                  <div className="transposition-letter letter-cell" key={i}>
                    {i < exampleWord.length ? (exampleWord[i].substitutionResult ? exampleWord[i].substitutionResult : '_') : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div>
              Transposition
            </div>
            <div>
              <div className="is-flex">
                {range(0, longestWordLength).map(i =>
                  <div className="transposition-letter letter-cell" key={i}>
                    {transposition[i] < exampleWord.length ? (exampleWord[transposition[i]].substitutionResult ? exampleWord[transposition[i]].substitutionResult : '_') : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <div>
              Retrait des espaces
            </div>
            <div>
              <div className="is-flex">
                {range(0, longestWordLength).map(i =>
                  transposition[i] < exampleWord.length ? <div className="transposition-letter letter-cell" key={i}>
                    {exampleWord[transposition[i]].substitutionResult ? exampleWord[transposition[i]].substitutionResult : '_'}
                  </div> : null
                )}
              </div>
            </div>
          </div>
        </div>}

        <div className="transposition-controls">
          <FontAwesomeIcon icon="undo" onClick={this.undo} className={transpositionHistoryPosition > 0 ? "is-visible" : ""}/>
          <FontAwesomeIcon icon="redo" onClick={this.redo} className={transpositionHistoryPosition < transpositionHistory.length - 1 ? "is-visible" : ""}/>
        </div>

        {!exampleWord && <p className="words-explanation">Sélectionnez un mot depuis l'outil "Déchiffrement" pour voir l'effet de la transposition sur ce mot.</p>}
      </div>
    );
  }

  moveLetter = (oldPosition, newPosition) => {
    this.props.dispatch({type: this.props.transpositionLetterMoved, payload: {oldPosition, newPosition}});
  };

  undo = () => {
    this.props.dispatch({type: this.props.transpositionUndo});
  };

  redo = () => {
    this.props.dispatch({type: this.props.transpositionRedo});
  };
}

export default {
  actions: {
    transpositionLetterMoved: 'Transposition.Letter.Moved',
    transpositionUndo: 'Transposition.Undo',
    transpositionRedo: 'Transposition.Redo',
  },
  actionReducers: {
    taskInit: taskInitReducer,
    taskRefresh: taskRefreshReducer,
    transpositionLetterMoved: transpositionLetterMovedReducer,
    transpositionUndo: transpositionUndoReducer,
    transpositionRedo: transpositionRedoReducer,
  },
  views: {
    Transposition: connect(TranspositionSelector)(TranspositionBundleView)
  }
};
