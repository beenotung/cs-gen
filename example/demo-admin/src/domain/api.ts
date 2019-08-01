import { Body, Controller, injectNestClient, Post, setBaseUrl } from 'nest-client';
import {
  BlockUser,
  Call as CallType,
} from './types';
import Primus from 'typescript-primus';

interface IPrimus extends Primus {
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

export interface CallInput<C extends CallType> {
  CallType: C['CallType'];
  Type: C['Type'];
  In: C['In'];
}

let coreService: CoreService;

@Controller('core')
export class CoreService {
  constructor(baseUrl: string) {
    setBaseUrl(baseUrl);
    injectNestClient(this);
  }

  @Post('Call')
  async Call<C extends CallType>(
    @Body() _body: CallInput<C>,
  ): Promise<C['Out']> {
    return undefined as any;
  }
}

export function startPrimus(baseUrl: string) {
  if (typeof window === 'undefined') {
    coreService = new CoreService(baseUrl);
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

export function Call<C extends CallType>(
  CallType: C['CallType'],
  Type: C['Type'],
  In: Omit<C['In'], 'Timestamp'> & { Timestamp?: number },
): Promise<C['Out']> {
  const callInput: CallInput<C> = {
    CallType,
    Type,
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
  };
  if (coreService) {
    return coreService.Call<C>(callInput);
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

export function BlockUser(In: Omit<BlockUser['In'], 'Timestamp'> & { Timestamp?: number }): Promise<BlockUser['Out']> {
  return Call<BlockUser>('Command', 'BlockUser', In);
}
