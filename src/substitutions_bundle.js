import React from 'react';
import {connect} from 'react-redux';
import update from 'immutability-helper';
import {put, select, takeEvery} from 'redux-saga/effects';
import SubstitutionEditView from './components/SubstitutionEditView';
import {wrapAround, editSubstitutionCell, lockSubstitutionCell, loadSubstitution, memoize} from './utils';

function appInitReducer (state, _action) {
  return {
    ...state,
    substitution: null,
    pinnedSubstitution: null,
    editingSubstitution: {},
  };
}

function taskInitReducer (state, _action) {
  const {taskData: {alphabet}} = state;
  const substitution = loadSubstitution(alphabet);

  return {...state, substitution, taskReady: true};
}

function substitutionCellEditStartedReducer (state, {payload: {cellRank, pinned}}) {
  const {taskData: {alphabet}} = state;
  cellRank = wrapAround(cellRank, alphabet.length);
  return update(state, {editingSubstitution: {$set: {cellRank, pinned}}});
}

function substitutionCellEditMovedReducer (state, {payload: {cellMove}}) {
  let {taskData: {alphabet}, substitution, editingSubstitution: {cellRank, pinned}} = state;
  let cellStop = cellRank;
  if (cellRank === undefined) return state;
  let cell;
  do {
    cellRank = wrapAround(cellRank + cellMove, alphabet.length);
    cell = substitution.cells[cellRank];
    /* If we looped back to the starting point, the move is impossible. */
    if (cellStop === cellRank) return state;
  } while (cell.hint || cell.locked);
  return update(state, {editingSubstitution: {$set: {cellRank, pinned}}});
}

function substitutionCellEditCancelledReducer (state, _action) {
  return update(state, {editingSubstitution: {$set: {}}});
}

function substitutionCellCharChangedReducer (state, {payload: {rank, symbol, moveToNext}}) {
  let {taskData: {alphabet}, substitution} = state;
  if (symbol.length !== 1 || -1 === alphabet.indexOf(symbol)) {
    symbol = null;
  }
  const newSubstitution = editSubstitutionCell(alphabet, substitution, rank, symbol);

  const newState = update(state, {substitution: {$set: newSubstitution}});

  if (null !== symbol && moveToNext) {
    return substitutionCellEditMovedReducer(newState, {payload: {cellMove: 1}});
  }

  return newState;
}

function substitutionCellLockChangedReducer (state, {payload: {rank, isLocked}}) {
  const newSubstitution = lockSubstitutionCell(state.substitution, rank, isLocked);

  return update(state, {substitution: {$set: newSubstitution}});
}

function substitutionPinnedReducer (state) {
  if (state.pinnedSubstitution) {
    return update(state, {pinnedSubstitution: {$set: !state.pinnedSubstitution}});
  }
}

function SubstitutionSelector (state) {
  const {
    actions: {
      substitutionCellLockChanged,
      substitutionCellCharChanged,
      decipheredCellEditCancelled,
      substitutionCellEditCancelled,
      substitutionCellEditStarted,
      substitutionCellEditMoved,
      substitutionPinned,
    },
    substitution,
    editingSubstitution,
    pinnedSubstitution,
    taskData: {alphabet, usedSymbols},
  } = state;

  return {
    substitutionCellEditStarted, substitutionCellEditCancelled, substitutionCellEditMoved,
    substitutionCellLockChanged, substitutionCellCharChanged, substitutionPinned,
    decipheredCellEditCancelled,
    substitution,
    alphabet,
    usedSymbols,
    editingSubstitution,
    pinnedSubstitution,
  };
}

const emptyEditing = {};

