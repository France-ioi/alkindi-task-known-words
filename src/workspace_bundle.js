import React from 'react';
import {connect} from 'react-redux';
import {Collapsable} from '@france-ioi/react-task-lib';
import {DndProvider} from 'react-dnd';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch';
import MultiBackend from 'react-dnd-multi-backend';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import CustomDragLayer from "./components/CustomDragLayer";
import Tutorial from "./components/Tutorial";

function WorkspaceSelector (state) {
  const {
    taskData: {version, frequencyAnalysis},
    views: {CipheredText, FrequencyAnalysis, Substitution, Transposition, DecipheredText, HintRequestFeedback, Hints},
  } = state;

  return {
    version, frequencyAnalysis,
    CipheredText, FrequencyAnalysis, Substitution, DecipheredText, HintRequestFeedback, Hints, Transposition,
  };
}

class Workspace extends React.PureComponent {
  render () {
    const {
      CipheredText, FrequencyAnalysis, Substitution, Transposition, DecipheredText, HintRequestFeedback, Hints, version,
    } = this.props;

    const versionId = String(version.version);

    return (
      <div>
        <DndProvider backend={MultiBackend} options={HTML5toTouch}>
          <CustomDragLayer/>
          <div className="content-block" style={{marginTop: '10px'}}>
            <div className="content-block-header">
              <FontAwesomeIcon icon="sticky-note" />
              Votre mission
            </div>
            <div className="content-block-body">
              {'2.3' === version.version && <p className="alert alert-warning">
                Attention, résoudre cette version peut prendre beaucoup de temps. Nous vous conseillons de résoudre d'abord les versions 2 et 3 étoiles des autres sujets.
              </p>}

              {'2.1' === version.version && <p>
                Un message a été chiffré par une <strong>substitution</strong> : chaque lettre de l’alphabet a été remplacée par un symbole, toujours le même.
              </p>}
              {'2.2' === version.version && <div>
                <p>
                  Un message a été chiffré par une <strong>substitution polyalphabétique</strong> : chaque lettre de l’alphabet a été remplacée par un symbole.
                </p>
                <div className="alert alert-warning">
                  <p>
                    <strong>Attention :</strong> Pour certaines lettres, <strong>deux symboles différents peuvent être utilisés</strong>. Dans ce cas, on choisit (au hasard) de remplacer la lettre parfois par un symbole, parfois par l’autre. Par exemple, si
                  </p>
                  <ul>
                    <li>la lettre “I” peut s’écrire “$” ou “*”</li>
                    <li>la lettre “C” peut s’écrire “#” ou “@”</li>
                  </ul>
                  <p>
                    alors le mot “ICI” peut s’écrire de plusieurs manières différentes : “$#$”, “$@*”, “*#*”, “*@$”, etc.
                  </p>
                </div>
              </div>}
              {('2.3' === version.version || '3.' === versionId.substring(0, 2)) && <div>
                <p>
                  Un message a été chiffré par une <strong>substitution polyalphabétique</strong> : chaque lettre de l’alphabet a été remplacée par un symbole.
                </p>
                <p>
                  {'2.3' === version.version && <strong>Attention :</strong>}
                  Pour certaines lettres, <strong>trois symboles différents peuvent être utilisés</strong>. Dans ce cas, on choisit (au hasard) de remplacer la lettre parfois par un symbole, parfois par l’autre. Par exemple, si
                </p>
                <ul>
                  <li>la lettre “I” peut s’écrire “$” ou “*”</li>
                  <li>la lettre “C” peut s’écrire “#”, “@” ou “%”</li>
                </ul>
                <p>
                  alors le mot “ICI” peut s’écrire de plusieurs manières différentes : “$#$”, “$@*”, “*#*”, “*%$”, etc.
                </p>
              </div>}
              {'3.2' === version.version && <p className="alert alert-warning">
                En plus de la substitution, on a appliqué une transposition, c’est-à-dire que l’on a changé l’ordre des lettres de chaque mot, toujours selon la même règle.
              </p>}
              <p>
                On connaît une liste de mots qui sont présents dans le message. Vous pouvez glisser les mots connus dans la zone de déchiffrement.
                Un outil vous permet d'éditer la substitution de déchiffrement. {'3.2' === versionId && "Un autre outil vous permet d’éditer la transposition de dechiffrement."}
              </p>
              <p>
                Retrouvez l'intégralité du message.
              </p>
            </div>
          </div>
          <div className="main-block">
            <Collapsable
              title={<div className="main-block-header">{"Texte chiffré"}</div>}
              tutorial={
                <Tutorial
                  category="ciphered"
                  version={this.props.version}
                />
              }
            >
              <CipheredText />
            </Collapsable>
          </div>
          <DecipheredText/>
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
              <Collapsable
                title={<div className="main-block-header" style={{zIndex: 8}}>{"Analyse de fréquence"}</div>}
                tutorial={
                  <Tutorial
                    category="frequency-analysis"
                    version={this.props.version}
                  />
                }
              >
                <div style={{marginTop: '20px'}}>
                  <FrequencyAnalysis />
                </div>
              </Collapsable>
            </div>
          }
          <div className="main-block">
            <Collapsable
              title={<div className="main-block-header">{"Substitution"}</div>}
              tutorial={
                <Tutorial
                  category="substitution"
                  version={this.props.version}
                />
              }
            >
              <div className="clearfix">
                <div>
                  <Substitution />
                </div>
              </div>
            </Collapsable>
          </div>
          {this.props.version.transposition &&
            <div className="main-block">
              <Collapsable
                title={<div className="main-block-header">{"Transposition"}</div>}
                tutorial={
                  <Tutorial
                    category="transposition"
                    version={this.props.version}
                  />
                }
              >
                <Transposition/>
              </Collapsable>
            </div>
          }
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
