import {range} from "range";
import {SubstitutionCell} from "./SubstitutionCell";
import React from "react";
import {DraggableUnusedLetter} from "./DraggableUnusedLetter";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

export default class SubstitutionEditView extends React.PureComponent {
  render () {
    const {alphabet, substitution, editing, nonUsedSymbols, pinned, symbolsPerLetterMax, symbolsLocked} = this.props;

    return (
      <div style={{marginTop: "10px", position: 'relative'}}>
        <div style={{width: "100%", position: "relative"}}>
          <div className="substitution-letters">
            {range(0, alphabet.length).map(rank => {
              const {editable, locked, conflict, hint} = substitution[rank];
              const isActive = false;
              const isEditing = editing.cellRank === rank && editing.pinned === pinned && !locked && !hint;
              const isLast = alphabet.length === rank + 1;
              const staticChar = alphabet.split('')[rank];

              return (
                <SubstitutionCell
                  key={rank} rank={rank} isLast={isLast}
                  staticChar={staticChar} editRank={rank}
                  pinned={pinned}
                  symbolsPerLetterMax={symbolsPerLetterMax}
                  symbolsLocked={symbolsLocked}
                  editableChar={editable} isLocked={locked} isHint={hint} isConflict={conflict}
                  isEditing={isEditing} isActive={isActive} highlighted={false}
                  onChangeChar={this.props.onChangeChar}
                  onChangeLocked={this.props.onChangeLocked}
                  onEditingStarted={this.props.onEditingStarted}
                  onEditingCancelled={this.props.onEditingCancelled}
                />
              );
            })}
          </div>
        </div>

        <div className="non-used-letters-container">
          <div>
            Symboles restants
          </div>
          <div className="non-used-letters">
            {nonUsedSymbols.length ? nonUsedSymbols.map((letter, index) => (
              <DraggableUnusedLetter key={index} letter={letter}/>
            )) : 'Aucune'}
          </div>
        </div>

        <div className="substitution-pin-link">
          <a onClick={() => this.props.onPinSubstitution(0)}>
            <FontAwesomeIcon icon={pinned ? 'times' : 'thumbtack'} />
          </a>
        </div>
      </div>
    );
  }
}