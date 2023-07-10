'use strict';

const merge = (
  // Distinct merge miltiple arrays
  ...args // array of array
  // Returns: array
) => {
  const array = args[0]; // the 1 array, taking as base?
  for (let i = 1; i < args.length; i++) {
    const arr = args[i];
    for (let j = 0; j < arr.length; j++) {
      const val = arr[j];
      if (!array.includes(val)) array.push(val);
    }
  }
  return array;
};

const section = (
  // Splits string by the first occurrence of separator
  s, // string
  separator // string, or char
  // Example: rsection('All you need is JavaScript', 'is')
  // Returns: ['All you need ', ' JavaScript']
) => {
  const i = s.indexOf(separator);
  if (i < 0) return [s, ''];
  return [s.slice(0, i), s.slice(i + separator.length)];
};

const SCALAR_TYPES = ['string', 'number', 'boolean', 'undefined'];
const OBJECT_TYPES = ['function', 'array', 'object', 'null', 'symbol'];
const META_TYPES = ['char', 'hash', 'record', 'set', 'map'];
const ALL_TYPES = merge(SCALAR_TYPES, OBJECT_TYPES, META_TYPES);

const FUNC_TERMS = [') {', ') => {', ') => ('];
const NAMED_LINES = ['Example:', 'Returns:', 'Hint:', 'Result:'];

const findParameterBlockEnding = (functionStr) => {
  return FUNC_TERMS.map(functionStr.indexOf, functionStr)
  .filter((index) => index !== -1)
  .reduce((minimal, current) => current < minimal ? current : minimal, functionStr.length);
}

const parseCommentLine = (line, signature) => {
  line = line.replace(/^\/\/ /, '').trim(); 
  if (NAMED_LINES.find((s) => line.startsWith(s))) {
    const [name, comment] = section(line, ': ');
    signature.comments.push({ name, comment });
  } else if (signature.parameters.length === 0) {
    if (signature.description.length > 0) {
      signature.description += '\n';
    }
    signature.description += line;
  } else {
    const par = last(signature.parameters);
    par.comment += '\n' + line;
  }
}

const parseParameterLine = (line, signature) => {
  const [name, text] = section(line, ': ');
  let [type, comment] = section(text, ', ');
  if (!ALL_TYPES.find((s) => type.startsWith(s))) {
    comment = type;
    type = '';
  }
  signature.parameters.push({ name, type, comment });
}

const parseLines = (s, signature) => {
  let lines = s.split('\n');
  lines.pop();
  signature.title = (lines.shift() || '').replace('//', '').trim();
  lines = lines.map((line) => line.trim().replace(/^(.*) \/\//, '$1:').replace(',:', ':'));
  for (const line of lines) {
    if (line.startsWith('//')) {
      parseCommentLine(line, signature);
    } else {
      parseParameterLine(line, signature);
    }
  }
}

const introspectMethod = (method) => {
  const signature = {
    method: '', title: '', description: '',
    parameters: [], comments: [],
  };
  let s = method.toString();
  let pos = findParameterBlockEnding(s); // '...) {'
  if (pos !== -1) {
    s = s.substring(0, pos);
    pos = s.indexOf('\n');
    s = s.substring(pos + 1);
    parseLines(s, signature);
  }
  return signature;
}

const moduleIntrospector = (moduleName) => (module) => {
  const introspectedModule = {};
  for (const method in module) {
    introspectedModule[method] = introspectMethod(module[method]);
    introspectedModule[method].method = moduleName + '.' + method;
  }
  return introspectedModule;
}

const introspect = (namespace) => {
  const inventory = {};
  for (const name in namespace) {
    const introspectCurrentModule = moduleIntrospector(name);
    inventory[name] = introspectCurrentModule(namespace[name]);
  }
  return inventory;
}

const badIntrospect = (
  // Introspect interface
  namespace // hash of interfaces
  // Returns: hash of hash of record, { method, title, parameters }
) => {
  const inventory = {}; // introspection result?
  for (const name in namespace) { // for every module name in namespace
    const iface = namespace[name]; // take the module as 'iface'
    const methods = {}; // module methods inited?
    inventory[name] = methods; // bind the module introspected methods to result
    for (const method in iface) { // for every method name inside current module of namespace
      const fn = iface[method]; // take each method value and put it in 'fn'
      const signature = { // introspected version of the method (initialized)
        title: '', description: '',
        parameters: [], comments: []
      };
      let s = fn.toString();
      let pos = FUNC_TERMS.map(indexing(s)) // find index of the beginning of function block like ') {'
        .filter((k) => k !== -1) // e.g. [-1, -1, 16]  ==> [16]
        .reduce((prev, cur) => (prev < cur ? prev : cur), s.length); // intuitively easier to write 'cur < prev ? cur : prev' instead!
      if (pos !== -1) {
        s = s.substring(0, pos); // взять всю заднюю часть "сигнатуры" до блоков ') {', ') => {'...
        pos = s.indexOf('\n'); // предыдущий индекс перед блоком параметров функции, e.g. '...(\n'
        s = s.substring(pos + 1); // взять подстроку от начала блока параметров до его конца (\n)
        console.log(`s начало блока параметров до ') {':\n${s}`);
        let lines = s.split('\n'); // разбить то что вышло по строкам (и комменты, и параметры, и сама функция)
        lines.pop(); // убрали конец '' (пустая строка после последнего перехода \n)
        signature.title = (lines.shift() || '').replace('//', '').trim(); // parse the title from the 1 line (replace-trim combo of clearing unnecessary symbols!)
        console.dir(lines);
        lines = lines.map(                                // for multiple arguments (extra ',' should be removed)
          (d) => d.trim().replace(/^(.*) \/\//, '$1:').replace(',:', ':') // first capturing group === (.*?), then backreference to it is '$1'. 
        );
        console.dir(lines);
        for (let line of lines) {
          // case when line is a key-comment ('returns', 'example', etc.)
          if (line.startsWith('//')) {
            line = line.replace(/^\/\/ /, '').trim(); // remove unnecessary '// ' from the beginning of comment line
            if (NAMED_LINES.find((s) => line.startsWith(s))) { // known comment type (returns, example)
              const [name, comment] = section(line, ': ');
              signature.comments.push({ name, comment });
            } else if (signature.parameters.length === 0) { // unknown comment type, but 0 paramters == add comment to description
              if (signature.description.length > 0) {
                signature.description += '\n';
              }
              signature.description += line;
            } else { // unknown comment type, but there are > 0 of parameters === add whole comment line to the last parameter 'comment' field
              const par = last(signature.parameters);
              par.comment += '\n' + line;
            }
          } else { // case when line is a parameter
            const [name, text] = section(line, ': '); // name of parameter + parameter type description
            let [type, comment] = section(text, ', '); // parameter type + extra type comment 
            if (!ALL_TYPES.find((s) => type.startsWith(s))) { // valid type: then type + comment, invalid: then only comment
              comment = type;
              type = '';
            }
            signature.parameters.push({ name, type, comment }); // push the parameter introspection from the current line 
          }
        }
      }
      methods[method] = Object.assign({
        method: name + '.' + method
      }, signature);
    }
  }
  return inventory;
};


const iface = { common: { merge, section } };
const introspection = introspect(iface);
console.dir(introspection, { depth: 5 });