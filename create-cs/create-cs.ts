#!/usr/bin/env node
import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'
import degit from 'degit'

async function clone(dest: string) {
  let src = 'https://github.com/beenotung/cs-gen#template-macro'
  console.log('Cloning from', src, '...')
  let git = degit(src)
  // git.on('info', info => console.log(info.message))
  git.on('warn', info => console.warn(info.message))
  await git.clone(dest)
}

async function getDest() {
  let dest = process.argv[2]
  if (!dest) {
    let io = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    dest = await new Promise(resolve =>
      io.question('project-directory: ', resolve),
    )
    io.close()
  }
  if (!dest) {
    console.error('Please specify the project directory')
    process.exit(1)
  }
  if (fs.existsSync(dest)) {
    console.error('Error:', dest, 'already exists')
    process.exit(1)
  }
  return dest
}

function setup(repoDir: string, dest: string) {
  console.log('Creating a new command souring module in', dest, '...')
  let src = path.join(repoDir, 'template', 'demo-server')
  fs.renameSync(src, dest)
}

function cleanup(repoDir: string) {
  fs.rmdirSync(repoDir, { recursive: true })
}

function greet(dest: string) {
  console.log(
    `
Done.
Inside that directory, you can run several commands:

  npm start
    (TODO) Starts the development server.
  
  npm run build
    (TODO) Bundles the app into static files for production.
  
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
  let repoDir = fs.mkdtempSync(dest + '.tmp')
  await clone(repoDir)
  try {
    setup(repoDir, dest)
  } finally {
    cleanup(repoDir)
  }
  greet(dest)
}

main().catch(err => console.error(err))
