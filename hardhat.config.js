

require("dotenv").config();
require("hardhat-deploy")
require("@nomicfoundation/hardhat-ethers")



const ETH_MAIN_NET_RPC_URL = process.env.ETH_MAIN_NET_RPC_URL;
const ETH_SEPOLIA_RPC_URL = process.env.ETH_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {

  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: ETH_MAIN_NET_RPC_URL
      }
    },
    sepolia: {
      chainId: 11155111,
      url: ETH_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY]
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
      11155111: 0,
      31337: 0
    },
    helper01: {
      default: 1,
    }
  },

  solidity: {

    compilers: [
      { version: "0.8.0" },
      { version: "0.6.12" },
    ], settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }

  },

};
