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
  // APR
  mapping(StakingTier => uint8) public rewardRate;
  // months
  mapping(StakingTier => uint8) public lockupPeriod;

  uint256 private constant MONTH = 60*60*24*30;
  uint256 private constant YEAR = MONTH*12;

  uint256 private _totalStaked;
  mapping(address => uint256) private _stakeBalances;
  mapping(address => uint256) private _depositTime;
  mapping(address => uint256) private _lastUpdatedTime;

  event Staked(address user, uint256 amount);
  event Withdrawn(address user, uint256 amount);
  event ClaimedReward(address user, uint256 amount);
  
  constructor(
    address _stakingToken,
    address _rewardToken,
    address _NFTcontract
  ) {
    stakingToken = IERC20(_stakingToken);
    rewardToken = IERC20(_rewardToken);
    NFTcontract = IERC1155(_NFTcontract);

    rewardRate[StakingTier.Tier1] = 8;
    rewardRate[StakingTier.Tier2] = 6;
    rewardRate[StakingTier.Tier3] = 4;
    rewardRate[StakingTier.Tier4] = 2;

    lockupPeriod[StakingTier.Tier1] = 24;
    lockupPeriod[StakingTier.Tier2] = 18;
    lockupPeriod[StakingTier.Tier3] = 12;
    lockupPeriod[StakingTier.Tier4] = 6;
  }

  function setStakingToken(address _stakingToken) external onlyOwner {
    stakingToken = IERC20(_stakingToken);
  }

  function setRewardToken(address _rewardToken) external onlyOwner {
    rewardToken = IERC20(_rewardToken);
  }

  function setNFTcontract(address _NFTcontract) external onlyOwner {
    NFTcontract = IERC1155(_NFTcontract);
  }

  function stake(uint256 amount) external {
    require(amount > 0, "Invalid amount");
    if (_stakeBalances[msg.sender] == 0) {
      _depositTime[msg.sender] = block.timestamp;
    }
    _lastUpdatedTime[msg.sender] = block.timestamp;
    _stake(amount);
  }

  function withdraw(uint256 amount) external {
    require(amount > 0, "Invalid amount");
    require((block.timestamp - _depositTime[msg.sender]) 
              >= lockupPeriod[getStakingTier(msg.sender)] * MONTH,
              "Withdrawal not active"
            );
    _depositTime[msg.sender] = 0;
    _withdraw(amount);
  }

  function claimReward() external {
    uint256 amount = unclaimedReward(msg.sender);
    _lastUpdatedTime[msg.sender] = block.timestamp;
    rewardToken.safeTransfer(msg.sender, amount);
    emit ClaimedReward(msg.sender, amount);
  }

  function setRewardRate(StakingTier tier, uint8 rate) external onlyOwner {
    require(rate > 0, "Cannot be 0");
    rewardRate[tier] = rate;
  }

  function setLockupPeriod(StakingTier tier, uint8 months) external onlyOwner {
    require(months > 0, "Cannot be 0");
    lockupPeriod[tier] = months;
  }

  function totalStaked() external view returns (uint256) {
    return _totalStaked;
  }

  function stakeBalanceOf(address user) public view returns (uint256) {
    return _stakeBalances[user];
  }

  function getStakingTier(address account) public view returns (StakingTier) {
    StakingTier _userTier = StakingTier.Tier4;
    if (NFTcontract.balanceOf(account, 3) != 0) {
      _userTier = StakingTier.Tier1;
    } else if (NFTcontract.balanceOf(account, 2) != 0) {
      _userTier = StakingTier.Tier2;
    } else if (NFTcontract.balanceOf(account, 1) != 0) {
      _userTier = StakingTier.Tier3;
    }
    return _userTier;
  }

  function getRewardRate(address account) public view returns (uint8) {
    StakingTier _userTier = getStakingTier(account);
    return rewardRate[_userTier];
  }

  function unclaimedReward(address account) public view returns (uint256) {
    require(_stakeBalances[account] > 0, "Not staking");
    uint256 rewardAmount =  (_stakeBalances[account] 
                              * getRewardRate(account) 
                              * (block.timestamp - _lastUpdatedTime[account])
                            ) / (YEAR * 100);
    return rewardAmount;
  }

  function getMonthsRemaining(address account) public view returns (uint8) {
    require(_stakeBalances[account] > 0, "Not staking");
    if (block.timestamp > _depositTime[account] + lockupPeriod[getStakingTier(account)] * MONTH) {
      return 0;
    } else {
      return uint8(((_depositTime[account] + lockupPeriod[getStakingTier(account)] * MONTH)
                      - block.timestamp) / MONTH);
    }
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