import React from 'react';

export default class DecipheredTextCell extends React.PureComponent {
  render () {
    let {value, ciphered, hint, cellWidth, editing} = this.props;

    const columnStyle = {
      float: 'left',
      width: Number(cellWidth) + 'px',
    };

    return (
      <div
        className={`letter-cell deciphered-clear-cell ${hint ? 'is-hint' : (value ? 'is-value' : 'is-ciphered')} ${ciphered === ' ' ? 'is-space' : ''}`}
        onClick={this.startEditing}
        style={columnStyle}
      >
        <div className="deciphered-clear-cell-inside">
          {editing
            ? <input ref={this.refInput} onChange={this.cellChanged} onKeyDown={this.keyDown} onBlur={this.blur}
                     type='text' value={value || ''} style={{width: cellWidth + 'px', height: '20px', textAlign: 'center', padding: '0', outline: '0', border: 'none', background: 'transparent'}} />
            : (hint || value || ciphered || '\u00A0')}
        </div>
      </div>
    );
  }

  componentDidUpdate () {
    if (this._input) {
      this._input.select();
      this._input.focus();
    }
  }
  keyDown = (event) => {
    let handled = true;
    if (event.key === 'ArrowRight') {
      this.props.onEditingMoved(this.props.rowIndex, this.props.position, 1);
    } else if (event.key === 'ArrowLeft') {
      this.props.onEditingMoved(this.props.rowIndex, this.props.position, -1);
    } else if (event.key === 'Escape' || event.key === 'Enter') {
      this.props.onEditingCancelled();
    } else if (event.key === 'Backspace') {
      this.props.onChangeChar(this.props.rowIndex, this.props.position, '');
      this.props.onEditingMoved(this.props.rowIndex, this.props.position, -1);
    } else if (event.key === 'Delete') {
      this.props.onChangeChar(this.props.rowIndex, this.props.position, '');
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  endEditing = () => {
    this.props.onEditingCancelled();
  };
  startEditing = () => {
    const {hint, position, ciphered, rowIndex} = this.props;
    if (ciphered === undefined || ' ' === ciphered) {
      return;
    }

    if (hint) {
      this.endEditing();
    } else {
      this.props.onEditingStarted(rowIndex, position);
    }
  };
  cellChanged = () => {
    const value = this._input.value.substr(-1); /* /!\ IE compatibility */
    this.props.onChangeChar(this.props.rowIndex, this.props.position, value);
  };
  blur = (event) => {
    if (event.relatedTarget && event.relatedTarget.tagName.toLocaleLowerCase() === 'button') {
      return;
    }
    this.props.onEditingCancelled();
  };
  refInput = (element) => {
    this._input = element;
  };
}