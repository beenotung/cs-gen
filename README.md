## TODO
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
