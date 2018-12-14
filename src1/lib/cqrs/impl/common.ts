export let EventHeightType = 'EventHeight';
export type EventHeight = number;

export function toEventHeightId(eventType: string) {
  return EventHeightType + '_' + eventType;
}
