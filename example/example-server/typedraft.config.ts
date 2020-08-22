import { Match } from './src/dsl/match'

export default {
  DSLs: [
    {
      name: 'match',
      dsl: () => new Match(),
    },
  ],
}
