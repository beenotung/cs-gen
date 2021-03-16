import {
  Call,
  CheckUsername,
  CreateUser,
  Query,
} from '../../../demo-common/src/calls'
type Model = {}
let init: Model = {}
type Msg = Call

export class LogicalProcessor {
  CreateUser(In: CreateUser['In']): CreateUser['Out'] {
    return { Success: true }
  }
  CheckUsername(In: CheckUsername['In']): CheckUsername['Out'] {
    return { used: true }
  }
}

export function process(msg: Msg): [Model, Query['Out']] {
  switch (msg.Type) {
    case 'CreateUser':
    default:
      return model
  }
}
