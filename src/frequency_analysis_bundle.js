import React from 'react';
import {connect} from 'react-redux';
import {range} from 'range';

function frequencyAnalysisLateReducer (state) {
  if (state.taskData) {
    let {taskData: {cipherTextLines, symbols}, substitution} = state;

    const frequencies = {};
    for (let line of cipherTextLines) {
      for (let symbol of line.split('')) {
        if (symbol.trim().length) {
          if (!(symbol in frequencies)) {
            frequencies[symbol] = 0;
          }
          frequencies[symbol]++;
        }
      }
    }

    let groups = [];
    let usedSymbols = [];
    for (let {editable} of substitution) {
      if (!editable.length) {
        continue;
      }
      groups.push({
        symbols: editable,
        totalCount: editable.reduce((agg, next) => agg + (next in frequencies ? frequencies[next] : 0), 0),
      });
      usedSymbols = [...usedSymbols, ...editable];
    }

    const unusedSymbols = symbols.split('').filter(symbol => -1 === usedSymbols.indexOf(symbol));
    for (let symbol of unusedSymbols) {
      groups.push({symbols: [symbol], totalCount: (symbol in frequencies ? frequencies[symbol] : 0)});
    }

    groups.forEach(group => {
      group.symbolsCount = group.symbols.map(symbol => symbol in frequencies ? frequencies[symbol] : 0);
    });

    const freqMap = range(0, groups.length).map(i => [groups[i].symbols, groups[i].totalCount, groups[i].symbolsCount]);
    const textFrequencies = normalizeAndSortFrequencies(freqMap);

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
  return result.map(([symbols, count, symbolsCount]) => ({symbols, proba: count / totalCount, count, symbolsCount}));
}

function FrequencyAnalysisSelector (state) {
  const {taskData: {alphabet, frequencyAnalysis: referenceFrequencyAnalysis}, frequencyAnalysis} = state;
  const frequencyTotalCount = referenceFrequencyAnalysis.reduce((agg, next) => agg + next, 0);
  const referenceFrequencyAnalysisMapped = referenceFrequencyAnalysis.map((count, index) => {
    return {
      symbol: alphabet.substring(index, index + 1),
      proba: count / frequencyTotalCount,
      count,
    };
  });
  referenceFrequencyAnalysisMapped.sort((a, b) => b.proba - a.proba);
  const scale = 40 / [...referenceFrequencyAnalysisMapped, ...frequencyAnalysis].reduce((a, x) => Math.max(a, x.proba), 0);

  const maxSymbols = frequencyAnalysis.reduce((agg, next) => Math.max(agg, next.symbols.length), 0);

  return {
    alphabetSize: alphabet.length,
    referenceFrequencies: referenceFrequencyAnalysisMapped,
    textFrequencies: frequencyAnalysis,
    maxSymbols,
    scale,
  };
}

class FrequencyAnalysisView extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {tooltipIndex: null};
  }

  render () {
    const {alphabetSize, referenceFrequencies, textFrequencies, scale, maxSymbols} = this.props;
    if (!referenceFrequencies) return false;

    return (
        <div className="frequency-analysis-container">
          <div className="frequency-analysis-section">
            <div className="frequency-analysis-categories">
              <div className="frequency-analysis-category bottom-up" style={{height: '70px', marginBottom: '10px'}}>
                <div>{"Fréquences dans le texte"}</div>
              </div>
              <div className="frequency-analysis-category" style={{height: (10 + 20 * maxSymbols) + 'px', paddingTop: '8px'}}>
                <div>{"Symboles du texte"}</div>
              </div>
            </div>
            <div
              className="frequency-analysis-scrollable custom-scrollable"
            >
              <div className="frequency-analysis-items not-wrappable bottom-up" style={{height: '70px', marginBottom: '10px'}}>
                {range(0, textFrequencies.length).filter(index => textFrequencies[index]).map(index =>
                  <div key={index} style={{position: 'relative'}} onMouseOver={() => this.displayDetails(index)} onMouseOut={() => this.hideDetails()}>
                    <div className="frequency-value">
                      {textFrequencies[index].count}
                      <div className="frequency-details" style={{display: index === this.state.tooltipIndex ? 'block': 'none'}}>
                        {textFrequencies[index].symbols.map((symbol, symbolIndex) =>
                          <div
                            key={symbolIndex}
                            className="frequency-details-element"
                          >
                            <div className="frequency-details-symbol">{symbol}</div>
                            <div className="frequency-details-count">{textFrequencies[index].symbolsCount[symbolIndex]}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {textFrequencies[index].symbols.map((symbol, symbolIndex) =>
                      <div
                        key={symbolIndex}
                        className="frequency-bar"
                        style={{
                          backgroundColor: ['#88BB88', '#468A43', '#256424'][symbolIndex],
                          borderTopLeftRadius: 0 === symbolIndex ? '2px' : 0,
                          borderTopRightRadius: 0 === symbolIndex ? '2px' : 0,
                          borderBottomLeftRadius: textFrequencies[index].symbols.length - 1 === symbolIndex ? '2px' : 0,
                          borderBottomRightRadius: textFrequencies[index].symbols.length - 1 === symbolIndex ? '2px' : 0,
                          height: `${Math.min(40, Math.round(textFrequencies[index].proba * scale * (textFrequencies[index].symbolsCount[symbolIndex] / (textFrequencies[index].count ? textFrequencies[index].count : 1))))}px`
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="frequency-analysis-items not-wrappable" style={{height: (10 + 20 * maxSymbols) + 'px'}}>
                {range(0, textFrequencies.length).filter(index => textFrequencies[index]).map(index =>
                  <div key={index} className="frequency-symbols-container">
                    {textFrequencies[index].symbols.map((symbol, symbolIndex) =>
                      <div className="frequency-selection-letter" key={symbolIndex}>{symbol}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="frequency-analysis-categories" style={{height: '20px'}}>
            <div className="frequency-analysis-category is-centered">
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
          <div className="frequency-analysis-categories" style={{height: '70px'}}>
            <div className="frequency-analysis-category">
              <div>{"Fréquences dans le clair"}</div>
            </div>
            <div className="frequency-analysis-items is-flex">
              {range(0, alphabetSize).map(index =>
                <div key={index}>
                  <div className="frequency-bar" style={{height: `${Math.round(referenceFrequencies[index].proba * scale)}px`}}/>
                  <div className="frequency-value">{referenceFrequencies[index].count}</div>
                </div>
              )}
            </div>
          </div>
        </div>
    );
  }

  displayDetails = (index) => {
    console.log('display', index);
    this.setState({
      tooltipIndex: index,
    });
  }

  hideDetails = () => {
    this.setState({
      tooltipIndex: null,
    });
  }
}

export default {
  lateReducer: frequencyAnalysisLateReducer,
  views: {
    FrequencyAnalysis: connect(FrequencyAnalysisSelector)(FrequencyAnalysisView)
  },
};
