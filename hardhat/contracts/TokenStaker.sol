// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenStaker is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  uint256 private _totalStaked;
  mapping(address => uint256) private _balances;

  IERC20 public stakingToken;

  event Staked(address user, uint256 amount);
  event Withdrawn(address user, uint256 amount);
  
  constructor(
    address _stakingToken
  ) {
    stakingToken = IERC20(_stakingToken);
  }

  function stake(uint256 amount) external {
    require(amount > 0, "Invalid amount");
    _stake(amount);
  }

  function withdraw(uint256 amount) external {
    require(amount > 0, "Invalid amount");
    _withdraw(amount);
  }

  function totalStaked() external view returns (uint256) {
    return _totalStaked;
  }

  function balanceOf(address user) external view returns (uint256) {
    return _balances[user];
  }

  function _stake(uint256 amount) private nonReentrant {
    require(amount > 0, "Cannot stake 0");
    _totalStaked += amount;
    _balances[msg.sender] += amount;
    stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    emit Staked(msg.sender, amount);
  }

  function _withdraw(uint256 amount) private nonReentrant {
    _totalStaked -= amount;
    _balances[msg.sender] -= amount;
    stakingToken.safeTransfer(msg.sender, amount);
    emit Withdrawn(msg.sender, amount);
  }
}