import { Addresses, Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import { MIN_ADA } from "../../constants";
import {
  GithoneyDatum,
  GithoneyDatumSchema,
  GithoneyValidatorRedeemer,
  mkDatum
} from "../../types";
import { bech32ToAddressType } from "../../utils";
import logger from "../../logger";

/**
 * Builds an `assignContributor` transaction. The tx is built in the context of the contributor wallet.
 * @param settingsUtxo The settings Utxo.
 * @param utxoRef The reference of the last transaction output that contains the bounty Utxo.
 * @param contributorAddr The contributor's address.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function assignContributor(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
  contributorAddr: string,
  lucid: Lucid
): Promise<string> {
  logger.info("START assignContributor");
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
  if (oldDatum.contributorAddress) {
    throw new Error("Bounty already has a contributor");
  }
  const contributorWallet = bech32ToAddressType(contributorAddr);
  const newDatum = mkDatum({
    ...oldDatum,
    contributorAddress: contributorWallet
  });

  const newAssets = {
    ...utxo.assets,
    lovelace: utxo.assets.lovelace + MIN_ADA
  };

  lucid.selectReadOnlyWallet({ address: contributorAddr });
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.Assign())
    .payToContract(validatorAddress, { Inline: newDatum }, newAssets)
    .commit();

  const cbor = tx.toString();
  logger.info("END assignContributor");
  logger.info("Assign Colaborator", cbor);
  return cbor;
}

export { assignContributor };
