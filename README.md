# cqrs-exp

Code generator for rapid development using CQRS (Command Query Responsibility Segregation) design pattern.

**This is not a framework**, instead it's a code generation tool to reduce the burden of boilerplate for common tasks in the development of web server and backend system with Typescript.

Any required library are injected to the target project, hence the resulting project does not have runtime dependency on this package.

This toolkit has been used in production by 30+ projects and micro-services for over 1 year.
The rough edges are getting polished and patched overtime hence it is considered to be "production-ready" for small to middle scale of application.

__Under active development.__

## System Architecture

Details analysis can be found in https://github.com/beenotung/cqrs-documents

### Background: The typical architecture
Typical applications follows 3-tier web architecture
which consists of the presentation tier, logic tier, and data tier.
Namely, the web/app client, web server, and database (usually RDBMs or NoSQL Database).

The business logic is usually handled by the domain model on the web server and validation constraints in the RDBMs.

The web server usually implements the domain model using Object-Oriented-Programming (OOP)
while the database usually model the dataset in normalized format.

### The Problem with typical architecture

Database is optimized for writing
but typical application area read-heavy.
Usually over 90% traffics are read nature.
reference: [1% rule (Internet culture)](https://en.wikipedia.org/wiki/1%25_rule_(Internet_culture))

### Solution: A simplified architecture

## Features
- Model API calls as command, query, and subscription (live query)
- Auto store API calls
- Auto replay API calls when server restart
- Customize which API calls to be stored and replayed
- Auto reconnect when network restore from failure
- Auto setup package dependencies and formatting (tsconfig, tslint, prettier, npm scripts, e.t.c.)

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
The APIs of the project can be declared in `./scripts/gen-project.ts`.
Depending on project the scale, the APIs can be declared across multiple files, then imported from the `gen-project.ts`.

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
  callTypes: flattenCallMetas({ commandTypes, queryTypes, subscribeTypes }),
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
}));
```

#### Declare Type Alias, constant, and authentication plugin
```typescript
import {
  commandTypes, queryTypes, subscribeTypes,
  alias,
  authConfig,
  def,
  typeAlias,
  authCommand as _authCommand,
  authQuery as _authQuery,
} from 'cqrs-exp/dist/helpers/gen-project-helpers';
import { flattenCallMetas, genProject } from 'cqrs-exp'

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
  callTypes: flattenCallMetas({ commandTypes, queryTypes, subscribeTypes }),
  typeAlias,
  plugins: { auth: authConfig },
  ...
})
```

#### Options of genProject
The complete list of options can be found in `cqrs-exp/dist/gen/gen-file.d.ts` in the node.js module, or [src/gen/gen-file.ts](src/gen/gen-file.ts) in the source code.

Some of them are optional with default value stored in `defaultGenProjectArgs` in the same file.

### Generate client-side SDK and server side stub code
```bash
> cqrs-exp gen
```

The myapp-client, myapp-server, and myapp-admin projects will be created / updated accordingly.
(The paths and controller names are configurable in the `./scripts/gen-project.ts`)

## Todo
- Rewrite string-based code generation to use TypeDraft
- Change the example APIs from UpperCase to javascript convention
- Write as express middleware
- Explain it's good at supporting testing snapshot of data with different version of build,
  ref: [wiki](https://en.m.wikipedia.org/wiki/Software_release_life_cycle)
