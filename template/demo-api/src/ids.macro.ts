import { EOL } from 'os'
import { callMetas } from '../config/call-meta'

let body = ``
callMetas.forEach(
  ({ type, id }) => (body += `${EOL}  ${type}: ${id} as const,`),
)
body += EOL
;`export const ids = {${body}}`
