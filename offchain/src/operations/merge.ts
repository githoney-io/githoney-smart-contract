import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import {
  controlTokenName,
  MIN_ADA,
  rewardFee,
  githoneyAddr
} from "../constants";
import {
  GithoneyDatum,
  GithoneyDatumT,
  GithoneyValidatorRedeemer,
  mkDatum
} from "../types";
import { fromText, toUnit, OutRef, Lucid, Data, Assets } from "lucid-cardano";
import { keyPairsToAddress, validatorParams } from "../utils";

async function mergeBounty(ref_input: OutRef, lucid: Lucid) {
  console.debug("START mergeBounty");
  const scriptParams = validatorParams(lucid);
  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);

  const [contractUtxo] = await lucid.utxosByOutRef([ref_input]);
  const bountyDatum: GithoneyDatumT = await lucid.datumOf(
    contractUtxo,
    GithoneyDatum
  );

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

  const mintingScript = buildGithoneyMintingPolicy(scriptParams);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
  const controlTokenUnit = toUnit(mintingPolicyid, fromText(controlTokenName));

  const feePercent = rewardFee / 10000n;

  const { githoneyFee, scriptValue } = calculateRewardsFeeAndScriptValue(
    contractUtxo.assets,
    feePercent,
    controlTokenUnit
  );

  const tx = await lucid
    .newTx()
    .collectFrom([contractUtxo], GithoneyValidatorRedeemer.Merge())
    .payToContract(validatorAddress, { inline: newBountyDatum }, scriptValue)
    .payToAddress(maintainerAddr, { lovelace: MIN_ADA })
    .payToAddress(githoneyAddr, githoneyFee)
    .complete();

  lucid.selectWalletFrom({ address: adminAddr });
  const txSigned = await tx.sign().complete();

  console.debug("END mergeBounty");
  return txSigned.toString();
}

function calculateRewardsFeeAndScriptValue(
  assets: Assets,
  feePercent: bigint,
  controlTokenUnit: string
) {
  let githoneyFee: Assets = {};
  let scriptValue: Assets = {};
  assets = {
    ...assets,
    lovelace: assets.lovelace - 2n * MIN_ADA
  };
  delete assets[controlTokenUnit];
  for (const [asset, amount] of Object.entries(assets)) {
    githoneyFee[asset] = amount * feePercent;
    scriptValue[asset] = amount * (1n - feePercent);
  }
  scriptValue[controlTokenUnit] = 1n;
  scriptValue["lovelace"] = scriptValue["lovelace"] + MIN_ADA;
  return { githoneyFee, scriptValue };
}

export default mergeBounty;
