import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { Data, fromText, toUnit, Assets, Lucid, OutRef } from "lucid-cardano";
import {
  ControlTokenName,
  Roles,
  MIN_ADA,
  creationFee,
  githoneyAddr
} from "../constants";
import { GithoneyDatumT, GithoneyValidatorRedeemer, mkDatum } from "../types";
import { addrToWallet, validatorParams } from "../utils";

async function assignContributor(
  utxoRef: OutRef,
  contributorAddr: string,
  lucid: Lucid
): Promise<string> {
  console.debug("START assignContributor");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const utxo = (await lucid.utxosByOutRef([utxoRef]))[0];
  const oldDatum: GithoneyDatumT = await lucid.datumOf(utxo);

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
  const newDatum = mkDatum(
    oldDatum.admin,
    oldDatum.maintainer,
    oldDatum.deadline,
    oldDatum.bounty_id,
    oldDatum.merged,
    contributorWallet
  );
  const newAssets = {
    ...utxo.assets,
    lovelace: utxo.assets.lovelace + MIN_ADA
  };

  lucid.selectWalletFrom({ address: contributorAddr });
  const tx = await lucid
    .newTx()
    .collectFrom([utxo], GithoneyValidatorRedeemer.Assign())
    .payToContract(validatorAddress, { inline: newDatum }, newAssets)
    .attachSpendingValidator(gitHoneyValidator)
    .complete();

  const cbor = tx.toString();
  console.debug("END assignContributor");
  console.debug("Assign Colaborator", cbor);
  return cbor;
}

export default assignContributor;