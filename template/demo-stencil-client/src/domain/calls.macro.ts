import { linesToCode, genCallTypes } from '../../../template/gen-code';
import { apiConfig, calls } from '../../../demo-config/src/calls';

let lines = genCallTypes(calls);
lines.push(`export let apiConfig = ${JSON.stringify(apiConfig)}`);
linesToCode(lines);
