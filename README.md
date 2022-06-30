# ct_smart_contract
Short tutorial how to test in testnet

[For Frontend](#for-frontend)

[IPFS](#ipfs)

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

### Deploy Contract in console 

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

파일에 ABI 파일과 ADDRESS 파일을 받아서 사용하시면 될거 같아요!
```
const mtkContract = new caver.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);
```

##List of methods 

![스크린샷_2022-03-16_21-05-18](https://user-images.githubusercontent.com/57386602/158586239-29e95c99-2f00-499b-b882-e2dd45c9c305.png)

### Example to use smart contract method
```
getOwnerOf: async function (tokenId) {
    return await Contract.methods.ownerOf(tokenId).call();
  }
```

## IPFS
 import ipfs 
```
import { create as ipfsHttpClient } from 'ipfs-http-client'
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')
```

 참고 https://github.com/dabit3/polygon-ethereum-nextjs-marketplace/blob/main/pages/create-nft.js
```
//파일 ipfs에 저장

async function onChange(e) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
  
 async function uploadToIPFS() {
   const { name, description } = formInput
   if (!name || !description || !fileUrl) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, image: fileUrl
    })
    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      /* url을 mintMTK 파라미터로 넣어주시면 될것 같아요*/
      return url
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
```

## Test Code Result

### Test code for tokenSales contract

![스크린샷_2022-04-20_20-27-26](https://user-images.githubusercontent.com/57386602/164222542-2ad0ab3c-84be-42ee-b7c2-8dc4f950b5e0.png)

