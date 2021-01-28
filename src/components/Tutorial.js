import React from 'react';
import {TutorialCarousel} from '@france-ioi/react-task-lib';

export default class Tutorial extends React.PureComponent {
  render () {
    const props = this.props;
    const {category} = props;
    const versionId = String(props.version ? props.version.version : '');

    if ('ciphered' === category) {
      return <TutorialCarousel>
        {[
          <div key="step1">
            <p>
              Cet outil affiche l’ensemble du contenu du message chiffré.
            </p>
            <p>
              Le message d’origine est une phrase en français, en lettres majuscules non accentuées, dont on a retiré la ponctuation mais conservé les espaces.
            </p>
            {'2.1' === versionId && <p>
              Pour chiffrer le message, chaque lettre a été remplacée par le symbole correspondant dans la substitution.
            </p>}
            {('2.2' === versionId || '2.3' === versionId) && <p>
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
              Cet outil sert à déchiffrer le message. Chaque mot du texte est visualisé par trois lignes :
            </p>
            <ul>
              <li><strong>Chiffré :</strong> les symboles du message chiffré ;</li>
              <li><strong>Mots placés :</strong> un emplacement où vous pouvez placer un mot en le glissant depuis l’outil “Mots du clair” ;</li>
              <li><strong>Substitution :</strong> le résultat de l’application de votre substitution de déchiffrement (que vous pouvez définir dans l’outil Substitution en bas de la page).</li>
            </ul>
            <p>
              Votre objectif est de <strong>faire apparaître l’ensemble du message d’origine sur la troisième ligne</strong>.
            </p>
          </div>
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
            {('2.2' === versionId || '2.3' === versionId) && <div>
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
    }
  }
}
