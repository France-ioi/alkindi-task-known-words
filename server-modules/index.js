var {generate} = require("../bebras-modules/pemFioi/sentences_2");
var seedrandom = require("seedrandom");
var {shuffle} = require("shuffle");
var {range} = require("range");

/**
 * Default constants
 */

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const symbols = "^@&#{}[]()|-°+=$£%¨*µ!€:/;.,?abcdefghijklmnopqrstuvwxyz";

/**
 * Versions configuration
 */

const versions = {
  // For test only
  '0.1': {
    version: '0.1',
    clearTextLength: 10,
    symbolsPerLine: 27,
    extractedWordsCount: 40,
    symbolsPerLetterMax: 1,
    frequencyAnalysis: false,
    explanation: 'Bienvenue sur ce sujet 2 ! Il est en cours de création',
  },

  1: {
    version: 1,
    clearTextLength: 400,
    symbolsPerLine: 27,
    extractedWordsCount: 40,
    symbolsPerLetterMax: 1,
    frequencyAnalysis: false,
    explanation: 'Bienvenue sur ce sujet 2 ! Il est en cours de création',
  },

  '2.1': {
    version: '2.1',
    randomSeed: 1,
    //clearMessage: "J AI COURS D AIKIDO CETTE SEMAINE AVEC LE PROFESSEUR QUI A DES CHEVEUX ROSES",
    //clearMessageWords: ["J", "AI", "COURS", "D", "AIKIDO", "CETTE", "SEMAINE", "AVEC", "LE", "PROFESSEUR", "QUI", "A", "DES", "CHEVEUX", "ROSES"],
    // Proposition Mélissa:
    clearMessage: "ALICE VA CONTACTER SECRETEMENT NOS PARTENAIRES AMERICAINS POUR LA NOUVELLE MISSION",
    clearMessageWords: ["NOUVELLE", "CONTACTER", "SECRETEMENT", "PARTENAIRES", "AMERICAINS",   "MISSION"],
    symbolsPerLine: 27,
    substitution: [['('], [')'], ['|'], ['-'], ['°'], ['+'], ['='], ['$'], ['£'], ['%'], ['¨'], ['*'], ['µ'], ['!'], ['€'], [':'], ['/'], [';'], ['^'], ['@'], ['&'], ['#'], ['{'], ['}'], ['['], [']']],
    symbolsPerLetterMax: 1,
    hints: false,
    frequencyAnalysis: false,
    clearTextLine: false,
    transposition: false,
    explanation: "Un message a été chiffré par une substitution : chaque lettre est remplacée par un symbole. On connaît une liste de mots qui sont présents dans le message. Retrouvez l'intégralité du message. Vous pouvez glisser les mots connus dans la zone de déchiffrement. Un outil vous permet d'éditer la substitution de déchiffrement.",
  },
  '2.2': {
    version: '2.2',
    randomSeed: 1,
    // clearMessage: "TOUS LES LANGAGES ONT UNE ECRITURE OU LES SYMBOLES DE L ALPHABET POUR CHAQUE SON SYLLABE OU MOT PAR EXEMPLE EN ESPAGNOL CHAQUE SON EST UN SYMBOLE EN JAPONAIS KANAS ALORS QUE L ECRITURE CHINOISE EST SEMANTIQUE",
    // clearMessageWords: [ "ESPAGNOL", "ECRITURE", "SYMBOLES", "LANGAGES", "JAPONAIS", "CHINOISE", "ALPHABET", "KANAS"],
    // Proposition Mélissa:
    clearMessage: "NE GOUTEZ RIEN DE CE QUI VOUS SERA PROPOSE AU BANQUET LES ENNEMIS ONT AJOUTE DU POISON VOUS TROUVEREZ VOTRE CONTACT A L EXTERIEUR",
    clearMessageWords: ["ENNEMIS", "TROUVEREZ", "CONTACT", "BANQUET", "AJOUTE", "GOUTEZ"],
    symbolsPerLine: 27,
    substitution: [['^', '.'], ['@'], ['&'], ['#'], ['{','j'], ['}'], ['['], [']'], ['('], [')'], ['|'], ['-'], ['°'], ['+','a'], ['='], ['$'], ['£'], ['%','4'], ['¨'], ['*'], ['µ'], ['!'], ['€'], [':'], ['/'], [';']],
    symbolsPerLetterMax: 2,
    hints: false,
    frequencyAnalysis: false,
    clearTextLine: false,
    transposition: false,
    explanation: 'Dans ce sujet, la substitution est poly-alphabétique (un à deux symboles par lettre).',
  },
  '2.3': {
    version: '2.3',
    randomSeed: 22,
    // clearMessage: "J AI COURS D AIKIDO CETTE SEMAINE AVEC LE PROFESSEUR QUI A DES CHEVEUX ROSES",
    // Proposition Mélissa:
    clearMessage: "LE CONTENU DE VOTRE PROCHAINE MISSION SE TROUVE DERRIERE LA PORTE A L ENTREE DU MUSEE DES BEAUX ARTS IL FAUT Y ALLER DE NUIT POUR NE PAS SE FAIRE REPERER",
    clearMessageWords: ["MUSEE", "ALLER", "VOTRE", "FAIRE"],
    symbolsPerLine: 27,
    substitution: [['^', '.'], ['-'], ['°'], ['+'], ['=','h','p'], ['$'], ['£'], ['%'], ['¨'], ['*'], ['µ'], ['!','m','s'], ['€'], [':'], ['/'], [';'], ['@'], ['&','c'], ['#'], ['{','v'], ['}'], ['['], [']'], ['('], [')'], ['|']],
    symbolsPerLetterMax: 3,
    hints: false,
    frequencyAnalysis: false,
    clearTextLine: false,
    transposition: false,
    explanation: 'Dans ce sujet, la substitution est poly-alphabétique (chaque lettre peut correspondre à 1 à 3 symboles).',
  },
};

