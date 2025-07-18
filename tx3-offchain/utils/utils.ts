import {
  Lucid,
  Blockfrost,
  Addresses,
  Network,
  Credential,
  Assets,
  fromUnit,
} from "@spacebudz/lucid";

import dotenv from "dotenv";
import {
  CardanoAddressAddress,
  CardanoAddressPaymentCredential,
  CardanoAddressStakeCredential,
} from "../plutus";

dotenv.config();

export const lucidBase = new Lucid({
  provider: new Blockfrost(
    process.env.BLOCKFROST_URL as string,
    process.env.PREPROD_BLOCKFROST_PROJECT_ID,
  ),
});

export const lucidWithWallet = lucidBase.selectWalletFromSeed(
  process.env.SEED as string,
);

export const cExplorerTxURL = "https://preprod.cexplorer.io/tx/";

export const signAndSubmit = async (cbor: string): Promise<string> => {
  const lucid = lucidBase.selectWalletFromSeed(process.env.SEED as string);
  const tx = await lucid.fromTx(cbor);
  const signedTx = await tx.sign().commit();
  const txHash = await signedTx.submit();
  console.log("Submitted transaction. View it at: " + cExplorerTxURL + txHash);

  return txHash;
};

function cardanoCredentialToCredential(
  credential: CardanoAddressPaymentCredential,
): Credential {
  let hash: string;
  if ("VerificationKey" in credential) {
    hash = (credential.VerificationKey as [string])[0];
  } else {
    hash = (
      (credential as unknown as { Script: [string] }).Script as [string]
    )[0];
  }
  return Addresses.keyHashToCredential(hash);
}

function cardanoStakingCredToCredential(
  credential: CardanoAddressStakeCredential,
) {
  if ("Inline" in credential) {
    return cardanoCredentialToCredential(credential.Inline[0]);
  } else {
    throw new Error("Invalid credential");
  }
}

/**
 * Gets the hash of the paymentCredential, whether VerificationKey or Script.
 * @param paymentCredential Payment credential.
 * @returns The hash as string.
 */
export function keyPairsToAddress(
  network: Network,
  cardanoAddress: CardanoAddressAddress,
): string {
  return Addresses.credentialToAddress(
    network,
    cardanoCredentialToCredential(cardanoAddress.paymentCredential),
    cardanoAddress.stakeCredential
      ? cardanoStakingCredToCredential(cardanoAddress.stakeCredential)
      : undefined,
  );
}

export function extractBountyIdTokenUnit(
  assets: Assets,
  mintingPolicyid: string,
): string {
  let bountyIdTokenUnit = "";
  Object.keys(assets).forEach((unit) => {
    if (mintingPolicyid === fromUnit(unit).policyId) {
      bountyIdTokenUnit = unit;
    }
  });
  return bountyIdTokenUnit;
}

export function getRewardAsset(
  assets: Assets,
  scriptHash: string,
): { rewardPolicy: string; rewardName: string; rewardAmount: bigint } {
  const unit = Object.keys(assets).find((unit) => {
    return (
      fromUnit(unit).policyId !== scriptHash &&
      fromUnit(unit).policyId !== "lovelace"
    );
  });

  if (!unit) {
    throw new Error("No reward asset found");
  }

  return {
    rewardPolicy: fromUnit(unit).policyId,
    rewardName: fromUnit(unit).name || "",
    rewardAmount: assets[unit],
  };
}
