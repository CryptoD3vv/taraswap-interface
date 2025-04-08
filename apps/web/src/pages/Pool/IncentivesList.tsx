import { Token } from "@taraswap/sdk-core";
import { CurrencyAmount } from "@taraswap/sdk-core";
import { useAccount } from "hooks/useAccount";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useState, useCallback } from "react";
import { Trans } from "i18n";
import { AutoColumn } from "components/Column";
import { LoadingRows, IncentiveCard, IncentiveHeader, IncentiveContent, AutoColumnWrapper, IncentiveStatus } from "./styled";
import { ThemedText } from "theme/components";
import { RowBetween, RowFixed } from "components/Row";
import CurrencyLogo from "components/Logo/CurrencyLogo";
import { ButtonPrimary } from "components/Button";
import { IncentiveKey } from "hooks/usePosition";
import Row from "components/Row";
import { getAddress } from "ethers/lib/utils";

interface MockedProcessedIncentive {
  id: string;
  poolName: string;
  poolAddress: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  token0LogoURI: string;
  token1LogoURI: string;
  token0Decimals: number;
  token1Decimals: number;
  liquidity: string;
  reward: string;
  totalReward: string;
  weeklyRewards: number;
  totalAPR: number;
  ended: boolean;
  hasUserPosition: boolean;
  accruedRewards: string;
}

