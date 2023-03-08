import { ethers } from "hardhat";

async function main() {
  const AirdropToken = await ethers.getContractFactory("AirdropToken");
  const airdropToken = await AirdropToken.deploy();
  await airdropToken.deployed();

  const TokenStaker = await ethers.getContractFactory("TokenStaker");
  const tokenStaker = await TokenStaker.deploy(
    airdropToken.address,
    airdropToken.address,
    process.env.URI as string
  );
  await tokenStaker.deployed();

  console.log(`AidropToken contract deployed to ${airdropToken.address}`);
  console.log(`Staking contract deployed to ${tokenStaker.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
