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
        await nft.safeMint(5000, uri, {from : admin});
    })

    describe('deployed', () => {
        it('deployed propery', async () => {
            const name = await nft.name();
            const symbol = await nft.symbol();
            assert.equal(name, 'MY TEST TOKEN');
            assert.equal(symbol, 'MTT');
        })
    })
    describe('safeMint', async ()=> {
        
        it('should reject mint - setting artist royalty can not over 50%', async () => {
           return await expect(nft.safeMint(6000, uri))
            .to.be.rejectedWith("can not over 50% for royalty");
        })

        it('should reject mint - THE USER IS NOT IN WHITELIST', async () => {
            return await expect(nft.safeMint(5000, uri, {from : owner1}))
             .to.be.rejectedWith("THE USER IS NOT IN WHITELIST");
         })

        it('should have equal royaltyInfo that i expect', async () => {
            const artistRoyalty = await nft.royaltyInfo(0, price);

            assert.equal(artistRoyalty[0], admin);
            assert.equal(artistRoyalty[1], 20000*0.5);
        })

        it('should have 1 total supply', async () => {
            const totalToken = await nft.totalSupply();
            assert.equal(totalToken, 1);
        })

        it('should have equal uri that i expect', async () => {
            const mintedTokenURI = await nft.tokenURI(0);

            assert.equal(mintedTokenURI, uri);
        })

        it('should be minted by the whitelist user', async () => {
            await nft.addUserToWhitelist(artist);
            await nft.safeMint(500, uri, {from : artist});

            const currentOwner = await nft.ownerOf(1);

            assert.equal(currentOwner, artist);
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
            await nft.burn(0, {from : admin});
        })
        
        it('should have burn 1 token', async () => {
            const totalToken = await nft.totalSupply();
            assert.equal(totalToken, 0);
        })

        it('should reject burn token', async () => {
            await nft.safeMint(500, uri, {from: admin})

            return await expect(nft.burn(1, {from : artist}))
            .to.be.rejectedWith("ERC721Burnable: caller is not owner nor approved");
        })

        it('should be 1 next NFT tokenId ', async () =>
        {
            await nft.safeMint(500, uri, {from: admin})
            const nftOwner = await nft.ownerOf(1)
            assert.equal(nftOwner, admin)
        })
    })

    describe('addUserToWhitelist', async ()=> {

        it('should be added a user to whitelist', async () => {
            await nft.addUserToWhitelist(owner2);
            const status = await nft.isWhitelisted(owner2);
            assert.isTrue(status);
        })

        it('should be reject add user to whitelist - Only Owner', async () => {

            return await expect(nft.addUserToWhitelist(owner2, {from : artist}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })
    })

    describe('archiveWhitelistedUser', async ()=> {

        it('should be archived the whitelisted user', async () => {
            await nft.addUserToWhitelist(owner1);
            const status1 = await nft.isWhitelisted(owner1);
            assert.isTrue(status1);

            await nft.archiveWhitelistedUser(owner1);
            const status2 = await nft.isWhitelisted(owner1);
            assert.isFalse(status2);
        })

        it('should be reject archive the user from whitelist - Only Owner', async () => {
            await nft.addUserToWhitelist(owner1);

            return await expect(nft.archiveWhitelistedUser(owner1, {from : artist}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })
    })
})