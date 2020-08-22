import { Call, CallInput } from '../domain/types';
import { Result } from '../lib/result';
import { CoreController } from './core.controller';

export function storeAndCall<C extends Call>(
  call: CallInput<C>,
): Result<C['Out']> {
  return CoreController.instance.storeAndCall({ call, from: 'server' });
}

export const ok: { Success: true } = { Success: true };