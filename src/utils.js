import update from 'immutability-helper';

export function loadSubstitution (alphabet, initialValues) {
  const cells = new Array(alphabet.length).fill(-1);
  const $cells = [];
  cells.forEach((cell, cellIndex) => {
    $cells[cellIndex] = {
      rank: cellIndex,
      editable: initialValues && initialValues[cellIndex] ? initialValues[cellIndex] : null,
      locked: false,
      conflict: false,
    };
  });

  let substitution = {
    alphabet,
    cells: $cells,
  };
  substitution = markSubstitutionConflicts(alphabet, substitution);

  return substitution;
}

export function editSubstitutionCell (alphabet, substitution, rank, symbol) {
  substitution = update(substitution, {cells: {[rank]: {editable: {$set: symbol}}}});

  return markSubstitutionConflicts(alphabet, substitution);
}

export function lockSubstitutionCell (substitution, rank, locked) {
  return update(substitution, {cells: {[rank]: {locked: {$set: locked}}}});
}

function markSubstitutionConflicts (alphabet, substitution) {
  const counts = new Map();
  const changes = {};
  for (let {rank, editable, conflict} of substitution.cells) {
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

  return update(substitution, {cells: changes});
}

export function applySubstitutions (substitutions, rank) {
  const result = {rank, locks: 0, trace: []};

  for (let substitution of substitutions) {
    applySubstitution(substitution, result);
  }

  return result;
}

export function wrapAround (value, mod) {
  return ((value % mod) + mod) % mod;
}

export function applySubstitution (substitution, result) {
  let rank = result.rank, cell;
  cell = substitution.cells[rank];
  rank = substitution.backward[rank];
  result.rank = rank;
  if (cell) {
    result.trace.push(cell);
    if (cell.locked) {
      result.locked = true;
    }
    if (cell.hint) {
      result.isHint = true;
    }
    if (cell.isConflict) {
      result.isConflict = true;
    }
  }
}

export function applySubstitutionToText (substitution, currentCipherText, alphabet) {
  return currentCipherText.map(({value, locked}) => {
    if (null === value) {
      return {value, locked};
    }

    const position = alphabet.indexOf(value);
    if (-1 === position) {
      throw 'Letter not found in alphabet: ' + value;
    }

    const cell = substitution.cells[position];
    if (cell.editable) {
      const newLetter = cell.editable;
      return {
        value: newLetter,
        locked: (true === locked || undefined === locked) && cell.locked,
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