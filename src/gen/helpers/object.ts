export function sortObjectKey<T extends object>(json: T): T {
  const src: any = json;
  const res: any = {};
  Object.keys(json)
    .sort()
    .forEach(key => (res[key] = src[key]));
  return res;
}
