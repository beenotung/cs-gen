import { CallMeta } from './types'
import { EOL } from 'os'

export function genCallIds(callMetas: CallMeta[]) {
  const lines: string[] = []
  callMetas.forEach(({ type, id }) => {
    lines.push(`${EOL}  ${type}: ${id} as ${id},`)
  })
  const body = lines.join('') + EOL
  const code = `export let ids = {${body}}`
  return code
}
