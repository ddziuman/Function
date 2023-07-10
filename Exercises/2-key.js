'use strict';

const generateKey = (length, possible) => {
  let key = '';
  let randomID = -1;
  for (let i = 0; i < length; i++) {
    randomID = Math.floor(possible.length * Math.random());
    key += possible[randomID];
  }
  return key;
};

module.exports = { generateKey };
