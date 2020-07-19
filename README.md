# cqrs-exp

Code generated and helper library for rapid development using CQRS (Command Query Responsibility Segregation) design pattern.

**This is not a framework**, instead it's a code generation tool and library to reduce the burden of boilerplate for common tasks in development.

__Under active development.__

## Installation
```bash
> git clone https://gitlab.com/beenotung/cqrs-exp
> cd cqrs-exp
> pnpm i || npm i
> npm i -g .
```
The `cqrs-exp` command will be installed for cli

## Usage

### Show Available Commands
```bash
> cqrs-exp help
cqrs-exp [command]
Commands:
  init  : initialize project skeleton, setup package.json and create scripts/gen-project.ts with default settings
  gen   : generate the client-side SDK for *-client and *-admin project, and stub code for *-server project
  help  : show this help message
```

### Create Project Template
```bash
> mkdir -p ~/workspace/myapp && cd $_

> cqrs-exp init
project name [myapp]:
production server domain [example.com]:
server origin [https://myapp.example.com]:
test server domain [example.net]:
server origin [https://myapp.example.net]:
port [8080]:
app id [com.example.myapp]:
initializing gen-project for 'myapp'
generated skeleton.

> find
.
./.editorconfig
./.prettierrc
./.gitignore
./package.json
./scripts
./scripts/gen-project.ts
```

### Declare Project APIs
The APIs can be declared in `./scripts/gen-project.ts`.
Depending the on project scale, the apis can be declared across multiple files, then imported from the `gen-project.ts`.

When the project skeleton is generated, there are some example Commands and Queries.
Below shows a part of `gen-project.ts`:
```typescript
commandTypes.push(
  { Type: 'CreateUser', In: `{ UserId: string }`, Out: ResultType([UserNotFound]) },
  { Type: 'CreateAdmin', In: `{ UserId: string }`, Out: ResultType([UserNotFound]), Admin },
);
queryTypes.push(
  { Type: 'GetUserList', In: 'void', Out: ResultType([NoPermission], `{ Users: ${ArrayType(`{ UserId: string }`)} }`) },
  { Type: 'HasUser', In: `{ UserId: string }`, Out: ResultType([NoPermission], `{ HasUser: boolean }`), Admin },
);

catchMain(genProject({
  outDirname: '.',
  baseProjectName: "myapp",
  injectTimestampField: true,
  timestampFieldName: 'Timestamp',
  asyncLogicProcessor: true,
  staticControllerReference: true,
  injectFormat: true,
  callTypes: flattenCallMetas({
    commandTypes,
    queryTypes,
    subscribeTypes,
  }),
  serverOrigin: {
    port: 8080,
    prod: "https://myapp.example.com",
    test: "https://myapp.example.net",
  },
  /* default is the inverse, uncomment to reverse the setting */
  // replayCommand: false,
  // replayQuery: true,
  // storeCommand: false,
  // storeQuery: false,
  plugins: { auth: authConfig },
}));
```

#### Declare Type Alias, constant, and authentication plugin
```typescript
import {
  alias,
  authConfig,
  def,
  typeAlias,
  authCommand as _authCommand,
  authQuery as _authQuery,
} from 'cqrs-exp/dist/helpers/gen-project-helpers';
import { genProject } from 'cqrs-exp';

const app_id = "com.example.myapp";
def({ app_id });

let ProfileType = `{
  UserId: string
  Nickname: string
  Bio?: string
  Avatar?: string
  Timestamp: number
}`;
let { type, typeArray } = alias({
  ProfileType,
});

// custom wrapper is possible
function authCommand(Type: string, In: string, Reasons: string[] = []) {
  _authCommand({ Type, In, Reasons });
}
function authQuery(Type: string, In: string, DataType: string, Reasons: string[] = []) {
  _authQuery({ Type, In, Reasons, Out: DataType });
}

// token will be injected as part of API params
authCommand('SetProfile', `{Profile: ${type(ProfileType)}}`, ['UserNotFound']);

// similar for queries
authQuery('GetProfile', `{ProfileUserId: string}`, `{Profile: ${type(ProfileType)}}`, [QuotaExcess, UserNotFound]);

genProject({
  ...
    asyncLogicProcessor: true, // for async auth check with external service / database
    typeAlias,
    plugins: { auth: authConfig },
  ...
})
```

### Generate client-side SDK and server side stub code
```bash
> cqrs-exp gen
```

The myapp-client, myapp-server, and myapp-admin projects will be created / updated accordingly.
(The paths and controller names are configurable in the `./scripts/gen-project.ts`)

## Features
- Command, Query pattern
- Subscription (live query)
- Auto reconnect when network restore from failure
- Auto setup project formatting and package dependencies (tsconfig, tslint, prettier, npm scripts, e.t.c.)

## Todo
- Rewrite string-based code generation to use TypeDraft
- Change the example APIs from UpperCase to javascript convention
