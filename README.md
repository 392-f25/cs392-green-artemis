# React + TypeScript + Vite + Vitest

A starter template for building React 19+ apps in TypeScript with Vite and TailwindCSS 4. Includes Vitest for unit testing and
a hefty .gitignore file. React compiler enabled.

# Requirements

Node 22 or greater.

## Usage

```
mkdir your-app-name
cd your-app-name
npx degit criesbeck/react-ts-vitest
npm install
```
Note: degit sometimes fails to say it is done after announcing it has cloned the repo.
If that happens, type control-C and then do `npm install`.

## Test

Verify that the initial app works. Run

```
npm run dev
```

Open the URL displayed. Click on the counter to increment it.

Then verify that the unit tests work with

```
npm test
```

Two tests should run and pass. 

## Scripts

**package.json** defines the following scripts:

| Script           | Description                                         |
| -----------------| --------------------------------------------------- |
| npm run dev      | Runs the app in the development mode.               |
| npm run build    | Builds the app for production to the `dist` folder. |
| npm run serve    | Serves the production build from the `dist` folder. |
| npm test         | Starts a Jest-like test loop                        |
| npm run coverage | Runs the tests, displays code coverage results      |


## Git

If everything is working, set up [your local and remote repositories](https://docs.github.com/en/get-started/importing-your-projects-to-github/importing-source-code-to-github/adding-locally-hosted-code-to-github#adding-a-local-repository-to-github-using-git).

## Folder Structure

```
your-app-name
├── public
│   └── robots.txt
│   ├── vite.svg
└── src
    |-- assets
        └── react.svg
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── vite-env.d.ts
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.son
├── tsconfig.node.json
├── vite.config.ts
```

## Credits

Built and maintained by [Chris Riesbeck](https://github.com/criesbeck).

Inspired by [SafdarJamal/vite-template-react](https://github.com/SafdarJamal/vite-template-react).
Expanded to include Vitest and some sample tests.

Thanks to Rich Harris for [degit](https://www.npmjs.com/package/degit).

Gitignore file created with [the Toptal tool](https://www.toptal.com/developers/gitignore/api/react,firebase,visualstudiocode,macos,windows).


## License

This project is licensed under the terms of the [MIT license](./LICENSE).
