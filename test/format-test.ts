import * as fs from 'fs';
import { formatString } from '../src/gen/gen-code';

let inStr =
  '\\nArray<{\n  Type: \'MadeOffer\',\n  RequestId: string,\n  Requester: \n/* Example: {\n ` \\"UserId": "user-123",\n  "Nickname": "Alice",\n  "Avatar": "/file/QmYfRjztpTYbGEqjWwzwX6XMr3qAqSo6wJBRLYZt3CvB2V"\n}\n */\n{ "UserId": string; "Nickname": string; "Avatar": string }\n,\n  Title: string,\n  Timestamp: number,\n} | {\n  Type: \'ReceivedOffer\',\n  RequestId: string,\n  Provider: \n/* Example: {\n  "UserId": "user-123",\n  "Nickname": "Alice",\n  "Avatar": "/file/QmYfRjztpTYbGEqjWwzwX6XMr3qAqSo6wJBRLYZt3CvB2V"\n}\n */\n{ "UserId": string; "Nickname": string; "Avatar": string }\n,\n  Title: string,\n  Timestamp: number,\n} | {\n  Type: \'MadeRequest\',\n  RequestId: string,\n  Title: string,\n  Timestamp: number,\n} | {\n  Type: \'MatchedRequest\',\n  RequestId: string,\n  Requester: \n/* Example: {\n  "UserId": "user-123",\n  "Nickname": "Alice",\n  "Avatar": "/file/QmYfRjztpTYbGEqjWwzwX6XMr3qAqSo6wJBRLYZt3CvB2V"\n}\n */\n{ "UserId": string; "Nickname": string; "Avatar": string }\n,\n  Keyword: string,\n  Title: string,\n  Timestamp: number,\n}>';
let outStr = eval(formatString(inStr));
if (inStr !== outStr) {
  fs.writeFileSync('in.txt', inStr);
  fs.writeFileSync('out.txt', outStr);
  console.error('not matching');
  process.exit(1);
} else {
  console.log('matched');
}
