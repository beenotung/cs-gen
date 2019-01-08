
export function isString(e: void | string | Promise<void> | Promise<string>): Promise<boolean> {
  if (typeof e === 'string') {
    return Promise.resolve(true);
  }
  if (typeof e === 'undefined') {
    return Promise.resolve(false);
  }
  return (e as Promise<void | string>).then(isString);
}
