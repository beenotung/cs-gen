import { EOL } from 'os'

export function formatCode(code: string) {
  return removeTailingSpaces(code).trim() + EOL
}

function removeTailingSpaces(code: string) {
  return code
    .split(EOL)
    .map(line => line.trimEnd())
    .join(EOL)
}
