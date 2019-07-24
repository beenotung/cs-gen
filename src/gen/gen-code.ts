import { groupBy } from '@beenotung/tslib/functional';
import { genTsType } from 'gen-ts-type';
import { CallMeta } from '../types';
import { PartialCallMeta } from '../utils';

export function formatString(s: string): string {
  return '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`';
}

export function removeTailingSpace(s: string): string {
  return s
    .split('\n')
    .map(s => s.trimRight())
    .join('\n');
}

function removeTsExtname(s: string): string {
  return s.replace(/\.ts$/, '');
}

function getTypeFileImportPath(args: {
  typeDirname: string;
  typeFilename: string;
}) {
  const { typeDirname, typeFilename } = args;
  return `'../${typeDirname}/${removeTsExtname(typeFilename)}'`;
}

export function genModuleCode(args: {
  moduleClassName: string;
  serviceFilename: string;
  serviceClassName: string;
  controllerFilename: string;
  controllerClassName: string;
}) {
  const {
    moduleClassName,
    serviceFilename,
    serviceClassName,
    controllerFilename,
    controllerClassName,
  } = args;
  return `
import { Module } from '@nestjs/common';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';
import { LogService } from 'cqrs-exp';
import * as path from 'path';
import { ${controllerClassName} } from './${removeTsExtname(
    controllerFilename,
  )}';

@Module({
  controllers: [${controllerClassName}],
  providers: [${serviceClassName}, { provide: LogService, useValue: new LogService(path.join('data', 'log')) }],
})
export class ${moduleClassName} {
}
`.trim();
}

export function genServiceCode(args: {
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  callTypes: CallMeta[];
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  logicProcessorCode: string;
}) {
  const {
    callTypeName,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    serviceClassName,
    logicProcessorDirname,
    logicProcessorFilename,
    logicProcessorClassName,
    logicProcessorCode,
    callTypes,
  } = args;
  const code = `
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ${[
    callTypeName,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    ...callTypes.map(call => call.Type),
  ].sort().join(`,
  `)}
} from ${getTypeFileImportPath(args)};
import { ${logicProcessorClassName} } from '../${logicProcessorDirname}/${removeTsExtname(
    logicProcessorFilename,
  )}';
import { CallInput } from 'cqrs-exp';

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

@Injectable()
export class ${serviceClassName} {
  impl = new ${logicProcessorClassName}();

  ${callTypeName}<C extends ${callTypeName}>(args: CallInput<C>): C['Out'] {
    const { CallType, Type, In } = args;
    const _type = Type as ${callTypeName}['Type'];
    let method: (In: C['In']) => C['Out'];
    switch (_type) {
      ${callTypes
        .map(({ CallType, Type }) =>
          CallType === subscribeTypeName
            ? `case '${Type}': {
        const m: (In: C['In']) => { id: string } = this.${Type};
        method = m as any;
        break;
      }
      `
            : `case '${Type}':
        method = this.${Type};
        break;
      `,
        )
        .join('')
        .trim()}
      default:
        const x: never = _type;
        console.log('not implemented call type:', x);
        throw new HttpException('not implemented call type:' + x, HttpStatus.NOT_IMPLEMENTED);
    }
    method = method.bind(this);
    // TODO validate input
    const res = method(In);
    ${
      /**
       * TODO auto save result
       * for Command, store the output to event table
       * for Query, count the query type and timestamp
       * for Subscribe, store the id to a session manager (or do nothing?)
       * */
      `// TODO save the result`
    }
    return res;
  }

  ${callTypes
    .map(
      ({ CallType, Type }) => `${Type}(In: ${Type}['In']): ${
        CallType === subscribeTypeName ? '{ id: string }' : `${Type}['Out']`
      } {
    ${
      logicProcessorCode.includes(Type)
        ? `return this.impl.${Type}(In);`
        : `return not_impl('${Type}');`
    }
  }

  `,
    )
    .join('')
    .trim()}
}
`;
  return code.trim();
}

export function genStatusCode(args: { statusName: string }) {
  const { statusName } = args;
  return `
