'use strict';

const random = (min, max) => {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(min + (max - min + 1) * Math.random());
};

module.exports = { random };
