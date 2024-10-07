import { creationFee, rewardFee } from "./constants";
import { WalletT } from "./types";
import dotenv from "dotenv";
import { Address, Assets, Lucid, Utils, fromUnit } from "lucid-txpipe";

dotenv.config();

function validatorSettings(lucid: Lucid, githoneyAddr: string) {
  const gitHoneyCredentials = lucid.utils.getAddressDetails(githoneyAddr);
  const gitHoneyWallet: WalletT = {
    paymentKey: gitHoneyCredentials.paymentCredential!.hash,
    stakeKey: gitHoneyCredentials.stakeCredential?.hash || null
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
    stakeKey: details.stakeCredential?.hash || null
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

function clearZeroAssets(assets: Assets): Assets {
  const keys = Object.keys(assets);
  for (let k = 0; k < keys.length; k++) {
    if (assets[keys[k]] === BigInt(0)) {
      delete assets[keys[k]];
    }
  }
  return assets;
}

function extractBountyIdTokenUnit(
  assets: Assets,
  mintingPolicyid: string
): string {
  let bountyIdTokenUnit = "";
  Object.keys(assets).forEach((unit) => {
    if (mintingPolicyid === fromUnit(unit).policyId) {
      bountyIdTokenUnit = unit;
    }
  });
  return bountyIdTokenUnit;
}

export {
  validatorSettings,
  addrToWallet,
  keyPairsToAddress,
  clearZeroAssets,
  extractBountyIdTokenUnit
};
