## TODO

### [done] manage subscribe consumer
Currently, client need to use primus.on(id) manually.
And the emitted data is not typed.

### auto re-subscribe when reconnect
Currently, if the device is disconnected,
client need to manually subscribe again when back to online.

### Use Dispatcher
Move common logic of persistent and routing
into dispatcher
instead of controller and service.

The new approach is less dependent to nest.js
and allow less duplication in nest and primus parts.

### Change from overwrite to inject
inject into project,
instead of overwriting entire project

e.g. below file `types.ts`:
```typescript
// some custom types
export type id = string;

// inject command type below
// injected command type above

// some other custom code
```

This approach allow larger flexibility.
Otherwise need to commit the files every time before regenerate, then use meld to compare and restore unwanted parts.

### Automate npm setup
Currently require manually setup tsconfig, tslint, and npm script to do formatting
