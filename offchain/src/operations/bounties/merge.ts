import { MIN_ADA } from "../../constants";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  SettingsDatum,
  mkDatum
} from "../../types";
import { OutRef, Lucid, Assets, UTxO } from "lucid-cardano";
import {
  keyPairsToAddress,
  clearZeroAssets,
  extractBountyIdTokenUnit
} from "../../utils";
import logger from "../../logger";

async function mergeBounty(
  settingsUtxo: UTxO,
  utxoRef: OutRef,
  lucid: Lucid
): Promise<string> {
  logger.info("START mergeBounty");
  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const validatorAddress = lucid.utils.validatorToAddress(githoneyScript);

  const [contractUtxo] = await lucid.utxosByOutRef([utxoRef]);
  const bountyDatum: GithoneyDatumT = await lucid.datumOf(
    contractUtxo,
    GithoneyDatum
  );

  if (
    bountyDatum.bounty_reward_fee < 0n ||
    bountyDatum.bounty_reward_fee > 10_000n
  ) {
    throw new Error("Reward fee must be between 0 and 10000");
  }
  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (!bountyDatum.contributor) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (bountyDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }

  const newBountyDatum: string = mkDatum({ ...bountyDatum, merged: true });
  const maintainerAddr = await keyPairsToAddress(lucid, bountyDatum.maintainer);
  const adminAddr = await keyPairsToAddress(lucid, bountyDatum.admin);
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatum);
  const githoneyAddr = await keyPairsToAddress(lucid, settings.githoney_wallet);

  const mintingPolicyid = lucid.utils.mintingPolicyToId(githoneyScript);
  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    contractUtxo.assets,
    mintingPolicyid
  );

  const { githoneyFee, scriptValue } = calculateRewardsFeeAndScriptValue(
    contractUtxo.assets,
    bountyDatum.bounty_reward_fee,
    bountyIdTokenUnit
  );

  lucid.selectWalletFrom({ address: adminAddr });
  const adminPkh =
    lucid.utils.getAddressDetails(adminAddr).paymentCredential?.hash!;
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([contractUtxo], GithoneyValidatorRedeemer.Merge())
    .payToContract(validatorAddress, { inline: newBountyDatum }, scriptValue)
    .payToAddress(maintainerAddr, { lovelace: MIN_ADA })
    .payToAddress(githoneyAddr, githoneyFee)
    .addSignerKey(adminPkh)
    .complete();
  const cbor = tx.toString();
  logger.info("END mergeBounty");
  logger.info(`Merge Bounty: ${cbor}`);
  return cbor;
}

function calculateRewardsFeeAndScriptValue(
  assets: Assets,
  rewardFee: bigint,
  bountyIdTokenUnit: string
) {
  let githoneyFee: Assets = {};
  let scriptValue: Assets = {};
  assets = {
    ...assets,
    lovelace: assets.lovelace - 2n * MIN_ADA
  };
  delete assets[bountyIdTokenUnit];
  for (const [asset, amount] of Object.entries(assets)) {
    githoneyFee[asset] = (amount * rewardFee) / 10_000n;
    scriptValue[asset] = amount - githoneyFee[asset];
  }
  scriptValue[bountyIdTokenUnit] = 1n;
  scriptValue["lovelace"] = scriptValue["lovelace"] + MIN_ADA;
  scriptValue = clearZeroAssets(scriptValue);
  return { githoneyFee, scriptValue };
}

export { mergeBounty };
