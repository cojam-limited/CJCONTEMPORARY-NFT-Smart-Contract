const { expect, assert } = require('chai');
var Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const NFT = artifacts.require('NFT.sol');
const TokenSales = artifacts.require('TokenSales.sol')
const MockToken = artifacts.require('MockToken.sol')
require('chai').use(require('chai-as-promised')).should();

function toNum(bn) {
    return Number(web3.utils.fromWei(bn, 'ether'))
}

function toWei(num) {
    return web3.utils.toWei(num, 'ether')
}

contract('TokenSales', (accounts) => {
    let [admin, artist, owner1, owner2, marketFee] = accounts;
    let token, nft, market;
    let unListedToken = '0x5e9456756afef83dddfa6416c8f96ff7c8aae8ce'
    let uri = "http://example.com";
    let address0 = '0x0000000000000000000000000000000000000000';
    const price = toWei('10','ether');
    
    beforeEach(async () => {
        nft = await NFT.new();
        await nft.safeMint(500, uri, {from: artist});
        await nft.safeMint(1000, uri, {from: artist});

        token = await MockToken.new();
        await token.transfer(owner1, toWei('100', 'ether'));
        await token.transfer(owner2, toWei('100', 'ether'));

        market = await TokenSales.new(nft.address, token.address);

        assert.equal(await market.nftAddress(), nft.address);
    })

    describe('listItem', ()=> {
        beforeEach(async () => {
            await nft.approve(market.address, 0, {from: artist});
          });

        it('should list with 0x', async () => {
            await market.listItem(0, price, address0, {from: artist});
            let result = [];
            result = await market.getMarketItemInfo(0);

            assert.equal(toNum(result[0]), 10);
            assert.equal(result[1], address0);
        });

        it('should list by ERC20 token', async () => {
            await market.listItem(0, price, token.address, {from: artist});
            let result = [];
            result = await market.getMarketItemInfo(0);

            assert.equal(toNum(result[0]), 10);
            assert.equal(result[1], token.address);
        });

        it('should reject list - THE ADDRESS(ERC20) IS NOT IN WHITELIST', async () => {
            return await expect(market.listItem(0, price, unListedToken, {from: artist}))
            .to.be.rejectedWith("THE ADDRESS(ERC20) IS NOT IN WHITELIST");
        });

        it('should reject list - THIS NFT ALREADY LISTED', async () => {
            await market.listItem(0, price, token.address, {from: artist});

            return await expect(market.listItem(0, price, token.address, {from: artist}))
            .to.be.rejectedWith("THIS NFT ALREADY LISTED");
        });

        it('should reject list - CALLER IS NOT NFT SELLER', async () => {
            return await expect(market.listItem(0, price, token.address, {from: owner1}))
            .to.be.rejectedWith("CALLER IS NOT NFT SELLER");
        });

        it('should reject list - PRICE IS ZERO OR LOWER', async () => {
            return await expect(market.listItem(0, 0, token.address, {from: artist}))
            .to.be.rejectedWith("PRICE IS ZERO OR LOWER");
        });

        it('should reject list - NFT OWNER DID NOT APPROVE TOKENSALES CONTRACT', async () => {
            return await expect(market.listItem(1, price, token.address, {from: artist}))
            .to.be.rejectedWith("NFT OWNER DID NOT APPROVE TOKENSALES CONTRACT");
        });
    });

    describe('cancelListedItem', ()=> {
        beforeEach(async () => {
            await nft.approve(market.address, 0, {from: artist});
            await market.listItem(0, price, address0, {from: artist});
          });

        it('should cancel listed Item', async () => {
            let beforeCancel= await market.getMarketItemInfo(0);
            await market.cancelListedItem(0, {from: artist});
            let afterCancel = await market.getMarketItemInfo(0);

            assert.notEqual(beforeCancel[0], afterCancel[0]);
            assert.equal(afterCancel[0], 0);
        });

        it('should not cancel item - NO PRICE IN THIS TOKEN', async () => {
            return await expect(market.cancelListedItem(1, {from: artist}))
            .to.be.rejectedWith("NO PRICE IN THIS TOKEN");
        });

        it('should not cancel item - CALLER IS NOT NFT SELLER', async () => {
            return await expect(market.cancelListedItem(0))
            .to.be.rejectedWith("CALLER IS NOT NFT SELLER");
        });
    })

    describe('_priceHandler', () => {
        it('should return price which (price - commission) - when seller is artist', async () => {
            let result = await market._priceHandler(0, artist, price);
            let intPrice = toNum(price);

            assert.equal(toNum(result[0]), intPrice-toNum(result[2]));
            assert.equal(result[1], 0);
            assert.equal(toNum(result[2]), 10*0.05);
            assert.equal(result[3], artist);
        })

        it('should return price which (price - commission) - when royalty is 0 ', async () => {
            await nft.safeMint(0, uri);
            let result = await market._priceHandler(2, admin, price);
            let intPrice = toNum(price);

            assert.equal(toNum(result[0]), intPrice-toNum(result[2]));
            assert.equal(result[1], 0);
            assert.equal(toNum(result[2]), 10*0.05);
            assert.equal(result[3], admin);
        })

        it('should return price which (price - commission - royalty) when seller is second-hand ', async () => {
            let result = await market._priceHandler(0, owner1, price);
            let intPrice = toNum(price);

            assert.equal(toNum(result[0]), intPrice-toNum(result[2])-toNum(result[1]));
            assert.notEqual(toNum(result[1]), 0);
            assert.equal(toNum(result[2]), 10*0.05);
            assert.equal(result[3], artist);
        })

        // it('should reject priceHandler function - Calculation is wrong ', async () => {
        //     await nft.safeMint(9000, uri);
        //     await market.updateCommissionBips(1000)

        //     return await expect(market._priceHandler(2, owner1, price))
        //     .to.be.rejectedWith("CALCULATION IS WRONG");
        // })
    })

    describe('buyItemByERC20', () => {
        beforeEach(async () => {
            await nft.approve(market.address, 0, {from: artist});
            await token.approve(market.address, price, {from: owner1}); 
          });

        it('should be success with (price - commision) when seller is artist', async () => {
            await market.listItem(0, price, token.address, {from: artist});
            await market.buyItemByERC20(0, token.address, price ,{from: owner1});
            let info = await market.getMarketItemInfo(0); 
            let nftOwner = await nft.ownerOf(0);
            let balOwner = await token.balanceOf(owner1);
            let balArtist = await token.balanceOf(artist);
            let balMarket = await token.balanceOf(marketFee);
 
            assert.equal(nftOwner, owner1);
            assert.equal(toNum(balOwner), 90);
            assert.equal(toNum(balArtist), 9.5);
            assert.equal(toNum(balMarket), 0.5);
            assert.equal(toNum(info[0]), 0);
            assert.notEqual(info[1], token.address);
        })

        it('should be success with (price - commision) when royalty is 0', async () => {
            await nft.safeMint(0, uri, {from: artist});
            await nft.safeTransferFrom(artist, owner2, 2, {from: artist});
            await nft.approve(market.address, 2, {from: owner2});
            await market.listItem(2, price, token.address, {from: owner2});
            await market.buyItemByERC20(2, token.address, price ,{from: owner1});
            let nftOwner = await nft.ownerOf(2);
            let balOwner = await token.balanceOf(owner1);
            let balOwner2 = await token.balanceOf(owner2);
            let balArtist = await token.balanceOf(artist);
            let balMarket = await token.balanceOf(marketFee);
 
            assert.equal(nftOwner, owner1);
            assert.equal(toNum(balOwner2), 109.5);
            assert.equal(toNum(balOwner), 90);
            assert.equal(toNum(balArtist),0);
            assert.equal(toNum(balMarket), 0.5);
         })

        it('should be success with (price - commision - royalty) when seller is second-hand', async () => {
            await nft.safeTransferFrom(artist, owner1, 0, {from: artist});
            await nft.approve(market.address, 0, {from: owner1});
            await market.listItem(0, price, token.address, {from: owner1});
            await token.approve(market.address, price, {from: owner2});
            await market.buyItemByERC20(0, token.address, price ,{from: owner2});
            let nftOwner = await nft.ownerOf(0);
            let balOwner = await token.balanceOf(owner1);
            let balArtist = await token.balanceOf(artist);
            let balOwner2 = await token.balanceOf(owner2);
            let balMarket = await token.balanceOf(marketFee);

            assert.equal(nftOwner, owner2);
            assert.equal(toNum(balOwner2), 90);
            assert.equal(toNum(balOwner), 109);
            assert.equal(toNum(balArtist), 0.5);
            assert.equal(toNum(balMarket), 0.5);
         })

         it('should reject buyItemByERC20 - UNMATCHED ERC20 TOKEN IN MARKET CONTRACT', async () => {
            await market.listItem(0, price, address0, {from: artist});

            return await expect(market.buyItemByERC20(0, token.address, price))
            .to.be.rejectedWith("UNMATCHED ERC20 TOKEN IN MARKET CONTRACT");
         })

         it('should reject buyItemByERC20 - CALLER IS NFT SELLER', async () => {
            await market.listItem(0, price, token.address, {from: artist});

            return await expect(market.buyItemByERC20(0, token.address, price, {from: artist}))
            .to.be.rejectedWith("CALLER IS NFT SELLER");
         })

         it('should reject buyItemByERC20 - PRICE DOES NOT MATCH WITH NFT', async () => {
            await market.listItem(0, price, token.address, {from: artist});
            const lowerPrice = toWei('8','ether');

            return await expect(market.buyItemByERC20(0, token.address, lowerPrice, {from: owner1}))
            .to.be.rejectedWith("PRICE DOES NOT MATCH WITH NFT");
         })

         it('should reject buyItemByERC20 - WHEN IS PUASED BY ADMIN', async () => {
            await market.listItem(0, price, token.address, {from: artist});
            await market.pause();

            return await expect(market.buyItemByERC20(0, token.address, price, {from: owner1}))
            .to.be.rejectedWith("Pausable: paused");
         })
    });

    describe('buyItem', () => {
        beforeEach(async () => {
            await nft.approve(market.address, 0, {from: artist});
        });
        
        it('should be success with (price - commision) when seller is artist', async () => {
            await market.listItem(0, price, address0, {from: artist});
            let balArtistBeforeSale = await web3.eth.getBalance(artist);
            let balOwnerBeforeSale= await web3.eth.getBalance(owner1);
            let balMarketBeforeSale = await web3.eth.getBalance(marketFee);
            await market.buyItem(0, {from : owner1, value : price});
            let result = await market._priceHandler(0, artist, price);
            let nftOwner = await nft.ownerOf(0);
            let info = await market.getMarketItemInfo(0);
            let balArtistAfterSale = await web3.eth.getBalance(artist); 
            let balOwnerAfterSale= await web3.eth.getBalance(owner1);
            let balMarketAfterSale = await web3.eth.getBalance(marketFee);

            assert.approximately(toNum(balOwnerAfterSale), toNum(balOwnerBeforeSale)-toNum(price), 0.01);
            assert.approximately(toNum(balArtistAfterSale), toNum(balArtistBeforeSale)+toNum(result[0]), 0.01);
            assert.equal(toNum(balMarketAfterSale), toNum(balMarketBeforeSale)+toNum(result[2]));
            assert.equal(nftOwner, owner1);
            assert.equal(info[0], 0);
        })

        it('should be success with (price - commision) when royalty is 0', async () => {
            await nft.safeMint(0, uri, {from: artist});
            await nft.safeTransferFrom(artist, owner2, 2, {from: artist});
            await nft.approve(market.address, 2, {from: owner2});
            await market.listItem(2, price, address0, {from: owner2});
            let balOwner2BeforeSale = await web3.eth.getBalance(owner2);
            let balOwnerBeforeSale= await web3.eth.getBalance(owner1);
            let balMarketBeforeSale = await web3.eth.getBalance(marketFee);
            await market.buyItem(2, {from : owner1, value : price});
            let result = await market._priceHandler(2, artist, price);
            let nftOwner = await nft.ownerOf(2);
            let info = await market.getMarketItemInfo(2);
            let balOwner2AfterSale = await web3.eth.getBalance(owner2); 
            let balOwnerAfterSale= await web3.eth.getBalance(owner1);
            let balMarketAfterSale = await web3.eth.getBalance(marketFee);

            assert.approximately(toNum(balOwnerAfterSale), toNum(balOwnerBeforeSale)-toNum(price), 0.01);
            assert.approximately(toNum(balOwner2AfterSale), toNum(balOwner2BeforeSale)+toNum(result[0]), 0.01);
            assert.equal(toNum(balMarketAfterSale), toNum(balMarketBeforeSale)+toNum(result[2]));
            assert.equal(nftOwner, owner1);
            assert.equal(info[0], 0);
        })

        it('should be success with (price - commision - royalty) when seller is second-hand', async () => {
            await nft.safeTransferFrom(artist, owner2, 0, {from: artist});
            await nft.approve(market.address, 0, {from: owner2});
            await market.listItem(0, price, address0, {from: owner2});
            let balArtistBeforeSale = await web3.eth.getBalance(artist);
            let balOwner2BeforeSale = await web3.eth.getBalance(owner2);
            let balOwnerBeforeSale= await web3.eth.getBalance(owner1);
            let balMarketBeforeSale = await web3.eth.getBalance(marketFee);
            await market.buyItem(0, {from : owner1, value : price});
            let result = await market._priceHandler(0, owner2, price);
            let nftOwner = await nft.ownerOf(0);
            let info = await market.getMarketItemInfo(0);
            let balArtistAfterSale = await web3.eth.getBalance(artist); 
            let balOwner2AfterSale = await web3.eth.getBalance(owner2); 
            let balOwnerAfterSale= await web3.eth.getBalance(owner1);
            let balMarketAfterSale = await web3.eth.getBalance(marketFee);
            
            assert.approximately(toNum(balOwnerAfterSale), toNum(balOwnerBeforeSale)-toNum(price), 0.01);
            assert.approximately(toNum(balOwner2AfterSale), toNum(balOwner2BeforeSale)+toNum(result[0]), 0.01);
            assert.equal(toNum(balMarketAfterSale), toNum(balMarketBeforeSale)+toNum(result[2]));
            assert.approximately(toNum(balArtistAfterSale), toNum(balArtistBeforeSale)+toNum(result[1]), 0.01);
            assert.equal(nftOwner, owner1);
            assert.equal(info[0], 0);
        })

        it('should reject buyItem - THIS NFT HAS TO BE PAID BY KLAY', async () => {
            await market.listItem(0, price, token.address, {from: artist});

            return await expect(market.buyItem(0, {from : owner1, value : price}))
            .to.be.rejectedWith("THIS NFT HAS TO BE PAID BY KLAY");
         })

         it('should reject buyItem - CALLER IS NFT SELLER', async () => {
            await market.listItem(0, price, address0, {from: artist});

            return await expect(market.buyItem(0, {from : artist, value : price}))
            .to.be.rejectedWith("CALLER IS NFT SELLER");
         })

         it('should reject buyItem - NOT LISTED NFT', async () => {
            return await expect(market.buyItem(0, {from : owner1, value : price}))
            .to.be.rejectedWith("NOT LISTED NFT");
         })

         it('should reject buyItem - PRICE DOES NOT MATCH WITH NFT', async () => {
            await market.listItem(0, price, address0, {from: artist});
            const lowerPrice = toWei('12','ether');

            return await expect(market.buyItem(0, {from : owner1, value : lowerPrice}))
            .to.be.rejectedWith("PRICE DOES NOT MATCH WITH NFT");
         })

         it('should reject buyItem - WHEN IS PUASED BY ADMIN', async () => {
            await market.listItem(0, price, address0, {from: artist});
            await market.pause();

            return await expect(market.buyItem(0, {from : owner1, value : price}))
            .to.be.rejectedWith("Pausable: paused");
         })
    })

    describe('updateCommissionBips', ()=> {
        it('should update commission', async () => {
            await market.updateCommissionBips(1000);
            let result = await market._priceHandler(0, artist, price);
            
            assert.equal(1, toNum(result[2]));
        })

        it('should not update commission - ONLY ADMIN', async () => {
            return await expect(market.updateCommissionBips(1000, {from: artist}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })

        it('should not update commission - MARKET COMMISSION CAN NOT MORE THAN 10% ', async () => {
            return await expect(market.updateCommissionBips(1001, {from: admin}))
            .to.be.rejectedWith("MARKET COMMISSION CAN NOT MORE THAN 10%");
        })
    })

    describe('updateCommissionAddress', ()=> {
        it('should not update address - ONLY ADMIN', async () => {
            return await expect( market.updateCommissionAddress(artist, {from: owner1}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })
    })

    describe('addERC20Whitelist', ()=> {
        it('should add address(erc20) as whitelist', async () => {
            await market.addERC20Whitelist(unListedToken, {from: admin})
            
            assert.isTrue(await market.whitelistedAddresses(unListedToken))
        })

        it('should reject addERC20Whitelist - ONLY ADMIN', async () => {
            return await expect( market.addERC20Whitelist(unListedToken, {from: owner1}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })
    })

    describe('archiveWhitelistedERC20', ()=> {
        it('should archive whitedlisted address(erc20)', async () => {
            await market.archiveWhitelistedERC20(address0, {from: admin})
            
            assert.isFalse(await market.whitelistedAddresses(address0))
        })

        it('should reject archiveWhitelistedERC20 - ONLY ADMIN', async () => {
            return await expect( market.archiveWhitelistedERC20(address0, {from: owner1}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })

        it('should reject archiveWhitelistedERC20 - THE ADDRESS(ERC20) IS NOT IN WHITELIST', async () => {
            return await expect( market.archiveWhitelistedERC20(unListedToken, {from: admin}))
            .to.be.rejectedWith("THE ADDRESS(ERC20) IS NOT IN WHITELIST");
        })
    })
})