import { Body, Controller, injectNestClient, Post, setBaseUrl } from 'nest-client';
import {
  Call,
  CreateItem,
  CreateUser,
  GetProfile,
  GetUserList,
  RenameUser,
  Subscribe,
  SubscribeItems,
} from './types';

let primus;
let pfs: Array<(primus) => void> = [];

export function usePrimus(f: (primus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}

export interface CallInput<C extends Call> {
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
  async Call<C extends Call>(
    @Body() body: CallInput<C>,
  ): Promise<C['Out']> {
    return undefined;
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

export function CreateUser(In: Omit<CreateUser['In'], 'Timestamp'> & { Timestamp?: number }): Promise<CreateUser['Out']> {
  const callInput: CallInput<CreateUser> = {
    CallType: 'Command',
    Type: 'CreateUser',
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
  };
  if (coreService) {
    return coreService.Call<CreateUser>(callInput);
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

export function RenameUser(In: Omit<RenameUser['In'], 'Timestamp'> & { Timestamp?: number }): Promise<RenameUser['Out']> {
  const callInput: CallInput<RenameUser> = {
    CallType: 'Command',
    Type: 'RenameUser',
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
  };
  if (coreService) {
    return coreService.Call<RenameUser>(callInput);
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

export function CreateItem(In: Omit<CreateItem['In'], 'Timestamp'> & { Timestamp?: number }): Promise<CreateItem['Out']> {
  const callInput: CallInput<CreateItem> = {
    CallType: 'Command',
    Type: 'CreateItem',
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
  };
  if (coreService) {
    return coreService.Call<CreateItem>(callInput);
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

export function GetProfile(In: Omit<GetProfile['In'], 'Timestamp'> & { Timestamp?: number }): Promise<GetProfile['Out']> {
  const callInput: CallInput<GetProfile> = {
    CallType: 'Query',
    Type: 'GetProfile',
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
  };
  if (coreService) {
    return coreService.Call<GetProfile>(callInput);
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

export function GetUserList(In: Omit<GetUserList['In'], 'Timestamp'> & { Timestamp?: number }): Promise<GetUserList['Out']> {
  const callInput: CallInput<GetUserList> = {
    CallType: 'Query',
    Type: 'GetUserList',
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
  };
  if (coreService) {
    return coreService.Call<GetUserList>(callInput);
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

export interface SubscribeOptions<T> {
  onError: (err) => void
  onEach: (Out: T) => void
}

export interface SubscribeResult {
  cancel: () => void
}

export function Subscribe<C extends Subscribe>(
  Type: C['Type'],
  In: Omit<C['In'], 'Timestamp'> & { Timestamp?: number },
  options: SubscribeOptions<C['Out']>,
): SubscribeResult {
  if (coreService) {
    throw new Error('Subscribe is not supported on node.js client yet');
  }
  const callInput: CallInput<C> = {
    CallType: 'Subscribe',
    Type,
    In: { ...In, Timestamp: In.Timestamp || Date.now() },
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

export function SubscribeItems(
  In: Omit<SubscribeItems['In'], 'Timestamp'> & { Timestamp?: number },
  options: SubscribeOptions<SubscribeItems['Out']>,
): SubscribeResult {
  return Subscribe<SubscribeItems>('SubscribeItems', In, options);
}
