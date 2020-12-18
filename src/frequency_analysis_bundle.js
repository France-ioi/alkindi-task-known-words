import React from 'react';
import {connect} from 'react-redux';
import {range} from 'range';

const referenceFrequencies = [
  {symbol: 'E', proba: 0.1715},
  {symbol: 'A', proba: 0.0812},
  {symbol: 'S', proba: 0.0795},
  {symbol: 'I', proba: 0.0758},
  {symbol: 'T', proba: 0.0724},
  {symbol: 'N', proba: 0.0709},
  {symbol: 'R', proba: 0.0655},
  {symbol: 'U', proba: 0.0637},
  {symbol: 'L', proba: 0.0545},
  {symbol: 'O', proba: 0.0540},
  {symbol: 'D', proba: 0.0367},
  {symbol: 'C', proba: 0.0334},
  {symbol: 'P', proba: 0.0302},
  {symbol: 'M', proba: 0.0297},
  {symbol: 'V', proba: 0.0163},
  {symbol: 'Q', proba: 0.0136},
  {symbol: 'F', proba: 0.0107},
  {symbol: 'B', proba: 0.0090},
  {symbol: 'G', proba: 0.0087},
  {symbol: 'H', proba: 0.0074},
  {symbol: 'J', proba: 0.0054},
  {symbol: 'X', proba: 0.0039},
  {symbol: 'Y', proba: 0.0031},
  {symbol: 'Z', proba: 0.0013},
  {symbol: 'W', proba: 0.0011},
  {symbol: 'K', proba: 0.0005}
];

function applySubstitutionToFreq (substitution, frequencyAnalysis, alphabet) {
  let newFrequencyAnalysis = alphabet.split('').map(() => 0);
  for (let {rank, editable} of substitution) {
    const newPosition = alphabet.indexOf(editable);
    newFrequencyAnalysis[newPosition] += frequencyAnalysis[rank];
  }

  return newFrequencyAnalysis;
}

function frequencyAnalysisLateReducer (state) {
  if (state.taskData) {
    let {taskData: {alphabet, cipherTextLines, version}, decipheredText: {appliedSubstitutions}, substitutions} = state;

    let frequencySelectedRows = {};
    for (let rowIndex = 0; rowIndex < cipherTextLines.length; rowIndex++) {
      frequencySelectedRows[rowIndex] = [0];
    }

    let textFrequencies = [];
    // if (Object.keys(frequencySelectedRows).length !== 0) {
    //   const frequencies = alphabet.split('').map(() => 0);
    //   for (let rowIndex in frequencySelectedRows) {
    //     let selectedSubLines = frequencySelectedRows[rowIndex];
    //     if (!selectedSubLines.length) {
    //       continue;
    //     }
    //     selectedSubLines.sort();
    //
    //     let currencyFrequencyAnalysis = cipherTextLines[rowIndex].frequencyAnalysis;
    //
    //     if (selectedSubLines[0] === 0) {
    //       for (let i = 0; i < alphabet.length; i++) {
    //         frequencies[i] += currencyFrequencyAnalysis[i];
    //       }
    //       selectedSubLines = selectedSubLines.slice(1);
    //     }
    //
    //     if (rowIndex in appliedSubstitutions && selectedSubLines.length) {
    //       for (let [index, subLineSubstitutions] of appliedSubstitutions[rowIndex].entries()) {
    //         for (let {count, type} of subLineSubstitutions) {
    //           for (let k = 0; k < count; k++) {
    //             currencyFrequencyAnalysis = applySubstitutionToFreq(substitutions[type-2], currencyFrequencyAnalysis, alphabet);
    //           }
    //         }
    //
    //         if (index + 1 === selectedSubLines[0]) {
    //           for (let i = 0; i < alphabet.length; i++) {
    //             frequencies[i] += currencyFrequencyAnalysis[i];
    //           }
    //           selectedSubLines = selectedSubLines.slice(1);
    //           if (!selectedSubLines.length) {
    //             break;
    //           }
    //         }
    //       }
    //     }
    //   }
    //
    //   const freqMap = new Map(range(0, alphabet.length).map(i => [alphabet.substring(i, i+1), frequencies[i]]));
    //   textFrequencies = normalizeAndSortFrequencies(freqMap.entries());
    // }

    return {...state, frequencyAnalysis: textFrequencies};
  }

  return state;
}

function normalizeAndSortFrequencies (entries) {
  const result = Array.from(entries);
  const totalCount = result.reduce((a, x) => a + x[1], 0);
  result.sort(function (s1, s2) {
    const p1 = s1[1], p2 = s2[1];
    return p1 > p2 ? -1 : (p1 < p2 ? 1 : 0);
  });
  return result.map(([symbol, count]) => ({symbol, proba: count / totalCount}));
}

function FrequencyAnalysisSelector (state) {
  const {taskData: {alphabet}, frequencyAnalysis} = state;
  const scale = 40 / referenceFrequencies.reduce((a, x) => Math.max(a, x.proba), 0);

  return {
    alphabetSize: alphabet.length,
    referenceFrequencies,
    textFrequencies: frequencyAnalysis,
    scale
  };
}

class FrequencyAnalysisView extends React.PureComponent {
  render () {
    const {alphabetSize, referenceFrequencies, textFrequencies, scale} = this.props;
    if (!referenceFrequencies) return false;

    return (
        <div className="frequency-analysis-container">
          <div className="frequency-analysis-categories" style={{height: '40px'}}>
            <div className="frequency-analysis-category">
              <div>{"Fréquences dans le texte"}</div>
            </div>
            <div className="frequency-analysis-items bottom-up">
              {range(0, alphabetSize).filter(index => textFrequencies[index]).map(index =>
                <div key={index}>
                  <div className="frequency-bar" style={{height: `${Math.min(40, Math.round(textFrequencies[index].proba * scale))}px`}}/>
                </div>
              )}
            </div>
          </div>
          <div className="frequency-analysis-categories" style={{height: '20px'}}>
            <div className="frequency-analysis-category">
              <div>{"Symbole du texte"}</div>
            </div>
            <div className="frequency-analysis-items">
              {range(0, alphabetSize).filter(index => textFrequencies[index]).map(index =>
                <div key={index} className="frequency-letter-container">
                  <div className="frequency-selection-letter">{textFrequencies[index].symbol}</div>
                </div>
              )}
            </div>
          </div>
          <div className="frequency-analysis-categories" style={{height: '20px'}}>
            <div className="frequency-analysis-category">
              <div>{"Substitution"}</div>
            </div>
            <div className="frequency-analysis-items">
              {range(0, alphabetSize).map(index =>
                <div key={index} className="frequency-letter-container">
                  <div className="frequency-substitute-letter">{referenceFrequencies[index].symbol}</div>
                </div>
              )}
            </div>
          </div>
          <div className="frequency-analysis-categories" style={{height: '40px'}}>
            <div className="frequency-analysis-category">
              <div>{"Fréquences en français"}</div>
            </div>
            <div className="frequency-analysis-items">
              {range(0, alphabetSize).map(index =>
                <div key={index}>
                  <div className="frequency-bar" style={{height: `${Math.round(referenceFrequencies[index].proba * scale)}px`}}/>
                </div>
              )}
            </div>
          </div>
        </div>
    );
  }
}

export default {
  lateReducer: frequencyAnalysisLateReducer,
  views: {
    FrequencyAnalysis: connect(FrequencyAnalysisSelector)(FrequencyAnalysisView)
  },
};
