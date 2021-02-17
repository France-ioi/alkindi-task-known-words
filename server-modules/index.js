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
  },

  1: {
    version: 1,
    clearTextLength: 400,
    symbolsPerLine: 27,
    extractedWordsCount: 40,
    symbolsCountToUse: 35,
    symbolsPerLetterMax: 3,
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
    workingArea: false,
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
    workingArea: false,
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
    workingArea: false,
  },
  '3.1': {
    version: '3.1',
    clearTextLength: 400,
    symbolsPerLine: 27,
    extractedWordsCount: 40,
    symbolsCountToUse: 33,
    symbolsPerLetterMax: 3,
    transposition: false,
  },
  '3.2': {
    version: '3.2',
    clearTextLength: 400,
    symbolsPerLine: 27,
    extractedWordsCount: 10,
    symbolsCountToUse: 33,
    symbolsPerLetterMax: 3,
    transposition: true,
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
    message = "Bravo, vous avez bien déchiffré le texte. ";
    if (false !== version.hints) {
      if (!hintsCost) {
        message += "Vous n'avez pas demandé d'indice.";
      } else {
        const asked = [];
        if (hints1Count) {
          asked.push(`${hints1Count} lettre${hints1Count > 1 ? "s" : ""}`);
        }
        if (hints2Count) {
          asked.push(`${hints2Count} ligne${hints2Count > 1 ? "s" : ""}`);
        }

        message += `Vous avez demandé la valeur de ${asked.join(' et ')} en indice, ce qui vous a coûté ${hintsCost} point${hintsCost > 1 ? 's' : ''}.`;
      }
    }
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
  let {clearMessage, clearMessageWords, clearTextLength, randomSeed, symbolsPerLine, extractedWordsCount, symbolsCountToUse, symbolsPerLetterMax, substitution: versionSubstitution, transposition} = versions[version];

  const rng0 = seedrandom(randomSeed ? randomSeed : task.random_seed + 16);

  const symbolsToUse = new Array(alphabet.length).fill(1);
  symbolsToUse[4] = 2; // E >= 2
  const secondFrequencyLetters = [0, 18, 8, 19]; // A, S, I, T >= 2
  const secondFrequencyLetter = secondFrequencyLetters[Math.floor(rng0() * secondFrequencyLetters.length)];
  symbolsToUse[secondFrequencyLetter] = 2;

  const symbolsUsedCount = symbolsToUse.reduce((agg, next) => agg + next, 0);
  for (let i = 0; i < (symbolsCountToUse - symbolsUsedCount); i++) {
    while (true) {
      const letter = Math.floor(rng0() * alphabet.length);
      if (symbolsToUse[letter] < symbolsPerLetterMax && (-1 === secondFrequencyLetters.indexOf(letter) || letter === secondFrequencyLetter)) {
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
    while (true) {
      clearText = generate(rng0, clearTextLength, clearTextLength + 100, true).trim();
      const words = clearText.split(' ');
      const wordLengths = words.map(word => word.length);
      let wordsByLength = {};
      for (let length of wordLengths) {
        if (!(length in wordsByLength)) {
          wordsByLength[length] = 0;
        }
        wordsByLength[length]++;
      }
      if ('3.1' !== version || (wordsByLength[5] >= 7 && wordsByLength[5] <= 9)) {
        break;
      }
    }
  }

  const words = clearText.split(' ');
  const longestWordLength = words.reduce((maxSize, next) => Math.max(maxSize, next.length), 0);

  const clearTextLines = cutTextIntoLines(clearText, symbolsPerLine);

  let cipherText = applySubstitution(clearText, substitution, rng0);

  if (transposition) {
    const generatedTransposition = shuffle({random: rng0, deck: range(0, longestWordLength)}).cards;
    cipherText = applyTransposition(cipherText, generatedTransposition);
  }

  const cipherTextLines = cutTextIntoLines(cipherText, symbolsPerLine);

  const clearWords = clearMessageWords && clearMessageWords.length ? clearMessageWords : extractWords(clearText, extractedWordsCount, version, rng0);
  clearWords.sort();

  const frequencyAnalysis = computeFrequencyAnalysis(clearText);

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
    frequencyAnalysis,
    version: versions[version]
  };

  const privateData = {
    clearText,
    clearTextLines,
  };

  console.log({randomSeed: task.random_seed});
  console.log(publicData, privateData);

  return {publicData, privateData};
}

function applyTransposition (clearText, transposition) {
  const words = clearText.split(' ');

  return words.map(word => {
    const exampleWord = range(0, word.length);

    const transpositionInverse = range(0, transposition.length)
      .filter(i => transposition[i] < exampleWord.length)
      .map(i => exampleWord[transposition[i]]);

    const letters = word.split('');

    return letters.map((letter, index) => {
      return letters[transpositionInverse.indexOf(index)];
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

function extractWords (text, wordsCount, version, rng0) {
  const words = text.split(' ');
  const shuffledWords = shuffle({random: rng0, deck: words}).cards;
  let wordsByLength = {};
  let longestWordLength = 0;
  for (let word of shuffledWords) {
    if (!(word.length in wordsByLength)) {
      wordsByLength[word.length] = [];
    }
    wordsByLength[word.length].push(word);
    longestWordLength = Math.max(longestWordLength, word.length);
  }

  // console.log({wordsByLength, longestWordLength});

  if ('3.1' === version) {
    const allWords = wordsByLength[5];

    return allWords.slice(0, allWords.length - 2);
  } else if ('3.2' === version) {
    let allWords = [];
    for (let [length, words] of Object.entries(wordsByLength)) {
      if (length >= 4 && words.length >= 3 && length <= longestWordLength - 4) {
        allWords = [...allWords, ...words];
      }
    }

    const shuffledAllWords = shuffle({random: rng0, deck: allWords}).cards;

    return shuffledAllWords.slice(0, wordsCount);
  } else {
    return shuffledWords.slice(0, wordsCount);
  }
}

function computeFrequencyAnalysis (clearText) {
  const reversedAlphabet = {};
  for (let i = 0; i < alphabet.length; i++) {
    reversedAlphabet[alphabet.substring(i, i + 1)] = i;
  }

  const frequencyAnalysis = alphabet.split('').map(() => 0);
  for (let j = 0; j < clearText.length; j++) {
    const letter = clearText.substring(j, j + 1);
    if (letter.trim().length) {
      frequencyAnalysis[reversedAlphabet[letter]]++;
    }
  }

  return frequencyAnalysis;
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
