/* name -> type */
const typeMap = new Map<string, string>();

export function setTsType(name: string, type: string): void {
  typeMap.set(name, type);
}

export function getTsType(
  o: any,
  format = false,
  currentIndent = '',
  indentStep = '  ',
): string {
  const type = typeof o;
  switch (type) {
    case 'string':
      if (typeMap.has(o)) {
        return typeMap.get(o);
      }
      return type;
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
    case 'undefined':
      return type;
    case 'object':
      if (Array.isArray(o)) {
        if (o.length < 1) {
          throw new TypeError('cannot determine type of empty array');
        }
        return `Array<${getTsType(o[0])}>`;
      } else {
        if (format) {
          const innerIndent = currentIndent + indentStep;
          let res = currentIndent + '{';
          Object.entries(o).forEach(([k, v]) => {
            res +=
              '\n' +
              innerIndent +
              JSON.stringify(k) +
              ': ' +
              getTsType(v, format, innerIndent, indentStep) +
              ';';
          });
          res += '\n' + currentIndent + '}';
          return res;
        }
        return `{ ${Object.entries(o)
          .map(([k, v]) => `${JSON.stringify(k)}: ${getTsType(v)}`)
          .join('; ')} }`;
      }
    default:
      console.error('unknown type', { type, o });
      throw new TypeError('unknown type: ' + type);
  }
}
