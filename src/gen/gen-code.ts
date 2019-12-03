import { groupBy } from '@beenotung/tslib/functional';
import { genTsType } from 'gen-ts-type';
import { check_app_id } from '../helpers/gen-project-helpers';
import { CallMeta } from '../types';
import { Constants, PartialCallMeta, TypeAlias } from '../utils';

export type GenProjectPlugins = {
  auth?: {
    ImportFile: string;
    MethodAuthCall: string;
    MethodAuthSubscribe: string;
    MethodCheckAppId: string;
    AttemptPrefix: string;
    AuthPrefix: string;
  };
};

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
  subscribeTypeName: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  logicProcessorCode: string;
  asyncLogicProcessor: boolean;
  plugins: GenProjectPlugins;
  check_app_id: string;
}) {
  const {
    callTypeName,
    subscribeTypeName,
    serviceClassName,
    logicProcessorDirname,
    logicProcessorFilename,
    logicProcessorClassName,
    logicProcessorCode,
    callTypes,
    asyncLogicProcessor,
    plugins,
  } = args;
  const { auth } = plugins;
  const async_import_type = asyncLogicProcessor ? ', Result' : '';
  const async_type = (type: string) =>
    asyncLogicProcessor ? `Result<${type}>` : type;
  const genMethodBody = (call: { CallType: string; Type: string }): string => {
    const { CallType, Type } = call;
    const code = logicProcessorCode.includes(Type)
      ? `return impl.${Type}(In);`
      : `return not_impl('${Type}');`;
    if (auth) {
      if (
        Type.length > auth.AttemptPrefix.length &&
        Type.startsWith(auth.AttemptPrefix)
      ) {
        // auto call CheckToken, then call store and call Auth version call
        return `return ${
          CallType === subscribeTypeName
            ? auth.MethodAuthSubscribe
            : auth.MethodAuthCall
        }(${JSON.stringify(CallType)}, ${JSON.stringify(Type).replace(
          auth.AttemptPrefix,
          auth.AuthPrefix,
        )}, In);`;
      }
      if (
        callTypes.find(call => call.Type === auth.AttemptPrefix + Type) &&
        callTypes.find(call => call.Type === auth.AuthPrefix + Type)
      ) {
        // the auth is optional
        // if the call.In contain token, reroute to Attempt version call
        return `if (In.token) {
      return this.${auth.AttemptPrefix + Type}(In);
    }
    ${code}`;
      }
    }
    return code;
  };
  const code = `
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ${[
    callTypeName,
    ...Array.from(new Set(callTypes.map(call => call.CallType))),
    ...callTypes.map(call => call.Type),
  ].sort().join(`,
  `)}
} from ${getTypeFileImportPath(args)};
import { ${logicProcessorClassName} } from '../${logicProcessorDirname}/${removeTsExtname(
    logicProcessorFilename,
  )}';
import { CallInput${async_import_type} } from 'cqrs-exp';${
    !auth
      ? ''
      : `
import { ${auth.MethodAuthCall}, ${auth.MethodAuthSubscribe}${
          check_app_id ? `, ${auth.MethodCheckAppId}` : ''
        } } from ${JSON.stringify(auth.ImportFile)};${
          !check_app_id
            ? ''
            : `

${auth.MethodCheckAppId}(${JSON.stringify(check_app_id)});`
        }
`
  }

// tslint:disable:no-unused-variable
function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}
// tslint:enable:no-unused-variable

const impl = new ${logicProcessorClassName}();

@Injectable()
export class ${serviceClassName} {
  get impl() {
    return impl;
  }

  ${callTypeName}<C extends ${callTypeName}>(args: CallInput<C>): ${async_type(
    `C['Out']`,
  )} {
    const { CallType, Type, In } = args;
    const _type = Type as ${callTypeName}['Type'];
    let method: (In: C['In']) => C['Out'];
    switch (_type) {
      ${callTypes
        .map(({ CallType, Type }) =>
          CallType === subscribeTypeName
            ? `case '${Type}': {
        // @ts-ignore
        const m: (In: C['In']) => { id: string } = this.${Type};
        method = m as any;
        break;
      }
      `
            : `case '${Type}':
        // @ts-ignore
        method = this.${Type};
        break;
      `,
        )
        .join('')
        .trim()}
      default:
        const x: never = _type;
        console.log(\`not implemented, CallType: \${CallType}, Type: \${Type}\`);
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
      ({ CallType, Type }) => `${Type}(In: ${Type}['In']): ${async_type(
        CallType === subscribeTypeName
          ? '{ id: string } | { error: any }'
          : `${Type}['Out']`,
      )} {
    ${genMethodBody({ CallType, Type })}
  }

  `,
    )
    .join('')
    .trim()}
}
`.trim();
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
  queryTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  staticControllerReference: boolean;
  serviceApiPath: string;
  callApiPath: string;
  statusFilename: string;
  statusName: string;
  ws: boolean;
  asyncLogicProcessor: boolean;
  replayQuery: boolean;
  storeQuery: boolean;
  timestampFieldName: string;
  injectTimestampField: boolean;
}) {
  const {
    callTypeName,
    commandTypeName,
    queryTypeName,
    serviceClassName,
    serviceFilename,
    serviceApiPath,
    callApiPath,
    controllerClassName,
    staticControllerReference,
    statusName,
    statusFilename,
    ws,
    asyncLogicProcessor,
    replayQuery,
    storeQuery,
    timestampFieldName,
    injectTimestampField,
  } = args;
  const serviceObjectName =
    serviceClassName[0].toLowerCase() + serviceClassName.substring(1);
  const async_import_type = asyncLogicProcessor ? ', isPromise, Result' : '';
  const async_type = (type: string) =>
    asyncLogicProcessor ? `Result<${type}>` : type;
  return `
import * as path from 'path';
import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express-serve-static-core';
import { ${callTypeName} } from ${getTypeFileImportPath(args)};
import { CallInput, LogService${async_import_type} } from 'cqrs-exp';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';
import { Bar } from 'cli-progress';
import { ok, rest_return } from 'nestlib';
import { ${statusName} } from './${removeTsExtname(statusFilename)}';
import { endRestCall, startRestCall } from './connection';
${
  !ws
    ? ''
    : `
import {
  closeConnection,
  endSparkCall,
  newConnection,
  Spark,
  startSparkCall,
} from './connection';
import { ISpark } from 'typestub-primus';
import { usePrimus } from '../main';
`.trim()
}

let ready: Promise<void>;

@Controller('${serviceApiPath}')
export class ${controllerClassName} {${
    !staticControllerReference
      ? ''
      : `
  static instance: ${controllerClassName};`
  }
  logService: LogService;

  constructor(
    public ${serviceObjectName}: ${serviceClassName},
  ) {${
    !staticControllerReference
      ? ''
      : `
    ${controllerClassName}.instance = this;`
  }
    this.logService = new LogService(path.join('data', 'log'));
    ready = this.restore();
  }

  async restore() {
    const start = Date.now();
    console.log('start to restore');
    const keys = this.logService.getKeysSync();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    ${statusName}.isReplay = true;
    bar.start(keys.length, 0);
    for (const key of keys) {
      if (!key.endsWith('-${commandTypeName}')${
    !replayQuery ? '' : ` && !key.endsWith('-${queryTypeName}')`
  }) {
        bar.increment(1);
        continue;
      }
      const call = this.logService.getObjectSync<CallInput<${callTypeName}>>(key);
      if (call === null) {
        continue;
      }
      if (call.CallType !== '${commandTypeName}'${
    !replayQuery ? '' : ` && call.CallType !== '${queryTypeName}'`
  }) {
        bar.increment(1);
        continue;
      }
      try {${
        !asyncLogicProcessor
          ? `
        this.${serviceObjectName}.${callTypeName}(call);`
          : `
        const out = this.${serviceObjectName}.${callTypeName}(call);
        if (isPromise(out)) {
          await out;
        }`
      }
      } catch (e) {
        console.error(\`failed when call '\${call.CallType}' '\${call.Type}':\`, e);
      }
      bar.increment(1);
    }
    ${statusName}.isReplay = false;
    bar.stop();
    console.log('finished restore');
    const end = Date.now();
    console.log('used:', (end - start) / 1000, 'seconds');${
      !ws
        ? ''
        : `
    usePrimus(primus => {
      primus.on('connection', (_spark: ISpark) => {
        const spark: Spark = _spark as any;
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('${callApiPath}', (async (call: CallInput<${callTypeName}>, ack: (data: any) => void) => {${
            injectTimestampField
              ? `
          call.In.${timestampFieldName} = Date.now();`
              : ``
          }
          startSparkCall(spark, call);
          try {
            await ready;
            let out = this.storeAndCall(call);${
              !asyncLogicProcessor
                ? ''
                : `
            if (isPromise(out)) {
              out = await out;
            }`
            }
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
        }) as any);
      });
    });`
    }
  }

  storeAndCall<C extends ${callTypeName}>(call: CallInput<C>): ${async_type(
    `C['Out']`,
  )} {
    ${((): string => {
      const store = `this.logService.storeObjectSync(
      call,
      this.logService.nextKey() + '-' + call.CallType,
    );`;
      if (storeQuery) {
        return store;
      }
      return `if (call.CallType !== '${queryTypeName}') {
    ${store
      .split('\n')
      .map(line => '  ' + line)
      .join('\n')}
    }`;
    })()}
    return this.coreService.${callTypeName}<C>(call);
  }

  @Post('${callApiPath}')
  async ${callApiPath}<C extends ${callTypeName}>(
    @Req() req: Request,
    @Res() res: Response,
    @Body() call: CallInput<C>,
  ): Promise<C['Out']> {${
    injectTimestampField
      ? `
    call.In.${timestampFieldName} = Date.now();`
      : ``
  }
    await ready;
    try {
      startRestCall(req, res, call);
      let out = this.storeAndCall<C>(call);${
        !asyncLogicProcessor
          ? ''
          : `
      if (isPromise(out)) {
        out = await out;
      }`
      }
      ok(res, out);
      return out;
    } catch (e) {
      return rest_return(res, Promise.reject(e));
    } finally {
      endRestCall(call);
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

function genConstant(constants: Constants): string {
  return Object.entries(constants)
    .map(([name, constant]) => {
      let type: string | undefined;
      let value: string;
      if (typeof constant === 'string') {
        type = value = JSON.stringify(constant);
      } else {
        type = constant.type;
        value = JSON.stringify(constant.value, null, 2);
      }
      return `export const ${name}${type ? `: ${type}` : ''} = ${value};`;
    })
    .join('\n');
}

export function genCallTypeCode(args: {
  typeAlias: TypeAlias;
  callTypes: CallMeta[];
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  constants: Constants;
}): string {
  const {
    typeAlias,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    callTypeName,
    callTypes,
    constants,
  } = args;
  const callTypesMap = groupBy(t => t.CallType, callTypes);
  const commandTypes = callTypesMap.get(commandTypeName) || [];
  const queryTypes = callTypesMap.get(queryTypeName) || [];
  const subscribeTypes = callTypesMap.get(subscribeTypeName) || [];
  const code = `
${Object.entries(typeAlias)
  .map(([name, type]) => `export type ${name} = ${type};`)
  .join('\n')}
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

export interface CallInput<C extends Call = Call> {
  CallType: C['CallType'];
  Type: C['Type'];
  In: C['In'];
}

function checkCallType(_t: {
  CallType: '${commandTypeName}' | '${queryTypeName}' | '${subscribeTypeName}';
  Type: string;
  In: any;
  Out: any;
}) {
    /* static type check only */
}

checkCallType({} as ${callTypeName});

${genConstant(constants)}
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

export function genMainCode(args: {
  originalCode: string;
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
}): string {
  const { originalCode, primusGlobalName, primusPath, ws } = args;
  if (!ws) {
    return originalCode;
  }
  if (
    originalCode.includes('Primus') ||
    originalCode.includes('attachServer')
  ) {
    return originalCode;
  }
  let newCode = insert(
    originalCode,
    'async function bootstrap',
    `import { Server } from 'http';
import { Primus } from 'typestub-primus';
let primus: Primus;

let pfs: Array<(primus: Primus) => void> = [];

export function usePrimus(f: (primus: Primus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}

function attachServer(server: Server) {
  primus = new Primus(server, {
    pathname: ${JSON.stringify(primusPath)},
    global: ${JSON.stringify(primusGlobalName)},
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  });
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
  primusGlobalName: string;
  ws: boolean;
  serverOrigin?: string;
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
    primusGlobalName,
    ws,
    serverOrigin,
  } = args;
  const serviceObjectName = firstCharToLowerCase(serviceClassName);
  const hasSubscribe =
    ws && callTypes.some(call => call.CallType === subscribeTypeName);

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
  let code = `
import { Body, Controller, injectNestClient, Post } from 'nest-client';
import {
  ${[
    `${callTypeName} as CallType`,
    'CallInput',
    !hasSubscribe ? '' : `${subscribeTypeName} as SubscribeType`,
    ...callTypes
      .filter(call => ws || call.CallType !== subscribeTypeName)
      .map(call => call.Type),
  ]
    .filter(s => s)
    .sort().join(`,
  `)},
} from ${typeFilePath};
${
  !ws
    ? ''
    : `
import { Primus } from 'typestub-primus';

export interface IPrimus extends Primus {
  send(command: string, data: any, cb?: (data: any) => void): void;
}

let primus: IPrimus;
let pfs: Array<(primus: IPrimus) => void> = [];

export function usePrimus(f: (primus: IPrimus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}
`.trim()
}

let ${serviceObjectName}: ${serviceClassName};

@Controller('${serviceApiPath}')
export class ${serviceClassName} {
  constructor(baseUrl: string) {
    injectNestClient(this, {
      baseUrl,
    });
  }

  @Post('${callApiPath}')
  async ${callApiPath}<C extends CallType>(
    @Body() _body: CallInput<C>,
  ): Promise<C['Out']> {
    return undefined as any;
  }
}

export function startPrimus(baseUrl: string${
    !serverOrigin ? '' : ` = ${JSON.stringify(serverOrigin)}`
  }) {
  ${
    ws
      ? `
  if (typeof window === 'undefined') {
    ${serviceObjectName} = new ${serviceClassName}(baseUrl);
    return;
  }
  const w = window as any;
  primus = new w.${primusGlobalName}(baseUrl);

  pfs.forEach(f => f(primus));
  pfs = [];

  primus.on('close', () => {
    console.log('disconnected with server');
  });
  primus.on('open', () => {
    console.log('connected with server');
  });

  return primus;
  `.trim()
      : `
  ${serviceObjectName} = new ${serviceClassName}(baseUrl);
  `.trim()
  }
}

export function ${callTypeName}<C extends CallType>(
  CallType: C['CallType'],
  Type: C['Type'],
  In: C['In'],
): Promise<C['Out']> {
  const callInput: CallInput<C> = {
    CallType,
    Type,
    In,
  };
  ${
    ws
      ? `
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
  `.trim()
      : `
  return ${serviceObjectName}.${callApiPath}<C>(callInput);
  `.trim()
  }
}
${callTypes
  .filter(c => c.CallType !== subscribeTypeName)
  .map(
    ({ CallType, Type }) => `
export function ${Type}(In: ${Type}['In']): Promise<${Type}['Out']> {
  return Call<${Type}>('${CallType}', '${Type}', In);
}
`,
  )
  .join('')}`;
  code += !hasSubscribe
    ? ''
    : `
export interface SubscribeOptions<T> {
  onError: (err: any) => void
  onEach: (Out: T) => void
}

export interface SubscribeResult {
  cancel: () => void
}

export function ${subscribeTypeName}<C extends SubscribeType>(
  Type: C['Type'],
  In: C['In'],
  options: SubscribeOptions<C['Out']>,
): SubscribeResult {
  if (coreService) {
    throw new Error('${subscribeTypeName} is not supported on node.js client yet');
  }
  const callInput: CallInput<C> = {
    CallType: '${subscribeTypeName}',
    Type,
    In,
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
          options.onEach(data as any);
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
  In: ${Type}['In'],
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
import { Request, Response } from 'express-serve-static-core';
import { HttpException, HttpStatus } from '@nestjs/common';
import { status } from './status';

export interface Spark {
  id: string;

  on(event: string, cb: (data: any, ack?: (data: any) => void) => void): void;

  send(event: string, data?: any, ack?: (data: any) => void): void;
}

export interface Subscription {
  id: string;

  close(): void;
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
  const session = sparkId_session_map.get(spark.id);
  if(!session){return}
  session.subscriptions.forEach(sub => sub.close());
  sparkId_session_map.delete(spark.id);
}

export function startSparkCall(spark: Spark, call: CallInput) {
  const session = sparkId_session_map.get(spark.id);
  if (!session) {
    return;
  }
  session.calls.push(call);
  in_session_map.set(call.In, session);
}

export function getSessionByIn(In: any): Session | undefined {
  return in_session_map.get(In);
}

export function checkedGetSessionByIn(In: any): Session {
  if (status.isReplay) {
    throw new HttpException('SkipWhenReplay', HttpStatus.NOT_ACCEPTABLE);
  }
  const session = in_session_map.get(In);
  if (!session) {
    throw new HttpException(
      'primus session not found',
      HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
    );
  }
  return session;
}

export function getSessionBySparkId(sparkId: string): Session | undefined {
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
  if(!session){return}
  remove(session.calls, call);
  in_session_map.delete(call.In);
}

export interface RestSession {
  req: Request;
  res: Response;
}

const in_rest_session_map = new Map<any, RestSession>();

export function startRestCall(req: Request, res: Response, call: CallInput) {
  in_rest_session_map.set(call.In, { req, res });
}

export function getRestSessionByIn(In: any): RestSession | undefined {
  return in_rest_session_map.get(In);
}

export function endRestCall(call: CallInput) {
  in_rest_session_map.delete(call.In);
}
`.trim();
}

export function genDocumentationHtmlCode(args: {
  baseProjectName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  typeAlias: TypeAlias;
  role: string;
}) {
  const {
    baseProjectName,
    callTypes,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    typeAlias,
    role,
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
  const aliasTypes = Object.entries(typeAlias)
    .map(([name, type]) => ({ name, type }))
    .filter(({ name }) =>
      callTypes.some(call => call.In.includes(name) || call.Out.includes(name)),
    );

  const title = `${baseProjectName} ${role} APIs`;

  const formatAliases = (prefix: string) =>
    `<h2>Type Aliases</h2>
${prefix}<ul>${aliasTypes
      .map(
        ({ name }) => `
${prefix}  <li><a href="#${name}">${name}</a></li>`,
      )
      .join('')}
${prefix}</ul>`;
  const formatApis = (prefix: string, name: string, calls: PartialCallMeta[]) =>
    `<h2>${name} APIs</h2>
${prefix}<ul>${calls
      .map(
        ({ Type }) => `
${prefix}  <li><a href="#${Type}">${Type}</a></li>`,
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
      ${formatAliases('      ')}
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
  var In = 'unknown';
  var Out = 'unknown';
  switch (Type) {
    ${aliasTypes
      .map(
        ({ name, type }) => `case '${name}': {
      In = ${removeTailingSpace(formatString(type))};
      Out = '';
      break;
    }
    `,
      )
      .join('')
      .trim()}
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
