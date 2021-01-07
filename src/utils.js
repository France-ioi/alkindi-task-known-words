import update from 'immutability-helper';

export function loadSubstitution (alphabet, initialValues) {
  const cells = new Array(alphabet.length).fill(-1);
  const $cells = [];
  cells.forEach((cell, cellIndex) => {
    $cells[cellIndex] = {
      rank: cellIndex,
      editable: initialValues && initialValues[cellIndex] ? initialValues[cellIndex] : [],
      conflict: false,
    };
  });

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

export function memoize (fn) {
  return function () {
    const args = JSON.stringify(arguments);
    fn.cache = fn.cache || {};
    return fn.cache[args] ? fn.cache[args] : (fn.cache[args] = fn.apply(this, arguments));
  };
}