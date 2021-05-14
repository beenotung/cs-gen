import { writeFile as _writeFile } from '@beenotung/tslib/fs';
import mkdirp from 'async-mkdirp';
import * as path from 'path';

async function writeFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  await _writeFile(filename, code);
}

function genIdeaModuleIml(args: {
  srcDirs?: string[];
  testDirs?: string[];
  excludeDirs?: string[];
}) {
  const srcDirs = args.srcDirs || [];
  const testDirs = args.testDirs || [];
  const excludeDirs = args.excludeDirs || [];
  return `
<?xml version="1.0" encoding="UTF-8"?>
<module type="JAVA_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">
      ${srcDirs
        .sort()
        .map(
          dir =>
            `<sourceFolder url="file://$MODULE_DIR$/${dir}" isTestSource="false" />`,
        )
        .join('\n      ')}
      ${testDirs
        .sort()
        .map(
          dir =>
            `<sourceFolder url="file://$MODULE_DIR$/${dir}" isTestSource="true" />`,
        )
        .join('\n      ')}
      ${excludeDirs
        .sort()
        .map(dir => `<excludeFolder url="file://$MODULE_DIR$/${dir}" />`)
        .join('\n      ')}
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
</module>
`
    .split('\n')
    .filter(s => s.trim())
    .join('\n');
}

function genIdeaModulesXml(projectName: string) {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/.idea/${projectName}.iml" filepath="$PROJECT_DIR$/.idea/${projectName}.iml" />
    </modules>
  </component>
</project>
`.trim();
}

export async function setBaseProjectIdeaConfig(args: {
  outDirname: string;
  baseProjectName: string;
  serverProjectName: string;
  clientProjectName: string;
  adminProjectName: string;
}) {
  const {
    outDirname,
    baseProjectName,
    serverProjectName,
    clientProjectName,
    adminProjectName,
  } = args;
  const appProjectName = clientProjectName.replace('-client', '-app');
  const ideaDir = path.join(outDirname, '.idea');
  await mkdirp(ideaDir);
  await Promise.all([
    writeFile(
      path.join(ideaDir, baseProjectName + '.iml'),
      genIdeaModuleIml({
        excludeDirs: [
          serverProjectName,
          clientProjectName,
          adminProjectName,
          appProjectName,
        ],
      }),
    ),
    writeFile(
      path.join(ideaDir, 'modules.xml'),
      genIdeaModulesXml(baseProjectName),
    ),
  ]);
}

export async function setProjectIdeaConfig(args: {
  projectDirname: string;
  projectName: string;
}) {
  const { projectDirname, projectName } = args;
  await Promise.all([
    writeFile(
      path.join(projectDirname, '.idea', projectName + '.iml'),
      genIdeaModuleIml({
        srcDirs: ['src'],
        testDirs: ['test'],
        excludeDirs: ['dist', 'data', 'www'],
      }),
    ),
    writeFile(
      path.join(projectDirname, '.idea', 'modules.xml'),
      genIdeaModulesXml(projectName),
    ),
  ]);
}
