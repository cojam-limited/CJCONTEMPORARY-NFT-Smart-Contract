const { expect, assert } = require('chai');
var Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
const MockToken = artifacts.require('MockToken.sol');
const BulkContract = artifacts.require('BulkTransferToken.sol');

require('chai').use(require('chai-as-promised')).should();

function toWei(num) {
    return web3.utils.toWei(num, 'ether')
}
function toNum(bn) {
    return Number(web3.utils.fromWei(bn, 'ether'))
}

contract('bulktransfer', (accounts) => {
    // All of the code goes here for testing
    let mockToken;
    let bulkContract;
    const [owner, user1, user2, user3] = accounts;
    
    beforeEach(async () => {
        mockToken = await MockToken.new()
        bulkContract = await BulkContract.new()
    })
    describe('setBaseToken', async ()=> {
        it('should set baseToken address to bulk contract', async () => {
            await bulkContract.setBaseToken(mockToken.address);
            const contractAddress = await bulkContract.baseToken()
            assert.equal(contractAddress, mockToken.address);
        })

        it('should reject set baseToken - Only owner', async () => {
            return await expect(bulkContract.setBaseToken(mockToken.address, {from: user1}))
            .to.be.rejectedWith("Ownable: caller is not the owner");
        })
    })

    describe('bulkTransferToken Error', async ()=> {
        it('empty token address using transfer', async () => {
            const test = await bulkContract.baseToken()
            const test2 = await mockToken.address
            console.log('basetoken',test)
            console.log('mockToken',test2)
            return await expect(bulkContract.bulkTransferToken([user1], toWei('10')))
            .to.be.rejectedWith("should set token address before bulkTransfer");
        })

        it('empty wallet address in array', async () => {
            await bulkContract.setBaseToken(mockToken.address);
            return await expect(bulkContract.bulkTransferToken([], toWei('10')))
            .to.be.rejectedWith("at least 1 wallet address should be sent");
        })
        it('0 balance from sender', async () => {
            await bulkContract.setBaseToken(mockToken.address);
            await mockToken.transfer(user1, toWei('1000'));
            return await expect(bulkContract.bulkTransferToken([user1, user2, user3], toWei('10')))
            .to.be.rejectedWith("sender does not have enough token to transfer");
        })
        it('not enough balance to send addresses from sender', async () => {
            await bulkContract.setBaseToken(mockToken.address);
            await mockToken.transfer(user1, toWei('900'));
            return await expect(bulkContract.bulkTransferToken([user1, user2, user3], toWei('100')))
            .to.be.rejectedWith("sender does not have enough token to transfer");
        })

    })

    describe('bulkTransferToken success', () => {

        beforeEach(async () => {
            await bulkContract.setBaseToken(mockToken.address);
            await mockToken.approve(bulkContract.address, toWei('100000'));
        })
        
        it('transfer token to 3 addresses', async () => {
            await bulkContract.bulkTransferToken([user1, user2, user3], toWei('100'))
            const balOfUser1 = await mockToken.balanceOf(user1)
            const balOfUser2 = await mockToken.balanceOf(user2)
            const balOfUser3 = await mockToken.balanceOf(user3)
            const balOfOwner = await mockToken.balanceOf(owner)

            assert.equal(toNum(balOfUser1), 100);
            assert.equal(toNum(balOfUser2), 100);
            assert.equal(toNum(balOfUser3), 100);
            assert.equal(toNum(balOfOwner), 700);
        })
    })
})