import { buildGithoneyValidator } from "../scripts";
import {
  Assets,
  Data,
  Lucid,
  OutRef,
  Tx,
  fromText,
  toUnit
} from "lucid-cardano";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer
} from "../types";
import { keyPairsToAddress, validatorParams } from "../utils";
import { MIN_ADA, controlTokenName } from "../constants";

async function close(utxoRef: OutRef, lucid: Lucid): Promise<string> {
  console.debug("START close");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const mintingPolicy = buildGithoneyValidator(scriptParams);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingPolicy);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const bountyDatum: GithoneyDatumT = await lucid.datumOf(utxo, GithoneyDatum);

  if (bountyDatum.merged) {
    throw new Error("Bounty already merged");
  }
  const adminAddr = await keyPairsToAddress(lucid, bountyDatum.admin);
  const controlTokenUnit = toUnit(mintingPolicyid, fromText(controlTokenName));

  lucid.selectWalletFrom({ address: adminAddr });
  const tx = await lucid
    .newTx()
    .collectFrom([utxo], GithoneyValidatorRedeemer.Close())
    .mintAssets({ [controlTokenUnit]: BigInt(-1) }, Data.void())
    .attachSpendingValidator(gitHoneyValidator)
    .attachMintingPolicy(mintingPolicy);

  const txWithPayments = await (
    await addPayments(tx, bountyDatum, utxo.assets, lucid)
  ).complete();

  const cbor = txWithPayments.toString();
  console.debug("END close");
  console.debug("close", cbor);
  return cbor;
}

const addPayments = async (
  tx: Tx,
  datum: GithoneyDatumT,
  assets: Assets,
  lucid: Lucid
): Promise<Tx> => {
  if (datum.contributor) {
    const contributorAddr = await keyPairsToAddress(lucid, datum.contributor);
    tx = tx.payToAddress(contributorAddr, { lovelace: MIN_ADA });
    assets = { ...assets, lovelace: assets["lovelace"] - MIN_ADA };
  }
  const maintainerAddr = await keyPairsToAddress(lucid, datum.maintainer);
  tx = tx.payToAddress(maintainerAddr, assets);
  return tx;
};

export default close;
