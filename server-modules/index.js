var {generate} = require("../bebras-modules/pemFioi/sentences_2");
var seedrandom = require("seedrandom");
var {shuffle} = require("shuffle");
var {range} = require("range");

/**
 * Default constants
 */

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const symbols = "^@&~#{}[]()|-\\_@^°+=$£%¨*µ!§:/;.,?abcdefghijklmnopqrstuvwxyz";

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
  let incorrectLine = null;

  for (let i = 0; i < clearTextLines.length; i++) {
    const line = clearTextLines[i];
    if (line === answerText[i]) {
      correctLines++;
    } else if (null === incorrectLine) {
      incorrectLine = [
        line,
        answerText[i],
      ];
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
    message =
      `Il y a ${clearTextLines.length - correctLines} ${clearTextLines.length - correctLines > 1 ? 'lignes différentes' : 'ligne différente'} entre votre texte déchiffré et le texte d'origine.`;
  }

  callback(null, {score, message});
};

/**
 * task methods
 */

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

  const clearWords = shuffledWords.slice(0, wordsCount);
  clearWords.sort();

  return clearWords;
}

const versions = {
  // For test only
  '0.1': {
    version: '0.1',
    clearTextLength: 30,
    symbolsPerLine: 19,
    extractedWordsCount: 40,
    symbolsPerLetterMax: 1,
    hints: false,
    frequencyAnalysis: false,
    explanation: 'Bienvenue sur ce sujet 2 ! Il est en cours de création',
  },

  1: {
    version: 1,
    clearTextLength: 400,
    symbolsPerLine: 19,
    extractedWordsCount: 40,
    symbolsPerLetterMax: 1,
    hints: false,
    frequencyAnalysis: false,
    explanation: 'Bienvenue sur ce sujet 2 ! Il est en cours de création',
  },
};

generateTaskData({
  params: {
    version: 1,
  },
  random_seed: 9,
});

// module.exports.generateTaskData =
function generateTaskData (task) {
  const version = task.params.version || 1;
  let {clearTextLength, symbolsPerLine, extractedWordsCount} = versions[version];

  const rng0 = seedrandom(task.random_seed + 16);

  const {substitution, symbols} = generateSubstitution(rng0, new Array(26).fill(1));

  const clearText = generate(rng0, clearTextLength, clearTextLength + 20, true);
  const clearTextLines = cutTextIntoLines(clearText, symbolsPerLine);

  const cipherText = applySubstitution(clearText, substitution, rng0);
  const cipherTextLines = cutTextIntoLines(cipherText, symbolsPerLine);

  const clearWords = extractWords(clearText, extractedWordsCount, rng0);

  const hintsRequested = getHintsRequested(task.hints_requested);

  let hints = grantHints(hintsRequested, clearText);

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
    version: versions[version]
  };

  const privateData = {
    clearText,
    clearTextLines,
  };

  console.log(publicData, privateData, substitution);

  return {publicData, privateData};
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
      return {rowIndex, position, value: clearTextLines[rowIndex].clearText.substring(position, position + 1), type};
    } else if (type === "type_2") {
      return {rowIndex, value: clearTextLines[rowIndex].clearText, type};
    }
  });
}
