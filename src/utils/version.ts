export function decodeVersion(version: string): number[] {
  const ss = version.split('.');
  const ns = ss.map(s => {
    const x = +s;
    if (x.toString() !== s) {
      throw new TypeError('not numeric version');
    }
    return x;
  });
  switch (ns.length) {
    case 1:
    case 2:
    case 3:
      return ns;
    default:
      throw new Error(
        `not in format of 'major.minor.patch' or 'major.minor' or 'major'`,
      );
  }
}
