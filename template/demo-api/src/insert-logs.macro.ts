import { callMetas } from '../config/call-meta'
import { genSqlInserts } from '../helpers/gen-sql-insert'
;`import { db } from '../config/db'
${genSqlInserts(callMetas)}
`
