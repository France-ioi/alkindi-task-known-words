import React from 'react';
import {connect} from 'react-redux';
import {NumberPicker} from '@france-ioi/react-task-lib';
import {range} from 'range';
import {DraggableTranspositionLetter} from "./components/DraggableTranspositionLetter";
import update from 'immutability-helper';

function taskInitReducer (state) {
  const {taskData: {longestWordLength}} = state;

  return {
    ...state,
    transposition: range(0, longestWordLength),
    taskReady: true,
  };
}

function taskRefreshReducer (state) {
  const {taskData: {longestWordLength}} = state;

  return {
    ...state,
    transposition: range(0, longestWordLength),
  };
}

function transpositionLetterMovedReducer (state, {payload: {oldPosition, newPosition}}) {
  const {transposition} = state;
  const previousLetter = transposition[oldPosition];
  const letterNewPosition = transposition[newPosition];
  const newTransposition = update(transposition, {
    $splice: [
      [oldPosition, 1, letterNewPosition],
      [newPosition, 1, previousLetter],
    ],
  });

  return {...state, transposition: newTransposition};
}

function TranspositionSelector (state) {
  const {
    actions: {
      transpositionLetterMoved,
    },
    transposition,
    taskData: {longestWordLength},
  } = state;

  return {
    transposition,
    longestWordLength,

    transpositionLetterMoved,
  };
}

class TranspositionBundleView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {lettersCount: 5};
  }

  render () {
    const {transposition, longestWordLength} = this.props;
    const letters = 'LOREMIPSUMDOLORSITAMET';
    const alphabet = 'ABCDEFGHIJKLMMNOPQRSTUVWXYZ';

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
          <div className="original">
            {range(0, longestWordLength).map(i =>
              <div className="transposition-letter original-letter letter-cell" key={i}>
                {letters.substring(i, i+1)}
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
                letter={letters.substring(transposition[i], transposition[i]+1)}
                moveLetter={this.moveLetter}
              />
            )}
          </div>
        </div>
        <div className="example">
          <div>
            <div className="letters-label">
              Exemple avec
            </div>
            <div className="picker">
              <NumberPicker
                minValue={1}
                maxValue={longestWordLength}
                count={this.state.lettersCount}
                onChange={(value) => this.changeLettersCount(value)}
              />
              <span>lettres</span>
            </div>
          </div>
          <div style={{marginTop: '15px'}}>
            <div>
              Mot de départ
            </div>
            <div>
              <div className="is-flex">
                {range(0, this.state.lettersCount).map(i =>
                  <div className="transposition-letter letter-cell" key={i}>
                    {alphabet.substring(i, i+1)}
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
                    {i < this.state.lettersCount ? alphabet.substring(i, i+1) : ''}
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
                    {transposition[i] < this.state.lettersCount ? alphabet.substring(transposition[i], transposition[i]+1) : ''}
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
                  transposition[i] < this.state.lettersCount ? <div className="transposition-letter letter-cell" key={i}>
                    {alphabet.substring(transposition[i], transposition[i]+1)}
                  </div> : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  changeLettersCount = (value) => {
    this.setState({
      lettersCount: value,
    });
  }

  moveLetter = (oldPosition, newPosition) => {
    this.props.dispatch({type: this.props.transpositionLetterMoved, payload: {oldPosition, newPosition}});
  };
}

export default {
  actions: {
    transpositionLetterMoved: 'Transposition.Letter.Moved',
  },
  actionReducers: {
    taskInit: taskInitReducer,
    taskRefresh: taskRefreshReducer,
    transpositionLetterMoved: transpositionLetterMovedReducer,
  },
  views: {
    Transposition: connect(TranspositionSelector)(TranspositionBundleView)
  }
};
