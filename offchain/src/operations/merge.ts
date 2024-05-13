import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import {
  controlTokenName,
  MIN_ADA,
  rewardFee,
  githoneyAddr
} from "../constants";
import { GithoneyDatum, GithoneyValidatorRedeemer, mkDatum } from "../types";
import { fromText, toUnit, OutRef, Lucid, Data } from "lucid-cardano";
import { validatorParams, calculateRewards } from "../utils";

async function mergeBounty(
  ref_input: OutRef,
  maintainerAddr: string,
  adminAddr: string,
  lucid: Lucid
) {
  console.debug("START mergeBounty");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const [contractUtxo] = await lucid.utxosByOutRef([ref_input]);
  const bountyDatum = await lucid.datumOf(contractUtxo, GithoneyDatum);

  const newBountyDatum: string = mkDatum(
    bountyDatum.admin,
    bountyDatum.maintainer,
    bountyDatum.deadline,
    bountyDatum.bounty_id,
    true
  );

  const mintingScript = buildGithoneyMintingPolicy(scriptParams);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);

  const feePercent = BigInt(rewardFee) / 10000n;
  const assets = contractUtxo.assets;

  const githoneyRewards = calculateRewards(assets, feePercent);

  const bountyRewards = calculateRewards(assets, 1n - feePercent);

  const tx = await lucid
    .newTx()
    .collectFrom([contractUtxo], GithoneyValidatorRedeemer.Merge())
    .payToContract(
      validatorAddress,
      { inline: newBountyDatum },
      {
        ...bountyRewards,
        [toUnit(mintingPolicyid, fromText(controlTokenName))]: 1n
      }
    )
    .payToAddress(maintainerAddr, { lovelace: MIN_ADA })
    .payToAddress(githoneyAddr, githoneyRewards)
    .complete();

  lucid.selectWalletFrom({ address: adminAddr });
  const txSigned = await tx.sign().complete();

  console.debug("END mergeBounty");
  return txSigned.toString();
}

export default mergeBounty;
