import { ethers } from "ethers";
import { global } from "../global";
import {
  Dispatch,
} from "redux";
import { RootState } from "../reducers";
import { notWeb3Browser } from "./web3"
import GrantsRegistryABI from "../contracts/abis/GrantsRegistry.json";
import { addressesByChainID } from "../contracts/deployments";
import { NewGrant } from "../reducers/newGrant";
import { parseMintEvents } from "./utils/grants";

export const NEW_GRANT_TX_STATUS = "NEW_GRANT_TX_STATUS";
export interface NewGrantTXStatus {
  type: typeof NEW_GRANT_TX_STATUS
  status: string
}

export const NEW_GRANT_CREATED = "NEW_GRANT_CREATED";
export interface GrantCreated {
  type: typeof NEW_GRANT_CREATED
  id: number
  ipfsHash: string
  owner?: string
}

export type NewGrantActions = GrantCreated | NewGrantTXStatus;

export const grantTXStatus = (status: string): NewGrantActions => ({
  type: NEW_GRANT_TX_STATUS,
  status,
});

export const grantCreated = ({ id,ipfsHash, owner }: NewGrant): NewGrantActions => ({
  type: NEW_GRANT_CREATED,
  id,
  ipfsHash,
  owner
});

export const mintGrant = () => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const chainID = state.web3.chainID;
    const addresses = addressesByChainID(chainID!);
    const signer = global.web3Provider?.getSigner()
    const grantNFTContract = new ethers.Contract(addresses.grantNft, GrantsRegistryABI, signer)
    if (state.ipfs.lastFileSavedURL) {
      const mintTx = await grantNFTContract.mintGrant(state.web3.account, state.ipfs.lastFileSavedURL)
      dispatch(grantTXStatus('initiated'))
      const txStatus = await mintTx.wait()
      if (txStatus.status) {
        const grantData = parseMintEvents(txStatus.events)
        if (!(grantData instanceof Error)) {
          dispatch(grantTXStatus('complete'))
          dispatch(grantCreated(grantData))
        }
      } else {
        throw Error('Unable to mint TX')
      }
    }
  }
}
