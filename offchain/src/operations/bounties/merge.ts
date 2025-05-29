import { MIN_ADA } from "../../constants";
import {
  GithoneyDatum,
  GithoneyDatumSchema,
  GithoneyValidatorRedeemer,
  SettingsDatum,
  SettingsDatumSchema,
  mkDatum
} from "../../types";
import { OutRef, Lucid, Assets, Utxo, Addresses } from "@spacebudz/lucid";
import {
  keyPairsToAddress,
  clearZeroAssets,
  extractBountyIdTokenUnit
} from "../../utils";
import logger from "../../logger";

/**
 * Builds a `mergeBounty` transaction. The tx is built in the context of the admin wallet.
 * @param settingsUtxo The settings Utxo.
 * @param utxoRef The reference of the last transaction output that contains the bounty Utxo.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function mergeBounty(
  adminAddress: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
  lucid: Lucid
): Promise<string> {
  logger.info("START mergeBounty");
  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const validatorAddress = Addresses.scriptToAddress(
    lucid.network,
    githoneyScript
  );

  const [contractUtxo] = await lucid.utxosByOutRef([utxoRef]);
  const bountyDatum: GithoneyDatum = await lucid.datumOf(
    contractUtxo,
    GithoneyDatumSchema
  );

  if (
    bountyDatum.bountyRewardFee < 0n ||
    bountyDatum.bountyRewardFee > 10_000n
  ) {
    throw new Error("Reward fee must be between 0 and 10000");
  }
  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (!bountyDatum.contributorAddress) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (bountyDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }

  const newBountyDatum: string = mkDatum({ ...bountyDatum, merged: true });
  const maintainerAddr = await keyPairsToAddress(
    lucid.network,
    bountyDatum.maintainerAddress
  );
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);
  const githoneyAddr = await keyPairsToAddress(
    lucid.network,
    settings.githoneyAddress
  );

  const mintingPolicyid = Addresses.scriptToCredential(githoneyScript).hash;
  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    contractUtxo.assets,
    mintingPolicyid
  );

  const { githoneyFee, scriptValue } = calculateRewardsFeeAndScriptValue(
    contractUtxo.assets,
    bountyDatum.bountyRewardFee,
    bountyIdTokenUnit
  );

  lucid.selectReadOnlyWallet({ address: adminAddress });
  const adminPkh = Addresses.inspect(adminAddress).payment?.hash!;
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  console.dir(settingsUtxo, { depth: 5 });
  console.dir(contractUtxo, { depth: 5 });
  console.log("validatorAddress", validatorAddress);
  console.log("maintainerAddr", maintainerAddr);
  console.log("githoneyAddr", githoneyAddr);
  console.log("adminAddress", adminAddress);
  console.dir(bountyDatum, { depth: 5 });
  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([contractUtxo], GithoneyValidatorRedeemer.Merge())
    .payToContract(validatorAddress, { Inline: newBountyDatum }, scriptValue)
    .payTo(githoneyAddr, githoneyFee)
    .payTo(maintainerAddr, { lovelace: MIN_ADA })
    .addSigner(adminPkh)
    .commit();
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
