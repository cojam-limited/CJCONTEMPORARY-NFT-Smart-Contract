require('dotenv').config();
const Caver = require('caver-js');
const HDWalletProvider = require("@truffle/hdwallet-provider");
const HDWalletProviderKlaytn = require("truffle-hdwallet-provider-klaytn");

const { 
  PRIVATE_KEY_KLAY_BAOBAB,
  PRIVATE_KEY_KLAY_BAOBAB2,
  PRIVATE_KEY_KLAY_BAOBAB3,
  PRIVATE_KEY_KLAY_CYPRESS, 
  ACCESS_KEY, 
  SECRET_ACCESS_KEY,
  INFURA_KEY,
  ACCESS_KEY_CYPRESS,
  SECRET_ACCESS_KEY_CYPRESS,
  SECRET_ACCESS_KEY_GOERLI,
  SECRET_ACCESS_KEY_MUMBAL,
  SECRET_ACCESS_KEY_MATIC,
  SECRET_ACCESS_KEY_MUMBAL2
 } = process.env

module.exports = {

  networks: {
    ganache: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },
    mainnet: {
      provider: () => {
        return new HDWalletProvider(
          PRIVATE_KEY_ETH,
          `https://mainnet.infura.io/v3/${INFURA_KEY}`
        );
      },
      port: 8545,
      network_id: 1,
    },
    goerli: {
      provider: function() {
        return new HDWalletProvider(SECRET_ACCESS_KEY_GOERLI, `https://goerli.infura.io/v3/${INFURA_KEY}`);
      },
      port: 8545,
      network_id: '5',
      skipDryRun: false,
      networkCheckTimeout: 10000,
    },
    sepolia: {
      provider: function() {
        return new HDWalletProvider(SECRET_ACCESS_KEY_GOERLI, `https://sepolia.infura.io/v3/${INFURA_KEY}`);
      },
      port: 8545,
      network_id: '11155111',
      skipDryRun: false,
      networkCheckTimeout: 10000,
    },
    mumbai: {
      provider: () => {
        return new HDWalletProvider([SECRET_ACCESS_KEY_MUMBAL, SECRET_ACCESS_KEY_MUMBAL2], `https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78`)
      },
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    matic: {
      provider: () => new HDWalletProvider(SECRET_ACCESS_KEY_MATIC, `https://polygon-mumbai.infura.io/v3/4458cf4d1689497b9a38b1d6bbf05e78`),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    kasBaobab:  {
      provider: () => {
        const option = {
          headers: [
            {
              name: "Authorization",
              value:
                "Basic " +
                Buffer.from(ACCESS_KEY+ ":" + SECRET_ACCESS_KEY).toString(
                  "base64"
                ),
            },
            { name: "x-chain-id", value: "1001" },
          ],
          keepAlive: false,
        };
        return new HDWalletProviderKlaytn(
          PRIVATE_KEY_KLAY_BAOBAB,
          new Caver.providers.HttpProvider(
            "https://node-api.klaytnapi.com/v1/klaytn",
            option
          )
        );
      },
      network_id: "1001", //Klaytn baobab testnet's network id
      gas: "8500000",
      gasPrice: null,
    },

    kasCypress: {
      provider: () => {
        const option = {
          headers: [
            {
              name: "Authorization",
              value:
                "Basic " +
                Buffer.from(ACCESS_KEY_CYPRESS+ ":" + SECRET_ACCESS_KEY_CYPRESS).toString(
                  "base64"
                ),
            },
            { name: "x-chain-id", value: "8217" },
          ],
          keepAlive: false,
        };
        return new HDWalletProviderKlaytn(
          PRIVATE_KEY_KLAY_CYPRESS,
          new Caver.providers.HttpProvider(
            "https://node-api.klaytnapi.com/v1/klaytn",
            option
          )
        );
      },
      network_id: "8217", 
      gas: "8500000",
      gasPrice: null,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
      //  evmVersion: "byzantium"
      // }
    }
  },

  // db: {
    // enabled: false,
    // host: "127.0.0.1",
    // adapter: {
    //   name: "sqlite",
    //   settings: {
    //     directory: ".db"
    //   }
    // }
  // }
};
