export function wrapResult(
  type: string,
  args: {
    asyncLogicProcessor: boolean;
  },
) {
  return args.asyncLogicProcessor ? `Result<C['Out']>` : `C['Out']`;
}