/**
 * task module export...
 */

/* prefer JSON config file at project root?  depend on NODE_ENV? */
module.exports.config = {
  cache_task_data: false
};

module.exports.taskData = function (args, callback) {
  const {publicData} = generateTaskData(args.task);
  callback(null, publicData);
};

module.exports.requestHint = function (args, callback) {
  const request = args.request;
  const hints_requested = args.task.hints_requested
    ? JSON.parse(args.task.hints_requested)
    : [];
  for (let hintRequest of hints_requested) {
    if (hintRequest === null) {
      continue;
    }
    if (typeof hintRequest === "string") {
      hintRequest = JSON.parse(hintRequest);
    }
    if (hintRequestEqual(hintRequest, request)) {
      return callback(new Error("hint already requested"));
    }
  }
  callback(null, args.request);
};

module.exports.gradeAnswer = function (args, task_data, callback) {
  const {
    privateData: {clearTextLines},
    publicData: {version},
  } = generateTaskData(args.task);

  const {
    answerText
  } = JSON.parse(args.answer.value);

  let correctLines = 0;
  let hasIncorrectLines = false;
  for (let i = 0; i < clearTextLines.length; i++) {
    const line = clearTextLines[i];
    let incorrect = false;
    let missing = false;
    for (let k = 0; k < line.length; k++) {
      if (answerText[i].substring(k, k+1).trim().length) {
        if (line.substring(k, k+1) !== answerText[i].substring(k, k+1)) {
          incorrect = true;
        }
      } else if (line.substring(k, k+1).trim().length) {
        missing = true;
      }
    }

    if (!missing && !incorrect) {
      correctLines++;
    } else {
      if (incorrect) {
        hasIncorrectLines = true;
      }
    }
  }

  const hintsRequested = getHintsRequested(args.answer.hints_requested);

  const hints1Count = (hintsRequested.filter(h => h.type === 'type_1')).length || 0;
  const hints2Count = (hintsRequested.filter(h => h.type === 'type_2')).length || 0;

  let score;
  let message;

  if (correctLines === clearTextLines.length) {
    const hintsCost = (hints1Count * 1) + (hints2Count * 10);
    score = Math.max(0, 100 - hintsCost);
    message = `Bravo, vous avez bien déchiffré le texte. ${false !== version.hints ? `Vous avez demandé la valeur de ${hints1Count} lettre${hints1Count > 1 ? "s" : ""}
      et de ${hints2Count} ligne${hints2Count > 1 ? "s" : ""} en indice, ce qui vous a coûté ${hintsCost} points.` : ''}`;
  } else {
    score = 0;
    if (hasIncorrectLines) {
      message = `Votre réponse contient au moins une erreur, c'est-à-dire au moins une lettre qui est différente entre votre texte déchiffré et le texte d'origine.`;
    } else {
      message = `Il manque au moins une lettre dans votre réponse.`;
    }
  }

  callback(null, {score, message});
};

/**
 * task methods
 */

