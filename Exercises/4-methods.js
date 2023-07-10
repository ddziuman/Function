'use strict';

const methods = (iface) => {
  const methodArray = [];
  for (const name in iface) {
    const prop = iface[name];
    if (!(typeof prop === 'function')) continue;
    methodArray.push([name, prop.length]);
  }
  return methodArray;
};

module.exports = { methods };
