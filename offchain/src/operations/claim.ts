import { buildGithoneyValidator } from "../scripts";
import { Data, Lucid, OutRef, fromText, toUnit } from "lucid-cardano";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer
} from "../types";
import { addrToWallet, clearZeroAssets, validatorParams } from "../utils";
import { controlTokenName } from "../constants";

async function claimBounty(
  utxoRef: OutRef,
  lucid: Lucid,
  contributorAddr: string
): Promise<string> {
  console.debug("START claim");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const mintingPolicy = buildGithoneyValidator(scriptParams);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingPolicy);
  const [utxo] = await lucid.utxosByOutRef([utxoRef]);
  const oldDatum: GithoneyDatumT = await lucid.datumOf(utxo, GithoneyDatum);

  if (!oldDatum.contributor) {
    throw new Error("Bounty doesn't have a contributor");
  }
  if (!oldDatum.merged) {
    throw new Error("Bounty is not merged");
  }
  const contributorWallet = addrToWallet(contributorAddr, lucid);
  if (
    oldDatum.contributor.paymentKey !== contributorWallet.paymentKey ||
    oldDatum.contributor.stakeKey !== contributorWallet.stakeKey
  ) {
    throw new Error("Invalid contributor");
  }
  const controlTokenUnit = toUnit(mintingPolicyid, fromText(controlTokenName));

  lucid.selectWalletFrom({
    address: contributorAddr
  });

  const contributorPayment = clearZeroAssets({
    ...utxo.assets,
    [controlTokenUnit]: 0n
  });

  const tx = await lucid
    .newTx()
    .collectFrom([utxo], GithoneyValidatorRedeemer.Claim())
    .payToAddress(contributorAddr, contributorPayment)
    .mintAssets({ [controlTokenUnit]: BigInt(-1) }, Data.void())
    .attachSpendingValidator(gitHoneyValidator)
    .attachMintingPolicy(mintingPolicy)
    .complete();

  const cbor = tx.toString();
  console.debug("END claim");
  console.debug(`Claim ${cbor}`);
  return cbor;
}

export { claimBounty };
