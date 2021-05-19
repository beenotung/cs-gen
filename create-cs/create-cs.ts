#!/usr/bin/env node
import * as path from 'path'
import { cloneTemplate, getDest } from 'npm-init-helper'

function greet(dest: string) {
  console.log(
    `
Done.
Inside that directory, you can run several commands:

  npm start
    (TODO) Starts the development server.
  
  npm run build
    Bundles the app into static files for production.
  
  npm run format
    Runs prettier and eslint with best-effort auto-fixing.

  npm run gen
    Generates or updates typescript files and sql migration file.

  npm test
    Runs test cases.


Typical workflow:

  1. Define the calls in \`${path.join('config', 'call-meta.ts')}\`
  2. Implement the handling logics in \`${path.join(
    'domain',
    'logic-processor',
    'logic-processor.ts',
  )}\`


Get started by typing:

  cd ${dest}
  npm install
  code . ${path.join('config', 'call-meta.ts')}

Then you can replace the sample call metas with your own.


If you run into issues, you can lookup or report on https://github.com/beenotung/cs-gen/issues
`.trim(),
  )
}

async function main() {
  let dest = await getDest()
  await cloneTemplate({
    gitSrc: 'https://github.com/beenotung/cs-gen#template-macro',
    srcDir: path.join('template', 'demo-server'),
    dest,
    showLog: true,
    updatePackageJson: true,
  })
  greet(dest)
}

main().catch(err => console.error(err))
