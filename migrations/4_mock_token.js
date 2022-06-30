const MockToken = artifacts.require("./MockToken.sol");

const fs = require("fs");

module.exports = function (deployer) {
  deployer.deploy(MockToken).then(()=> {
    if (MockToken._json) {
      fs.writeFile(
        "deployedABI_MockToken",
        JSON.stringify(MockToken._json.abi),
        (err) => {
          if (err) throw err;
          console.log("파일에 ABI 입력 성공");
        }
      );
    }

    fs.writeFile("deployedAddress_MockToken", MockToken.address, (err) => {
      if (err) throw err;
      console.log("파일에 주소 입력 성공");
    });
  });


};