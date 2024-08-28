import { Data, Lucid, OutRef, UTxO } from "lucid-txpipe";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer
} from "../../types";
import {
  addrToWallet,
  clearZeroAssets,
  extractBountyIdTokenUnit,
  keyPairsToAddress
} from "../../utils";
import logger from "../../logger";

async function claimBounty(
  settingsUtxo: UTxO,
  utxoRef: OutRef,
  lucid: Lucid
): Promise<string> {
  logger.info("START claim");
  const githoneyScript = settingsUtxo.scriptRef;
  if (!githoneyScript) {
    throw new Error("Githoney validator not found");
  }

  const mintingPolicyid = lucid.utils.mintingPolicyToId(githoneyScript);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatumT = await lucid.datumOf(utxo, GithoneyDatum);

  if (!oldDatum.contributor) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (!oldDatum.merged) {
    throw new Error("Bounty is not merged");
  }
  const contributorAddr = await keyPairsToAddress(lucid, oldDatum.contributor);

  lucid.selectWalletFrom({
    address: contributorAddr
  });

  const bountyIdTokenUnit = extractBountyIdTokenUnit(
    utxo.assets,
    mintingPolicyid
  );
  const contributorPayment = clearZeroAssets({
    ...utxo.assets,
    [bountyIdTokenUnit]: 0n
  });

  const tx = await lucid
    .newTx()
    .readFrom([settingsUtxo])
    .collectFrom([utxo], GithoneyValidatorRedeemer.Claim())
    .payToAddress(contributorAddr, contributorPayment)
    .mintAssets({ [bountyIdTokenUnit]: BigInt(-1) }, Data.void())
    .complete();

  const cbor = tx.toString();
  logger.info("END claim");
  logger.info(`Claim ${cbor}`);
  return cbor;
}

export { claimBounty };
