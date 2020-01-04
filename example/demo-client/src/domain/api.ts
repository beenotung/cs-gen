import { Body, Controller, injectNestClient, Post } from 'nest-client';
import {
  Call as CallType,
  CallInput,
  CreateItem,
  CreateUser,
  GetProfile,
  GetUserList,
  RenameUser,
  Subscribe as SubscribeType,
  SubscribeItems,
} from './types';
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

let coreService: CoreService;

@Controller('core')
export class CoreService {
  constructor(baseUrl: string) {
    injectNestClient(this, {
      baseUrl,
    });
  }

  @Post('Call')
  async Call<C extends CallType>(
    @Body() _body: CallInput<C>,
  ): Promise<C['Out']> {
    return undefined as any;
  }
}

export function startAPI(options: {
  mode: 'local' | 'test' | 'prod',
} | {
  baseUrl: string
}) {
  const baseUrl: string = (() => {
    if ('baseUrl' in options) {
      return options.baseUrl
    }
    switch (options.mode) {
      case 'local':
        return 'http://localhost:3000';
      case 'test':
        return "https://api.example.com";
      case 'prod':
        return "https://api.example.com";
      default:
        throw new Error(`Failed to resolve baseUrl, unknown mode: '${options.mode}'`)
    }
  })();
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
  In: C['In'],
): Promise<C['Out']> {
  const callInput: CallInput<C> = {
    CallType,
    Type,
    In,
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

export function CreateUser(In: CreateUser['In']): Promise<CreateUser['Out']> {
  return Call<CreateUser>('Command', 'CreateUser', In);
}

export function RenameUser(In: RenameUser['In']): Promise<RenameUser['Out']> {
  return Call<RenameUser>('Command', 'RenameUser', In);
}

export function CreateItem(In: CreateItem['In']): Promise<CreateItem['Out']> {
  return Call<CreateItem>('Command', 'CreateItem', In);
}

export function GetProfile(In: GetProfile['In']): Promise<GetProfile['Out']> {
  return Call<GetProfile>('Query', 'GetProfile', In);
}

export function GetUserList(In: GetUserList['In']): Promise<GetUserList['Out']> {
  return Call<GetUserList>('Query', 'GetUserList', In);
}

export interface SubscribeOptions<T> {
  onError: (err: any) => void
  onEach: (Out: T) => void
  onReady?: () => void
}

export interface SubscribeResult {
  cancel: () => void
}

export function Subscribe<C extends SubscribeType>(
  Type: C['Type'],
  In: C['In'],
  options: SubscribeOptions<C['Out']>,
): SubscribeResult {
  if (coreService) {
    throw new Error('Subscribe is not supported on node.js client yet');
  }
  const callInput: CallInput<C> = {
    CallType: 'Subscribe',
    Type,
    In,
  };
  let cancelled = false;
  const res: SubscribeResult = { cancel: () => cancelled = true };
  usePrimus(primus => {
    primus.send('Call', callInput, data => {
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

export function SubscribeItems(
  In: SubscribeItems['In'],
  options: SubscribeOptions<SubscribeItems['Out']>,
): SubscribeResult {
  return Subscribe<SubscribeItems>('SubscribeItems', In, options);
}
