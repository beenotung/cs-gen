import { Body, Controller, injectNestClient, Post } from 'nest-client'
import { Primus } from 'typestub-primus'
import { Call as CallType, CallInput, DeleteByKey, ListKeys } from './types'

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

export function DeleteByKey(
  In: DeleteByKey['In'],
): Promise<DeleteByKey['Out']> {
  return Call<DeleteByKey>('Command', 'DeleteByKey', In)
}

export function ListKeys(In: ListKeys['In']): Promise<ListKeys['Out']> {
  return Call<ListKeys>('Query', 'ListKeys', In)
}
