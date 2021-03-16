import { EOL } from 'os'
import { binArrayBy } from '@beenotung/tslib/array'
import { andType, orType } from 'gen-ts-type'

type Type = string

export type CallMeta = {
  CallType: string
  Type: string
  In: Type
  Out: Type
  Feed?: Type // default is no feed
  Replay: boolean
  Async?: boolean // default is sync
}

export function ResultType(Reasons: string[] = [], Data: string = '{}') {
  let type = andType(`{ Success: true }`, Data)
  if (Reasons.length > 0) {
    let Reason = Reasons.map(s => JSON.stringify(s)).join(' | ')
    type = orType(type, `{ Success: false, Reason: ${Reason} }`)
  }
  return type
}

export function genCallTypes(calls: CallMeta[]) {
  let lines: string[] = []
  calls.forEach(call => {
    call.Async = call.Async || false
    let code = `export type ${call.Type} = {
  CallType: ${JSON.stringify(call.CallType)}
  Type: ${JSON.stringify(call.Type)}
  In: ${call.In}
  Out: ${call.Out}`
    if (call.Feed) {
      code += `
  Feed: ${call.Feed || 'undefined'}`
    }
    code += `
  Replay: ${JSON.stringify(call.Replay)}
  Async: ${call.Async}
}`
    lines.push(code)
  })
  let callsByCallType = binArrayBy(calls, call => call.CallType)
  callsByCallType.forEach((calls, CallType) => {
    let names =
      calls.length === 0 ? 'never' : calls.map(call => call.Type).join(' | ')
    lines.push(`export type ${CallType} = ${names}`)
  })
  let names = Array.from(callsByCallType.keys()).join(' | ')
  lines.push(`export type Call = ${names}`)
  lines.push(`export let calls = ${JSON.stringify(calls, null, 2)}`)
  lines.push(`export type CallMeta = (typeof calls)[number]`)
  return lines
}

export function linesToCode(lines: string[]) {
  return lines.join(EOL + EOL).trim() + EOL
}
