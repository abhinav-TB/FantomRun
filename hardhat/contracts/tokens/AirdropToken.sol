// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AirdropToken is ERC20, Ownable {
    constructor() ERC20("AirdropToken", "ADT") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function claim(bytes calldata proof) external {
        (address to, uint8 score, uint256 secret) = abi.decode(proof, (address, uint8, uint256));
        require(secret == 5234198, "Invalid proof");
        _mint(to, score * 1 ether);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}