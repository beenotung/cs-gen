import { linesToCode } from '../../../template/gen-code'
import { calls } from '../ts/calls'
import { checkTsType, parseType } from '../ts/elm'

let sample = `
module Calls exposing (..)

type alias CheckUsernameIn =
    { username:String
    }


type alias CheckUsernameOut =
    { success : Bool
    , used : Bool
    }
`

function tsTypeToElm(type: string) {
  // console.log('parse:', type)

  let ast = parseType(type)

  return toElmType(ast.data)
}

function toElmType(tsType: ReturnType<typeof parseType>['data']) {
  console.log('toElmType: type =', tsType.type)
  console.dir(tsType, { depth: 20 })
  console.log(tsType.constructor.name)
  console.log('output:', tsType.elmType)
  return tsType.elmType
}

let lines: string[] = []
lines.push(`module Calls exposing (..)`)
calls.forEach(call => {
  let { Type } = call
  let In = tsTypeToElm(call.In)
  let Out = tsTypeToElm(call.Out)
  lines.push(`type alias ${Type}In = ${In}`)
  lines.push(`type alias ${Type}Out = ${Out}`)
})
linesToCode(lines)
