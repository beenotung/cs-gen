import { groupBy } from '@beenotung/tslib/functional';
import { genTsType } from 'gen-ts-type';
import { CallMeta } from '../types';
import { Constants, PartialCallMeta, TypeAlias } from '../utils';
import { addIndentation } from './helpers/indent';
import { callsToQuoteString } from './helpers/quote-string';
import { AuthPluginOptions, genAuthServiceMethod } from './plugins/auth';

export type GenProjectPlugins = {
  auth?: AuthPluginOptions;
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
  libDirname: string;
}) {
  const {
    moduleClassName,
    serviceFilename,
    serviceClassName,
    controllerFilename,
    controllerClassName,
    libDirname,
  } = args;
  // prettier-ignore
  return `
import { Module } from '@nestjs/common';
import * as path from 'path';
import { LogService } from '../${libDirname}/log.service';
import { ${controllerClassName} } from './${removeTsExtname(controllerFilename)}';
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';

@Module({
  controllers: [${controllerClassName}],
  providers: [
    ${serviceClassName},
    { provide: LogService, useValue: new LogService(path.join('data', 'log')) },
  ],
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
  libDirname: string;
  plugins: GenProjectPlugins;
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
    libDirname,
  } = args;
  const { auth } = plugins;
  const async_type = (type: string) =>
    asyncLogicProcessor ? `Result<${type}>` : type;
  const genMethodBody = (call: CallMeta): string => {
    const { Type } = call;
    const invokeCode = logicProcessorCode.includes(Type)
      ? `return impl.${Type}(In);`
      : `return not_impl('${Type}');`;
    if (auth) {
      return genAuthServiceMethod({
        call,
        auth,
        invokeCode,
        subscribeTypeName,
      });
    }
    return invokeCode;
  };
  // prettier-ignore
  const code = `
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';${auth ? `
import {
  ${auth.MethodAuthCall},${callTypes.some(call => call.CallType === subscribeTypeName) ? `
  ${auth.MethodAuthSubscribe},` : ``}${auth.AppId ? `
  ${auth.MethodCheckAppId},` : ''}
} from ${JSON.stringify(auth.ImportFile)};` : ''}
import { ${logicProcessorClassName} } from '../${logicProcessorDirname}/${removeTsExtname(logicProcessorFilename)}';
import {
  ${[
    callTypeName,
    'CallInput',
    ...Array.from(new Set(callTypes.map(call => call.CallType))),
    ...callTypes.map(call => call.Type),
  ].sort().join(`,
  `)}
} from ${getTypeFileImportPath(args)};${asyncLogicProcessor ? `
import { Result } from '../${libDirname}/result';` : ''}

${auth && auth.AppId ? `
${auth.MethodCheckAppId}(${JSON.stringify(auth.AppId)});
` : ''}

// tslint:disable-next-line:no-unused-declaration
function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

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
      (call) => {
        const { CallType, Type } = call;
        return `${Type}(In: ${Type}['In']): ${async_type(
          CallType === subscribeTypeName
            ? '{ id: string } | { error: any }'
            : `${Type}['Out']`,
        )} {
    ${genMethodBody(call)}
  }

  `;
      },
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

export function genCallsCode(args: {
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  callTypes: CallMeta[];
}) {
  const { callTypeName, callTypes } = args;
  // prettier-ignore
  return `
import { ${callTypeName} } from ${getTypeFileImportPath(args)};

export type CallMeta = {
  CallType: ${callTypeName}['CallType'],
  Type: ${callTypeName}['Type'],
  In: string,
  Out: string,
} & {
  Admin?: boolean;
  Internal?: boolean;
  OptionalAuth?: boolean;
  RequiredAuth?: boolean;
  Replay?: boolean;
};

// tslint:disable max-line-length
export const calls: CallMeta[] = ${callsToQuoteString(callTypes)};
// tslint:enable max-line-length

export const callMap = new Map<Call['Type'], CallMeta>(
  calls.map(call => [call.Type, call]),
);

export function isInternalCall(Type: ${callTypeName}['Type']): boolean {
  const call = callMap.get(Type);
  if (!call) {
    return false
  }
  return !!call.Internal
}

export function shouldReply(Type: Call['Type']): boolean {
  return !!callMap.get(Type)?.Replay;
}
`.trim();
}

/**
 * replay the commands and queries if needed
 * */
function genInitSyncCode({
  statusName,
  asyncLogicProcessor,
  serviceClassName,
  callTypeName,
  commandTypeName,
  queryTypeName,
  subscribeTypeName,
  callTypes,
  replayCommand,
  replayQuery,
}: {
  statusName: string;
  asyncLogicProcessor: boolean;
  serviceClassName: string;
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  replayCommand: boolean;
  replayQuery: boolean;
}): string {
  const serviceObjectName = firstCharToLowerCase(serviceClassName);
  const replayCallTypes = new Set<string>();
  if (replayCommand) {
    if (callTypes.some(call => call.CallType === commandTypeName)) {
      replayCallTypes.add(commandTypeName);
    }
  }
  if (replayQuery) {
    if (callTypes.some(call => call.CallType === queryTypeName)) {
      replayCallTypes.add(queryTypeName);
    }
    if (callTypes.some(call => call.CallType === subscribeTypeName)) {
      replayCallTypes.add(subscribeTypeName);
    }
  }
  callTypes.forEach(call => {
    if (call.Replay) {
      replayCallTypes.add(call.CallType);
    }
  });
  // prettier-ignore
  return `
  private${asyncLogicProcessor ? ` async` : ``} initSync() {
    ${statusName}.isReplay = true;
    const start = Date.now();
    console.log('start init sync');
    const bar = new Bar({
      format:
        'init sync progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(0, 0);
    for (const { key, content: call, estimateTotal } of iterateBatch<CallInput<Call>>(this.logService)) {
      bar.setTotal(estimateTotal);
      if (${Array.from(replayCallTypes).map(CallType => `!key.endsWith('-${CallType}')`).join(' && ')}) {
        bar.increment(1);
        continue;
      }
      if (call === null) {
        console.warn('failed to load call from log:', key);
        bar.increment(1);
        continue;
      }
      if (!shouldReply(call.Type)) {
        bar.increment(1);
        continue;
      }
      try {${!asyncLogicProcessor ? `
        this.${serviceObjectName}.${callTypeName}(call);` : `
        const out = this.${serviceObjectName}.${callTypeName}(call);
        if (isPromise(out)) {
          await out;
        }`}
      } catch (e) {
        console.error(\`failed when call '\${call.CallType}' '\${call.Type}':\`, e);
      }
      bar.increment(1);
    }
    bar.stop();
    console.log('finished init sync');
    const end = Date.now();
    console.log('used:', (end - start) / 1000, 'seconds');
  }
`.trim();
}

/**
 * listen to calls from primus client
 * */
function genUsePrimusCode({
  controllerClassName,
  callApiPath,
  callTypeName,
  injectTimestampField,
  timestampFieldName,
  asyncLogicProcessor,
}: {
  controllerClassName: string;
  callApiPath: string;
  callTypeName: string;
  injectTimestampField: boolean;
  timestampFieldName: string;
  asyncLogicProcessor: boolean;
}): string {
  // prettier-ignore
  return `
  private${asyncLogicProcessor ? ` async` : ''} usePrimus() {
    primusPromise.then(primus => {
      primus.on('connection', (_spark: ISpark) => {
        const spark: Spark = _spark as any;
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('${callApiPath}', (${asyncLogicProcessor ? `async ` : ''}(call: CallInput<${callTypeName}>, ack: (data: any) => void) => {
          try {${injectTimestampField ? `
            call.In.${timestampFieldName} = Date.now();` : ''}${asyncLogicProcessor ? `
            await ready;` : ''}
            startSparkCall(spark, call);
            let out = this.storeAndCall({ call, from: 'client' });${
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
    });
    console.log('connected primus to ${controllerClassName}');
  }
`.trim();
}

/**
 * replay the commands, than start primus listener
 * (init sync was previously called as restore)
 * */
function genControllerInitMethod(args: {
  statusName: string;
  asyncLogicProcessor: boolean;
  serviceClassName: string;
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  replayCommand: boolean;
  replayQuery: boolean;
  controllerClassName: string;
  ws: boolean;
  callApiPath: string;
  injectTimestampField: boolean;
  timestampFieldName: string;
}): string {
  const {
    statusName,
    asyncLogicProcessor,
    ws,
    replayCommand,
    replayQuery,
  } = args;
  const needInitSync = replayCommand || replayQuery;
  // prettier-ignore
  return `
  ${needInitSync ? genInitSyncCode(args) + '\n' : ''}
  ${ws ? genUsePrimusCode(args) + '\n' : ''}
  ${asyncLogicProcessor ? 'async ' : ''}init() {${needInitSync ? `
    ${asyncLogicProcessor ? `await ` : ''}this.initSync();` : ``}
    ${statusName}.isReplay = false;${ws ? `
    this.usePrimus();` : ``}
  }
`.trim();
}

function populateStoreMethodParam({
  storeCommand,
  storeQuery,
  callTypes,
  commandTypeName,
  queryTypeName,
  subscribeTypeName,
}: {
  storeCommand: boolean;
  storeQuery: boolean;
  callTypes: CallMeta[];
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
}) {
  const needStoreCommand =
    storeCommand && callTypes.some(call => call.CallType === commandTypeName);
  const hasQuery = callTypes.some(call => call.CallType === queryTypeName);
  const hasSubscribe = callTypes.some(
    call => call.CallType === subscribeTypeName,
  );
  const needStoreQuery = storeQuery && (hasQuery || hasSubscribe);
  const shouldStore = needStoreCommand || needStoreQuery;
  return {
    needStoreCommand,
    needStoreQuery,
    shouldStore,
    hasQuery,
    hasSubscribe,
  };
}

function genStoreMethodBody(args: {
  storeCommand: boolean;
  storeQuery: boolean;
  callTypes: CallMeta[];
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
}): string {
  const { commandTypeName, queryTypeName, subscribeTypeName } = args;
  // prettier-ignore
  const callStoreCode = `
    this.logService.storeObjectSync(
      call,
      this.logService.nextKey() + '-' + call.CallType,
    );`.trim();
  const {
    needStoreCommand,
    needStoreQuery,
    shouldStore,
    hasQuery,
    hasSubscribe,
  } = populateStoreMethodParam(args);
  const isStoreAll = needStoreCommand && needStoreQuery;
  if (!shouldStore || isStoreAll) {
    return callStoreCode;
  }
  const storeCallTypes: string[] = [];
  if (needStoreCommand) {
    storeCallTypes.push(commandTypeName);
  }
  if (needStoreQuery) {
    if (hasQuery) {
      storeCallTypes.push(queryTypeName);
    }
    if (hasSubscribe) {
      storeCallTypes.push(subscribeTypeName);
    }
  }
  // prettier-ignore
  return `
    if (${storeCallTypes.map(CallType => `call.CallType === ${JSON.stringify(CallType)}`).join(' || ')}) {
    ${addIndentation(callStoreCode, '  ')}
    }
`;
}

function genStoreAndCallMethodBody(args: {
  storeCommand: boolean;
  storeQuery: boolean;
  callTypes: CallMeta[];
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
}): string {
  const { callTypeName } = args;
  const { shouldStore } = populateStoreMethodParam(args);
  // prettier-ignore
  return `
    if (from !== 'server' && isInternalCall(call.Type)) {
      throw new HttpException('The call is not from authentic caller', HttpStatus.FORBIDDEN);
    }${shouldStore ? `
    ${genStoreMethodBody(args)}` : ``}
    return this.coreService.${callTypeName}<C>(call);
`.trim();
}

export function genControllerCode(args: {
  typeDirname: string;
  typeFilename: string;
  callsFilename: string;
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  libDirname: string;
  staticControllerReference: boolean;
  serviceApiPath: string;
  callApiPath: string;
  statusFilename: string;
  statusName: string;
  ws: boolean;
  asyncLogicProcessor: boolean;
  replayCommand: boolean;
  replayQuery: boolean;
  storeCommand: boolean;
  storeQuery: boolean;
  timestampFieldName: string;
  injectTimestampField: boolean;
}) {
  const {
    callsFilename,
    callTypeName,
    serviceClassName,
    serviceFilename,
    serviceApiPath,
    callApiPath,
    controllerClassName,
    libDirname,
    staticControllerReference,
    statusName,
    statusFilename,
    ws,
    asyncLogicProcessor,
    timestampFieldName,
    injectTimestampField,
  } = args;
  const serviceObjectName =
    serviceClassName[0].toLowerCase() + serviceClassName.substring(1);
  const async_type = (type: string) =>
    asyncLogicProcessor ? `Result<${type}>` : type;
  // prettier-ignore
  return `
import { Body, Controller, Post, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Bar } from 'cli-progress';
import { Request, Response } from 'express-serve-static-core';
import { bad_request, ok } from 'nestlib';${ws ? `
import { ISpark } from 'typestub-primus';` : ''}
import { ${callTypeName}, CallInput } from ${getTypeFileImportPath(args)};
import { LogService } from '../${libDirname}/log.service';${asyncLogicProcessor ? `
import { isPromise, Result } from '../${libDirname}/result';` : ''}
import { isInternalCall, shouldReply } from './${removeTsExtname(callsFilename)}';
import { iterateBatch } from '../lib/batch';${ws ? `
import { primusPromise  } from '../main';` : ''}
import { endRestCall, startRestCall } from './connection';${ws ? `
import {
  closeConnection,
  endSparkCall,
  newConnection,
  Spark,
  startSparkCall,
} from './connection';` : ''}
import { ${serviceClassName} } from './${removeTsExtname(serviceFilename)}';
import { ${statusName} } from './${removeTsExtname(statusFilename)}';
${asyncLogicProcessor ? `
let ready: Promise<void>;
` : ''}
@Controller('${serviceApiPath}')
export class ${controllerClassName} {${
    !staticControllerReference
      ? ''
      : `
  static instance: ${controllerClassName};`
  }

  constructor(
    public ${serviceObjectName}: ${serviceClassName},
    public logService: LogService,
  ) {${
    !staticControllerReference
      ? ''
      : `
    ${controllerClassName}.instance = this;`
  }
    ${asyncLogicProcessor ? `ready = ` : ''}this.init();
  }${asyncLogicProcessor ? `

  get ready() {
    return ready;
  }` : ''}

  ${genControllerInitMethod(args)}

  storeAndCall<C extends ${callTypeName}>({ call, from }: { call: CallInput<C>, from: 'server' | 'client' }): ${async_type(
    `C['Out']`,
  )} {
    ${genStoreAndCallMethodBody(args)}
  }

  @Post('${callApiPath}')
  ${asyncLogicProcessor ? `async ` : ''}${callApiPath}<C extends ${callTypeName}>(
    @Req() req: Request,
    @Res() res: Response,
    @Body() call: CallInput<C>,
  ): ${asyncLogicProcessor ? `Promise<` : ''}C['Out']${asyncLogicProcessor ? `>` : ''} {
    try {${injectTimestampField ? `
      call.In.${timestampFieldName} = Date.now();` : ''}${asyncLogicProcessor ? `
      await ready;` : ``}
      startRestCall(req, res, call);
      let out = this.storeAndCall<C>({ call, from: 'client' });${
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
      bad_request(res, e);
      return e;
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

function hasFields(o: any, fields: string[]) {
  return (
    typeof o === 'object' && o !== null && fields.every(field => field in o)
  );
}

function valueToString(value: any) {
  if (typeof value === 'function') {
    return value.toString();
  }
  return JSON.stringify(value, null, 2);
}

function genConstant(constants: Constants): string {
  return Object.entries(constants)
    .map(([name, constant]) => {
      let type: string | undefined;
      let value: string;
      if (typeof constant === 'string' || typeof constant === 'number') {
        type = value = JSON.stringify(constant);
      } else if (hasFields(constant, ['type', 'value'])) {
        type = constant.type;
        value = valueToString(constant.value);
      } else {
        value = valueToString(constant);
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

export function genMainCode(args: {
  entryModule: string;
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
  port: number;
  web: boolean;
}): string {
  const { primusGlobalName, primusPath, ws, port, web, entryModule } = args;
  const ModuleClass =
    entryModule[0].toUpperCase() + entryModule.substring(1) + 'Module';
  let protocol = 'http';
  if (ws) {
    protocol += ' and ws';
  }
  // prettier-ignore
  return `${web ? `
import * as express from 'express';
import * as path from 'path';` : ''}
import { NestFactory } from '@nestjs/core';
import { ${ModuleClass} } from './${entryModule}.module';${ws ? `
import { Server } from 'http';
import { Primus } from 'typestub-primus';

let resolvePrimus: (primus: Primus) => void;
export let primusPromise = new Promise<Primus>(resolve => {
  resolvePrimus = resolve;
});

/**@deprecated use primusPromise instead */
export function usePrimus(f: (primus: Primus) => void): void {
  primusPromise.then(f);
}

function attachServer(server: Server) {
  const primus = new Primus(server, {
    pathname: ${JSON.stringify(primusPath)},
    global: ${JSON.stringify(primusGlobalName)},
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  });
  primus.plugin('emitter', require('primus-emitter'));
  // primus.save('primus.js');

  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
  });

  resolvePrimus(primus);
}` : ''}

async function bootstrap() {
  const app = await NestFactory.create(${ModuleClass});${web ? `
  app.use(
    '/',
    express.static(path.join(process.cwd(), 'www'), {
      setHeaders: res => {
        res.setHeader('Connection', 'Keep-Alive')
        // res.setHeader('Keep-Alive','timeout=5, max=1000')
      },
    }),
  );` : ''}
  app.enableCors();${ws ? `
  attachServer(app.getHttpServer());` : ''}
  await app.listen(${port});
  console.log('listening ${protocol} on port ${port}');
}
bootstrap();
`.trim();
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
  serverOrigin: {
    port: number;
    test: string;
    prod: string;
  };
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
import { Body, Controller, injectNestClient, Post } from 'nest-client/rest';${
    ws
      ? `
import { Primus } from 'typestub-primus';`
      : ``
  }
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
} from ${typeFilePath};${
    !ws
      ? ''
      : `

export interface IPrimus extends Primus {
  send(command: string, data: any, cb?: (data: any) => void): void;
}

let resolvePrimus: (primus: IPrimus) => void;
export let primusPromise = new Promise<IPrimus>(resolve => {
  resolvePrimus = resolve;
});

/**@deprecated use primusPromise instead */
export function usePrimus(f: (primus: IPrimus) => void): void {
  primusPromise.then(f);
}
`
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

export function startAPI(options: {
  localhost: string
} | {
  mode: 'local' | 'test' | 'prod'
} | {
  baseUrl: string
}) {
  const baseUrl: string = (() => {
    if ('baseUrl' in options) {
      return options.baseUrl
    }
    if ('localhost' in options) {
      return \`http://\${options.localhost}:${serverOrigin.port}\`;
    }
    switch (options.mode) {
      case 'local':
        return 'http://localhost:${serverOrigin.port}';
      case 'test':
        return ${JSON.stringify(serverOrigin.test)};
      case 'prod':
        return ${JSON.stringify(serverOrigin.prod)};
      default:
        throw new Error(\`Failed to resolve baseUrl, unknown mode: '\${options.mode}'\`)
    }
  })();
  ${
    ws
      ? `
  if (typeof window === 'undefined') {
    ${serviceObjectName} = new ${serviceClassName}(baseUrl);
    return;
  }
  const w = window as any;
  const primus: IPrimus = new w.${primusGlobalName}(baseUrl);

  primus.on('close', () => {
    console.log('disconnected with server');
  });
  primus.on('open', () => {
    console.log('connected with server');
  });

  resolvePrimus(primus);

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
    primusPromise.then(primus => {
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
  onReady?: () => void
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
  primusPromise.then(primus => {
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
      if (options.onReady) {
        options.onReady();
      }
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

export function genConnectionCode(args: {
  typeDirname: string;
  typeFilename: string;
  statusFilename: string;
  statusName: string;
}): string {
  const { statusFilename, statusName } = args;
  return `
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express-serve-static-core';
import { CallInput } from ${getTypeFileImportPath(args)};
import { ${statusName} } from './${removeTsExtname(statusFilename)}';

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
  calls: Set<CallInput>;
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
    calls: new Set(),
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
  session.calls.add(call);
  in_session_map.set(call.In, session);
}

export function getSessionByIn(In: any): Session | undefined {
  return in_session_map.get(In);
}

export function checkedGetSessionByIn(In: any): Session {
  if (${statusName}.isReplay) {
    throw new HttpException('SkipWhenReplay', HttpStatus.NOT_ACCEPTABLE);
  }
  const session = getSessionByIn(In);
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

export function endSparkCall(spark: Spark, call: CallInput) {
  const session = sparkId_session_map.get(spark.id);
  if(!session){return}
  session.calls.delete(call);
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
  typeAlias: TypeAlias;
  callTypes: CallMeta[];
  role: string;
}) {
  const {
    baseProjectName,
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    typeAlias,
    callTypes,
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
