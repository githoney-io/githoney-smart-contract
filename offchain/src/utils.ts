import { creationFee, rewardFee } from "./constants";
import { WalletT } from "./types";
import dotenv from "dotenv";
import { Address, AddressDetails, Lucid, Utils } from "lucid-cardano";

dotenv.config();

function validatorParams(lucid: Lucid) {
  const githoneyAddr = process.env.GITHONEY_ADDR!;
  const gitHoneyCredentials = lucid.utils.getAddressDetails(githoneyAddr);
  const gitHoneyWallet: WalletT = {
    paymentKey: gitHoneyCredentials.paymentCredential!.hash,
    stakeKey: gitHoneyCredentials.stakeCredential!.hash
  };

  return {
    githoneyWallet: gitHoneyWallet,
    creationFee: BigInt(creationFee),
    rewardFee: BigInt(rewardFee)
  };
}

function addrToWallet(address: string, lucid: Lucid): WalletT {
  const details = lucid.utils.getAddressDetails(address);
  return {
    paymentKey: details.paymentCredential!.hash,
    stakeKey: details.stakeCredential!.hash
  };
}

/**
 * Converts a keys pair to its corresponding address.
 * @param keyPairs payment and (optional) stake key.
 * @returns Address in bech32 representation.
 */
async function keyPairsToAddress(
  lucid: Lucid,
  keyPairs: { paymentKey: string; stakeKey: string | null }
): Promise<Address> {
  const utils = new Utils(lucid);
  const { paymentKey, stakeKey } = keyPairs;
  return utils.credentialToAddress(
    utils.keyHashToCredential(paymentKey),
    stakeKey ? utils.keyHashToCredential(stakeKey) : undefined
  );
}

export { validatorParams, addrToWallet, keyPairsToAddress };
