// TODO WIP, to extract into library

type collection = {
  // e.g. user
  name: string
  map: Map<string, object>
  // e.g. users
  collection_name: string
  // e.g. User
  type: string
  // e.g. _id
  key_suffix: string
  // e.g. user_id
  key: string
  // e.g. UserNotFound
  not_found: string
  // e.g. author
  aliases: string[]
}
type collections = {
  [name: string]: Map<string, object> | Partial<collection>
}

function WordCase(s: string): string {
  return s.split('_').map(s => s[0].toUpperCase() + s.substr(1)).join('');
}

function snake_case(s: string): string {
  let res = '';
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if ('A' <= c && c <= 'Z') {
      res += '_' + c;
    } else {
      res += c;
    }
  }
  return res.replace(/^_/, '');
}

function to_collection(map_name: string, collection: Partial<collection>): collection {
  const name = map_name.endsWith('ies') ? map_name.replace(/ies$/, 'y') : map_name.replace(/s$/, '');
  const type = collection.type || WordCase(name);
  const key_suffix = collection.key_suffix || '_id';
  return {
    name,
    map: collection.map || new Map(),
    collection_name: collection.collection_name || map_name,
    type,
    key_suffix,
    key: snake_case(name) + key_suffix,
    not_found: collection.not_found || (WordCase(type) + 'NotFound'),
    aliases: collection.aliases || [],
  };
}

function combinations<T>(xs: T[]): T[][] {
  let xss: T[][] = [];
  let N = xs.length;
  let C = (1 << N);
  for (let i = 1; i < C; i++) {
    let ys: T[] = [];
    for (let j = 0; j < N; j++) {
      if (i & (1 << j)) {
        ys.push(xs[j]);
      }
    }
    xss.push(ys);
  }
  return xss;
}

function genGetsSignature(cs: collection[]): string {
  const lines: string[] = [];
  combinations(cs)
    .sort((a, b) => b.length - a.length)
    .forEach(cs =>
      lines.push(`function gets<T>(keys: { ${cs.map(c => `${c.key}: string`).join(', ')} }, f: (values: { ${cs.map(c => `${c.name}: ${c.type}`).join(', ')} }) => T): T | { Success: false, Reason: ${cs.map(c => `'${c.not_found}'`).join(' | ')} };`));
  return lines.join('\n  ');
}

function genCollections(collections: collections) {
  const cs: collection[] = [];
  for (const [name, value] of Object.entries(collections)) {
    cs.push((value instanceof Map) ? to_collection(name, { map: value }) : to_collection(name, value));
  }
  const valuesType = `{ ${cs.map(c => `${c.name}: ${c.type}`).join(', ')} }`;
  // prettier-ignore
  return `
${cs.map(({ not_found }) => `export const ${not_found}: { Success: false, Reason: '${not_found}' } = { Success: false, Reason: '${not_found}' };`).join('\n')}

export function wrapCollections(collections: {${cs.map(({ type, collection_name }) => `
  ${collection_name}: Map<string, ${type}>`).join('')}
}) {

  ${genGetsSignature(cs)}
  function gets<T>(keys: { ${cs.map(c => `${c.key}?: string`).join(', ')} }, f: (values: ${valuesType}) => T): T | { Success: false, Reason: ${cs.map(c => `'${c.not_found}'`).join(' | ')} } {
    const values: ${valuesType} = {} as any;
    for (let [key_name, key] of Object.entries(keys)) {
      key = key!;
      switch (key_name) {${cs.map(({ key, collection_name, not_found, aliases, key_suffix }) => `${aliases.map(alias => `
        case '${alias + key_suffix}':`).join('')}
        case '${key}': {
          let ${collection_name} = collections.${collection_name};
          if (!${collection_name}.has(key!)) {
            return ${not_found};
          }
          values.${key.replace(/_id$/, '')} = ${collection_name}.get(key)!;
          break;
        }`).join('')}
        default:
          throw new Error(\`undefined collection for key: '\${key_name}'\`)
      }
    }
    return f(values);
  }

  return {
    gets,
  };
}
`.trim();
}

// example
(function() {
  return `
type User = {}
type Post = {}
type Reply = {}

${genCollections({
    users: { map: new Map(), aliases: ['author'] },
    posts: new Map(),
    replies: new Map(),
  })}
`.trim();
})();
