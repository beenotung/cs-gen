import { IDSL } from 'typedraft'
import {
  ArrayExpression,
  BlockStatement,
  CallExpression,
  ExpressionStatement,
  FunctionDeclaration,
  MemberExpression,
  Statement, StringLiteral,
} from '@babel/types'

/**
 * convert
 * ```
 * {
 *   "use match";
 *   ["a", "b", "c"].map(value => {...})
 * }
 * ```
 *
 * to
 * ```
 * switch(value) {
 *   case "a": {...} break;
 *   case "b": {...} break;
 *   case "c": {...} break;
 * }
 * ```
 * */
export class Match implements IDSL {
  m_Merge: boolean = true

  Transcribe(block: Array<Statement>): Array<Statement> {
    let [use_match,pattern]=block
    const expression = (pattern as ExpressionStatement).expression
    const callee = (expression as CallExpression).callee as MemberExpression
    const tests = (callee.object as ArrayExpression).elements.map((each:StringLiteral)=>each)
    console.log({tests})
    return block
  }

}
