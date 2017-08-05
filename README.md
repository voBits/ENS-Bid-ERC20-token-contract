# ENS (Ethereum Name Service) Bid Token Contracts
Implementations ERC20 token contract for ens-bid project.

## Contracts

Contract structure
```
EnsBidToken
```

ENSBidToken.sol: ERC20 for ens-bid.

# Getting started

Install Truffle

```
$ npm install -g truffle
```

Launch the RPC client, for example TestRPC:
```
$ testrpc
```

Deploy `ENSBidToken` to the private network, the deployment process is defined at [here](./migrations/2_deploy_contracts.js):

```
$ truffle migrate --reset
```

Check the truffle [documentation](http://truffleframework.com/docs/) for more information.

# Reviewers And Audits

Code for the ens-bid is being reviewed by:

- [Phyrex Tsai](https://github.com/PhyrexTsai), Author.
