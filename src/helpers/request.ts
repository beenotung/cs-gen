import { IncomingMessage } from 'http';

export function jsonBody(req: IncomingMessage): Promise<any> {
  return new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk.toString());
    req.on('end', () => {
      let body = JSON.parse(data);
      resolve(body);
    });
    req.on('error', err => {
      reject(err);
    });
  });
}
