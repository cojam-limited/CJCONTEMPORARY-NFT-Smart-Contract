require('dotenv').config();
const Caver = require('caver-js');
const HDWalletProvider = require("truffle-hdwallet-provider-klaytn");

const NETWORK_ID = "1001";
const GASLIMIT = "20000000";
// var GAS_PRICE = new Caver.klay.getGasPrice()
const URL = `https://api.baobab.klaytn.net:8651`;
const { 
  PRIVATE_KEY_KLAY_BAOBAB,
  PRIVATE_KEY_KLAY_BAOBAB2,
  PRIVATE_KEY_KLAY_BAOBAB3,
  PRIVATE_KEY_KLAY_CYPRESS, 
  ACCESS_KEY, 
  SECRET_ACCESS_KEY,
  ACCESS_KEY_CYPRESS,
  SECRET_ACCESS_KEY_CYPRESS
 } = process.env

module.exports = {

  networks: {
    ganache: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },

    klaytn: {
      provider: new HDWalletProvider([PRIVATE_KEY_KLAY_BAOBAB2 ,PRIVATE_KEY_KLAY_BAOBAB, PRIVATE_KEY_KLAY_BAOBAB3], URL),
      network_id: NETWORK_ID,
      gas: GASLIMIT,
      gasPrice: null,
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
        return new HDWalletProvider(
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
        return new HDWalletProvider(
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
