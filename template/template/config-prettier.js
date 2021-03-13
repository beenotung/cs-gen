#!/usr/bin/env node
let dir = process.argv[2];
let fs = require('fs');
let path = require('path');
let pkgFile = path.join(dir, 'package.json');
let ignoreFile = path.join(dir, '.prettierignore');

let pkg = JSON.parse(fs.readFileSync(pkgFile).toString());
let scripts = pkg.scripts || (pkg.scripts = {});
if (!('format' in scripts)) {
  scripts.format = 'prettier --write "src/**/*.ts"';
}
fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));

let lines = [];
if (fs.existsSync(ignoreFile)) {
  lines = fs
    .readFileSync(ignoreFile)
    .toString()
    .split('\n');
}
console.log({lines,i:lines.includes('*.macro.ts')});
if (!lines.includes('*.macro.ts')) {
  lines.push('*.macro.ts');
}
fs.writeFileSync(ignoreFile, lines.join('\n'));
