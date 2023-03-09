// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CojamNFT is ERC721Royalty, ERC721URIStorage, ERC721Enumerable, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    mapping(address => bool) private whitelistedAddresses;
    constructor() ERC721("Unilapse", "UNI") {
        whitelistedAddresses[msg.sender] = true;
    }
    function safeMint(uint96 _royaltyFeeArtist, string memory _tokenURI) public onlyWhitelisted {
        require(_royaltyFeeArtist <= uint96(5000), "can not over 50% for royalty");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        _setTokenRoyalty(tokenId, msg.sender, _royaltyFeeArtist);
    }
    function _burn(uint256 tokenId) internal override(ERC721Royalty, ERC721URIStorage, ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Royalty, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }
    function addUserToWhitelist(address _addressToWhitelist) public onlyOwner {
        whitelistedAddresses[_addressToWhitelist] = true;
   }
   function archiveWhitelistedUser(address _address) public onlyOwner {
        whitelistedAddresses[_address] = false;
   }
   function isWhitelisted(address _address) public view returns (bool) {
       return whitelistedAddresses[_address];
   }
   modifier onlyWhitelisted() {
       require(isWhitelisted(msg.sender), "THE USER IS NOT IN WHITELIST");
       _;
    }
}
