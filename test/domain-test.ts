import { cqrsEngine } from '../src/config/values';
import { user_command, user_command_type } from '../src/models/user';

cqrsEngine.sendCommand({
  aggregate_id: 'beeno-101',
  type: user_command_type.CreateUser,
  expected_version: 0,
  data: { username: 'beeno' },
} as user_command);