function generateTaskData (task) {
  const version = task.params.version || 1;
  let {clearMessage, clearMessageWords, clearTextLength, randomSeed, symbolsPerLine, extractedWordsCount, symbolsCountToUse, symbolsPerLetterMax, substitution: versionSubstitution} = versions[version];

  const rng0 = seedrandom(randomSeed ? randomSeed : task.random_seed + 16);

  const symbolsToUse = new Array(alphabet.length).fill(1);
  for (let i = 0; i < (symbolsCountToUse - alphabet.length); i++) {
    while (true) {
      const letter = Math.floor(rng0() * alphabet.length);
      if (symbolsToUse[letter] < symbolsPerLetterMax) {
        symbolsToUse[letter]++;
        break;
      }
    }
  }

  let substitution, symbols;
  if (versionSubstitution) {
    substitution = versionSubstitution;
    symbols = versionSubstitution.reduce((cur, next) => [...cur, ...next], []);
    symbols = shuffle({random: rng0, deck: symbols}).cards.join('');
  } else {
    let substitutionResult = generateSubstitution(rng0, symbolsToUse);
    substitution = substitutionResult.substitution;
    symbols = substitutionResult.symbols;
  }

  let clearText;
  if (clearMessage && clearMessage.length) {
    clearText = clearMessage;
  } else {
    clearText = generate(rng0, clearTextLength, clearTextLength + 100, true).trim();
  }

  const words = clearText.split(' ');
  const longestWordLength = words.reduce((maxSize, next) => Math.max(maxSize, next.length), 0);

  const clearTextLines = cutTextIntoLines(clearText, symbolsPerLine);

  const cipherTextSubstitution = applySubstitution(clearText, substitution, rng0);

  const transposition = shuffle({random: rng0, deck: range(0, longestWordLength)}).cards;
  const cipherText = applyTransposition(cipherTextSubstitution, transposition);

  const cipherTextLines = cutTextIntoLines(cipherText, symbolsPerLine);

  const clearWords = clearMessageWords && clearMessageWords.length ? clearMessageWords : extractWords(clearText, extractedWordsCount, rng0);
  clearWords.sort();

  const hintsRequested = getHintsRequested(task.hints_requested);

  let hints = grantHints(hintsRequested, clearTextLines);

  // if (freeHintRows && freeHintRows.length) {
  //   const newHints = [];
  //   for (let i = 0; i < freeHintRows.length; i++) {
  //     newHints.push({rowIndex: freeHintRows[i], value: clearTextLines[i].clearText, type: 'type_3'});
  //   }
  //   hints = hints.concat(newHints);
  // }

  const publicData = {
    alphabet,
    cipherText,
    cipherTextLines,
    symbols,
    hints,
    clearWords,
    longestWordLength,
    version: versions[version]
  };

  const privateData = {
    clearText,
    clearTextLines,
  };

  console.log(publicData, privateData);

  return {publicData, privateData};
}

function applyTransposition (clearText, transposition) {
  const words = clearText.split(' ');

  return words.map(word => {
    const letters = word.padEnd(transposition.length).split('');

    return letters.map((letter, index) => {
      return transposition[index] < word.length ? letters[transposition[index]] : '';
    }).join('');
  }).join(' ');
}

function applySubstitution (data, substitution, rng0) {
  return data.split('').map(letter => {
    if (' ' === letter) {
      return letter;
    }

    const position = alphabet.indexOf(letter);
    if (-1 === position) {
      throw 'Letter not found in alphabet: ' + letter;
    }

    const availableSymbols = substitution[position];
    const newPosition = Math.floor(rng0() * availableSymbols.length);

    return availableSymbols[newPosition];
  }).join('');
}

function generateSubstitution (rng0, symbolsByLetter) {
  const totalSymbolsToUse = symbolsByLetter.reduce((current, next) => current + next, 0);
  const shuffledSymbols = shuffle({random: rng0, deck: symbols.split('').slice(0, totalSymbolsToUse)}).cards;
  let symbolsIndex = 0;

  const substitution = range(0, alphabet.length).map((letterRank) => {
    const symbols = shuffledSymbols.slice(symbolsIndex, symbolsIndex + symbolsByLetter[letterRank]);
    symbolsIndex += symbolsByLetter[letterRank];

    return symbols;
  });

  return {
    substitution,
    symbols: symbols.substring(0, totalSymbolsToUse),
  };
}

function cutTextIntoLines (text, symbolsPerLine) {
  const words = text.split(' ');
  const lines = [];

  for (let word of words) {
    let currentLine = lines[lines.length - 1];
    if (lines.length && currentLine.length + word.length + 1 <= symbolsPerLine) {
      lines[lines.length - 1] += ' ' + word;
    } else {
      lines.push(word);
    }
  }

  return lines;
}

function extractWords (text, wordsCount, rng0) {
  const words = text.split(' ');
  const shuffledWords = shuffle({random: rng0, deck: words}).cards;

  return shuffledWords.slice(0, wordsCount);
}

function hintRequestEqual (h1, h2) {
  return (
    h1.type === h2.type
    && h1.rowIndex === h2.rowIndex
    && h1.position === h2.position
  );
}

function getHintsRequested (hints_requested) {
  return (hints_requested
    ? JSON.parse(hints_requested)
    : []
  )
    .filter(hr => hr !== null)
    .map(hint => (typeof hint === "string") ? JSON.parse(hint) : hint);
}

function grantHints (hintRequests, clearTextLines) {
  return hintRequests.map((hintRequest) => {
    let {rowIndex, position, type} = hintRequest;

    if (type === "type_1") {
      return {rowIndex, position, value: clearTextLines[rowIndex].substring(position, position + 1), type};
    } else if (type === "type_2") {
      return {rowIndex, value: clearTextLines[rowIndex], type};
    }
  });
}
