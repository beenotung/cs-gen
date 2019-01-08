import { cqrsEngine } from '../src/config/values';
import { user_command, user_event_type } from '../src/models/user';

cqrsEngine.commandBus.sendCommand({
  aggregate_id: 'beeno-101',
  expected_version: 0,
  type: user_event_type.CreatedUser,
  data: { username: 'beeno' },
} as user_command);
