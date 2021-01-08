import React from 'react';
import {connect} from 'react-redux';
import update from 'immutability-helper';
import {put, select, takeEvery} from 'redux-saga/effects';
import SubstitutionEditView from './components/SubstitutionEditView';
import {wrapAround, markSubstitutionConflicts, loadSubstitution, memoize} from './utils';

function appInitReducer (state, _action) {
  return {
    ...state,
    substitution: null,
    pinnedSubstitution: false,
    editingSubstitution: {},
    symbolsLocked: {},
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

function substitutionCellEditCancelledReducer (state, _action) {
  return update(state, {editingSubstitution: {$set: {}}});
}

function substitutionCellCharChangedReducer (state, {payload: {rank, position, symbol}}) {
  let {taskData: {symbols, version: {symbolsPerLetterMax}}, substitution} = state;
  if (null === symbol && null !== position) {
    const newSubstitution = update(substitution, {[rank]: {editable: {$splice: [[position, 1]]}}});

    return update(state, {substitution: {$set: markSubstitutionConflicts(newSubstitution)}});
  }

  if (null === symbol || -1 === symbols.indexOf(symbol) || substitution[rank].editable.length >= symbolsPerLetterMax) {
    return state;
  }

  const newSubstitution = update(substitution, {[rank]: {editable: {$push: [symbol]}}});

  return update(state, {substitution: {$set: markSubstitutionConflicts(newSubstitution)}});
}

function substitutionCellLockChangedReducer (state, {payload: {symbol, isLocked}}) {
  return update(state, {symbolsLocked: {[symbol]: {$set: isLocked}}});
}

function substitutionPinnedReducer (state) {
    return update(state, {pinnedSubstitution: {$set: !state.pinnedSubstitution}});
}

function SubstitutionSelector (state) {
  const {
    actions: {
      substitutionCellLockChanged,
      substitutionCellCharChanged,
      decipheredCellEditCancelled,
      substitutionCellEditCancelled,
      substitutionCellEditStarted,
      substitutionPinned,
    },
    substitution,
    editingSubstitution,
    pinnedSubstitution,
    symbolsLocked,
    taskData: {alphabet, symbols, version: {symbolsPerLetterMax}},
  } = state;

  return {
    substitutionCellEditStarted, substitutionCellEditCancelled,
    substitutionCellLockChanged, substitutionCellCharChanged, substitutionPinned,
    decipheredCellEditCancelled,
    substitution,
    alphabet,
    symbols,
    editingSubstitution,
    pinnedSubstitution,
    symbolsPerLetterMax,
    symbolsLocked,
  };
}

class SubstitutionBundleView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.substitutionRef = React.createRef();
    this.state = {
      showPinned: true,
    };
  }

  nonUsedSymbols = memoize((substitution, alphabet, symbols) => {
    const usedSymbols = [];
    for (let i = 0; i < alphabet.length; i++) {
      const symbols = substitution[i].editable;
      for (let symbol of symbols) {
        usedSymbols.push(symbol);
      }
    }

    return symbols.split('').filter(symbol => usedSymbols.indexOf(symbol) === -1);
  });

  render () {
    const {alphabet, substitution, editingSubstitution, symbols, symbolsPerLetterMax, symbolsLocked, pinnedSubstitution} = this.props;

    return (
        <div>
          {pinnedSubstitution && this.state.showPinned &&
          <div className="substitution-pinned">
            <div className="container" style={{width: '800px'}}>
              <SubstitutionEditView
                substitution={substitution}
                nonUsedSymbols={this.nonUsedSymbols(substitution, alphabet, symbols)}
                alphabet={alphabet}
                editing={editingSubstitution}
                symbolsPerLetterMax={symbolsPerLetterMax}
                symbolsLocked={symbolsLocked}
                pinned
                onChangeChar={this.onChangeChar}
                onChangeLocked={this.onChangeLocked}
                onEditingStarted={this.onEditingStarted}
                onEditingCancelled={this.onEditingCancelled}
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
              nonUsedSymbols={this.nonUsedSymbols(substitution, alphabet, symbols)}
              alphabet={alphabet}
              editing={editingSubstitution}
              symbolsPerLetterMax={symbolsPerLetterMax}
              symbolsLocked={symbolsLocked}
              onChangeChar={this.onChangeChar}
              onChangeLocked={this.onChangeLocked}
              onEditingStarted={this.onEditingStarted}
              onEditingCancelled={this.onEditingCancelled}
              onPinSubstitution={this.onPinSubstitution}
            />
          </div>
        </div>
    );
  }
  onEditingStarted = (rank, pinned) => {
    this.props.dispatch({type: this.props.substitutionCellEditStarted, payload: {cellRank: rank, pinned}});
  };
  onEditingCancelled = () => {
    this.props.dispatch({type: this.props.substitutionCellEditCancelled});
  };
  onChangeChar = (rank, position, symbol, moveToNext = true) => {
    this.props.dispatch({type: this.props.substitutionCellCharChanged, payload: {rank, position, symbol, moveToNext}});
    if (!moveToNext) {
      this.props.dispatch({type: this.props.substitutionCellEditCancelled});
    }
  };
  onChangeLocked = (symbol, isLocked) => {
    this.props.dispatch({type: this.props.substitutionCellLockChanged, payload: {symbol, isLocked}});
  };
  onPinSubstitution = () => {
    this.props.dispatch({type: this.props.substitutionPinned});
  }
}

export default {
  actions: {
    substitutionCellEditStarted: 'Substitution.Cell.Edit.Started',
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
