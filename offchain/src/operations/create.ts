import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { Data, fromText, toUnit, Lucid } from "lucid-cardano";
import {
  controlTokenName,
  MIN_ADA,
  creationFee,
  githoneyAddr
} from "../constants";
import { mkDatum } from "../types";
import { addrToWallet, validatorParams } from "../utils";

async function createBounty(
  maintainerAddr: string,
  adminAddr: string,
  reward: { unit: string; amount: bigint },
  deadline: bigint,
  bounty_id: string,
  lucid: Lucid
): Promise<string> {
  console.debug("START createBounty");
  const scriptParams = validatorParams(lucid);

  const gitHoneyValidator = buildGithoneyValidator(scriptParams);
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const mintingScript = buildGithoneyMintingPolicy(scriptParams);

  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
  const controlTokenUnit = toUnit(mintingPolicyid, fromText(controlTokenName));
  const mintAssets = {
    [controlTokenUnit]: 1n
  };
  const rewardAssets =
    reward.unit === "lovelace"
      ? { lovelace: reward.amount + MIN_ADA }
      : { [reward.unit]: reward.amount, lovelace: MIN_ADA };
  const utxoAssets = {
    ...rewardAssets,
    ...mintAssets
  };
  const maintainerWallet = addrToWallet(maintainerAddr, lucid);
  const adminWallet = addrToWallet(adminAddr, lucid);

  console.debug("Maintainer Address", maintainerAddr);
  console.debug("Githoney Address", githoneyAddr);
  // New tx to pay to the contract the minAda and mint the admin, githoney, developer and mantainer tokens
  console.debug("Rewards", rewardAssets);
  lucid.selectWalletFrom({ address: maintainerAddr });

  const bountyDatum = mkDatum({
    admin: adminWallet,
    maintainer: maintainerWallet,
    deadline,
    bounty_id,
    merged: false,
    contributor: null
  });

  lucid.selectWalletFrom({ address: maintainerAddr });
  const tx = await lucid
    .newTx()
    .payToContract(validatorAddress, { inline: bountyDatum }, utxoAssets)
    .payToAddress(githoneyAddr, { lovelace: BigInt(creationFee) })
    .mintAssets(mintAssets, Data.void())
    .attachMintingPolicy(mintingScript)
    .complete();

  const cbor = tx.toString();
  console.debug("END createBounty");
  console.debug(`Create ${cbor}`);
  return cbor;
}

export { createBounty };
