// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract BulkTransferToken is Ownable{
    IERC20 public baseToken;

    constructor(address _tokenAddress) {
        baseToken = IERC20(_tokenAddress);
    }
    
    function setBaseToken(address _tokenAddress) public onlyOwner {
        baseToken = IERC20(_tokenAddress);
    }

    function bulkTransferToken(address[] memory _eventWinners, uint256 _amount) public {
        require(address(baseToken) != address(0), "should set token address before bulkTransfer");
        uint256 numberOfWinners = _eventWinners.length;
        require(numberOfWinners > 0, "at least 1 wallet address should be sent");
        require(numberOfWinners <= 50, "able to transfer max wallet address is 50");
        uint256 bank = baseToken.balanceOf(msg.sender);
        require(bank >= (numberOfWinners*_amount), "sender does not have enough token to transfer");

        for(uint i = 0; i < numberOfWinners; i++) {
            address recipient = _eventWinners[i];
            baseToken.transferFrom(msg.sender, recipient, _amount);
        }
    }
}