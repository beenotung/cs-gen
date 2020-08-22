import { Body, Controller, injectNestClient, Post } from 'nest-client/rest'
import { Primus } from 'typestub-primus'
import {
  Call as CallType,
  CallInput,
  CancelSubscribe,
  GetValue,
  SetKV,
  Subscribe as SubscribeType,
  SubscribeByKey,
} from './types'

export interface IPrimus extends Primus {
  send(command: string, data: any, cb?: (data: any) => void): void
}

let resolvePrimus: (primus: IPrimus) => void
export let primusPromise = new Promise<IPrimus>(resolve => {
  resolvePrimus = resolve
})

/**@deprecated use primusPromise instead */
export function usePrimus(f: (primus: IPrimus) => void): void {
  primusPromise.then(f)
}

let coreService: CoreService

@Controller('core')
export class CoreService {
  constructor(baseUrl: string) {
    injectNestClient(this, {
      baseUrl,
    })
  }

  @Post('Call')
  async Call<C extends CallType>(
    @Body() _body: CallInput<C>,
  ): Promise<C['Out']> {
    return undefined as any
  }
}

export function startAPI(
  options:
    | {
        localhost: string
      }
    | {
        mode: 'local' | 'test' | 'prod'
      }
    | {
        baseUrl: string
      },
) {
  const baseUrl: string = (() => {
    if ('baseUrl' in options) {
      return options.baseUrl
    }
    if ('localhost' in options) {
      return `http://${options.localhost}:3000`
    }
    switch (options.mode) {
      case 'local':
        return 'http://localhost:3000'
      case 'test':
        return 'https://example.example.net'
      case 'prod':
        return 'https://example.example.com'
      default:
        throw new Error(
          `Failed to resolve baseUrl, unknown mode: '${options.mode}'`,
        )
    }
  })()
  if (typeof window === 'undefined') {
    coreService = new CoreService(baseUrl)
    return
  }
  const w = window as any
  const primus: IPrimus = new w.Primus(baseUrl)

  primus.on('close', () => {
    console.log('disconnected with server')
  })
  primus.on('open', () => {
    console.log('connected with server')
  })

  resolvePrimus(primus)

  return primus
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
  }
  if (coreService) {
    return coreService.Call<C>(callInput)
  }
  return new Promise((resolve, reject) => {
    primusPromise.then(primus => {
      primus.send('Call', callInput, data => {
        if ('error' in data) {
          reject(data)
          return
        }
        resolve(data)
      })
    })
  })
}

export function CancelSubscribe(
  In: CancelSubscribe['In'],
): Promise<CancelSubscribe['Out']> {
  return Call<CancelSubscribe>('Command', 'CancelSubscribe', In)
}

export function SetKV(In: SetKV['In']): Promise<SetKV['Out']> {
  return Call<SetKV>('Command', 'SetKV', In)
}

export function GetValue(In: GetValue['In']): Promise<GetValue['Out']> {
  return Call<GetValue>('Query', 'GetValue', In)
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
    throw new Error('Subscribe is not supported on node.js client yet')
  }
  const callInput: CallInput<C> = {
    CallType: 'Subscribe',
    Type,
    In,
  }
  let cancelled = false
  const res: SubscribeResult = { cancel: () => (cancelled = true) }
  primusPromise.then(primus => {
    primus.send('Call', callInput, data => {
      if ('error' in data) {
        options.onError(data)
        return
      }
      if (cancelled) {
        return
      }
      const { id } = data
      primus.on(id, data => {
        if (!cancelled) {
          options.onEach(data as any)
        }
      })
      res.cancel = () => {
        cancelled = true
        primus.send('CancelSubscribe', { id })
      }
      if (options.onReady) {
        options.onReady()
      }
    })
  })
  return res
}

export function SubscribeByKey(
  In: SubscribeByKey['In'],
  options: SubscribeOptions<SubscribeByKey['Out']>,
): SubscribeResult {
  return Subscribe<SubscribeByKey>('SubscribeByKey', In, options)
}
