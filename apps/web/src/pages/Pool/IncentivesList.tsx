import { Token } from "@taraswap/sdk-core";
import { CurrencyAmount } from "@taraswap/sdk-core";
import { useAccount } from "hooks/useAccount";
import { useV3StakerContract } from "hooks/useV3StakerContract";
import { useState, useCallback, useEffect, useMemo } from "react";
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
import { useIncentivesData, type ProcessedIncentive } from "hooks/useIncentivesData";
import { ScrollBarStyles } from "components/Common";
import styled from "styled-components";
import useMultiChainPositions from "components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions";
import { Pool } from "@taraswap/v3-sdk";
import { ChainId } from "@taraswap/sdk-core";

const Container = styled(AutoColumnWrapper)`
  position: relative;
  height: 100%;
`

const ButtonsContainer = styled(Row)`
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.surface1};
  padding: 16px 0;
  gap: 8px;
  justify-content: center;
  z-index: 1;
`

const ScrollableContent = styled(AutoColumnWrapper)`
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  gap: 0px;
  ${ScrollBarStyles}
`

function IncentivesList({ tokenId, poolAddress }: { tokenId: number, poolAddress: string }) {
  const [expandedIncentive, setExpandedIncentive] = useState<string | null>(null);
  const { address, chainId } = useAccount();
  const v3StakerContract = useV3StakerContract();
  const [isBulkStaking, setIsBulkStaking] = useState(false);
  const [isBulkUnstaking, setIsBulkUnstaking] = useState(false);
  const [isBulkWithdrawing, setIsBulkWithdrawing] = useState(false);
  const [isTokenOwner, setIsTokenOwner] = useState(false);
  const [hasRewards, setHasRewards] = useState(false);

  const { activeIncentives, endedIncentives, isLoading, error } = useIncentivesData(poolAddress);
  const allIncentives = [...activeIncentives, ...endedIncentives];

  const { positions } = useMultiChainPositions(address ?? '', [chainId ?? ChainId.MAINNET]);
  const hasPositionInPool = useMemo(() => {
    return positions?.some(
      (position: any) =>
        Pool.getAddress(position.pool.token0, position.pool.token1, position.pool.fee).toLowerCase() ===
        poolAddress.toLowerCase()
    ) ?? false;
  }, [positions, poolAddress]);

  const fetchIncentiveData = useCallback(async (incentiveId: string) => {
    const incentive = allIncentives.find(inc => inc.id === incentiveId);
    if (incentive) {
      return {
        rewardToken: { id: incentive.poolAddress },
        pool: { id: incentive.poolAddress },
        startTime: (Date.now() / 1000 - 3600).toString(),
        endTime: (Date.now() / 1000 + 3600).toString(),
        vestingPeriod: '86400',
        refundee: address || '0x0000000000000000000000000000000000000000'
      };
    }
    return null;
  }, [address, allIncentives]);

  useEffect(() => {
    const checkTokenOwnership = async () => {
      if (!v3StakerContract || !address) {
        setIsTokenOwner(false);
        return;
      }

      try {
        const depositData = await v3StakerContract.deposits(tokenId);
        console.log('depositData', depositData);
        setIsTokenOwner(depositData.owner.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error('Error checking token ownership:', error);
        setIsTokenOwner(false);
      }
    };

    checkTokenOwnership();
  }, [v3StakerContract, address, tokenId]);

  useEffect(() => {
    const checkRewards = async () => {
      if (!v3StakerContract || !address) {
        setHasRewards(false);
        return;
      }

      try {
        let totalRewards = 0;
        for (const incentive of allIncentives) {
          const incentiveData = await fetchIncentiveData(incentive.id);
          if (!incentiveData) continue;
          
          const reward = await v3StakerContract.rewards(incentiveData.rewardToken.id, address);
          totalRewards += reward.toNumber();
        }
        setHasRewards(totalRewards > 0);
      } catch (error) {
        console.error('Error checking rewards:', error);
        setHasRewards(false);
      }
    };

    checkRewards();
  }, [v3StakerContract, address, allIncentives, fetchIncentiveData]);

  const handleStake = useCallback(async (incentive: ProcessedIncentive) => {
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

  const handleUnstake = useCallback(async (incentive: ProcessedIncentive) => {
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

  const handleClaim = useCallback(async (incentive: ProcessedIncentive) => {
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
    if (!v3StakerContract || !address || !nftManagerPositionsContract) return;
    setIsBulkStaking(true);

    try {
      // First check if we need to approve the staker contract
      const isApproved = await nftManagerPositionsContract.isApprovedForAll(
        address,
        v3StakerContract.address
      );

      if (!isApproved) {
        const approveTx = await nftManagerPositionsContract.setApprovalForAll(
          v3StakerContract.address,
          true
        );
        await approveTx.wait();
      }

      // Get all active incentives that the user hasn't staked in yet
      const incentivesToStake = activeIncentives.filter(
        (incentive) => !incentive.hasUserPosition
      );

      if (incentivesToStake.length === 0) {
        throw new Error('No incentives available to stake');
      }

      // Create array of incentive keys
      const incentiveKeys = await Promise.all(
        incentivesToStake.map(async (incentive) => {
          const incentiveData = await fetchIncentiveData(incentive.id);
          if (!incentiveData) throw new Error('Failed to fetch incentive data');
          return {
            rewardToken: incentiveData.rewardToken.id,
            pool: incentiveData.pool.id,
            startTime: parseInt(incentiveData.startTime),
            endTime: parseInt(incentiveData.endTime),
            vestingPeriod: parseInt(incentiveData.vestingPeriod),
            refundee: incentiveData.refundee,
          };
        })
      );

      // Encode the incentive keys array
      const encodedIncentiveKeys = v3StakerContract.interface.encodeFunctionData(
        'stakeToken',
        [incentiveKeys[0], tokenId]
      );

      // Transfer the NFT to the staker contract with the encoded incentive keys
      const transferTx = await nftManagerPositionsContract[
        'safeTransferFrom(address,address,uint256,bytes)'
      ](address, v3StakerContract.address, tokenId, encodedIncentiveKeys);
      await transferTx.wait();
    } catch (error) {
      console.error('Error in bulk staking:', error);
    } finally {
      setIsBulkStaking(false);
    }
  }, [v3StakerContract, tokenId, address, fetchIncentiveData, activeIncentives, nftManagerPositionsContract]);

  const handleBulkUnstake = useCallback(async () => {
    if (!v3StakerContract || !address) return;
    setIsBulkUnstaking(true);

    try {
      // Get all incentives that the user has staked in
      const stakedIncentives = allIncentives.filter(
        (incentive) => incentive.hasUserPosition
      );

      if (stakedIncentives.length === 0) {
        throw new Error('No incentives to unstake from');
      }

      // Create array of incentive keys
      const incentiveKeys = await Promise.all(
        stakedIncentives.map(async (incentive) => {
          const incentiveData = await fetchIncentiveData(incentive.id);
          if (!incentiveData) throw new Error('Failed to fetch incentive data');
          return {
            rewardToken: incentiveData.rewardToken.id,
            pool: incentiveData.pool.id,
            startTime: parseInt(incentiveData.startTime),
            endTime: parseInt(incentiveData.endTime),
            vestingPeriod: parseInt(incentiveData.vestingPeriod),
            refundee: incentiveData.refundee,
          };
        })
      );

      // Create multicall data for unstaking from all incentives
      const unstakeCalls = incentiveKeys.map((key) => {
        return v3StakerContract.interface.encodeFunctionData('unstakeToken', [
          key,
          tokenId,
        ]);
      });

      // Execute the multicall
      const unstakeTx = await v3StakerContract.multicall(unstakeCalls);
      await unstakeTx.wait();
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

  if (isLoading) {
    return (
      <Container gap="md">
        <LoadingRows>
          <div />
          <div />
          <div />
        </LoadingRows>
      </Container>
    );
  }

  if (error) {
    return (
      <Container gap="md">
        <ThemedText.DeprecatedMain>Error loading incentives: {error.message}</ThemedText.DeprecatedMain>
      </Container>
    );
  }

  return (
    <Container gap="md">
      <Trans i18nKey="common.incentives" />

      <ButtonsContainer gap="8px">
        <ButtonPrimary
          onClick={handleBulkStake}
          disabled={isBulkStaking}
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
          disabled={isBulkWithdrawing || !hasRewards}
          style={{ padding: '8px', fontSize: '14px', height: '32px', whiteSpace: 'nowrap', width: '120px' }}
        >
          {isBulkWithdrawing ? (
            <Trans i18nKey="common.withdrawing" />
          ) : (
            <Trans i18nKey="common.withdraw" />
          )}
        </ButtonPrimary>
      </ButtonsContainer>

      <ScrollableContent gap="md">
        {allIncentives.map((incentive) => {
          const isExpanded = expandedIncentive === incentive.id;
          const isActive = !incentive.ended;
          const hasStaked = incentive.hasUserPosition;

          const rewardToken = new Token(
            1,
            incentive.token1Address,
            18,
            incentive.rewardSymbol,
            incentive.rewardSymbol
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
                    {incentive.reward} {rewardToken.symbol} Rewards
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
                      <CurrencyLogo
                        currency={rewardToken}
                        size={20}
                        logoURI={`https://raw.githubusercontent.com/taraswap/assets/master/logos/${getAddress(rewardToken.address)}/logo.png`}
                      />
                      <ThemedText.DeprecatedMain>
                        {incentive.accruedRewards || '0'} {rewardToken.symbol}
                      </ThemedText.DeprecatedMain>
                    </RowFixed>
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
                          disabled={!incentive.accruedRewards || Number(incentive.accruedRewards) <= 0}
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
      </ScrollableContent>
    </Container>
  );
}

export default IncentivesList; 