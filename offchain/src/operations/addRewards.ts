import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { MIN_ADA, NetConfig } from "../utils";
import { Assets, Data, Lucid, OutRef, fromText, toUnit } from "lucid-cardano";

async function addRewards(
  lucid: Lucid,
  githoneyUtxo: OutRef,
  address: string,
  assets: Assets
) {
  console.debug("START addRewards");
  const utxo = (await lucid.utxosByOutRef([githoneyUtxo]))[0];
  const datum = await lucid.datumOf(utxo);
  const gitHoneyValidator = buildGithoneyValidator();
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const mintingScript = buildGithoneyMintingPolicy(outRef);
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
  const githoneyUnit = toUnit(mintingPolicyid, fromText("githoney"));

  // Your code here
  console.debug("END addRewards");
  return {
    // Your return object here
  };
}

export default addRewards;