export let ${statusName} = {
  isReplay: true,
};
`.trim();
}

export function genControllerCode(args: {
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  commandTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  serviceApiPath: string;
  callApiPath: string;
  statusFilename: string;
  statusName: string;
}) {
  const {
    callTypeName,
    commandTypeName,
    serviceClassName,
    serviceFilename,
    serviceApiPath,
    callApiPath,
    controllerClassName,
    statusName,
    statusFilename,
  } = args;
  const serviceObjectName =
    serviceClassName[0].toLowerCase() + serviceClassName.substring(1);
  return `
import * as path from 'path';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { ${callTypeName} } from ${getTypeFileImportPath(args)};
import { CallInput, LogService } from 'cqrs-exp';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';
import { Bar } from 'cli-progress';
import { usePrimus } from '../main';
import { ok, rest_return } from 'nestlib';
import {
  closeConnection,
  endSparkCall,
  newConnection,
  startSparkCall,
} from './connection';
import { ${statusName} } from './${removeTsExtname(statusFilename)}';

@Controller('${serviceApiPath}')
export class ${controllerClassName} {
  logService: LogService;
  ready: Promise<void>;

  constructor(
    public ${serviceObjectName}: ${serviceClassName},
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    this.ready = this.restore();
  }

  async restore() {
    const keys = await this.logService.getKeys();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    ${statusName}.isReplay = true;
    bar.start(keys.length, 0);
    for (const key of keys) {
      if (!key.endsWith('-${commandTypeName}')) {
        bar.increment(1);
        continue;
      }
      const call: CallInput<${callTypeName}> = await this.logService.getObject<${callTypeName}>(key);
      if (call.CallType !== '${commandTypeName}') {
        bar.increment(1);
        continue;
      }
      try {
        this.${serviceObjectName}.${callTypeName}(call);
      } catch (e) {
        console.error(\`failed when call '\${call.CallType}' '\${call.Type}':\`, e);
      }
      bar.increment(1);
    }
    ${statusName}.isReplay = false;
    bar.stop();
    usePrimus(primus => {
      primus.on('connection', spark => {
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('${callApiPath}', async (call: CallInput<${callTypeName}>, ack) => {
          startSparkCall(spark, call);
          try {
            await this.ready;
            await this.logService.storeObject(call, this.logService.nextKey() + '-' + call.CallType);
            const out = this.${serviceObjectName}.${callTypeName}<${callTypeName}>(call);
            ack(out);
          } catch (e) {
            console.error(e);
            ack({
              error: e.toString(),
              response: e.response,
              status: e.status,
              message: e.message,
            });
          } finally {
            endSparkCall(spark, call);
          }
        });
      });
    });
  }

  @Post('${callApiPath}')
  async ${callApiPath}<C extends ${callTypeName}>(
    @Res() res,
    @Body() call: CallInput<C>,
  ): Promise<C['Out']> {
    await this.ready;
    await this.logService.storeObject(call, this.logService.nextKey() + '-' + call.CallType);
    try {
      const out = this.coreService.Call<C>(call);
      ok(res, out);
      return out;
    } catch (e) {
      return rest_return(res, Promise.reject(e));
    }
  }
}
`.trim();
}

export function genCallTypeCode2(args: {
  callTypes: CallMeta[];
  callTypeName: string;
}): string {
  const { callTypeName } = args;
  let { callTypes } = args;
  callTypes = callTypes.filter(c => c.CallType === callTypeName);
  return `
${callTypes.map(({ CallType, Type, In, Out }) =>
  `
export interface ${Type} {
  CallType: '${CallType}';
  Type: '${Type}';
  In: ${In};
  Out: ${Out};
}
`.trim(),
).join(`
`)}
export type ${callTypeName} = ${callTypes.map(({ Type }) => Type).join(' | ')};
`.trim();
}

export function genCallTypeCode(args: {
  callTypes: CallMeta[];
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
}): string {
  const {
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    callTypeName,
    callTypes,
  } = args;
  const callTypesMap = groupBy(t => t.CallType, callTypes);
  const commandTypes = callTypesMap.get(commandTypeName) || [];
  const queryTypes = callTypesMap.get(queryTypeName) || [];
  const subscribeTypes = callTypesMap.get(subscribeTypeName) || [];
  const code = `
${[
  { typeName: commandTypeName, types: commandTypes },
  { typeName: queryTypeName, types: queryTypes },
  { typeName: subscribeTypeName, types: subscribeTypes },
]
  .map(
    ({ typeName, types }) => `${types
      .map(
        ({ CallType, Type, In, Out }) => `
export type ${Type} = {
  CallType: '${CallType}';
  Type: '${Type}',
  In: ${In},
  Out: ${Out},
};`,
      )
      .join('')}

export type ${typeName} = ${types.map(({ Type }) => Type).join(' | ') ||
      'never'};
`,
  )
  .join('')}
export type ${callTypeName} = ${commandTypeName} | ${queryTypeName} | ${subscribeTypeName};

function checkCallType(t: {
  CallType: '${commandTypeName}' | '${queryTypeName}' | '${subscribeTypeName}';
  Type: string;
  In: any;
  Out: any;
}) {
    /* static type check only */
}

checkCallType({} as ${callTypeName});
`;
  return code.replace(/\n\n\n\n/g, '\n\n').trim();
}

export function genTypeCode(name: string, demo: any): string {
  return `
/** Example of ${name}:
${JSON.stringify(demo, null, 2)}
 */
export type ${name} = ${genTsType(demo)};
`.trim();
}

function insert(
  content: string,
  insertPattern: string,
  insertContent: string,
): string {
  const i = content.indexOf(insertPattern);
  if (i === -1) {
    throw new Error('failed to locate ' + JSON.stringify(insertPattern));
  }
  return content.substring(0, i) + insertContent + content.substring(i);
}

export function genMainCode(originalCode: string): string {
  if (originalCode.includes('attachServer')) {
    return originalCode;
  }
  let newCode = insert(
    originalCode,
    'async function bootstrap',
    `import { Server } from 'http';

const Primus = require('primus');
let primus;

let pfs: Array<(primus) => void> = [];

export function usePrimus(f: (primus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}

function attachServer(server: Server) {
  const primus_options = {
    pathname: '/primus',
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  };

  primus = new Primus(server, primus_options);
  primus.plugin('emitter', require('primus-emitter'));
  // primus.save('primus.js');
  pfs.forEach(f => f(primus));

  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
  });
}

`,
  );
  newCode = insert(
    newCode,
    'await app.listen',
    `attachServer(app.getHttpServer());
  `,
  );
  return newCode.trim();
}

function firstCharToLowerCase(s: string): string {
  if (s.length < 1) {
    throw new Error('expect non-empty string');
  }
  return s[0].toLowerCase() + s.substring(1);
}

export function genClientLibCode(args: {
  typeDirname: string;
  typeFilename: string;
  apiDirname: string;
  apiFilename: string;
  serviceApiPath: string;
  serviceClassName: string;
  callApiPath: string;
  callTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  timestampFieldName: string;
  injectTimestampOnClient: boolean;
}): string {
  const {
    typeDirname,
    typeFilename,
    apiDirname,
    serviceApiPath,
    serviceClassName,
    callApiPath,
    callTypeName,
    subscribeTypeName,
    callTypes,
    timestampFieldName,
    injectTimestampOnClient,
  } = args;
  const serviceObjectName = firstCharToLowerCase(serviceClassName);

  const relativeDir =
    apiDirname === typeDirname
      ? '.'
      : './' +
        apiDirname
          .split('/')
          .map(s => (s === '.' || s === '..' ? s : '..'))
          .join('/') +
        `/${typeDirname}`;
  const typeFilePath = `'${relativeDir}/${removeTsExtname(typeFilename)}'`;

  const wrapInType = (Type: string) =>
    injectTimestampOnClient
      ? `Omit<${Type}['In'], '${timestampFieldName}'> & { ${timestampFieldName}?: number }`
      : `${Type}['In']`;

  const inPropCode = injectTimestampOnClient
    ? `In: { ...In, ${timestampFieldName}: In.${timestampFieldName} || Date.now() }`
    : 'In';

  const code = `
import { Body, Controller, injectNestClient, Post, setBaseUrl } from 'nest-client';
import {
  ${[
    `${callTypeName} as CallType`,
    `${subscribeTypeName} as SubscribeType`,
    ...callTypes.map(call => call.Type),
  ].sort().join(`,
  `)},
} from ${typeFilePath};

let primus;
let pfs: Array<(primus) => void> = [];

export function usePrimus(f: (primus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}

export interface CallInput<C extends CallType> {
  CallType: C['CallType'];
  Type: C['Type'];
  In: C['In'];
}

let ${serviceObjectName}: ${serviceClassName};

@Controller('${serviceApiPath}')
export class ${serviceClassName} {
  constructor(baseUrl: string) {
    setBaseUrl(baseUrl);
    injectNestClient(this);
  }

  @Post('${callApiPath}')
  async ${callApiPath}<C extends CallType>(
    @Body() body: CallInput<C>,
  ): Promise<C['Out']> {
    return undefined;
  }
}

export function startPrimus(baseUrl: string) {
  if (typeof window === 'undefined') {
    ${serviceObjectName} = new ${serviceClassName}(baseUrl);
    return;
  }
  const w = window as any;
  primus = new w.Primus(baseUrl);

  pfs.forEach(f => f(primus));
  pfs = [];

  primus.on('close', () => {
    console.log('disconnected with server');
  });
  primus.on('open', () => {
    console.log('connected with server');
  });

  return primus;
}

export function ${callTypeName}<C extends CallType>(
  CallType: C['CallType'],
  Type: C['Type'],
  In: ${wrapInType('C')},
): Promise<C['Out']> {
  const callInput: CallInput<C> = {
    CallType,
    Type,
    ${inPropCode},
  };
  if (${serviceObjectName}) {
    return ${serviceObjectName}.${callApiPath}<C>(callInput);
  }
  return new Promise((resolve, reject) => {
    usePrimus(primus => {
      primus.send('Call', callInput, data => {
        if ('error' in data) {
          reject(data);
          return;
        }
        resolve(data);
      });
    });
  });
}
${callTypes
  .filter(c => c.CallType !== subscribeTypeName)
  .map(
    ({ CallType, Type }) => `
export function ${Type}(In: ${wrapInType(Type)}): Promise<${Type}['Out']> {
  return Call<${Type}>('${CallType}', '${Type}', In);
}
`,
  )
  .join('')}
export interface SubscribeOptions<T> {
  onError: (err) => void
  onEach: (Out: T) => void
}

export interface SubscribeResult {
  cancel: () => void
}

export function ${subscribeTypeName}<C extends SubscribeType>(
  Type: C['Type'],
  In: ${wrapInType('C')},
  options: SubscribeOptions<C['Out']>,
): SubscribeResult {
  if (coreService) {
    throw new Error('${subscribeTypeName} is not supported on node.js client yet');
  }
  const callInput: CallInput<C> = {
    CallType: '${subscribeTypeName}',
    Type,
    ${inPropCode},
  };
  let cancelled = false;
  const res: SubscribeResult = { cancel: () => cancelled = true };
  usePrimus(primus => {
    primus.send('${callTypeName}', callInput, data => {
      if ('error' in data) {
        options.onError(data);
        return;
      }
      if (cancelled) {
        return;
      }
      const { id } = data;
      primus.on(id, data => {
        if (!cancelled) {
          options.onEach(data);
        }
      });
      res.cancel = () => {
        cancelled = true;
        primus.send('CancelSubscribe', { id });
      };
    });
  });
  return res;
}
${callTypes
  .filter(({ CallType }) => CallType === subscribeTypeName)
  .map(
    ({ Type }) => `
export function ${Type}(
  In: ${wrapInType(Type)},
  options: SubscribeOptions<${Type}['Out']>,
): SubscribeResult {
  return ${subscribeTypeName}<${Type}>('${Type}', In, options);
}`,
  )
  .join('')}
`;
  return code.trim();
}

export function genConnectionCode(): string {
  return `
import { CallInput } from 'cqrs-exp';

export interface Spark {
  id: string;

  on(event: string, cb: (data: any, ack?: (data: any) => void) => void);

  send(event: string, data?: any, ack?: (data: any) => void);
}

export interface Subscription {
  id: string;

  close();
}

export interface Session {
  spark: Spark;
  calls: CallInput[];
  // channel id -> Subscription
  subscriptions: Map<string, Subscription>;
}

let sparkId_session_map: Map<string, Session> = new Map();
let in_session_map = new Map<any, Session>();

export function getAllSession() {
  return sparkId_session_map.values();
}

export function newConnection(spark: Spark) {
  sparkId_session_map.set(spark.id, {
    spark,
    calls: [],
    subscriptions: new Map(),
  });
}

export function closeConnection(spark: Spark) {
  let session = sparkId_session_map.get(spark.id);
  session.subscriptions.forEach(sub => sub.close());
  sparkId_session_map.delete(spark.id);
}

export function startSparkCall(spark: Spark, call: CallInput) {
  let session = sparkId_session_map.get(spark.id);
  session.calls.push(call);
  in_session_map.set(call.In, session);
}

export function getSessionByIn(In): Session {
  return in_session_map.get(In);
}

export function getSessionBySparkId(sparkId: string): Session {
  return sparkId_session_map.get(sparkId);
}

/**
 * @remark inplace update
 * @return original array
 * */
function remove<A>(xs: A[], x: A): void {
  const idx = xs.indexOf(x);
  if (idx !== -1) {
    xs.splice(idx, 1);
  }
}

export function endSparkCall(spark: Spark, call: CallInput) {
  const session = sparkId_session_map.get(spark.id);
  remove(session.calls, call);
  in_session_map.delete(call.In);
}
`.trim();
}

export function genDocumentationHtmlCode(args: {
  baseProjectName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
}) {
  const {
    baseProjectName,
    callTypes,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
  } = args;

  const commandTypes: PartialCallMeta[] = callTypes.filter(
    x => x.CallType === commandTypeName,
  );
  const queryTypes: PartialCallMeta[] = callTypes.filter(
    x => x.CallType === queryTypeName,
  );
  const subscribeTypes: PartialCallMeta[] = callTypes.filter(
    x => x.CallType === subscribeTypeName,
  );

  const title = `${baseProjectName} APIs`;

  const formatApis = (prefix: string, name: string, calls: PartialCallMeta[]) =>
    `<h2>${name} APIs</h2>
${prefix}<ul>${calls
      .map(
        call => `
${prefix}  <li><a href="#${call.Type}">${call.Type}</a></li>`,
      )
      .join('')}
${prefix}</ul>`;

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <meta name="format-detection" content="telephone=no">
  <meta name="msapplication-tap-highlight" content="no">
  <style>
    #content {
      display: flex;
      flex-direction: row;
    }
    @media only screen
    and (orientation: portrait) {
      #content {
        flex-direction: column;
      }
    }
    #content > * {
      flex-grow: 1;
    }
    code {
      white-space: pre-wrap;
      font-size: large;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div id="content">
    <nav>
      ${formatApis('      ', commandTypeName, commandTypes)}
      ${formatApis('      ', queryTypeName, queryTypes)}
      ${formatApis('      ', subscribeTypeName, subscribeTypes)}
    </nav>
    <noscript><span style="color: red">Javascript is required to show type of In and Out<span></noscript>
    <div>
      <h3>In</h3>
      <code id="in"></code>
    </div>
    <div>
      <h3>Out</h3>
      <code id="out"></code>
    </div>
  </div>
<script>
window.onhashchange=function(){
  var Type = window.location.hash.substr(1);
  var In;
  var Out;
  switch (Type) {
    ${callTypes
      .map(
        ({ Type, In, Out }) => `case '${Type}': {
      In = ${removeTailingSpace(formatString(In))};
      Out = ${removeTailingSpace(formatString(Out))};
      break;
    }
    `,
      )
      .join('')
      .trim()}
    default:
      console.error('unknown Type:', Type);
  }
  document.getElementById('in').textContent = In;
  document.getElementById('out').textContent = Out;
};
</script>
</body>
</html>
`.trim();
}
