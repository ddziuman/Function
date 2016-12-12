'use strict';

function inc(a) {
  return ++a;
}

let sum = function(a, b) {
  return a + b;
};

let max = (a, b) => {
  return a > b ? a : b;
};

console.log('Names: ');
console.dir({
  inc: inc.name,
  sum: sum.name,
  max: max.name,
});

console.log('Argumants: ');
console.dir({
  inc: inc.length,
  sum: sum.length,
  max: max.length
});

console.log('Anonymous function: ' + function(x) { return x; }.name);
console.log('Anonymous lambda' + (x => x).name);

console.log('toString: ');
console.dir({
  inc: inc.toString(),
  sum: sum.toString(),
  max: max.toString()
});
