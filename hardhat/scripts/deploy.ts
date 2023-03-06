import { ethers } from "hardhat";

const stakingTokenAddress = "0xEFA42BF5AD8A70575A16aa171dbF8751d3A01337";
const rewardTokenAddress = "0xEFA42BF5AD8A70575A16aa171dbF8751d3A01337";
const NFTcontractAddress = "0xD5231C458c54A90b11477D3681B167934A6D3Ce9";

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
