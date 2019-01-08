import { compare_number } from '@beenotung/tslib/number';

const xs = [1, 3, 2];
xs.sort((a, b) => compare_number(a, b));
console.log(xs);
