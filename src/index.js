
import update from 'immutability-helper';
import algoreaReactTask from './algorea_react_task';

import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

// Import used Font-Awesome icons individually to allow tree-shaking reduce sensibly Webpack build size
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {faStickyNote} from '@fortawesome/free-solid-svg-icons/faStickyNote';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck';
import {faLock} from '@fortawesome/free-solid-svg-icons/faLock';
import {faLockOpen} from '@fortawesome/free-solid-svg-icons/faLockOpen';
import {faSpinner} from '@fortawesome/free-solid-svg-icons/faSpinner';
import {faThumbtack} from '@fortawesome/free-solid-svg-icons/faThumbtack';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
library.add(faPlus, faStickyNote, faTimes, faCheck, faLock, faLockOpen, faSpinner, faThumbtack, faChevronUp, faChevronDown);

import CipheredTextBundle from './ciphered_text_bundle';
import FrequencyAnalysisBundle from './frequency_analysis_bundle';
import SubstitutionsBundle from './substitutions_bundle';
import DecipheredTextBundle from './deciphered_text_bundle';
import HintsBundle from './hints_bundle';
import WorkspaceBundle from './workspace_bundle';
import SelectionTextBundle from './selection_text_bundle';
import {loadSubstitution} from './utils';


const TaskBundle = {
  actionReducers: {
    appInit: appInitReducer,
    taskInit: taskInitReducer /* possibly move to algorea-react-task */,
    taskRefresh: taskRefreshReducer /* possibly move to algorea-react-task */,
    taskAnswerLoaded: taskAnswerLoaded,
    taskStateLoaded: taskStateLoaded,
  },
  includes: [
    CipheredTextBundle,
    FrequencyAnalysisBundle,
    SubstitutionsBundle,
    DecipheredTextBundle,
    HintsBundle,
    WorkspaceBundle,
    SelectionTextBundle,
  ],
  selectors: {
    getTaskState,
    getTaskAnswer,
  }
};

if (process.env.NODE_ENV === 'development') {
  /* eslint-disable no-console */
  TaskBundle.earlyReducer = function (state, action) {
    console.log('ACTION', action.type, action);
    return state;
  };
}

function appInitReducer (state, _action) {
  const taskMetaData = {
    "id": "http://concours-alkindi.fr/tasks/2020/known-words",
    "language": "fr",
    "version": "fr.01",
    "authors": "Sébastien Tainon",
    "translators": [],
    "license": "",
    "taskPathPrefix": "",
    "modulesPathPrefix": "/",
    "browserSupport": [],
    "fullFeedback": true,
    "acceptedAnswers": [],
    "usesRandomSeed": true
  };
  return {...state, taskMetaData};
}

function taskInitReducer (state, _action) {
  return {...state};
}

function taskRefreshReducer (state, _action) {
  return state;
}

function getTaskAnswer (state) {
  const {decipheredText, substitution} = state;
  const {lines, decipheredLetters, placedWords} = decipheredText;

  const answer = lines.map(({deciphered}) => {
    return deciphered.map(cell => cell.hint || cell.value || ' ').join('');
  });

  const answerState = {
    substitution: substitution.map(cell => cell.editable),
    decipheredLetters,
    placedWords,
  };

  return {
    ...answerState,
    answerText: answer,
  };
}

function taskAnswerLoaded (state, {payload: {answer}}) {
  const {alphabet} = state.taskData;
  const {substitutions: subs, decipheredLetters, placedWords} = answer;

  const substitutions = subs.map(substitution => {
    return loadSubstitution(alphabet, substitution);
  });

  return update(state, {
    substitutions: {$set: substitutions},
    decipheredText: {
      decipheredLetters: {$set: decipheredLetters},
      placedWords: {$set: placedWords},
    }
  });
}

function getTaskState (_state) {
  return {};
}

function taskStateLoaded (state, {payload: {_dump}}) {
  return state;
}

export function run (container, options) {
  return algoreaReactTask(container, options, TaskBundle);
}
