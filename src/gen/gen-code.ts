import { groupBy } from '@beenotung/tslib/functional';
import { genTsType } from 'gen-ts-type';
import { Call } from '../types';

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
  callTypes: Call[];
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

  ${callTypeName}<C extends ${callTypeName}>(args: CallInput): C['Out'] {
    const { CallType, Type, In } = args;
    const _type = Type as ${callTypeName}['Type'];
    let method: (In: C['In']) => C['Out'];
    switch (_type) {
      ${callTypes
        .map(({ Type }) => Type)
        .map(
          s => `case '${s}':
        method = this.${s};
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
    .map(call => call.Type)
    .map(
      s => `${s}(In: ${s}['In']): ${s}['Out'] {
    ${
      logicProcessorCode.indexOf(s) === -1
        ? `return not_impl('${s}');`
        : `return this.impl.${s}(In);`
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

export function genControllerCode(args: {
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  serviceApiPath: string;
  callApiPath: string;
}) {
  const {
    callTypeName,
    serviceClassName,
    serviceFilename,
    serviceApiPath,
    callApiPath,
    controllerClassName,
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
import { primus } from '../main';
import { ok } from 'nestlib';

@Controller('${serviceApiPath}')
export class ${controllerClassName} {
  logService: LogService;
  ready: Promise<void>;

  constructor(
    public ${serviceObjectName}: ${serviceClassName},
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    this.ready = this.restore();
    primus.on('${callApiPath}', async (data: CallInput<${callTypeName}>, ack) => {
      try {
        await this.ready;
        const out = this.${serviceObjectName}.${callTypeName}<${callTypeName}>(data);
        ack(out);
      } catch (e) {
        console.error(e);
        ack({ Error: e.toString() });
      }
    });
  }

  async restore() {
    const keys = await this.logService.getKeys();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(keys.length, 0);
    for (const key of keys) {
      const call = await this.logService.getObject<${callTypeName}>(key);
      this.${serviceObjectName}.${callTypeName}(call);
      bar.increment(1);
    }
    bar.stop();
  }

  @Post('${callApiPath}')
  async ${callApiPath}<C extends ${callTypeName}>(
    @Res() res,
    @Body() body: CallInput,
  ): Promise<C['Out']> {
    await this.ready;
    this.logService.storeObject(body);
    const out = this.${serviceObjectName}.${callTypeName}(body);
    return ok(res, out);
  }
}
`.trim();
}

export function genCallTypeCode(args: {
  callTypes: Call[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
  subscribeTypeName: string;
}) {
  const {
    queryTypeName,
    commandTypeName,
    subscribeTypeName,
    callTypeName,
    callTypes,
  } = args;
  const callTypesMap = groupBy(t => t.CallType, callTypes);
  const queryTypes = callTypesMap.get('Query') || [];
  const commandTypes = callTypesMap.get('Command') || [];
  const subscribeTypes = callTypesMap.get('Subscribe') || [];
  const code = `
import { checkCallType } from 'cqrs-exp';
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
export let primus;

function attachServer(server: Server) {
  const primus_options = {
    pathname: '/primus',
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  };

  primus = new Primus(server, primus_options);

  // /*
  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
    spark.write('hi from server');
    spark.on('data', data => {
      console.log('client data:', data);
    });
  });
  // */
}

`,
  );
  newCode = insert(
    newCode,
    'await app.listen',
    `attachServer(app.getHttpServer());
  `,
  );
  return newCode;
}
