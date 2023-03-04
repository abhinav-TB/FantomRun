import { ethers } from "hardhat";

const stakingTokenAddress = "";
const rewardTokenAddress = "";
const NFTcontractAddress = "";

async function main() {
  const TokenStaker = await ethers.getContractFactory("TokenStaker");
  const tokenStaker = await TokenStaker.deploy(
    stakingTokenAddress,
    rewardTokenAddress,
    NFTcontractAddress
  );
  await tokenStaker.deployed();

  console.log(`Staking contract deployed to ${tokenStaker.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
