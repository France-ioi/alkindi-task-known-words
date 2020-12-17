import {range} from "range";
import {SubstitutionCell} from "./SubstitutionCell";
import React from "react";
import {DraggableUnusedLetter} from "./DraggableUnusedLetter";

export default class SubstitutionEditView extends React.PureComponent {
  render () {
    const {alphabet, substitution, editing, nonUsedLetters, pinned} = this.props;

    return (
      <div style={{marginTop: "10px", position: 'relative'}}>
        <div style={{width: "100%", position: "relative"}}>
          <div className="substitution-letters">
            {range(0, alphabet.length).map(rank => {
              const {editable, locked, conflict, hint} = substitution.cells[rank];
              const isActive = false;
              const isEditing = editing.cellRank === rank && editing.pinned === pinned && !locked && !hint;
              const isLast = alphabet.length === rank + 1;
              const staticChar = alphabet.split('')[rank];

              return (
                <SubstitutionCell
                  key={rank} rank={rank} isLast={isLast}
                  staticChar={staticChar} editRank={rank}
                  pinned={pinned}
                  editableChar={editable} isLocked={locked} isHint={hint} isConflict={conflict}
                  isEditing={isEditing} isActive={isActive} highlighted={false}
                  onChangeChar={this.props.onChangeChar}
                  onChangeLocked={this.props.onChangeLocked}
                  onEditingStarted={this.props.onEditingStarted}
                  onEditingCancelled={this.props.onEditingCancelled}
                  onEditingMoved={this.props.onEditingMoved}
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
            {nonUsedLetters.length ? nonUsedLetters.map((letter, index) => (
              <DraggableUnusedLetter key={index} letter={letter}/>
            )) : 'Aucune'}
          </div>
        </div>

        {/*<div className="substitution-pin-link">*/}
        {/*  <a onClick={() => this.props.onPinSubstitution()}>*/}
        {/*    <FontAwesomeIcon icon={pinned ? 'times' : 'thumbtack'} />*/}
        {/*  </a>*/}
        {/*</div>*/}
      </div>
    );
  }
}