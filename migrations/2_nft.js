const UnilapseNFT = artifacts.require("./UnilapseNFT.sol");
const fs = require("fs");

module.exports = function (deployer) {
  deployer.deploy(UnilapseNFT).then(()=> {
    if (UnilapseNFT._json) {
      fs.writeFile(
        "deployedABI_UnilapseNFT",
        JSON.stringify(UnilapseNFT._json.abi),
        (err) => {
          if (err) throw err;
          console.log("파일에 ABI 입력 성공");
        }
      );
    }

    fs.writeFile("deployedAddress_UnilapseNFT", UnilapseNFT.address, (err) => {
      if (err) throw err;
      console.log("파일에 주소 입력 성공");
    });
  });


};
