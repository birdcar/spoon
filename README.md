# spoon

The GitHub anti-fork

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/spoon.svg)](https://npmjs.org/package/spoon)
[![Downloads/week](https://img.shields.io/npm/dw/spoon.svg)](https://npmjs.org/package/spoon)
[![License](https://img.shields.io/npm/l/spoon.svg)](https://github.com/nickcannariato/spoon/blob/master/package.json)

<!-- toc -->

- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g spoon
$ spoon COMMAND
running command...
$ spoon (-v|--version|version)
spoon/0.0.1 darwin-x64 node-v12.16.1
$ spoon --help [COMMAND]
USAGE
  $ spoon COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [spoon](#spoon)
- [Usage](#usage)
- [Commands](#commands)
  - [`spoon help [COMMAND]`](#spoon-help-command)
  - [`spoon login [FILE]`](#spoon-login-file)

## `spoon help [COMMAND]`

display help for spoon

```
USAGE
  $ spoon help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `spoon login [FILE]`

describe the command here

```
USAGE
  $ spoon login

OPTIONS
  -h, --help         show CLI help
  -t, --token=token  A GitHub Personal Access Token with at 'repo' & 'delete_repo' scopes
```

_See code: [src/commands/login.ts](https://github.com/nickcannariato/spoon/blob/v0.0.1/src/commands/login.ts)_

<!-- commandsstop -->
