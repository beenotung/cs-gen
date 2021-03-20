#!/usr/bin/env node
let fs = require('fs')
let path = require('path')
let os = require('os')

let targetDir = process.argv[2]
let targetPkgFile = path.resolve(path.join(targetDir, 'package.json'))
let targetPkg = require(targetPkgFile)
let targetIgnoreFile = path.join(targetDir, '.prettierignore')

let rootDir = path.join(__dirname, '..')
let rootPkg = require('../package')
let rootIgnoreFile = path.join(rootDir, '.prettierignore')
let rootIgnoreLines = fs.readFileSync(rootIgnoreFile).toString().split(os.EOL)

let scripts = targetPkg.scripts || (targetPkg.scripts = {})
if (!scripts.format) {
  scripts.format = rootPkg.scripts.format
}
fs.writeFileSync(targetPkgFile, JSON.stringify(targetPkg, null, 2))

let targetIgnoreLines = []
if (fs.existsSync(targetIgnoreFile)) {
  targetIgnoreLines = fs.readFileSync(targetIgnoreFile).toString().split(os.EOL)
}
rootIgnoreLines.forEach(line => {
  if (!targetIgnoreLines.includes(line)) {
    targetIgnoreLines.push(line)
  }
})
fs.writeFileSync(targetIgnoreFile, targetIgnoreLines.join(os.EOL))
