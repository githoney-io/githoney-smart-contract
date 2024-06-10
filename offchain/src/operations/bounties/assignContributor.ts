import { Lucid, OutRef, UTxO } from "lucid-cardano";
import { MIN_ADA } from "../../constants";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  mkDatum
} from "../../types";
import { addrToWallet } from "../../utils";
import logger from "../../logger";

async function assignContributor(
  settingsUtxo: UTxO,
  utxoRef: OutRef,
  contributorAddr: string,
  lucid: Lucid
): Promise<string> {
  logger.info("START assignContributor");
  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }

  const validatorAddress = lucid.utils.validatorToAddress(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatumT = await lucid.datumOf(utxo, GithoneyDatum);
  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }
  if (oldDatum.contributor) {
    throw new Error("Bounty already has a contributor");
  }
  const contributorWallet = addrToWallet(contributorAddr, lucid);
  const newDatum = mkDatum({ ...oldDatum, contributor: contributorWallet });

  const newAssets = {
    ...utxo.assets,
    lovelace: utxo.assets.lovelace + MIN_ADA
  };

  lucid.selectWalletFrom({ address: contributorAddr });
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .validTo(sixHoursFromNow.getTime())
    .collectFrom([utxo], GithoneyValidatorRedeemer.Assign())
    .payToContract(validatorAddress, { inline: newDatum }, newAssets)
    .complete();

  const cbor = tx.toString();
  logger.info("END assignContributor");
  logger.info("Assign Colaborator", cbor);
  return cbor;
}

export { assignContributor };
