import { Addresses, Assets, Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import {
  GithoneyDatum,
  GithoneyDatumSchema,
  GithoneyValidatorRedeemer
} from "../../types";
import logger from "../../logger";

/**
 * Builds an `addReward` transaction. The tx is built in the context of any wallet.
 * @param settingsUtxo The settings Utxo.
 * @param utxoRef The reference of the last transaction output that contains the bounty Utxo.
 * @param address The address of the current wallet.
 * @param rewards The reward assets and amount to be added.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function addRewards(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
  address: string,
  rewards: Assets,
  lucid: Lucid
): Promise<string> {
  logger.info("START addRewards");

  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }
  const validatorAddress = Addresses.scriptToAddress(
    lucid.network,
    githoneyScript
  );
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatum = await lucid.datumOf(
    utxo,
    GithoneyDatumSchema
  );

  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }
  let newAssets = { ...utxo.assets };
  Object.entries(rewards).forEach(([asset, amount]) => {
    newAssets[asset] = newAssets[asset] ? newAssets[asset] + amount : amount;
  });
  if (Object.keys(newAssets).length > 15) {
    throw new Error("Too many assets, max 15");
  }

  lucid.selectReadOnlyWallet({ address: address });
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.AddRewards())
    .payToContract(validatorAddress, { Inline: utxo.datum! }, newAssets)
    .commit();

  const cbor = tx.toString();
  logger.info("END addRewards");
  logger.info(`Add Rewards: ${cbor}`);
  return cbor;
}

export { addRewards };
