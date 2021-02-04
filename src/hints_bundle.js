import React from 'react';
import {Button, Modal} from 'react-bootstrap';
import {connect} from 'react-redux';

class Hint1View extends React.PureComponent {
    render () {
        const {hintRequest: {isActive}, hintCellRequestData} = this.props;

        return (
            <div className="hint-element">
                <p>
                    {"Pour un coût de "}
                    <span style={{fontWeight: "bold"}}>{'1 point'}</span>
                    {
                        ", cliquez sur une case de la rangée du bas d'une ligne de texte, et validez pour la déchiffrer."
                    }
                </p>
                <div style={{textAlign: "center", margin: "10px 0"}}>
                    <Button onClick={() => this.props.requestHint(hintCellRequestData)} disabled={!hintCellRequestData || isActive}>{`Valider`}</Button>
                </div>
            </div>
        );
    }
}

class Hint2View extends React.PureComponent {
    constructor (props) {
        super(props);
        this.state = {index: ""};
    }
    render () {
        const {hintRequest: {isActive}, hintLineRequestData} = this.props;

        return (
            <div className="hint-element">
                <p>
                    {"Pour un coût de "}
                    <span style={{fontWeight: 'bold'}}>{'10 points'}</span>
                    {
                        ", cliquez sur une case de la rangée du bas d'une ligne de texte et validez pour déchiffrer "
                    }
                    <span style={{fontWeight: 'bold'}}>la ligne entière</span>
                    {"."}
                </p>
                <div style={{textAlign: "center", margin: "10px 0", paddingTop: '10px'}}>
                    <Button onClick={() => this.props.requestHint(hintLineRequestData)} disabled={!hintLineRequestData || isActive}>{`Valider`}</Button>
                </div>
            </div>
        );
    }
}

function HintSelector (state) {
    const {
        actions: {requestHint, hintRequestFeedbackCleared, decipheredCellEditCancelled},
        decipheredText: {lines},
        hintRequest,
        editingDecipher,
    } = state;
    let hintCellRequestData = null;
    let hintLineRequestData = null;

    if (editingDecipher && typeof editingDecipher.rowIndex === 'number') {
        const isHint =
            lines[editingDecipher.rowIndex] &&
            lines[editingDecipher.rowIndex].deciphered[editingDecipher.position].hint;

        if (!isHint) {
            hintCellRequestData = {
                type: 'type_1',
                ...editingDecipher,
            };
            hintLineRequestData = {
                type: 'type_2',
                rowIndex: editingDecipher.rowIndex,
            };
        }
    }

    return {
        requestHint,
        hintRequestFeedbackCleared,
        decipheredCellEditCancelled,
        hintRequest,
        hintCellRequestData,
        hintLineRequestData,
    };
}

class Hints extends React.PureComponent {
    constructor (props) {
        super(props);
        this.state = {
            modalShow: false,
            hintRequest: null,
        };
    }

    render () {
        return (
            <div className="hints-container">
                <Modal
                  show={this.state.modalShow}
                  onHide={() => this.setModalShow(false)}
                  size="lg"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Confirmation
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                       Êtes-vous sûr de vouloir prendre cet indice ? Il vous coûtera <strong>{this.state.hintRequest && 'type_2' === this.state.hintRequest.type ? '10 points' : '1 point'}</strong>.
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => this.setModalShow(false)}>Annuler</Button>
                        <Button variant="primary" onClick={() => this.confirmRequestHint()}>Confirmer</Button>
                    </Modal.Footer>
                </Modal>
                <Hint1View {...this.props} requestHint={this.requestHint}/>
                <Hint2View {...this.props} requestHint={this.requestHint}/>
            </div>
        );
    }

    requestHint = (request) => {
        this.setModalShow(true);
        this.setState({
            hintRequest: request,
        });
    };

    confirmRequestHint = () => {
        const {dispatch, requestHint, decipheredCellEditCancelled} = this.props;
        this.setModalShow(false);
        dispatch({type: requestHint, payload: {request: this.state.hintRequest}});
        dispatch({type: decipheredCellEditCancelled});
    }

    setModalShow = (modalShow) => {
        this.setState({
            modalShow,
        });
    };
}

export default {
    views: {
        Hints: connect(HintSelector)(Hints)
    },
};
