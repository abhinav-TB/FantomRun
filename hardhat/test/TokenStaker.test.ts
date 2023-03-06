import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Wallet } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { AirdropNFT, AirdropToken, TokenStaker } from "../typechain-types";

describe("TokenStaker", function () {
  let deployer: Wallet,
      wallet1: Wallet,
      wallet2: Wallet,
      airdropToken: AirdropToken,
      airdropNFT: AirdropNFT,
      tokenStaker: TokenStaker;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  const fixture = async () => {
    const AirdropToken = await ethers.getContractFactory("AirdropToken");
    airdropToken = await AirdropToken.deploy();
    await airdropToken.deployed();

    const AirdropNFT = await ethers.getContractFactory("AirdropNFT");
    airdropNFT = await AirdropNFT.deploy();
    await airdropNFT.deployed();

    const TokenStaker = await ethers.getContractFactory("TokenStaker");
    tokenStaker = await TokenStaker.deploy(
      airdropToken.address,
      airdropToken.address,
      airdropNFT.address
    );
    await tokenStaker.deployed();
  }

  beforeEach('deploy contracts', async () => {
    await loadFixture(fixture); 
    [deployer, wallet1, wallet2] = await (ethers as any).getSigners();
    await airdropToken.mint(wallet1.address, ethers.utils.parseEther("1000"));
    await airdropToken.mint(wallet2.address, ethers.utils.parseEther("1000"));
    await airdropToken.mint(tokenStaker.address, ethers.utils.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Contracts are deployed", async function () {
      expect(airdropToken.address).to.not.equal(ethers.constants.AddressZero);
      expect(airdropToken.address).to.not.be.undefined;
      expect(airdropNFT.address).to.not.equal(ethers.constants.AddressZero);
      expect(airdropNFT.address).to.not.be.undefined;
      expect(tokenStaker.address).to.not.equal(ethers.constants.AddressZero);
      expect(tokenStaker.address).to.not.be.undefined;
    });
  });

  describe("Staking", function () {
    it("User can stake tokens", async function () {
      await airdropToken.connect(wallet1).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet1).stake(ethers.utils.parseEther("1000"));
      expect(await tokenStaker.stakeBalanceOf(wallet1.address)).to.equal(ethers.utils.parseEther("1000"));
      expect(await tokenStaker.totalStaked()).to.equal(ethers.utils.parseEther("1000"));
    });

    it("Assigns staking tier and rate", async function () {
      expect(await tokenStaker.getStakingTier(wallet1.address)).to.equal(3);
      expect(await tokenStaker.getRewardRate(wallet1.address)).to.equal(2);

      await airdropNFT.mint(wallet2.address, 1, 1, '0x');
      expect(await tokenStaker.getStakingTier(wallet2.address)).to.equal(2);
      expect(await tokenStaker.getRewardRate(wallet2.address)).to.equal(4);

      await airdropNFT.mint(wallet1.address, 2, 1, '0x');
      expect(await tokenStaker.getStakingTier(wallet1.address)).to.equal(1);
      expect(await tokenStaker.getRewardRate(wallet1.address)).to.equal(6);

      await airdropNFT.mint(wallet2.address, 3, 1, '0x');
      expect(await tokenStaker.getStakingTier(wallet2.address)).to.equal(0);
      expect(await tokenStaker.getRewardRate(wallet2.address)).to.equal(8);
    });

    it("Calculates number of months remaining", async function () {
      await airdropNFT.mint(wallet1.address, 2, 1, '0x');
      await airdropToken.connect(wallet1).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet1).stake(ethers.utils.parseEther("1000"));

      await airdropToken.connect(wallet2).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet2).stake(ethers.utils.parseEther("1000"));

      expect(await tokenStaker.getMonthsRemaining(wallet1.address)).to.equal(17);
      expect(await tokenStaker.getMonthsRemaining(wallet2.address)).to.equal(6);

      await network.provider.send("evm_increaseTime", [2*30*24*60*60]);
      await network.provider.send("evm_mine");
      expect(await tokenStaker.getMonthsRemaining(wallet1.address)).to.equal(15);
      expect(await tokenStaker.getMonthsRemaining(wallet2.address)).to.equal(4);

      await network.provider.send("evm_increaseTime", [8*30*24*60*60]);
      await network.provider.send("evm_mine");
      expect(await tokenStaker.getMonthsRemaining(wallet1.address)).to.equal(7);
      expect(await tokenStaker.getMonthsRemaining(wallet2.address)).to.equal(0)
    });
  });

  describe("Rewards", function () {
    beforeEach(async () => {
      await airdropNFT.mint(wallet1.address, 2, 1, '0x');
      await airdropToken.connect(wallet1).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet1).stake(ethers.utils.parseEther("1000"));

      await airdropToken.connect(wallet2).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet2).stake(ethers.utils.parseEther("1000"));
    });

    it("Calculates unclaimed reward", async function () {
      await network.provider.send("evm_increaseTime", [6*30*24*60*60]);
      await network.provider.send("evm_mine");

      expect(
        parseInt(ethers.utils.formatEther(await tokenStaker.unclaimedReward(wallet1.address)))
      ).to.equal(1000 * 0.06 * 6/12);
      expect(
        parseInt(ethers.utils.formatEther(await tokenStaker.unclaimedReward(wallet2.address)))
      ).to.equal(1000 * 0.02 * 6/12);
    });
    
    it("User can claim rewards", async function () {
      await network.provider.send("evm_increaseTime", [6*30*24*60*60]);
      await network.provider.send("evm_mine");

      await tokenStaker.connect(wallet1).claimReward();
      await tokenStaker.connect(wallet2).claimReward();

      expect(
        parseInt(ethers.utils.formatEther(await airdropToken.balanceOf(wallet1.address)))
      ).to.equal(1000 * 0.06 * 6/12);
      expect(
        parseInt(ethers.utils.formatEther(await airdropToken.balanceOf(wallet2.address)))
      ).to.equal(1000 * 0.02 * 6/12);
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async () => {
      await airdropNFT.mint(wallet1.address, 2, 1, '0x');
      await airdropToken.connect(wallet1).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet1).stake(ethers.utils.parseEther("1000"));

      await airdropToken.connect(wallet2).increaseAllowance(tokenStaker.address, ethers.utils.parseEther("1000"));
      await tokenStaker.connect(wallet2).stake(ethers.utils.parseEther("1000"));
    });

    it("User cannot withdraw stake before maturity", async function () {
      await expect(
        tokenStaker.connect(wallet1).withdraw(await tokenStaker.stakeBalanceOf(wallet1.address))
      ).to.be.revertedWith("Withdrawal not active");
    });

    it("User can withdraw stake", async function () {
      await network.provider.send("evm_increaseTime", [6*30*24*60*61]);
      await network.provider.send("evm_mine");

      await tokenStaker.connect(wallet2).withdraw(await tokenStaker.stakeBalanceOf(wallet2.address));
      expect(
        parseInt(ethers.utils.formatEther(await airdropToken.balanceOf(wallet2.address)))
      ).to.equal(1000);

      await network.provider.send("evm_increaseTime", [12*30*24*60*61]);
      await network.provider.send("evm_mine");

      await tokenStaker.connect(wallet1).withdraw(await tokenStaker.stakeBalanceOf(wallet1.address));
      expect(
        parseInt(ethers.utils.formatEther(await airdropToken.balanceOf(wallet1.address)))
      ).to.equal(1000);
    });
  });
});
