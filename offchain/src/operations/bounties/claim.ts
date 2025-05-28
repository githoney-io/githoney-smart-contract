import { Addresses, Data, Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import {
  GithoneyDatum,
  GithoneyDatumSchema,
  GithoneyValidatorRedeemer
} from "../../types";
import {
  clearZeroAssets,
  extractBountyIdTokenUnit,
  keyPairsToAddress
} from "../../utils";
import logger from "../../logger";

/**
 * Builds a `claimBounty` transaction. The tx is built in the context of the contributor wallet.
 * @param settingsUtxo The settings Utxo.
 * @param utxoRef The reference of the last transaction output that contains the bounty Utxo.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function claimBounty(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
  lucid: Lucid
): Promise<string> {
  logger.info("START claim");
  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }

  const mintingPolicyid = Addresses.scriptToCredential(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatum = await lucid.datumOf(
    utxo,
    GithoneyDatumSchema
  );

  if (!oldDatum.contributorAddress) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (!oldDatum.merged) {
    throw new Error("Bounty is not merged");
  }
  const contributorAddr = await keyPairsToAddress(
    lucid.network,
    oldDatum.contributorAddress
  );

  lucid.selectReadOnlyWallet({
    address: contributorAddr
  });

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    utxo.assets,
    mintingPolicyid.hash
  );
  const contributorPayment = clearZeroAssets({
    ...utxo.assets,
    [bountyIdTokenUnit]: 0n
  });

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .collectFrom([utxo], GithoneyValidatorRedeemer.Claim())
    .payTo(contributorAddr, contributorPayment)
    .mint({ [bountyIdTokenUnit]: BigInt(-1) }, Data.void())
    .commit();

  const cbor = tx.toString();
  logger.info("END claim");
  logger.info(`Claim ${cbor}`);
  return cbor;
}

export { claimBounty };
