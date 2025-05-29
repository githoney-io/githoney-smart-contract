import { creationFee, rewardFee } from "./constants";
import { Address } from "./types";
import dotenv from "dotenv";
import {
  Addresses,
  Assets,
  Credential,
  Lucid,
  Network,
  fromUnit
} from "@spacebudz/lucid";
import {
  CardanoAddressPaymentCredential,
  CardanoAddressStakeCredential
} from "./plutus";

dotenv.config();

function validatorSettings(githoneyAddr: string) {
  console.log("validatorSettings", githoneyAddr);
  return {
    githoneyAddress: bech32ToAddressType(githoneyAddr),
    creationFee: creationFee,
    rewardFee: rewardFee
  };
}

function bech32ToAddressType(addr: string): Address {
  const addressDetails = Addresses.inspect(addr);
  if (!addressDetails.payment) {
    throw new Error("Invalid address");
  }
  return {
    paymentCredential: {
      VerificationKey: [addressDetails.payment.hash]
    },
    stakeCredential: addressDetails.delegation
      ? {
          Inline: [
            {
              VerificationKey: [addressDetails.delegation.hash]
            }
          ]
        }
      : null
  };
}

function cardanoCredentialToCredential(
  credential: CardanoAddressPaymentCredential
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
  credential: CardanoAddressStakeCredential
) {
  if ("Inline" in credential) {
    return cardanoCredentialToCredential(credential.Inline[0]);
  } else {
    throw new Error("Invalid credential");
  }
}

/**
 * Obtiene el hash del paymentCredential, sea VerificationKey o Script.
 * @param paymentCredential Credential de pago.
 * @returns El hash como string.
 */
function keyPairsToAddress(network: Network, cardanoAddress: Address): string {
  return Addresses.credentialToAddress(
    network,
    cardanoCredentialToCredential(cardanoAddress.paymentCredential),
    cardanoAddress.stakeCredential
      ? cardanoStakingCredToCredential(cardanoAddress.stakeCredential)
      : undefined
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
  bech32ToAddressType,
  keyPairsToAddress,
  clearZeroAssets,
  extractBountyIdTokenUnit,
  cardanoCredentialToCredential,
  cardanoStakingCredToCredential
};
