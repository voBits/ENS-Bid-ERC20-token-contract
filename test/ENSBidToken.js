var sleep = require("sleep");
var ENSBidToken = artifacts.require("../contracts/ENSBidToken.sol");

contract("ENSBidToken", function(accounts) {
  var tokenExchangeRate = 10000000000000000;
  var unixTime = Math.round(new Date() / 1000);
  var lockoutTime = 5;

  /**
   * 1.1 before owner initialize should fail when send transaction
   */
  it("1.1. before owner initialize should fail when send transaction", function() {
    var ensBidToken;
    var ether = 1;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      web3.eth.sendTransaction({ from: accounts[1], to: ensBidToken.address, value: web3.toWei(ether, "ether"), gas: 200000 });
    }).catch(function(err) {
      assert.isDefined(err, "transaction should have thrown");
    });
  });

  /**
   * 1.2 owner send wrong parameters should fail
   */
  it("1.2. owner send wrong parameters should fail", function() {
    var ensBidToken;
    var name = "ENSBidToken";
    var symbol = "EBT";
    var decimals = 0;
    var startBlock = web3.eth.blockNumber;            // each transaction will add 1 block number
    var endBlock = web3.eth.blockNumber + 10000;
    var ownerWalletAddress = accounts[0];
    var initializedTime = 0;                      
    var lockoutTime = 0;
    var minInvestInWei = 10000000000000000;             // 購買 Token 最小單位
    var maxTokenSupply = 1000000;
    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.initialize(
        name,
        symbol,
        decimals,
        ensBidToken.address,
        ownerWalletAddress,
        startBlock, 
        endBlock, 
        initializedTime,
        lockoutTime,
        minInvestInWei,
        maxTokenSupply);
    }).catch(function(err) {
      assert.isDefined(err, "initialize fail");
      return ensBidToken.initialized.call();
    }).then(function(initialized) {
      assert.equal(initialized, false, "initialized fail wasn't correctly");
    });
  });

  /**
   * 1.3 owner send correct parameters should success
   */
  it("1.3. owner send correct parameters should success", function() {
    var ensBidToken;
    var name = "ENSBidToken";
    var symbol = "EBT";
    var decimals = 0;
    var startBlock = web3.eth.blockNumber + 2;    // each transaction will add 1 block number
    var endBlock = web3.eth.blockNumber + 10;
    var ownerWalletAddress = accounts[0];
    var initializedTime = unixTime;             
    var lockoutTime = 60 * 60 * 24 * 365;         // 預設鎖定一年，測試的時候可以減少時間
    lockoutTime = 10;
    var minInvestInWei = 10000000000000000;       // 購買 Token 最小單位
    var maxTokenSupply = 10000;
    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.initialize(
        name,
        symbol,
        decimals,
        ensBidToken.address,
        ownerWalletAddress,
        startBlock, 
        endBlock, 
        initializedTime,
        lockoutTime,
        minInvestInWei,
        maxTokenSupply);
    }).then(function() {
      return ensBidToken.initialized.call();
    }).then(function(initialized) {
      assert.equal(initialized, true, "initialized wasn't correctly");
    });
  });

  /**
   * 2.1. less then ether limit: buy token fail 
   */
  it("2.1. less then ether limit: buy token fail", function() {
    var ensBidToken;
    var ether = 0.001;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      web3.eth.sendTransaction({ from: accounts[3], to: ensBidToken.address, value: web3.toWei(ether, "ether"), gas: 2000000 });
    }).catch(function(err) {
      assert.isDefined(err, "transaction should have thrown");
    });
  });

  /**
   * 2.2. over then ether limit should success
   * 2.3. should refund when more then expect ether
   */
  it("2.2. over then ether limit should success \r\n      2.3. should refund when more then expect ether", function() {
    var ensBidToken;
    var ether = 2.001;
    var realEther = 2;
    var sender_start_amount;
    var sender_end_amount;
    var owner_start_amount;
    var owner_end_amount;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      owner_start_amount = web3.eth.getBalance(accounts[0]).toNumber();
      sender_start_amount = web3.eth.getBalance(accounts[2]).toNumber();
      return ensBidToken.initialized.call();
    }).then(function(initialized) {
      assert.equal(initialized, true, "contract wasn't initalize");
      web3.eth.sendTransaction({ from: accounts[2], to: ensBidToken.address, value: web3.toWei(ether, "ether"), gas: 2000000 });
      return ensBidToken.totalSupply.call();
    }).then(function(totalSupply) {
      assert.equal(totalSupply, web3.toWei(realEther, "ether") * 2 / tokenExchangeRate, "total supply wasn't correctley");
      return ensBidToken.balanceOf(accounts[2]);
    }).then(function(balance) {
      owner_end_amount = web3.eth.getBalance(accounts[0]).toNumber();
      sender_end_amount = web3.eth.getBalance(accounts[2]).toNumber();
      assert.equal(web3.fromWei(owner_start_amount), web3.fromWei(owner_end_amount) - realEther, "owner wasn't accept ether correctley");
      assert.equal(sender_end_amount < sender_start_amount, true, "sender wasn't send ether correctley");
      assert.equal(balance.valueOf(), web3.toWei(realEther, "ether") / tokenExchangeRate, "token amount wasn't correctly in the first account");

      web3.eth.sendTransaction({ from: accounts[4], to: ensBidToken.address, value: web3.toWei(ether, "ether"), gas: 2000000 });
    });
  });

  /**
   * 3.1. anyone should finalize fail when not over end block
   */
  it("3.1. anyone should finalize fail when not over end block", function() {
    var ensBidToken;
    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.finalize({from: accounts[5]});
    }).then(function() {
      assert.equal(false, true, "finalize call wasn't correctly");
    }).catch(function(err) {
      assert.isDefined(err, "finalize fail");
      return ensBidToken.finalizedTime.call();
    }).then(function(finalizedTime) {
      assert.equal(finalizedTime, 0, "finalizedTime wasn't correctly");
      return ensBidToken.finalizedBlock.call();
    }).then(function(finalizedBlock) {
      assert.equal(finalizedBlock, 0, "finalizedTime wasn't correctly");
    });
  });

  /**
   * 3.2. owner should finalize at anytime, before or after end block
   */
  it("3.2. owner should finalize at anytime, before or after end block", function() {
    var ensBidToken;
    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.finalize({from: accounts[0]});
    }).then(function() {
      return ensBidToken.finalizedTime.call();
    }).then(function(finalizedTime) {
      assert.equal(finalizedTime > 0, true, "finalizedTime wasn't correctly");
      return ensBidToken.finalizedBlock.call();
    }).then(function(finalizedBlock) {
      assert.equal(finalizedBlock.toNumber(), web3.eth.blockNumber, "finalizedBlock wasn't correctly");
    });
  });

  /**
   * 3.3. anyone should fail send transaction after finalize
   */
  it("3.3. anyone should fail send transaction after finalize", function() {
    var ensBidToken;
    var ether = 3;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      web3.eth.sendTransaction({ from: accounts[6], to: ensBidToken.address, value: web3.toWei(ether, "ether"), gas: 2000000 });
    }).then(function() {
      assert.equal(false, true, "transaction wasn't fail correctly");
    }).catch(function(err) {
      assert.isDefined(err, "transaction should have thrown");
    });
  });

  /**
   * 4.1. new payee should add to payee list correctly
   * 4.2. payee should transfer success when contract non paused
   */
  it("4.1. new sender should add to sender list correctly \r\n      4.2. sender should transfer success when contract non paused", function() {
    var ensBidToken;
    var token = 1;
    var receiver_start_token;
    var receiver_end_token;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_start_token = balance.valueOf();
      return ensBidToken.transfer(accounts[3], token, {from: accounts[2]});
    }).then(function() {
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_end_token = balance.valueOf();
      assert.equal(receiver_end_token - token, receiver_start_token, "token transfer wasn't correctly");
    });
  });

  /**
   * 5.1. should pause contract success
   */
  it("5.1. should pause contract success", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.pauseContract();
    }).then(function() {
      return ensBidToken.paused.call();
    }).then(function(paused) {
      assert.equal(paused, true, "pause contract wasn't correctly");
    });
  });

  /**
   * 4.3. sender should transfer fail when contract paused
   */
  it("4.3. sender should transfer fail when contract paused", function() {
    var ensBidToken;
    var token = 1;
    var receiver_start_token;
    var receiver_end_token;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_start_token = balance.valueOf();
      return ensBidToken.transfer(accounts[3], token, {from: accounts[2]});
    }).then(function() {
      assert.equal(false, true, "sender transfer fail when contract paused wasn't correctly");
    }).catch(function(err) {
      assert.isDefined(err, "transfer fail when contract paused");
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_end_token = balance.valueOf();
      assert.equal(receiver_end_token, receiver_start_token, "token transfer wasn't correctly");
    });
  });

  /**
   * 4.4. over token limit should fail
   */
  it("4.4. over token limit should fail", function() {
    var ensBidToken;
    var token = 10;
    var receiver_start_token;
    var receiver_end_token;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_start_token = balance.valueOf();
      return ensBidToken.transfer(accounts[3], token, {from: accounts[2]});
    }).then(function() {
      assert.equal(false, true, "sender transfer fail wasn't correctly");
    }).catch(function(err) {
      assert.isDefined(err, "transfer fail when contract paused");
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_end_token = balance.valueOf();
      assert.equal(receiver_end_token, receiver_start_token, "token transfer wasn't correctly");
    });
  });

  /**
   * 4.5. allow another sender to withdraw from origin sender account
   */
  it("4.5. allow another sender to withdraw from origin sender account \r\n      " + 
    "4.6. returns the amount which another sender is still allowed to withdraw from origin sender", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.approve(accounts[7], 1, {from: accounts[4]});
    }).then(function() {
      return ensBidToken.allowance(accounts[4], accounts[7]);
    }).then(function(remaing) {
      assert.equal(remaing, 1, "remaing token amount wasn't correctly");
    });
  });

  /**
   * 5.2. should resume contract success
   */
  it("5.2. should resume contract success", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.resumeContract();
    }).then(function() {
      return ensBidToken.paused.call();
    }).then(function(paused) {
      assert.equal(paused, false, "resume contract wasn't correctly");
    });
  });

  /**
   * 4.7. sender transfer tokens from one address to another
   */
  it("4.7. sender transfer tokens from one address to another", function() {
    var ensBidToken;
    var sender_start_token;
    var sender_end_token;
    var receiver_start_token;
    var receiver_end_token;
    var token = 1;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.balanceOf(accounts[4]);
    }).then(function(balance) {
      sender_start_token = balance.toNumber();
      return ensBidToken.balanceOf(accounts[7]);
    }).then(function(balance) {
      receiver_start_token = balance.toNumber();
      return ensBidToken.transferFrom(accounts[4], accounts[7], token, {from: accounts[7]});
    }).then(function() {
      return ensBidToken.balanceOf(accounts[4]);
    }).then(function(balance) {
      sender_end_token = balance.toNumber();
      return ensBidToken.balanceOf(accounts[7]);
    }).then(function(balance) {
      receiver_end_token = balance.toNumber();
      assert.equal(sender_start_token - token, sender_end_token, "sender token balance wasn't correctly");
      assert.equal(receiver_end_token - token, receiver_start_token, "receiver token balance wasn't correctly");
    });
  });

  /**
   * 4.8. funder should transfer fail during lock period
   */
  it("4.8. funder should transfer fail during lock period", function() {
    var ensBidToken;
    var token = 1;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.transfer(accounts[3], token, {from: accounts[0]});
    }).then(function() {
      assert.equal(false, true, "funder transfer fail wasn't correctly");
    }).catch(function(err) {
      assert.isDefined(err, "funder transfer fail when in lockout time");
    });
  });

  /**
   * 4.9. funder should transfer tokens from one address to another fail during lock period
   */
  it("4.9. funder should transfer tokens from one address to another fail during lock period", function() {
    var ensBidToken;
    var token = 1;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.transferFrom(accounts[0], accounts[4], token, {from: accounts[4]});
    }).then(function() {
      assert.equal(false, true, "funder transferFrom fail wasn't correctly");
    }).catch(function(err) {
      assert.isDefined(err, "funder transferFrom fail when in lockout time");
    });
  });

  /**
   * 4.10. funder should transfer success over lock period
   */
  it("4.10. funder should transfer success over lock period", function() {
    var ensBidToken;
    var token = 1;
    var receiver_start_token;
    var receiver_end_token;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_start_token = balance.valueOf();
      sleep.sleep(15);
      return ensBidToken.transfer(accounts[3], token, {from: accounts[0]});
    }).then(function() {
      return ensBidToken.balanceOf(accounts[3]);
    }).then(function(balance) {
      receiver_end_token = balance.valueOf();
      assert.equal(receiver_end_token - token, receiver_start_token, "token transfer wasn't correctly");
    });
  });

  /**
   * 4.11. allow another sender to withdraw from origin sender account
   * 4.12. returns the amount which another sender is still allowed to withdraw from origin sender
   */
  it("4.11. allow another sender to withdraw from origin sender account \r\n      " + 
    "4.12. returns the amount which another sender is still allowed to withdraw from origin sender", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.approve(accounts[7], 1, {from: accounts[0]});
    }).then(function() {
      return ensBidToken.allowance(accounts[0], accounts[7]);
    }).then(function(remaing) {
      assert.equal(remaing, 1, "remaing token amount wasn't correctly");
    });
  });

  /**
   * 4.13. funder should transfer tokens from one address to another success over lock period
   */
  it("4.13. funder should transfer tokens from one address to another success over lock period", function() {
    var ensBidToken;
    var sender_start_token;
    var sender_end_token;
    var receiver_start_token;
    var receiver_end_token;
    var token = 1;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.balanceOf(accounts[0]);
    }).then(function(balance) {
      sender_start_token = balance.toNumber();
      return ensBidToken.balanceOf(accounts[7]);
    }).then(function(balance) {
      receiver_start_token = balance.toNumber();
      return ensBidToken.transferFrom(accounts[0], accounts[7], token, {from: accounts[7]});
    }).then(function() {
      return ensBidToken.balanceOf(accounts[0]);
    }).then(function(balance) {
      sender_end_token = balance.toNumber();
      return ensBidToken.balanceOf(accounts[7]);
    }).then(function(balance) {
      receiver_end_token = balance.toNumber();
      assert.equal(sender_start_token - token, sender_end_token, "sender token balance wasn't correctly");
      assert.equal(receiver_end_token - token, receiver_start_token, "receiver token balance wasn't correctly");
    });
  });

  /**
   * 6.1. should pause contract success
   */
  it("6.1. should pause contract success", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.pauseContract();
    }).then(function() {
      return ensBidToken.paused.call();
    }).then(function(paused) {
      assert.equal(paused, true, "pause contract wasn't correctly");
    });
  });

  /**
   * 6.2. should resume contract success
   */
  it("6.2. should resume contract success", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.resumeContract();
    }).then(function() {
      return ensBidToken.paused.call();
    }).then(function(paused) {
      assert.equal(paused, false, "resume contract wasn't correctly");
    });
  });

  /**
   * 7.1. transfer ownership should fail when not owner
   */
  it("7.1. transfer ownership should fail when not owner", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.owner.call();
    }).then(function(owner) {
      assert.equal(owner, accounts[0], "owner wasnt' correctly");
      return ensBidToken.transferOwnership({from: accounts[1]});
    }).catch(function(err) {
      assert.isDefined(err, "transfer ownership should have thrown");
    });
  });

  /**
   * 7.2. transfer ownership should success when not owner
   */
  it("7.2. transfer ownership should success when not owner", function() {
    var ensBidToken;

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.owner.call();
    }).then(function(owner) {
      assert.equal(owner, accounts[0], "owner wasnt' correctly");
      return ensBidToken.transferOwnership(accounts[1]);
    }).then(function() {
      return ensBidToken.owner.call();
    }).then(function(owner) {
      assert.equal(owner, accounts[1], "transfer ownership wasnt' correctly");
    });
  });

  /**
   * 8.1. owner should share benefit success
   */
  it("8.1. owner should share benefit success", function() {
    var ensBidToken;
    var address = [];
    var benefitInWei = [];
    address.push(accounts[2]);
    address.push(accounts[4]);
    benefitInWei.push(5);
    benefitInWei.push(6);

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.shareBenefit(address, benefitInWei, {from: accounts[1], gas: 4000000});
    }).then(function() {
      return ensBidToken.shareHolders.call(accounts[2]);
    }).then(function(shareHolder) {
      assert.equal(shareHolder[2].toNumber(), 5, "non-owner share benefit should fail wasn't correctly");
      return ensBidToken.shareHolders.call(accounts[4]);
    }).then(function(shareHolder) {
      assert.equal(shareHolder[2].toNumber(), 6, "non-owner share benefit should fail wasn't correctly");
    });
  });

  /**
   * 8.2. non-owner should share benefit fail
   */
  it("8.2. non-owner should share benefit fail", function() {
    var ensBidToken;
    var address = [];
    var benefitInWei = [];
    address.push(accounts[2]);
    address.push(accounts[4]);
    benefitInWei.push(5);
    benefitInWei.push(6);

    return ENSBidToken.deployed().then(function(instance) {
      ensBidToken = instance;
      return ensBidToken.shareBenefit(address, benefitInWei, {from: accounts[0], gas: 4000000});
    }).then(function() {
      assert.equal(false, true, "non-owner share benefit should fail wasn't correctly");
    }).catch(function(err) {
      assert.isDefined(err, "non-owner should share benefit should have thrown");
    });
  });

});
