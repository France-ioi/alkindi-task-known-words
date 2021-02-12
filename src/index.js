import "core-js";
import "regenerator-runtime/runtime";
import update from 'immutability-helper';
import {reactTask} from '@france-ioi/react-task-lib';
import 'bootstrap/dist/css/bootstrap.css';
import '@france-ioi/react-task-lib/dist/index.css';
import './style.scss';

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
import {faUndo} from '@fortawesome/free-solid-svg-icons/faUndo';
import {faRedo} from '@fortawesome/free-solid-svg-icons/faRedo';
library.add(faPlus, faStickyNote, faTimes, faCheck, faLock, faLockOpen, faSpinner, faThumbtack, faChevronUp, faChevronDown, faUndo, faRedo);

import CipheredTextBundle from './ciphered_text_bundle';
import FrequencyAnalysisBundle from './frequency_analysis_bundle';
import SubstitutionsBundle from './substitutions_bundle';
import TranspositionBundle from './transposition_bundle';
import DecipheredTextBundle from './deciphered_text_bundle';
import HintsBundle from './hints_bundle';
import WorkspaceBundle from './workspace_bundle';
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
    TranspositionBundle,
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
    "usesRandomSeed": true,
    "autoHeight": true,
    "minWidth": "auto",
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
  const {decipheredText, substitution, symbolsLocked, transposition} = state;
  const {lines, decipheredLetters, placedWords} = decipheredText;

  const answer = lines.map(({deciphered}) => {
    return deciphered.map(cell => cell.hint || cell.value || cell.result || ' ').join('');
  });

  const answerState = {
    substitution: substitution,
    decipheredLetters,
    placedWords,
    symbolsLocked,
    transposition,
  };

  return {
    ...answerState,
    answerText: answer,
  };
}

function taskAnswerLoaded (state, {payload: {answer}}) {
  const {alphabet} = state.taskData;
  const {substitution: sub, decipheredLetters, placedWords, symbolsLocked, transposition} = answer;

  return update(state, {
    substitution: {$set: loadSubstitution(alphabet, sub)},
    decipheredText: {
      decipheredLetters: {$set: decipheredLetters},
      placedWords: {$set: placedWords},
    },
    symbolsLocked: {$set: symbolsLocked},
    transposition: {$set: transposition},
  });
}

function getTaskState (_state) {
  return {};
}

function taskStateLoaded (state, {payload: {_dump}}) {
  return state;
}

window.runReact = function (container, options) {
  /// #if 'client' === GENERATE_MODE
  const versions = {easy: {version: '2.1'}, medium: {version: '2.2'}, hard: {version: '2.3', locked: true}};
  return reactTask(container, options, TaskBundle, require('../server-modules/index.js'), versions);
  /// #else
  return reactTask(container, options, TaskBundle);
  /// #endif
};
