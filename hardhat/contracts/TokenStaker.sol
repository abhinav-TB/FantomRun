// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenStaker is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  enum StakingTier {
    Tier1,
    Tier2,
    Tier3,
    Tier4
  }

  IERC20 public stakingToken;
  IERC20 public rewardToken;
  IERC1155 public NFTcontract;

  uint256 private _totalStaked;
  mapping(address => uint256) private _stakeBalances;
  mapping(StakingTier => uint8) private _rewardRate;

  event Staked(address user, uint256 amount);
  event Withdrawn(address user, uint256 amount);
  
  constructor(
    address _stakingToken,
    address _rewardToken,
    address _NFTcontract
  ) {
    stakingToken = IERC20(_stakingToken);
    rewardToken = IERC20(_rewardToken);
    NFTcontract = IERC1155(_NFTcontract);
    _rewardRate[StakingTier.Tier1] = 8;
    _rewardRate[StakingTier.Tier2] = 6;
    _rewardRate[StakingTier.Tier3] = 4;
    _rewardRate[StakingTier.Tier4] = 2;
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

  function stakeBalanceOf(address user) external view returns (uint256) {
    return _stakeBalances[user];
  }

  function userTier(address account) public view returns (StakingTier) {
    StakingTier _userTier = StakingTier.Tier4;
    if (NFTcontract.balanceOf(account, 4) != 0) {
      _userTier = StakingTier.Tier1;
    } else if (NFTcontract.balanceOf(account, 3) != 0) {
      _userTier = StakingTier.Tier2;
    } else if (NFTcontract.balanceOf(account, 2) != 0) {
      _userTier = StakingTier.Tier3;
    }
    return _userTier;
  }

  function rewardRate(address account) public view returns (uint8) {
    StakingTier _userTier = userTier(account);
    return _rewardRate[_userTier];
  }

  function _stake(uint256 amount) private nonReentrant {
    _totalStaked += amount;
    _stakeBalances[msg.sender] += amount;
    stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    emit Staked(msg.sender, amount);
  }

  function _withdraw(uint256 amount) private nonReentrant {
    _totalStaked -= amount;
    _stakeBalances[msg.sender] -= amount;
    stakingToken.safeTransfer(msg.sender, amount);
    emit Withdrawn(msg.sender, amount);
  }
}