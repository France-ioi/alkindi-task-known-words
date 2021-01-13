# Installation

1. `git submodule update --init` to install bebras-modules
2. `yarn install` to install dependencies, see warning below for `@france-ioi/react-task-lib`
3. `yarn build` to build the js packages
4. If you want to use it with a server (see Usage section below), add server modules to bebras-server-modules as described below
5. Install shuffle and range globally by running `yarn global install shuffle range` in that folder.
6. Edit `options.server_module.baseUrl` in `index.html` to point to the bebras-server-modules installation (by default, it should be `http://your.server:3101/`).

## React-task-lib installation

`@franceioi/react-task-lib` is a library to build France IOI tasks with React.js.
To be able to download the library (because it is hosted on Github and not NPM), you have to setup your `~/.npmrc` file:

```
registry=https://registry.npmjs.org/
@france-ioi:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=your_token
```

`your_token` has to be replaced by a Github token you have to generate here: https://github.com/settings/tokens/new

You have to check at least `read:packages` but you are also invited to check `write:packages` if you want to contribute to this library.


## Server modules installation

The folder `server-modules` contains files to be installed with [bebras-server-modules](https://github.com/France-ioi/bebras-server-modules).

1. Install bebras-server-modules as described in its `README.md`
2. Add the task to bebras-server-modules, for instance: go to `bebras-server-modules` folder and then run `node command.js tasks:add http://concours-alkindi.fr/tasks/2020/known-words path_to_known_words/server-modules/index.js`(the task ID `http://concours-alkindi.fr/tasks/2020/known-words` can be changed)

# Usage

The task can be used in two ways: client-only, and with a server.

## Client-only usage

In this case, you don't need to install `bebras-server-modules`.

Just run `yarn start:dev:client` to start developing.

Then run `yarn build:client` to make a client build (will be in the `build` folder).

You can change the settings of the versions in the file `server-modules/index.js`.

## Server usage

You need to install `bebras-server-modules` or a similar server to do this (see above).

### Develop locally

Use `yarn start:dev` to develop locally.

### Use with a platform

Make the files readable by a webserver, and then add the task to a token-generating platform such as [AlgoreaPlatform](https://github.com/France-ioi/AlgoreaPlatform). That platform must be configured to generate tokens using the public key of bebras-server-modules (by default, that public key is stored in `bebras-server-modules/tasks_demo/grader_public.key`).

The URL must contain the task ID set for the server modules, and a version number to select the task difficulty, for instance `http://example.com/alkindi-task-known-words/?taskID=http%3A%2F%2Fconcours-alkindi.fr%2Ftasks%2F2018%2Fknown-words&version=1`.

If you want to use the task locally without a platform, you will need to use the development options below.


#### Devel options

If `DEV_MODE` is enabled on bebras-server-modules, you can send an object instead of the task token, allowing you to easily test the task outside of any token-generating platform and to use custom data.

This object can be specified through the `options.server_module.devel` variable set in `index.html`, which will be sent to bebras-server-modules instead of the task token if it is present.

These keys will be read by the server :
* `itemUrl` (required) : full URL of the task, with the task ID and version number as described in the section above
* `randomSeed` (required) : integer determined the random seed to be used (send the same number each time to test the task with the same data)
* `sHintsRequested` (optional) : a JSON-encoded array of hints (to be) requested to the server

Example of `options` variable with these devel options :
```
var options = {
    server_module: {
        baseUrl: 'http://example.com:3101/',
        devel: {
            itemUrl: "http://example.com/?taskID=http%3A%2F%2Fconcours-alkindi.fr%2Ftasks%2F2018%2Fenigma&version=1",
            randomSeed: 1,
            sHintsRequested: "[{\"rotorIndex\": 0, \"cellRank\": 1}]"
        }
    },
};
```
