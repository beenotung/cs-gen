import { writeFileSync } from 'fs'
import { EOL } from 'os'
import { join } from 'path'

export function saveCode(code: string, ...paths: string[]) {
  const filename = join(...paths)
  code = code.trim() + EOL
  writeFileSync(filename, code)
}
