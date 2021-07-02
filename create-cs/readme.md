# create-cs

The npm init script for [cs-gen](https://github.com/beenotung/cs-gen/tree/template-macro) - a project template adopting command sourcing design pattern

## Usage Example

Start a new cs-gen project with `npm init`, for example:

```bash
> npm init cs
project directory: <input-project-name-here>
```

You can also specify the project name as the command line parameter. For example:

```bash
> npm init cs my-server
```

Sample output:
```
Cloning from https://github.com/beenotung/cs-gen#template-macro ...
Creating a new project in my-server ...
Done.
Inside that directory, you can run several commands:

  npm start
    (TODO) Starts the development server.
  
  npm run build
    Bundles the app into static files for production.
  
  npm run format
    Runs prettier and eslint with best-effort auto-fixing.

  npm run gen
    Generates or updates typescript files and sql migration file.

  npm test
    Runs test cases.


Typical workflow:

  1. Define the calls in `config/call-meta.ts`
  2. Implement the handling logics in `domain/logic-processor/logic-processor.ts`


Get started by typing:

  cd my-server
  npm install
  code . config/call-meta.ts

Then you can replace the sample call metas with your own APIs.


If you run into issues, you can lookup or report on https://github.com/beenotung/cs-gen/issues
```

## License
This is free and open-source software (FOSS) with
[BSD-2-Clause License](./LICENSE)
