import { flattenCallMetas, genProject } from 'cs-gen'
import { catchMain } from '@beenotung/tslib/node'
import { ArrayType } from 'gen-ts-type'
import {
  commandTypes,
  queryTypes,
  subscribeTypes,
  alias,
  typeAlias,
  def,
  constants,
  ResultType,
  authConfig,
  authCommand,
  authQuery,
} from 'cs-gen/dist/helpers/gen-project-helpers'
import {
  Admin,
  Internal,
  OptionalAuth,
  UserNotFound,
  NoPermission,
  Duplicated,
} from 'cs-gen/dist/helpers/constants'

const app_id = 'com.example.example'
def({ app_id })

authConfig.AppId = app_id
// authConfig.ExposeAttemptPrefix = true; // for legacy API

let { type, typeArray } = alias({})

if ('enableSubscription') {
  commandTypes.push({
    Type: `CancelSubscribe`,
    In: `{ id: string }`,
    Out: `{ Success: false, Reason: "no active session matched" | "no active channel matched" } | { Success: true }`,
  })
  subscribeTypes.push({ Type: 'SubscribeByKey', In: `{ Key: string }`, Out: `{ Value: string }` })
}

let KeyNotFound = 'KeyNotFound'

commandTypes.push(
  // this API is available for all users
  { Type: 'SetKV', In: `{ Key: string, Value: string }`, Out: ResultType() },
  // this API is only available for admin sdk
  { Type: 'DeleteByKey', In: `{ Key: string }`, Out: ResultType([KeyNotFound]), Admin },
)
queryTypes.push(
  // this API is available for all users
  { Type: 'GetValue', In: '{ Key: string }', Out: ResultType([KeyNotFound], `{ Value: string }`) },
  // this API is only available for admin sdk
  { Type: 'ListKeys', In: 'void', Out: ResultType([KeyNotFound], `{ Keys: string[] }`), Admin },
)

// this API is available only for login-ed users
// the Out Type is auto wrapped with `{ Success: true } | { Success: false, Reason: 'InvalidToken' }`
// authQuery({ Type: 'GetMyProfile', Out: `{ username: string }` })

let calls = flattenCallMetas({
  commandTypes,
  queryTypes,
  subscribeTypes,
})

// use password to auth Admin APIs
calls.forEach(call => {
  if (call.Admin) {
    call.In = `(${call.In}) & { AdminPassword: string }`
    call.Out = `(${call.Out}) | { Success: false, Reason: 'Wrong Admin Password' }`
  }
})

catchMain(genProject({
  outDirname: '.',
  baseProjectName: 'example',
  injectTimestampField: true,
  timestampFieldName: 'Timestamp',
  asyncLogicProcessor: true,
  staticControllerReference: true,
  injectFormat: true,
  callTypes: calls,
  // ws: false,
  // web: true,
  serverOrigin: {
    'port': 3000,
    'test': 'https://example.example.net',
    'prod': 'https://example.example.com',
  },
  typeAlias,
  constants,
  // replayCommand: false,
  // replayQuery: true,
  // storeCommand: false,
  // storeQuery: false,
  // plugins: { auth: authConfig },
}))
