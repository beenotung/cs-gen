import { readFile } from '@beenotung/tslib/fs';
import path from 'path';
import { removeTsExtname } from '../../gen-code';
import { getSrcDirname, saveCode } from '../helpers';

export async function updateMainFile(
  args: {
    projectDirname: string;
  } & Parameters<typeof genMainCode>[0],
) {
  const srcPath = getSrcDirname(args);
  const mainPath = path.join(srcPath, 'main.ts');
  const originalCode = (await readFile(mainPath)).toString();
  const newMainCode = genMainCode({
    ...args,
  });
  if (originalCode.trim() !== newMainCode.trim()) {
    await saveCode(mainPath, newMainCode);
  }
}

export function genMainCode(args: {
  entryModule: string;
  moduleDirname: string;
  serverHelperFilename: string;
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
  port: number;
  web: boolean;
  jsonSizeLimit: string | undefined;
}): string {
  const {
    moduleDirname,
    serverHelperFilename,
    primusGlobalName,
    primusPath,
    ws,
    port,
    web,
    entryModule,
    jsonSizeLimit,
  } = args;
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
import { Primus } from 'typestub-primus';${jsonSizeLimit ? `
import { json } from 'express';` : ''}
import { resolvePrimus } from './${moduleDirname}/${removeTsExtname(serverHelperFilename)}'

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
  );` : ''}${jsonSizeLimit ? `
  app.use(json({ limit: ${JSON.stringify(jsonSizeLimit)} }))` : ''}
  app.enableCors();${ws ? `
  attachServer(app.getHttpServer());` : ''}
  await app.listen(${port});
  console.log('listening ${protocol} on port ${port}');
}
bootstrap();
`.trim();
}
