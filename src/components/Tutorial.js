import React from 'react';
import {Row, Col} from 'react-bootstrap';
import {TutorialCarousel} from '@france-ioi/react-task-lib';

export default class Tutorial extends React.PureComponent {
  render () {
    const props = this.props;
    const {category} = props;
    const versionId = String(props.version ? props.version.version : '');
    const isRound2 = '2.' === versionId.substring(0, 2);

    if ('ciphered' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <p>
              Cet outil affiche l’ensemble du contenu du message chiffré.
            </p>
            {isRound2 && <p>
              Le message d’origine est une phrase en français, en lettres majuscules non accentuées, dont on a retiré la ponctuation mais conservé les espaces.
            </p>}
            {!isRound2 && <div>
              <p>
                Le message d’origine est une phrase en français produite par un générateur aléatoire, en lettres majuscules non accentuées, dont on a retiré la ponctuation mais conservé les espaces.
              </p>
              <p>
                Les phrases sont a priori grammaticalement correctes et constituées de mots correctement orthographiés, mais n’ont pas beaucoup de sens. Voici un exemple de phrase générée :
              </p>
              <p className="letter-cell" style={{fontSize: '16px'}}>
                LES ENTHOUSIASMANTS COURSIERS CIMENTAIENT CES LAURIERS
              </p>
            </div>}
            {'2.1' === versionId && <p>
              Pour chiffrer le message, chaque lettre a été remplacée par le symbole correspondant dans la substitution.
            </p>}
            {'3.2' === versionId && <p>
              Pour chiffrer le message, chaque lettre a été remplacée par le symbole correspondant dans la substitution, puis l’ordre des lettres a été modifié, en appliquant toujours la même règle (voir outil “Transposition”).
            </p>}
            {'2.1' !== versionId && '3.2' !== versionId && <p>
              Pour chiffrer le message, chaque lettre a été remplacée par un des symboles correspondants dans la substitution.
            </p>}
            <p>
              Les espaces ne sont pas chiffrés et correspondent aux espaces du texte d’origine.
            </p>
          </div>
        ]}
      </TutorialCarousel>;
    } else if ('deciphered' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <p>
              Cet outil sert à déchiffrer le message. Chaque mot du texte est visualisé par {isRound2 ? 'trois' : 'quatre'} lignes :
            </p>
            <ul>
              <li><strong>Chiffré :</strong> les symboles du message chiffré ;</li>
              <li><strong>Mots placés :</strong> un emplacement où vous pouvez placer un mot en le glissant depuis l’outil “Mots connus” ;</li>
              {'3.2' !== versionId && <li><strong>Substitution :</strong> le résultat de l’application de votre substitution de déchiffrement (que vous pouvez définir dans l’outil Substitution en bas de la page).</li>}
              {'3.2' === versionId && <li><strong>Résultat :</strong> le résultat de l’application de votre substitution de déchiffrement et de votre transposition de déchiffrement (que vous pouvez définir dans les outils en bas de la page).</li>}
              {!isRound2 && <li><strong>Réponse :</strong> la ligne où doit se trouver votre proposition de message déchiffré.</li>}
            </ul>
            <p>
              Votre objectif est de <strong>faire apparaître l’ensemble du message d’origine sur la {isRound2 ? 'troisième' : 'quatrième'} ligne</strong>.
            </p>
          </div>,
          ...(!isRound2 ? [<div key="step2">
            <h3>Éditer la réponse</h3>
            <p>
              Sur chaque ligne “Réponse”, vous pouvez cliquer sur une case, puis saisir au clavier la lettre qui selon vous, se trouve à cette position dans le message d'origine.
            </p>
            <p>
              Si vous ne mettez rien, la case contiendra automatiquement en gris, le résultat de l'application de la substitution, repris de la ligne précédente.
            </p>
            <p>
              C'est aussi sur cette ligne que seront affichés, en vert, les lettres que vous aurez obtenues en indice.
            </p>
          </div>] : []),
        ]}
      </TutorialCarousel>;
    } else if ('words' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <p>
              Cet outil vous montre un ensemble de mots qui sont présents dans le message d’origine.
            </p>
            <p>
              Vous pouvez :
            </p>
            <ul>
              <li>Cliquer sur un mot pour voir apparaître en vert tous les emplacements qui ont le même nombre de lettres que ce mot.</li>
              <li>Glisser un mot vers un emplacement de la bonne taille.</li>
            </ul>
            <p>
              Notez qu’une fois que vous avez placé un mot, vous pouvez le déplacer vers un autre emplacement, ou bien le retirer.
            </p>
            <p>
              Les mots déjà placés apparaissent en gris ci-dessous.
            </p>
          </div>
        ]}
      </TutorialCarousel>;
    } else if ('substitution' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <p>
              Cet outil vous permet de définir votre substitution de déchiffrement.
            </p>
            {'2.1' === versionId && <div>
              <p>
                Sous chaque lettre de l’alphabet, vous pouvez glisser le symbole qui doit être déchiffré en cette lettre. Pour cela, glissez un symbole depuis la liste des symboles restants. Vous pouvez aussi le retirer en le glissant vers la liste des symboles restants, ou le placer sous une autre lettre.
              </p>
              <p>
                Vous pouvez cliquer sur un cadenas pour le fermer et indiquer ainsi que vous êtes sûrs de vous pour une lettre donnée. Le contenu d’une case dont le cadenas est fermé ne peut pas être modifié. Dans l’outil déchiffrement, toutes les lettres dont le cadenas est fermé apparaissent en gris. Vous pouvez cliquer de nouveau sur un cadenas pour le réouvrir.
              </p>
            </div>}
            {('2.1' !== versionId) && <div>
              <p>
                Sous chaque lettre de l’alphabet, vous pouvez glisser le (ou les) symboles qui doivent être déchiffrés en cette lettre. Pour cela, glissez un symbole depuis la liste des symboles restants. Vous pouvez aussi le retirer en le glissant vers la liste des symboles restants, ou le placer sous une autre lettre.
              </p>
              <p>
                Si vous êtes sûrs de vous pour un certain symbole, vous pouvez cliquer sur le cadenas qui se trouve en dessous. Une bulle apparaît alors sur le côté, qui vous permet de bloquer (cadenas fermé) ou débloquer (cadenas ouvert) ce symbole. Le contenu d’une case dont le cadenas est fermé ne peut pas être modifié. Par ailleurs, dans l’outil déchiffrement, toutes les lettres dont le cadenas est fermé apparaissent en gris.
              </p>
            </div>}
          </div>
        ]}
      </TutorialCarousel>;
    } else if ('working-area' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <p>
              L’outil plan de travail est un espace sur lequel vous pouvez placer des mots connus et des mots chiffrés, en les faisant glisser depuis l'outil "mots connus", et depuis la zone du bas. Retirez un mot du plan de travail en glissant ce mot vers l'extérieur.
            </p>
            <p>
              Dans cet outil, les mots chiffrés sont présentés sur deux lignes. La première contient le mot chiffré lui-même, et la deuxième correspond au contenu de votre réponse, à savoir la même chose que la quatrième ligne dans l'outil "déchiffrement".
            </p>
            <p>
              Notez que lorsque vous sélectionnez un mot dans l'outil "mots connus", tous les mots chiffrés de la même longueur sont colorés en vert.
            </p>
          </div>
        ]}
      </TutorialCarousel>;
    } else if ('frequency-analysis' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <h3>Principe de l’analyse de fréquence</h3>
            <p>
              En français, certaines lettres apparaissent plus souvent que d’autres.
              La lettre E est la lettre la plus fréquente. Elle représente environ 15% des lettres d’un texte en français typique
              (15% signifie que parmi 100 lettres d’un message en français 15 sont sûrement des E). La lettre Z est beaucoup plus
              rare, elle correspond à 0.15% des lettres.
            </p>
            <p>
              Dans un long texte chiffré par substitution, la version chiffrée du E représente donc environ 15% des lettres du texte chiffré,
              et est ainsi assez facilement reconnaissable. Par exemple, si la substitution remplace la lettre E par la lettre G,
              alors on trouvera environ 15% de G dans le message chiffré.
            </p>
          </div>,
          <div key="step2">
            <h3>Description de l'outil</h3>
            <p>
              Dans la partie du haut, on vous présente la liste de symboles présents dans le texte chiffré, par ordre décroissant de nombre d'occurrences dans ce texte.
            </p>
            <p>
              <img src={require('~/tutorial_frequency_description.png')} style={{width: '200px'}}/>
            </p>
            <p>
              Au-dessus, une barre d'histogramme visualise ce nombre. Sa valeur exacte, à savoir le nombre de fois où le symbole est présent dans le texte, est affichée au-dessus de la barre.
            </p>
          </div>,
          <div key="step3">
            <h3>Symboles regroupés</h3>
            <Row>
              <Col>
                <p>
                  Lorsque dans votre substitution, vous avez indiqué que plusieurs symboles représentent la même lettre, ces symboles sont réunis en une seule barre qui représente leur nombre total d'occurrences.
                </p>
                <p>
                  Cliquer sur la barre d’histogramme permet de voir le détail de leur répartition.
                </p>
              </Col>
              <Col xs="auto">
                <img src={require('~/tutorial_frequency_symbols.png')} style={{width: '100px'}}/>
              </Col>
            </Row>
          </div>,
          <div key="step4">
            <h3>Fréquences dans le clair</h3>
            <p>
              Dans la partie du bas, on vous présente de la même manière, les lettres du clair, avec pour chacune, le nombre exact d'occurrences de la lettre au sein du texte non chiffré (qu'on appelle le clair).
            </p>
            <p>
              Les lettres sont présentées par ordre décroissant de ce nombre d'occurrences.
            </p>
            <p>
              Lorsque vous avez complété correctement la substitution, la zone des fréquences dans le clair doit donc correspondre exactement à celle des fréquences dans le texte chiffré. Bien sûr, avoir une telle correspondance ne veut pas dire que vous avez la bonne substitution.
            </p>
          </div>
        ]}
      </TutorialCarousel>;
    } else if ('transposition' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <h3>Transposition</h3>
            <p>
              Chaque mot du message a été chiffré par transposition, c'est-à-dire que l'on a changé l'ordre de ses lettres, selon une règle bien précise.
            </p>
            <p>
              Pour les remettre dans l'ordre, vous devez définir une transposition de déchiffrement, c'est-à-dire une manière de réordonner les lettres.
            </p>
          </div>,
          <div key="step2">
            <h3>Modifier la transposition</h3>
            <p>
              La transposition est représentée par deux lignes de cases, où chaque case de la ligne du haut est reliée à une case de la ligne du bas.
            </p>
            <p>
              La ligne du haut représente les lettres dans leur ordre initial, et la ligne du bas, ces mêmes lettres dans leur nouvel ordre.
            </p>
            <p className="is-centered">
              <img src={require('~/tutorial_transposition_modify.png')} style={{width: '400px'}}/>
            </p>
            <p>
              Pour changer cet ordre, faites glisser les cases de la ligne du bas vers la gauche ou la droite.
            </p>
            <p>
              Les boutons sur le côté droit vous permettent d'annuler ou refaire une étape, si vous faites une fausse manipulation.
            </p>
          </div>,
          <div key="step3">
            <h3>Appliquer à un mot</h3>
            <p>
              Cliquez sur un mot chiffré dans l'outil "Déchiffrement", pour visualiser l'application de votre transposition à ce mot.
            </p>
            <p>
              Le mot chiffré apparaît alors au-dessus de la ligne de cases du haut. Les lettres correspondantes sont affichées dans les cases, telles que vous les avez indiquées dans votre substitution, et les lettres inconnues représentées par des "_".
            </p>
            <p className="is-centered">
              <img src={require('~/tutorial_transposition_apply.png')} style={{width: '400px'}}/>
            </p>
            <p>
              Dans la ligne du bas de la transposition, le nouvel ordre est présenté, mais il peut contenir des cases vides (espaces), correspondant aux cases situées après la fin du mot, mais qui se retrouvent placées avant certaines des lettres.
            </p>
            <p>
              Pour finaliser l'application de la transposition, ces cases vides sont retirées. Les étapes de l'application sont présentées en bas de l'outil.
            </p>
          </div>,
        ]}
      </TutorialCarousel>;
    }
  }
}
