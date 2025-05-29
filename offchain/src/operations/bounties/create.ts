import {
  Data,
  fromText,
  toUnit,
  Lucid,
  Utxo,
  Assets,
  fromUnit,
  Addresses
} from "@spacebudz/lucid";
import { MIN_ADA } from "../../constants";
import { SettingsDatumSchema, mkDatum } from "../../types";
import { bech32ToAddressType, keyPairsToAddress } from "../../utils";
import logger from "../../logger";

/**
 * Builds a `createBounty` transaction. The tx is built in the context of the maintainer wallet.
 * @param settingsUtxo The settings Utxo.
 * @param maintainerAddr The maintainer's address.
 * @param adminAddr The admin's address.
 * @param rewards The reward assets and amount to be locked in the bounty Utxo.
 * @param deadline The deadline for the bounty.
 * @param bounty_id The bounty identifier.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function createBounty(
  settingsUtxo: Utxo,
  maintainerAddr: string,
  adminAddr: string,
  rewards: Assets,
  deadline: bigint,
  bounty_id: string,
  lucid: Lucid
): Promise<string> {
  logger.info("START createBounty");

  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const validatorAddress = Addresses.scriptToAddress(
    lucid.network,
    githoneyScript
  );

  const mintingPolicyid = Addresses.scriptToCredential(githoneyScript);
  const bountyIdTokenUnit = toUnit(mintingPolicyid.hash, fromText(bounty_id));
  const mintAssets = {
    [bountyIdTokenUnit]: 1n
  };
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime();

  if (settings.bountyRewardFee < 0n || settings.bountyRewardFee > 10_000n) {
    throw new Error("Reward fee must be between 0 and 10000");
  }
  if (BigInt(settings.bountyCreationFee) < 2_000_000n) {
    throw new Error("Creation fee must be at least 2 ADA");
  }
  if (deadline < tomorrow) {
    throw new Error("Deadline must be at least 24 hours from now");
  }

  const rewardsWithLovelace = {
    ...rewards,
    lovelace: rewards.lovelace ? rewards.lovelace + MIN_ADA : MIN_ADA
  };

  const utxoAssets: Assets = {
    ...rewardsWithLovelace,
    ...mintAssets
  };
  const maintainerWallet = bech32ToAddressType(maintainerAddr);
  const adminWallet = bech32ToAddressType(adminAddr);
  const githoneyAddr = await keyPairsToAddress(
    lucid.network,
    settings.githoneyAddress
  );

  logger.info(`Maintainer Address ${maintainerAddr}`);
  logger.info(`Admin Address ${adminAddr}`);
  logger.info(`Githoney Address ${githoneyAddr}`);
  // New tx to pay to the contract the minAda and mint the admin, githoney, developer and mantainer tokens
  lucid.selectReadOnlyWallet({ address: maintainerAddr });

  const rewardsValue = new Map();

  Object.entries(rewardsWithLovelace).forEach(([key, value]) => {
    const unit = fromUnit(key);
    const policyId = unit.policyId === "lovelace" ? "" : unit.policyId;
    const assetName = unit.assetName || "";

    if (!rewardsValue.has(policyId)) {
      rewardsValue.set(policyId, new Map());
    }
    rewardsValue.get(policyId)!.set(assetName, value);
  });

  const bountyDatum = mkDatum({
    adminPaymentCredential: adminWallet.paymentCredential,
    maintainerAddress: maintainerWallet,
    contributorAddress: null,
    bountyRewardFee: settings.bountyRewardFee,
    deadline,
    merged: false,
    initialValue: rewardsValue
  });

  lucid.selectReadOnlyWallet({ address: maintainerAddr });
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .payToContract(validatorAddress, { Inline: bountyDatum }, utxoAssets)
    .payTo(githoneyAddr, { lovelace: settings.bountyCreationFee })
    .mint(mintAssets, Data.void())
    .commit();

  const cbor = tx.toString();
  logger.info("END createBounty");
  logger.info(`Create ${cbor}`);
  return cbor;
}

export { createBounty };
