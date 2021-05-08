import { storeAndCall } from '../src/engine-helpers'
import { ids } from '../src/types'

storeAndCall({
  id: ids.change_username,
  in: { from_username: '', to_username: '' },
})
