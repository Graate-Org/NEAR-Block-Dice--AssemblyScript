# Block-Dice

This repository includes a complete Smart Contract for a dice game built on the NEAR blockchain. This is the first variant of the smart contract with a fault.

- The error in the the smart contract is that you can see what other players rolled before a game has ended, this gives those joining late an edge as they can make a decision based on what other players rolled. This will be corrected in the second variant.


For additional informtion on the smart contract methods view [here](src/block-dice/)

```

It's a simple contract demonstrating how to build a dice game on the NEAR blockchain using AssemblyScript:
- Why you should avoid leaks and have data restrictions on your smart contracts
- How to implement random number generation and id checks on the NEAR blockchain


## Usage

### Getting started

1. clone this repo to a local folder
2. run `yarn`
3. run `yarn test:unit`

### Top-level `yarn` commands

- run `yarn test` to run all tests
- run `yarn build` to quickly verify build status
- run `yarn clean` to clean up build folder

### Other documentation

- Sample contract and test documentation
  - see `/src/block-dice/README` for contract interface
  - see `/src/block-dice/__tests__/README` for Sample unit testing details
```
