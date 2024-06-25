import { Data, fromText, toUnit, Lucid, UTxO } from "lucid-cardano";
import { MIN_ADA } from "../../constants";
import { SettingsDatum, mkDatum } from "../../types";
import { addrToWallet, keyPairsToAddress } from "../../utils";
import logger from "../../logger";

async function createBounty(
  settingsUtxo: UTxO,
  maintainerAddr: string,
  adminAddr: string,
  reward: { unit: string; amount: bigint },
  deadline: bigint,
  bounty_id: string,
  lucid: Lucid
): Promise<string> {
  logger.info("START createBounty");

  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const validatorAddress = lucid.utils.validatorToAddress(githoneyScript);

  const mintingPolicyid = lucid.utils.mintingPolicyToId(githoneyScript);
  const bountyIdTokenUnit = toUnit(mintingPolicyid, fromText(bounty_id));
  const mintAssets = {
    [bountyIdTokenUnit]: 1n
  };
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatum);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).getTime();

  if (BigInt(settings.creation_fee) < 2_000_000n) {
    throw new Error("Creation fee must be at least 2 ADA");
  }
  if (deadline < tomorrow) {
    throw new Error("Deadline must be at least 24 hours from now");
  }

  if (reward.amount < 1n) {
    throw new Error("Negative fees are not allowed");
  }
  const rewardAssets =
    reward.unit === "lovelace"
      ? { lovelace: reward.amount + MIN_ADA }
      : { [reward.unit]: reward.amount, lovelace: MIN_ADA };
  const utxoAssets = {
    ...rewardAssets,
    ...mintAssets
  };
  const maintainerWallet = addrToWallet(maintainerAddr, lucid);
  const adminWallet = addrToWallet(adminAddr, lucid);
  const githoneyAddr = await keyPairsToAddress(lucid, settings.githoney_wallet);

  logger.info("Maintainer Address", maintainerAddr);
  logger.info("Githoney Address", JSON.stringify(settings.githoney_wallet));
  // New tx to pay to the contract the minAda and mint the admin, githoney, developer and mantainer tokens
  logger.info("Rewards", rewardAssets);
  lucid.selectWalletFrom({ address: maintainerAddr });

  const bountyDatum = mkDatum({
    admin: adminWallet,
    maintainer: maintainerWallet,
    contributor: null,
    bounty_reward_fee: settings.reward_fee,
    deadline,
    merged: false
  });

  lucid.selectWalletFrom({ address: maintainerAddr });
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .payToContract(validatorAddress, { inline: bountyDatum }, utxoAssets)
    .payToAddress(githoneyAddr, { lovelace: settings.creation_fee })
    .mintAssets(mintAssets, Data.void())
    .complete();

  const cbor = tx.toString();
  logger.info("END createBounty");
  logger.info(`Create ${cbor}`);
  return cbor;
}

export { createBounty };
