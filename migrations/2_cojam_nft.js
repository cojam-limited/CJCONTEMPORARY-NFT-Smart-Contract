const CojamNFT = artifacts.require("./CojamNFT.sol");
const fs = require("fs");

module.exports = function (deployer) {
  deployer.deploy(CojamNFT).then(()=> {
    if (CojamNFT._json) {
      fs.writeFile(
        "deployedABI_CojamNFT",
        JSON.stringify(CojamNFT._json.abi),
        (err) => {
          if (err) throw err;
          console.log("파일에 ABI 입력 성공");
        }
      );
    }

    fs.writeFile("deployedAddress_CojamNFT", CojamNFT.address, (err) => {
      if (err) throw err;
      console.log("파일에 주소 입력 성공");
    });
  });


};
