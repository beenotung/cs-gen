import { is, not } from 'ts-class-validator';
export { or } from 'ts-class-validator';

export function requireField(name: string) {
  return is.required().message(`${name} is required`);
}

export function nonEmptyField(name: string) {
  return not.empty().message(`${name} is required to be non-empty`);
}
