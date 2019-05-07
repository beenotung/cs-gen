import { Call } from '../types';

export function genServiceCode(args: {
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  typeNames: string[];
  callTypeName: string;
}) {
  const { callTypeName, serviceClassName, typeDirname, typeFilename } = args;
  const code = `
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ${[callTypeName, ...args.typeNames]
    .sort()
    .join(', ')} } from '../${typeDirname}/${typeFilename.replace(
    /\.ts$/,
    '',
  )}';

function not_impl(name: string): any {
  throw new HttpException('not implemented ' + name, HttpStatus.NOT_IMPLEMENTED);
}

type C = ${callTypeName};

@Injectable()
export class ${serviceClassName} {
  Call(Type: C['Type']): (In: C['In']) => C['Out'] {
    let res: (In: C['In']) => C['Out'];
    switch (Type) {
      ${args.typeNames
        .map(
          s => `case '${s}':
        res = this.${s};
        break;
      `,
        )
        .join('')
        .trim()}
      default:
        const x: never = Type;
        console.log('not implemented call type:', x);
        throw new HttpException('not implemented call type:' + x, HttpStatus.NOT_IMPLEMENTED);
    }
    return res.bind(this);
  }

  ${args.typeNames
    .map(
      s => `${s}(In: ${s}['In']): ${s}['Out'] {
    return not_impl('${s}');
  }

  `,
    )
    .join('')
    .trim()}
}
`;
  return code.trim();
}

function genCallTypesCode(callTypes: Call[]) {
  return callTypes
    .map(
      ({ Type, In, Out }) => `export type ${Type} = {
  Type: '${Type}',
  In: ${In},
  Out: ${Out},
};
`,
    )
    .join('')
    .trim();
}

export function genTypeCode(args: {
  queryTypes: Call[];
  commandTypes: Call[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
}) {
  const {
    callTypeName,
    queryTypeName,
    commandTypeName,
    queryTypes,
    commandTypes,
  } = args;
  const code = `
import { checkCallType } from 'cqrs-exp';

${genCallTypesCode(queryTypes)}

export type ${queryTypeName} = ${queryTypes
    .map(({ Type }) => Type)
    .join(' | ')};

${genCallTypesCode(commandTypes)}

export type ${commandTypeName} = ${commandTypes
    .map(({ Type }) => Type)
    .join(' | ')};

export type ${callTypeName} = ${queryTypeName} | ${commandTypeName};

checkCallType({} as ${callTypeName});
`;
  return code.trim();
}