class SubstitutionBundleView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.substitutionRef = React.createRef();
    this.state = {
      showPinned: true,
    };
  }

  nonUsedLetters = memoize((substitution, alphabet) => {
    const usedLetters = [];
    for (let i = 0; i < alphabet.length; i++) {
      const letter = substitution.cells[i].editable;
      if (letter) {
        usedLetters.push(letter);
      }
    }

    return alphabet.split('').filter(letter => usedLetters.indexOf(letter) === -1);
  });

  render () {
    const {alphabet, substitution, editingSubstitution, pinnedSubstitution} = this.props;

    return (
        <div>
          {pinnedSubstitution && this.state.showPinned &&
            <div className="substitution-pinned">
              <div className="container" style={{width: '800px'}}>
                <SubstitutionEditView
                  key="pinned"
                  substitution={substitution}
                  substitutionIndex={pinnedSubstitution}
                  nonUsedLetters={this.nonUsedLetters(substitution, alphabet)}
                  alphabet={alphabet}
                  editing={editingSubstitution}
                  pinned
                  onChangeChar={this.onChangeChar}
                  onChangeLocked={this.onChangeLocked}
                  onEditingStarted={this.onEditingStarted}
                  onEditingCancelled={this.onEditingCancelled}
                  onEditingMoved={this.onEditingMoved}
                  onPinSubstitution={this.onPinSubstitution}
                />
              </div>
            </div>
          }
          <div
            className="substitution-edit"
            ref={this.substitutionRef}
          >
            <SubstitutionEditView
              substitution={substitution}
              nonUsedLetters={this.nonUsedLetters(substitution, alphabet)}
              alphabet={alphabet}
              editing={editingSubstitution}
              onChangeChar={this.onChangeChar}
              onChangeLocked={this.onChangeLocked}
              onEditingStarted={this.onEditingStarted}
              onEditingCancelled={this.onEditingCancelled}
              onEditingMoved={this.onEditingMoved}
              onPinSubstitution={this.onPinSubstitution}
            />
          </div>
        </div>
    );
  }
  onEditingStarted = (rank, pinned) => {
    this.props.dispatch({type: this.props.substitutionCellEditStarted, payload: {cellRank: rank, pinned}});
    // this.props.dispatch({type: this.props.decipheredCellEditCancelled});
  };
  onEditingCancelled = () => {
    this.props.dispatch({type: this.props.substitutionCellEditCancelled});
  };
  onChangeChar = (rank, symbol, moveToNext = true) => {
    symbol = symbol.toUpperCase();
    this.props.dispatch({type: this.props.substitutionCellCharChanged, payload: {rank, symbol, moveToNext}});
  };
  onChangeLocked = (rank, isLocked) => {
    this.props.dispatch({type: this.props.substitutionCellLockChanged, payload: {rank, isLocked}});
  };
  onEditingMoved = (substitutionMove, cellMove) => {
    this.props.dispatch({type: this.props.substitutionCellEditMoved, payload: {substitutionMove, cellMove}});
  };
  onPinSubstitution = () => {
    this.props.dispatch({type: this.props.substitutionPinned});
  }
}

export default {
  actions: {
    substitutionCellEditStarted: 'Substitution.Cell.Edit.Started',
    substitutionCellEditMoved: 'Substitution.Cell.Edit.Moved',
    substitutionCellEditCancelled: 'Substitution.Cell.Edit.Cancelled',
    substitutionCellLockChanged: 'Substitution.Cell.Lock.Changed',
    substitutionCellCharChanged: 'Substitution.Cell.Char.Changed',
    substitutionKeyLoaded: 'Substitution.Key.Loaded',
    substitutionPinned: 'Substitution.Pinned',
  },
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer,
    substitutionCellEditStarted: substitutionCellEditStartedReducer,
    substitutionCellEditMoved: substitutionCellEditMovedReducer,
    substitutionCellEditCancelled: substitutionCellEditCancelledReducer,
    substitutionCellLockChanged: substitutionCellLockChangedReducer,
    substitutionCellCharChanged: substitutionCellCharChangedReducer,
    substitutionPinned: substitutionPinnedReducer,
  },
  saga: function* () {
    const actions = yield select(({actions}) => actions);
    yield takeEvery(actions.substitutionCellEditStarted, function* () {
      yield put({type: actions.hintRequestFeedbackCleared});
    });
  },
  views: {
    Substitution: connect(SubstitutionSelector)(SubstitutionBundleView)
  }
};
