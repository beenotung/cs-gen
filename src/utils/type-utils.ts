import { GeneralTypeSelector } from '../cqrs/types/data.types';

export function isTypeMatch(type: string, typeSelector: GeneralTypeSelector) {
  if (typeSelector === 'all') {
    return true;
  }
  if (Array.isArray(typeSelector)) {
    return typeSelector.indexOf(type) !== -1;
  }
  return false;
}
