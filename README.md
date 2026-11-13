# FP Chain Edu

The smart contract and blockchain infrastructure for [Immutable Academics](https://github.com/mrkrishna225/final-year-proj).

Contains the Truffle project with Solidity contracts, migration scripts, and a local Ganache
test network setup for credential issuance and verification.

## What's here

- Solidity smart contracts for credential registration and verification
- Truffle migration and deployment scripts
- Ganache config for local Ethereum simulation
- IPFS hash storage and retrieval integration

## Setup

```bash
npm install
truffle compile
truffle migrate --network development
```

Requires [Ganache](https://trufflesuite.com/ganache/) running locally.
