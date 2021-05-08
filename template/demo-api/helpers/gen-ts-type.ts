import { inspect } from 'util'
import { ucfirst, lcfirst } from '@beenotung/tslib/string'

export function toTsTypeName(name: string): string {
  return name.split('_').map(ucfirst).join('')
}

export function toTsMethodName(name: string): string {
  name = toTsTypeName(name)
  return lcfirst(name)
}

export function toTsLiteral(type: string) {
  return inspect(type)
}

export function unionTypes<T>(
  types: Iterable<T>,
  mapper: (type: T) => string,
  indent = '',
) {
  let code = ''
  Array.from(types).forEach(type => {
    code += `
${indent}  | ${mapper(type)}`
  })
  return code
}
