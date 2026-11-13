# FP Chain Edu

The smart contract and blockchain infrastructure for
[Immutable Academics](https://github.com/mrkrishna225/final-year-proj).

This repo has the Truffle project — Solidity contracts, migration scripts, and the config for
running against a local Ganache network.

## What's here

- Solidity contracts for credential registration and verification
- Truffle migration and deployment scripts
- Ganache config for local Ethereum simulation
- IPFS hash storage and retrieval

## Setup

Requires [Ganache](https://trufflesuite.com/ganache/) running locally.

```bash
npm install
truffle compile
truffle migrate --network development
```

## Related

The frontend and full application: [final-year-proj](https://github.com/mrkrishna225/final-year-proj)
