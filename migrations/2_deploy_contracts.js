var ENSBidToken = artifacts.require("./ENSBidToken.sol");

module.exports = function(deployer) {
  deployer.deploy(ENSBidToken);
};
