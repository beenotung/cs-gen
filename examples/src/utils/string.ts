export function str_filter(s: string, f: (c: string) => boolean): string {
  let acc: string[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (f(c)) {
      acc.push(c)
    }
  }
  return acc.join('')
}
