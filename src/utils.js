import update from 'immutability-helper';

export function loadSubstitution (alphabet, initialValues) {
  const cells = new Array(alphabet.length).fill(-1);
  let $cells = [];
  if (initialValues) {
    $cells = initialValues;
  } else {
    cells.forEach((cell, cellIndex) => {
      $cells[cellIndex] = initialValues ? initialValues : {
        rank: cellIndex,
        editable: [],
        conflict: false,
      };
    });
  }

  let substitution = $cells;
  substitution = markSubstitutionConflicts(substitution);

  return substitution;
}

export function markSubstitutionConflicts (substitution) {
  const counts = new Map();
  const changes = {};
  for (let {rank, editable, conflict} of substitution) {
    if (conflict) {
      changes[rank] = {conflict: {$set: false}};
    }
    if (editable !== null) {
      if (!counts.has(editable)) {
        counts.set(editable, [rank]);
      } else {
        counts.get(editable).push(rank);
      }
    }
  }
  for (let ranks of counts.values()) {
    if (ranks.length > 1) {
      for (let rank of ranks) {
        changes[rank] = {conflict: {$set: true}};
      }
    }
  }

  return update(substitution, changes);
}

export function wrapAround (value, mod) {
  return ((value % mod) + mod) % mod;
}

export function wrapAroundLines (currentPosition, cellMove, lines) {
  let {rowIndex, position} = currentPosition;
  position += cellMove;
  while (position > lines[rowIndex].length - 1 || position < 0) {
    if (position > lines[rowIndex].length - 1) {
      position = wrapAround(position, lines[rowIndex].length);
      rowIndex++;
      if (rowIndex > lines.length - 1) {
        rowIndex = 0;
      }
    } else if (position < 0) {
      rowIndex--;
      if (rowIndex < 0) {
        rowIndex = lines.length - 1;
      }
      position = wrapAround(position, lines[rowIndex].length);
    }
  }

  return {rowIndex, position};
}

export function applySubstitutionToText (substitution, currentCipherText, alphabet, symbolsLocked) {
  let symbolValue = {};
  if (null !== substitution) {
    let i = 0;
    for (let cell of substitution) {
      for (let symbol of cell.editable) {
        symbolValue[symbol] = {
          letter: alphabet.substring(i, i+1),
          locked: symbolsLocked[symbol],
        };
      }
      i++;
    }
  }

  return currentCipherText.map(({value, locked}) => {
    if (null === value) {
      return {value, locked};
    }

    if (value in symbolValue) {
      const newLetter = symbolValue[value].letter;
      return {
        value: newLetter,
        locked: (true === locked || undefined === locked) && symbolValue[value].locked,
      };
    } else {
      return {
        value: null,
        locked: false,
      };
    }
  });
}

export function padArray (arr, len, fill) {
  return arr.concat(Array(len).fill(fill)).slice(0, len);
}

export function applyTranspositionToWords (transposition, words) {
  return words.map(word => {
    const letters = padArray(word, transposition.length, '');
    return letters.map((letter, index) => {
      return transposition[index] < word.length ? letters[transposition[index]] : '';
    }).filter(letter => '' !== letter);
  });
}

export function memoize (fn) {
  return function () {
    const args = JSON.stringify(arguments);
    fn.cache = fn.cache || {};
    return fn.cache[args] ? fn.cache[args] : (fn.cache[args] = fn.apply(this, arguments));
  };
}