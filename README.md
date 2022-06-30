# ct_smart_contract
Short tutorial how to test in testnet

[Test Code](#test-code-result)


# Version check!
- npm 8.6.0

- node 16.13.1

- truffle 5.1.61

## Test in ganache
```
$ npm install gnanche-cli
```

### open ganache-cli 
```
$ ganache-cli 
```

using other terminal 
```
$ truffle migrate --compile-all --reset --network ganache
$ truffle console --network ganache
```

### Deployed Contract in console 

```
truffle(ganache) > let nft = await NFT.deployed()
```

## Test in Klaytn (Same as above)
```
$ $ truffle migrate --compile-all --reset --network klaytn
```

## For frontend

### Using Klaytn Provider in caver-js
```
import Caver from "caver-js";

const caver = new Caver(klaytn);
```

### Import Smart Contract 

```
const mtkContract = new caver.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);
```

## Test Code Result

### Test code for tokenSales contract

![스크린샷_2022-04-20_20-27-26](https://user-images.githubusercontent.com/57386602/164222542-2ad0ab3c-84be-42ee-b7c2-8dc4f950b5e0.png)

