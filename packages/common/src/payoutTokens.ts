import { getTokensByChainId, TToken } from "@b0rza/gitcoin-chain-data";

export const getPayoutTokens = (chainId: number): TToken[] => {
  return getTokensByChainId(chainId);
};
