import { EOL } from 'os'
import { binArrayBy } from '@beenotung/tslib/array'
import { andType, orType } from 'gen-ts-type'

export type CallMeta = {
  CallType: string
  Type: string
  In: string
  Out: string
  Feed?: string
  Replay: boolean
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
    lines.push(`export type ${call.Type} = {
  CallType: ${JSON.stringify(call.CallType)}
  Type: ${JSON.stringify(call.Type)}
  In: ${call.In}
  Out: ${call.Out}
  Replay: ${JSON.stringify(call.Replay)}
}`)
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
