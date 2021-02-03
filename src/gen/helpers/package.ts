import semver from 'semver';
import { sortObjectKey } from './object';

export interface Package {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export function addPackage(
  pkg: Package,
  type: keyof Package,
  name: string,
  version: string,
) {
  if (!(type in pkg)) {
    pkg[type] = {};
  }
  const currentVersion = pkg[type][name];
  if (!currentVersion || !semver.satisfies(currentVersion, version)) {
    pkg[type][name] = version;
  }
}

export function addPackages(
  pkg: Package,
  type: keyof Package,
  requiredPackages: Record<string, string>,
) {
  const currentPackages = pkg[type];
  if (!currentPackages) {
    pkg[type] = sortObjectKey(requiredPackages);
    return;
  }
  Object.entries(requiredPackages).forEach(([name, version]) => {
    const currentVersion = currentPackages[name];
    if (!currentVersion || !semver.satisfies(currentVersion, version)) {
      currentPackages[name] = version;
    }
  });
  pkg[type] = sortObjectKey(currentPackages);
}
