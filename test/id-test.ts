import { eventToId } from '../src/event';

console.log(eventToId({
  aggregate_type: 'user',
  aggregate_id: '1',
  seq: 0,
}));
