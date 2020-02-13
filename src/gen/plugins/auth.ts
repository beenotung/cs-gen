import { CallMeta } from '../../types';

export type AuthPluginOptions = {
  ImportFile: string;
  MethodAuthCall: string;
  MethodAuthSubscribe: string;
  MethodCheckAppId: string;
  AttemptPrefix: string;
  AuthPrefix: string;
  ExposeAttemptPrefix: boolean; // for legacy code
  InjectUserId: boolean; // disable for custom auth logic
  InjectAppId: boolean; // disable for custom auth logic
  AppId?: string; // only allow token of this app_id
};
export let DefaultAuthConfig: AuthPluginOptions = {
  AttemptPrefix: 'Attempt',
  AuthPrefix: 'Auth',
  ImportFile: '../domain/core/server-utils',
  MethodAuthCall: 'authCall',
  MethodAuthSubscribe: 'authSubscribe',
  MethodCheckAppId: 'checkAppId',
  ExposeAttemptPrefix: false,
  InjectUserId: true,
  InjectAppId: true,
};

export function startsWith(Type: string, prefix: string): boolean {
  return Type.length > prefix.length && Type.startsWith(prefix);
}

export function genAuthServiceMethod({
  call,
  auth,
  invokeCode,
  subscribeTypeName,
}: {
  call: CallMeta;
  auth: AuthPluginOptions;
  invokeCode: string;
  subscribeTypeName: string;
}): string {
  const { Type } = call;
  if (
    !call.OptionalAuth &&
    !call.Internal &&
    !auth.ExposeAttemptPrefix &&
    !startsWith(Type, auth.AttemptPrefix) &&
    !startsWith(Type, auth.AuthPrefix)
  ) {
    return `return this.${auth.AttemptPrefix + Type}(In)`;
  }
  if (call.OptionalAuth) {
    // prettier-ignore
    return `if (In.token) {
      return this.${auth.AttemptPrefix + Type}(In as ${Type}['In'] & { token: string });
    }
    ${invokeCode}`;
  }
  if (call.RequiredAuth) {
    const authMethod =
      call.CallType === subscribeTypeName
        ? auth.MethodAuthSubscribe
        : auth.MethodAuthCall;
    const callType = JSON.stringify(call.CallType);
    const type = Type.replace(auth.AttemptPrefix, auth.AuthPrefix);
    const typeStr = JSON.stringify(type);
    return `return ${authMethod}<${type}>(${callType}, ${typeStr}, In);`;
  }
  return invokeCode;
}