function IncentivesList({ tokenId }: { tokenId: number }) {
  const [expandedIncentive, setExpandedIncentive] = useState<string | null>(null);
  const { address } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const [isBulkStaking, setIsBulkStaking] = useState(false);
  const [isBulkUnstaking, setIsBulkUnstaking] = useState(false);
  const [isBulkWithdrawing, setIsBulkWithdrawing] = useState(false);

  // Mock data for testing
  const mockedIncentives: MockedProcessedIncentive[] = [
    {
      id: '1',
      poolName: 'LARA/TARA',
      poolAddress: '0x1234567890123456789012345678901234567890',
      token0Symbol: 'TARA',
      token1Symbol: 'LARA',
      token0Address: '0xE6A69cD4FF127ad8E53C21a593F7BaC4c608945e',
      token1Address: '0xE6A69cD4FF127ad8E53C21a593F7BaC4c608945e',
      token0LogoURI: '',
      token1LogoURI: '',
      token0Decimals: 18,
      token1Decimals: 18,
      liquidity: '1000000000000000000',
      reward: '1',
      totalReward: '10000',
      weeklyRewards: 0,
      totalAPR: 25.5,
      ended: false,
      hasUserPosition: true,
      accruedRewards: '0.5',
    },
    {
      id: '2',
      poolName: 'LARA/TARA',
      poolAddress: '0x1234567890123456789012345678901234567890',
      token0Symbol: 'TARA',
      token1Symbol: 'LARA',
      token0Address: '0x1234567890123456789012345678901234567890',
      token1Address: '0xE6A69cD4FF127ad8E53C21a593F7BaC4c608945e',
      token0LogoURI: '',
      token1LogoURI: '',
      token0Decimals: 18,
      token1Decimals: 18,
      liquidity: '2000000000000000000',
      reward: '2',
      totalReward: '20000',
      weeklyRewards: 0,
      totalAPR: 30.2,
      ended: false,
      hasUserPosition: false,
      accruedRewards: '0',
    },
    {
      id: '3',
      poolName: 'LARA/TARA',
      poolAddress: '0x1234567890123456789012345678901234567890',
      token0Symbol: 'TARA',
      token1Symbol: 'LARA',
      token0Address: '0x1234567890123456789012345678901234567890',
      token1Address: '0xE6A69cD4FF127ad8E53C21a593F7BaC4c608945e',
      token0LogoURI: '',
      token1LogoURI: '',
      token0Decimals: 18,
      token1Decimals: 18,
      liquidity: '50000',
      reward: '0.5',
      totalReward: '5000',
      weeklyRewards: 0,
      totalAPR: 15.8,
      ended: true,
      hasUserPosition: true,
      accruedRewards: '1',
    },
  ];

  const allIncentives = mockedIncentives;

  const fetchIncentiveData = useCallback(async (incentiveId: string) => {
    const mockIncentive = mockedIncentives.find(inc => inc.id === incentiveId);
    if (mockIncentive) {
      return {
        rewardToken: { id: mockIncentive.poolAddress },
        pool: { id: mockIncentive.poolAddress },
        startTime: (Date.now() / 1000 - 3600).toString(),
        endTime: (Date.now() / 1000 + 3600).toString(),
        vestingPeriod: '86400',
        refundee: address || '0x0000000000000000000000000000000000000000'
      };
    }
    return null;
  }, [address]);

  const handleStake = useCallback(async (incentive: MockedProcessedIncentive) => {
    if (!v3StakerContract || !address) return;

    try {
      const incentiveData = await fetchIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const incentiveKey: IncentiveKey = {
        rewardToken: incentiveData.rewardToken.id,
        pool: incentiveData.pool.id,
        startTime: parseInt(incentiveData.startTime),
        endTime: parseInt(incentiveData.endTime),
        vestingPeriod: parseInt(incentiveData.vestingPeriod),
        refundee: incentiveData.refundee,
      };
      const stakeTx = await v3StakerContract.stakeToken(incentiveKey, tokenId);
      await stakeTx.wait();
    } catch (error) {
      console.error('Error staking:', error);
    }
  }, [v3StakerContract, tokenId, address, fetchIncentiveData]);

  const handleUnstake = useCallback(async (incentive: MockedProcessedIncentive) => {
    if (!v3StakerContract || !address) return;

    try {
      const incentiveData = await fetchIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const incentiveKey: IncentiveKey = {
        rewardToken: incentiveData.rewardToken.id,
        pool: incentiveData.pool.id,
        startTime: parseInt(incentiveData.startTime),
        endTime: parseInt(incentiveData.endTime),
        vestingPeriod: parseInt(incentiveData.vestingPeriod),
        refundee: incentiveData.refundee,
      };
      const unstakeTx = await v3StakerContract.unstakeToken(incentiveKey, tokenId);
      await unstakeTx.wait();
    } catch (error) {
      console.error('Error unstaking:', error);
    }
  }, [v3StakerContract, tokenId, address, fetchIncentiveData]);

  const handleClaim = useCallback(async (incentive: MockedProcessedIncentive) => {
    if (!v3StakerContract || !address) return;

    try {
      const incentiveData = await fetchIncentiveData(incentive.id);
      if (!incentiveData) {
        throw new Error('Failed to fetch incentive data');
      }

      const reward = await v3StakerContract.rewards(incentiveData.rewardToken.id, address);
      const claimTx = await v3StakerContract.claimReward(
        incentiveData.rewardToken.id,
        address,
        reward
      );
      await claimTx.wait();
    } catch (error) {
      console.error('Error claiming:', error);
    }
  }, [v3StakerContract, address, fetchIncentiveData]);

  const handleBulkStake = useCallback(async () => {
    if (!v3StakerContract || !address) return;
    setIsBulkStaking(true);

    try {
      for (const incentive of allIncentives) {
        if (!incentive.hasUserPosition && !incentive.ended) {
          const incentiveData = await fetchIncentiveData(incentive.id);
          if (!incentiveData) continue;

          const incentiveKey: IncentiveKey = {
            rewardToken: incentiveData.rewardToken.id,
            pool: incentiveData.pool.id,
            startTime: parseInt(incentiveData.startTime),
            endTime: parseInt(incentiveData.endTime),
            vestingPeriod: parseInt(incentiveData.vestingPeriod),
            refundee: incentiveData.refundee,
          };
          const stakeTx = await v3StakerContract.stakeToken(incentiveKey, tokenId);
          await stakeTx.wait();
        }
      }
    } catch (error) {
      console.error('Error in bulk staking:', error);
    } finally {
      setIsBulkStaking(false);
    }
  }, [v3StakerContract, tokenId, address, fetchIncentiveData, allIncentives]);

  const handleBulkUnstake = useCallback(async () => {
    if (!v3StakerContract || !address) return;
    setIsBulkUnstaking(true);

    try {
      for (const incentive of allIncentives) {
        if (incentive.hasUserPosition) {
          const incentiveData = await fetchIncentiveData(incentive.id);
          if (!incentiveData) continue;

          const incentiveKey: IncentiveKey = {
            rewardToken: incentiveData.rewardToken.id,
            pool: incentiveData.pool.id,
            startTime: parseInt(incentiveData.startTime),
            endTime: parseInt(incentiveData.endTime),
            vestingPeriod: parseInt(incentiveData.vestingPeriod),
            refundee: incentiveData.refundee,
          };
          const unstakeTx = await v3StakerContract.unstakeToken(incentiveKey, tokenId);
          await unstakeTx.wait();
        }
      }
    } catch (error) {
      console.error('Error in bulk unstaking:', error);
    } finally {
      setIsBulkUnstaking(false);
    }
  }, [v3StakerContract, tokenId, address, fetchIncentiveData, allIncentives]);

  const handleBulkWithdraw = useCallback(async () => {
    if (!v3StakerContract || !address) return;
    setIsBulkWithdrawing(true);

    try {
      const withdrawTx = await v3StakerContract.withdrawToken(tokenId, address);
      await withdrawTx.wait();
    } catch (error) {
      console.error('Error in bulk withdrawal:', error);
    } finally {
      setIsBulkWithdrawing(false);
    }
  }, [v3StakerContract, tokenId, address]);

  if (!allIncentives) {
    return (
      <AutoColumnWrapper gap="md">
        <LoadingRows>
          <div />
          <div />
          <div />
        </LoadingRows>
      </AutoColumnWrapper>
    );
  }

  return (
    <AutoColumnWrapper gap="md">
      <Trans i18nKey="common.incentives" />
      
      <Row gap="8px" justify="center" style={{ flexWrap: 'nowrap', width: '100%' }}>
        <ButtonPrimary
          onClick={handleBulkStake}
          disabled={isBulkStaking || allIncentives.every(inc => inc.hasUserPosition || inc.ended)}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkStaking ? (
            <Trans i18nKey="common.staking" />
          ) : (
            <Trans i18nKey="common.stakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkUnstake}
          disabled={isBulkUnstaking || allIncentives.every(inc => !inc.hasUserPosition)}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkUnstaking ? (
            <Trans i18nKey="common.unstaking" />
          ) : (
            <Trans i18nKey="common.unstakeAll" />
          )}
        </ButtonPrimary>
        <ButtonPrimary
          onClick={handleBulkWithdraw}
          disabled={isBulkWithdrawing}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkWithdrawing ? (
            <Trans i18nKey="common.withdrawing" />
          ) : (
            <Trans i18nKey="common.withdraw" />
          )}
        </ButtonPrimary>
      </Row>

      {allIncentives.map((incentive) => {
        const isExpanded = expandedIncentive === incentive.id;
        const isActive = !incentive.ended;
        const hasStaked = incentive.hasUserPosition;

        const rewardToken = new Token(
          1,
          incentive.token1Address,
          18,
          'LARA',
          'LARA'
        );


        return (
          <IncentiveCard key={incentive.id} onClick={() => setExpandedIncentive(isExpanded ? null : incentive.id)}>
            <IncentiveHeader>
              <RowFixed gap="8px">
                <CurrencyLogo 
                  currency={rewardToken} 
                  size={24}
                  logoURI={`https://raw.githubusercontent.com/taraswap/assets/master/logos/${getAddress(rewardToken.address)}/logo.png`}
                />
                <ThemedText.DeprecatedMain>
                  {incentive.totalReward} {rewardToken.symbol} Rewards
                </ThemedText.DeprecatedMain>
                {hasStaked && (
                  <ThemedText.DeprecatedMain style={{ marginLeft: '8px', fontSize: '14px' }}>
                    (Staked)
                  </ThemedText.DeprecatedMain>
                )}
              </RowFixed>
              <RowFixed gap="8px">
          
                <IncentiveStatus isActive={isActive}>
                  {isActive ? <Trans i18nKey="common.active" /> : <Trans i18nKey="common.ended" />}
                </IncentiveStatus>
             
              </RowFixed>
            </IncentiveHeader>
            {isExpanded && (
              <IncentiveContent gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedMain>
                    <Trans i18nKey="common.accruedRewards" />
                  </ThemedText.DeprecatedMain>
                  <RowFixed gap="8px">
                    <CurrencyLogo currency={rewardToken} size={20} />
                    <ThemedText.DeprecatedMain>
                      {incentive.accruedRewards} LARA
                    </ThemedText.DeprecatedMain>
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <ThemedText.DeprecatedMain>
                    Total APR
                  </ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedMain>
                    {incentive.totalAPR}%
                  </ThemedText.DeprecatedMain>
                </RowBetween>
                <Row justify="center" gap="8px">
                  {!hasStaked ? (
                    <ButtonPrimary
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStake(incentive);
                      }}
                      disabled={!isActive}
                      style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                    >
                      <Trans i18nKey="common.stake" />
                    </ButtonPrimary>
                  ) : (
                    <>
                      <ButtonPrimary
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnstake(incentive);
                        }}
                        style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                      >
                        <Trans i18nKey="common.unstake" />
                      </ButtonPrimary>
                      <ButtonPrimary
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(incentive);
                        }}
                        disabled={incentive.accruedRewards === '0'}
                        style={{ padding: '8px', fontSize: '14px', height: '32px', width: '120px' }}
                      >
                        <Trans i18nKey="common.claim" />
                      </ButtonPrimary>
                    </>
                  )}
                </Row>
              </IncentiveContent>
            )}
          </IncentiveCard>
        );
      })}
    </AutoColumnWrapper>
  );
}

export default IncentivesList; 