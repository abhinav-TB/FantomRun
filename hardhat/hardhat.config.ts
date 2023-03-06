import * as dotenv from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";
dotenv.config();

const accounts = {
  mnemonic:
    process.env.MNEMONIC ||
    "test test test test test test test test test test test test",
};

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {},
    mainnet: {
      url: `https://rpcapi.fantom.network`,
      chainId: 250,
      accounts
    },
    testnet: {
      url: `https://rpc.ankr.com/fantom_testnet`,
      chainId: 4002,
      accounts
    },
  },
  etherscan: {
    apiKey: {
      ftmTestnet: process.env.API_KEY || "",
      opera: process.env.API_KEY || ""
    }
  },
  abiExporter: {
    path: './abis',
    runOnCompile: true,
    clear: true,
    only: ['TokenStaker'],
  }
};

export default config;
