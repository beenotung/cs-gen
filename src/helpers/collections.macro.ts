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

function expandAliases(cs: collection[]) {
  const xs: Array<{
    name: string
    type: string
    key: string
    not_found: string
  }> = [];
  cs.forEach(({ name, type, key_suffix, not_found, key, aliases }) => {
    xs.push({ name, type, key, not_found });
    aliases.forEach(alias => xs.push({ name: alias, type, key: alias + key_suffix, not_found }));
  });
  return xs;
}

function failType(reasons: string[]): string {
  reasons = Array.from(new Set(reasons));
  return `{ Success: false, Reason: ${reasons.map(s => `'${s}'`).join(' | ')} }`;
}

function genCollections(collections: collections) {
  const cs: collection[] = [];
  for (const [name, value] of Object.entries(collections)) {
    cs.push((value instanceof Map) ? to_collection(name, { map: value }) : to_collection(name, value));
  }
  const xs = expandAliases(cs);
  const valuesType = `{ ${xs.map(c => `${c.name}: ${c.type}`).join(', ')} }`;
  const combos = combinations(xs).sort((a, b) => b.length - a.length);
  // prettier-ignore
  return `
export const Duplicated : { Success: false, Reason: 'Duplicated' } = { Success: false, Reason: 'Duplicated' };
${cs.map(({ not_found }) => `export const ${not_found}: { Success: false, Reason: '${not_found}' } = { Success: false, Reason: '${not_found}' };`).join('\n')}

export function wrapCollections(collections: {${cs.map(({ type, collection_name }) => `
  ${collection_name}: Map<string, ${type}>`).join('')}
}) {
  ${cs.map(({ key, name, type, collection_name, not_found }) => `
  function get${WordCase(type)}<T>(${key}: string, f: (${name}: ${type}) => T): T | typeof ${not_found} {
    let ${collection_name} = collections.${collection_name};
    if (!${collection_name}.has(${key})) {
      return ${not_found}
    }
    return f(${collection_name}.get(${key})!);
  }
`).join('').trimRight()}
  ${combos.map(cs => `
  function gets<T>(keys: { ${cs.map(c => `${c.key}: string`).join(', ')} }, f: (values: { ${cs.map(c => `${c.name}: ${c.type}`).join(', ')} }) => T): T | ${failType(cs.map(c => c.not_found))};`).join('')}
  function gets<T>(keys: { ${xs.map(c => `${c.key}?: string`).join(', ')} }, f: (values: ${valuesType}) => T): T | ${failType(cs.map(c => c.not_found))} {
    const values: ${valuesType} = {} as any;
    for (let [key_name, key] of Object.entries(keys)) {
      key = key!;
      switch (key_name) {${cs.map(({ key, collection_name, not_found, aliases, key_suffix }) => `
        case '${key}':${aliases.map(alias => `
        case '${alias + key_suffix}':`).join('')} {
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
  ${combos.map(cs => `
  function sets<T>(values: { ${cs.map(c => `${c.name}: ${c.type}`).join(', ')} }, f: () => T): T | typeof Duplicated;`).join('')}
  function sets<T>(values: { ${xs.map(({ name, type }) => `${name}?: ${type}`).join(', ')} }, f: () => T): T | typeof Duplicated {
    // validate in batch for atomicity
    for (const [name, value] of Object.entries(values)) {
      switch (name) {${cs.map(({ name, collection_name, aliases, key, type }) => `
        case '${name}':${aliases.map(alias => `
        case '${alias}':`)} {
          let ${name} = value as ${type};
          let ${collection_name} = collections.${collection_name};
          if (${collection_name}.has(${name}.${key})) {
            return Duplicated;
          }
          break;
        }`).join('')}
        default:
          throw new Error(\`undefined collection for set: '\${name}'\`);
      }
    }
    // apply update in batch, so won't have partial update when something wrong in the middle of process
    for (const [name, value] of Object.entries(values)) {
      switch (name) {${cs.map(({ name, collection_name, aliases, key, type }) => `
        case '${name}':${aliases.map(alias => `
        case '${alias}':`)} {
          let ${name} = value as ${type};
          collections.${collection_name}.set(${name}.${key}, ${name});
          break;
        }`).join('')}
      }
    }
    return f();
  }

  return {${cs.map(c=>`
    get${WordCase(c.type)},`).join('')}
    gets,
    sets,
  };
}
`.trim();
}

// example
(function() {
  return `
type User = {
  user_id: string
  username: string
}
type Post = {
  post_id: string
  title: string
  content: string
}
type Reply = {
  reply_id: string
  author_id: string
  content: string
}

${genCollections({
    users: { map: new Map(), aliases: ['author'] },
    posts: new Map(),
    replies: new Map(),
  })}

class Core {
  users = new Map<string, User>();
  posts = new Map<string, Post>();
  replies = new Map<string, Reply>();

  constructor() {
    console.log('init core');
  }
}
let core = new Core();
let cs = wrapCollections(core);
[
  cs.gets({ user_id: 'Alice' }, ({ user }) => ({ user })),       // UserNotFound
  cs.sets({
    user: { user_id: 'Alice', username: 'alice' },
    post: { post_id: 'p1', title: 'ti', content: 'co' },
  }, () => 'registered Alice'),                                       // registered Alice
  cs.gets({ user_id: 'Alice' }, values => values.user.username), // alice
  cs.getPost('p1', post => post.title),                        // ti
].forEach(x => console.log(x));
`.trim();
})();
