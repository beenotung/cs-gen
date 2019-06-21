## TODO
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
Otherwise need to commit the files everytime before regenerate, then use meld to compare and restore unwanted parts.
