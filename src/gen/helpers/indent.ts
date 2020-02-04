export function addIndentation(code: string, indentation: string): string {
  return code
    .split('\n')
    .map(line => indentation + line)
    .join('\n');
}
