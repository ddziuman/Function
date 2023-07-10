'use strict';

const ipToInt = (ip = '127.0.0.1') => {
  const shiftingIPV4 = (sum, current) => (sum << 8) + parseInt(current);
  return ip.split('.').reduce(shiftingIPV4, 0);
};

module.exports = { ipToInt };
