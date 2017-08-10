# ENS (Ethereum Name Service) Bid Token Contracts
Implementations ENS-Bid ERC20 token contract for the Ethereum Name Service.

## Technical Definition
 
At the technical level ENSBidToken are a ERC20-compliant tokens.  
Symbol will named: EBT.

## Techincal Stack

Use `truffle` to create, compile, deploy and test smart contract.  
Use `open zeppelin` for smart contract security.  
Use `testrpc` for local testing.

## Testing

See [test](test) for details.

## Contracts

[ENSBidToken.sol](./contracts/ENSBidToken.sol): Main contract for the token, ENS-Bid follows ERC20 standard.  
[BasicToken.sol](./contracts/token/BasicToken.sol): ERC20Basic.sol interface implementation.  
[StandardToken.sol](./contracts/token/StandardToken.sol): ERC20.sol interface implementation.  
[ERC20.sol](./contracts/token/ERC20.sol): ERC20 standard interfaces.  
[ERC20Basic.sol](./contracts/token/ERC20Basic.sol): ERC20 basic interfaces.  
[Ownable.sol](./contracts/ownership/Ownable.sol): Owner ship.  
[SafeMath.sol](./contracts/math/SafeMath.sol): Math operations with safety checks.  

# Reviewers And Audits

Code for the EnsBid is being reviewed by:

- [Phyrex Tsai](https://github.com/PhyrexTsai), Author.
