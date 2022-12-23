# SpadesJS

An [Ace Of Spades](https://en.wikipedia.org/wiki/Ace_of_Spades_(video_game)) server implementation in javascript for [Node.js](https://nodejs.org/)

This is an extremely rough implementation, so don't expect packet validation or an anticheat.
For now, only some packets are handled and there are no physics.

## Getting Started
### Installing
- `$ git clone https://github.com/TheFireBlast/spades-js`
- `$ cd spades-js`
- `$ pnpm install`
  - or `$ npm install`

### Running
- `$ pnpm build`
  - or `$ npm run build`
- `$ node dist/src`

## Development
Use `$ pnpm swc-node src/index.ts` to run on a terminal

To debug, just press F5 in VSCode.

Use `$ pnpm test` to run tests or just `$ pnpm test:mocha` if you don't want to typecheck.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details

## Other Implementations
| Name        | Versions | Language   | Repository                                 |
| ----------- | -------- | ---------- | ------------------------------------------ |
| piqueserver | 0.75     | Python     | https://github.com/piqueserver/piqueserver |
| PySnip      | 0.75     | Python     | https://github.com/NateShoffner/PySnip     |
| SpadesX     | 0.75     | C          | https://github.com/SpadesX/SpadesX         |
| SpadesJS    | 0.75     | Javascript | https://github.com/TheFireBlast/spades-js  |

<!-- | spades-rust | 0.75     | Rust       | https://github.com/TheFireBlast/spades-rust | -->
