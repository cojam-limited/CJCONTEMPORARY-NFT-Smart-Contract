const { expect, assert } = require('chai');

const CojamNFT = artifacts.require('CojamNFT.sol');

require('chai').use(require('chai-as-promised')).should();

contract('CojamNFT', (accounts) => {
    // All of the code goes here for testing
    let nft;
    let [admin, artist, owner1, owner2, marketFee] = accounts;
    let uri = "http://example.com";
    let price = 20000;
    
    beforeEach(async () => {
        nft = await CojamNFT.new()
        await nft.safeMint(500, uri, {from : artist});
    })

    describe('deployed', () => {
        it('deployed propery', async () => {
            const name = await nft.name();
            const symbol = await nft.symbol();
            assert.equal(name, 'COJAM NFT IRELAND');
            assert.equal(symbol, 'CNT');
        })
    })
    describe('safeMint', async ()=> {
        
        it('should reject mint - setting artist royalty can not over 50%', async () => {
           return await expect(nft.safeMint(6000, uri))
            .to.be.rejectedWith("can not over 50% for royalty");
        })

        it('should have equal royaltyInfo that i expect', async () => {
            const artistRoyalty = await nft.royaltyInfo(0, price);

            assert.equal(artistRoyalty[0], artist);
            assert.equal(artistRoyalty[1], 20000*0.05);
        })

        it('should have 1 total supply', async () => {
            const totalToken = await nft.totalSupply();
            assert.equal(totalToken, 1);
        })

        it('should have equal uri that i expect', async () => {
            const mintedTokenURI = await nft.tokenURI(0);

            assert.equal(mintedTokenURI, uri);
        })
    })

    describe('owner', async ()=> {

        it('should be owner who deploy contract', async () => {
                const owner = await nft.owner();

                assert.equal(owner, admin);
        })
    })

    describe('burn', () => {
       
        beforeEach(async () => {
            await nft.burn(0, {from : artist});
        })
        
        it('should have burn 1 token', async () => {
            const totalToken = await nft.totalSupply();
            assert.equal(totalToken, 0);
        })

        it('should reject burn token', async () => {
            await nft.safeMint(500, uri, {from: owner1})

            return await expect(nft.burn(1))
            .to.be.rejectedWith("ERC721Burnable: caller is not owner nor approved");
        })

        it('should be 1 next NFT tokenId ', async () =>
        {
            await nft.safeMint(500, uri, {from: owner1})
            const nftOwner = await nft.ownerOf(1)
            assert.equal(nftOwner, owner1)
        })
    })
})