import { Primus } from 'typestub-primus'
import { Call, CallInput } from '../domain/types'
import { Result } from '../lib/result'

export const ok: { Success: true } = { Success: true }

export let resolvePrimus: (primus: Primus) => void
export let primusPromise = new Promise<Primus>(resolve => {
  resolvePrimus = resolve
})

export function usePrimus(f: (primus: Primus) => void): void {
  primusPromise.then(f)
}

interface Instance {
  ready: Promise<void>
  storeAndCall<C extends Call>({
    call,
    from,
  }: {
    call: CallInput<C>
    from: 'server' | 'client'
  }): Result<C['Out']>
}

export let instance: Instance = {} as any

export function storeAndCall<C extends Call>(
  call: CallInput<C>,
): Result<C['Out']> {
  return instance.storeAndCall({ call, from: 'server' })
}
