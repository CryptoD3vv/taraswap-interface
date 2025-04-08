import styled from 'styled-components';
import { AutoColumn } from 'components/Column';
import Row from 'components/Row';

export const IncentiveCard = styled.div`
  background: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.surface3};
  }
`

export const IncentiveHeader = styled(Row)`
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

export const IncentiveContent = styled(AutoColumn)`
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.surface3};
`

export const IncentiveStatus = styled.div<{ isActive: boolean }>`
  background: ${({ theme, isActive }) => isActive ? theme.success : theme.surface3};
  color: ${({ theme, isActive }) => isActive ? theme.surface1 : theme.neutral2};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
`

export const AutoColumnWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 0;
` 