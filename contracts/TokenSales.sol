// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TokenSales is Ownable, Pausable {
  ERC721Royalty public nftAddress;
  ERC20 public tokenForPay;
  mapping(uint256 => MarketItem) private idToMarketItem;
  mapping(address => bool) public whitelistedAddresses;
  uint96 public commission = 250;
  address private market = address(0xe60B079468BD23204949996Bff0995Cc06a0d26b);
  struct MarketItem {
      uint256 price;
      address currency;
  }
  constructor(address _tokenAddress){
      nftAddress = ERC721Royalty(_tokenAddress);
      whitelistedAddresses[address(0x7F223b1607171B81eBd68D22f1Ca79157Fd4A44b)] = true;
      whitelistedAddresses[address(0)] = true;
  }
  function listItem(uint256 _tokenId, uint256 _price, address _currency) public {
      address nftOwner = nftAddress.ownerOf(_tokenId);
      require(whitelistedAddresses[_currency], "THE ADDRESS(ERC20) IS NOT IN WHITELIST");
      require(idToMarketItem[_tokenId].price == 0, "THIS NFT ALREADY LISTED");
      require(nftOwner == msg.sender, "CALLER IS NOT NFT SELLER");
      require(_price > 0 , "PRICE IS ZERO OR LOWER");
      require(nftAddress.getApproved(_tokenId) == address(this), "NFT OWNER DID NOT APPROVE TOKENSALES CONTRACT");
      idToMarketItem[_tokenId] = MarketItem(_price, _currency);
  }
  //general way by klay
  function buyItem(uint256 _tokenId) public payable whenNotPaused {
      require(idToMarketItem[_tokenId].currency == address(0), "THIS NFT HAS TO BE PAID BY KLAY");
      address nftSeller = nftAddress.ownerOf(_tokenId);
      require(msg.sender != nftSeller, "CALLER IS NFT SELLER");
      uint256 price = idToMarketItem[_tokenId].price;
      require(price > 0, "NOT LISTED NFT");
      require(msg.value == price, "PRICE DOES NOT MATCH WITH NFT");
      (uint256 realPrice, uint256 royalty, uint256 marketCommission, address artist) = _priceHandler(_tokenId, nftSeller, msg.value);
      payable(nftSeller).transfer(realPrice);
      payable(market).transfer(marketCommission);
      if(royalty !=0) {
          payable(artist).transfer(royalty);
      }
      nftAddress.safeTransferFrom(nftSeller, msg.sender, _tokenId);
      idToMarketItem[_tokenId].price= 0;
  }
  // pay by ERC20token
  function buyItemByERC20(uint256 _tokenId, address _tokenAddress, uint256 _price) public whenNotPaused {
      require(idToMarketItem[_tokenId].currency == _tokenAddress, "UNMATCHED ERC20 TOKEN IN MARKET CONTRACT");
      address nftSeller = nftAddress.ownerOf(_tokenId);
      require(msg.sender != nftSeller, "CALLER IS NFT SELLER");
      uint256 price = idToMarketItem[_tokenId].price;
      require(_price == price, "PRICE DOES NOT MATCH WITH NFT");
      (uint256 realPrice, uint256 royalty, uint256 marketCommission, address artist) = _priceHandler(_tokenId, nftSeller, _price);
      
      tokenForPay = ERC20(_tokenAddress);
      require(tokenForPay.transferFrom(msg.sender, nftSeller, realPrice), "ERC20 TRANSFER FAILED TO SELLER");
      require(tokenForPay.transferFrom(msg.sender, market, marketCommission), "ERC20 TRANSFER FAILED TO MARKET");
      if(royalty !=0 ) {
         require(tokenForPay.transferFrom(msg.sender, artist , royalty), "ERC20 TRANSFER FAILED TO ARTIST");
      }
      nftAddress.safeTransferFrom(nftSeller, msg.sender, _tokenId);
      idToMarketItem[_tokenId] = MarketItem(0, address(0));
  }
  function cancelListedItem(uint256 _tokenId) public {
      require(idToMarketItem[_tokenId].price > 0, "NO PRICE IN THIS TOKEN");
      address nftSeller = nftAddress.ownerOf(_tokenId);
      require(msg.sender == nftSeller, "CALLER IS NOT NFT SELLER");
      idToMarketItem[_tokenId] = MarketItem(0, address(0));
  }
  function _priceHandler(uint256 _tokenId, address _nftSeller, uint256 _price) internal view returns(uint256, uint256, uint256, address){
      uint256 royalty;
      uint256 commissionPrice = _commissionCalculator(_price);
      uint256 resultPrice; 
      address artist;
      (artist, royalty) = nftAddress.royaltyInfo(_tokenId, _price);
      require(_price >= royalty + commissionPrice, "CALCULATION IS WRONG");
      if((royalty == 0) || artist == _nftSeller) {
        resultPrice = _price -  commissionPrice;
        royalty = 0;
      } else {
        resultPrice= _price - royalty - commissionPrice;
      }
      return (resultPrice, royalty, commissionPrice, artist);
  }
  function _commissionCalculator(uint256 _salePrice) internal view returns (uint256 ) {
        uint256 salePrice = (_salePrice * commission) / 10000;
        return  salePrice;
   }
   function updateCommissionBips(uint96 _commission) external onlyOwner {
        require(_commission <= uint96(1000), "MARKET COMMISSION CAN NOT BE MORE THAN 10%");
        commission = _commission;
   }

    function updateCommissionAddress(address _market) external onlyOwner {
        market = _market;
   }

   function getMarketItemInfo(uint256 _tokenId) public view returns(uint256, address){
       return (idToMarketItem[_tokenId].price, idToMarketItem[_tokenId].currency);
   }
   
   function pause() external onlyOwner {
       _pause();
   }
   function unPause() external onlyOwner {
       _unpause();
   }
   function addERC20Whitelist(address _addressToWhitelist) public onlyOwner {
       whitelistedAddresses[_addressToWhitelist] = true;
   }
   function archiveWhitelistedERC20(address _address) public onlyOwner {
       require(whitelistedAddresses[_address], "THE ADDRESS(ERC20) IS NOT IN WHITELIST");
       whitelistedAddresses[_address] = false;
   }
}