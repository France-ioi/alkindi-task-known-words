import React from 'react';
import {connect} from 'react-redux';
import Collapsable from './tools/collapsable';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function WorkspaceSelector (state) {
  const {
    taskData: {version, frequencyAnalysis},
    views: {CipheredText, FrequencyAnalysis, Substitution, DecipheredText, HintRequestFeedback, Hints, SelectionText},
  } = state;

  return {
    version, frequencyAnalysis,
    CipheredText, FrequencyAnalysis, Substitution, DecipheredText, HintRequestFeedback, Hints, SelectionText,
  };
}

class Workspace extends React.PureComponent {
  render () {
    const {
      CipheredText, FrequencyAnalysis, Substitution, DecipheredText, HintRequestFeedback, Hints, SelectionText,
    } = this.props;
    return (
      <div>
        <DndProvider backend={HTML5Backend}>
          <div className="content-block" style={{marginTop: '10px'}}>
            <div className="content-block-header">
              <FontAwesomeIcon icon="sticky-note" />
              Votre mission
            </div>
            <div className="content-block-body">
              {this.props.version.explanation}
            </div>
          </div>
          <div className="main-block">
            <Collapsable title={<div className="main-block-header">{"Texte chiffré"}</div>}>
              <CipheredText />
            </Collapsable>
          </div>
          <div className="main-block">
            <Collapsable title={<div className="main-block-header">{"Déchiffrement"}</div>}>
              <DecipheredText />
            </Collapsable>
          </div>
          {this.props.version.hints !== false &&
            <div className="main-block hints">
              <Collapsable title={<div className="main-block-header">{"Indices"}</div>}>
                <div>
                  <HintRequestFeedback/>
                  <Hints/>
                </div>
              </Collapsable>
            </div>
          }
          {this.props.version.frequencyAnalysis !== false &&
            <div className="main-block">
              <Collapsable title={<div className="main-block-header">{"Analyse de fréquence"}</div>}>
                {this.props.version.frequencyAnalysisWhole !== true &&
                  <div style={{marginTop: '20px'}}>
                    <h3 className="sub-block-title">Lignes sélectionnées</h3>
                    <SelectionText/>
                  </div>
                }
                <div style={{marginTop: '20px'}}>
                  <FrequencyAnalysis />
                </div>
              </Collapsable>
            </div>
          }
          <div className="main-block">
            <Collapsable title={<div className="main-block-header">{"Substitution"}</div>}>
              <div className="clearfix">
                <div>
                  <Substitution />
                </div>
              </div>
            </Collapsable>
          </div>
        </DndProvider>
      </div>
    );
  }
}

export default {
  views: {
    Workspace: connect(WorkspaceSelector)(Workspace)
  }
};
