import { callMetas } from '../config/call-meta'
import { genInsertFileContent } from '../helpers/gen-sql-insert'
;`import { db } from '../config/db'
${genInsertFileContent(callMetas)}
`
