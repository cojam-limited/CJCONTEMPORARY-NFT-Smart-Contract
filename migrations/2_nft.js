const NFT = artifacts.require("./NFT.sol");
const fs = require("fs");

module.exports = function (deployer) {
  deployer.deploy(NFT).then(()=> {
    if (NFT._json) {
      fs.writeFile(
        "deployedABI_NFT",
        JSON.stringify(NFT._json.abi),
        (err) => {
          if (err) throw err;
          console.log("파일에 ABI 입력 성공");
        }
      );
    }

    fs.writeFile("deployedAddress_NFT", NFT.address, (err) => {
      if (err) throw err;
      console.log("파일에 주소 입력 성공");
    });
  });


};
