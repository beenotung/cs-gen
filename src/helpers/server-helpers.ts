export let SkipWhenReplay = 'SkipWhenReplay ';
export const ok: { Success: true } = { Success: true };
export const InvalidToken: { Success: false; Reason: 'InvalidToken' } = {
  Success: false,
  Reason: 'InvalidToken',
};
export const InvalidAppId: { Success: false; Reason: 'InvalidAppId' } = {
  Success: false,
  Reason: 'InvalidAppId',
};
export const QuotaExcess: { Success: false; Reason: 'QuotaExcess' } = {
  Success: false,
  Reason: 'QuotaExcess',
};
export const NoPermission: { Success: false; Reason: 'NoPermission' } = {
  Success: false,
  Reason: 'NoPermission',
};
export const UserNotFound: { Success: false; Reason: 'UserNotFound' } = {
  Success: false,
  Reason: 'UserNotFound',
};
