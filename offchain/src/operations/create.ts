import dotenv from "dotenv";
import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { Data, fromText, toUnit, Assets, Lucid } from "lucid-cardano";
import { Roles, MIN_ADA } from "../utils";
import { mkDatum } from "../types";

dotenv.config();

async function createBounty(
  maintainerAddr: string,
  adminAddr: string,
  githoneyAddr: string,

  rewards: Assets,
  deadline: bigint,
  bounty_id: string,
  lucid: Lucid
) {
  console.debug("START createBounty");
  const creationFee = process.env.CREATION_FEE!;
  const rewardFee = process.env.REWARD_FEE!;
  const gitHoneyCredentials = lucid.utils.getAddressDetails(githoneyAddr);
  const gitHoneyValidator = buildGithoneyValidator(
    {
      paymentKey: gitHoneyCredentials.paymentCredential!.hash,
      stakeKey: gitHoneyCredentials.stakeCredential!.hash
    },
    BigInt(creationFee),
    BigInt(rewardFee)
  );
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const utxo = (await lucid.utxosAt(maintainerAddr))[0];
  const mintingScript = buildGithoneyMintingPolicy(
    {
      paymentKey: gitHoneyCredentials.paymentCredential!.hash,
      stakeKey: gitHoneyCredentials.stakeCredential!.hash
    },
    BigInt(creationFee),
    BigInt(rewardFee)
  );
  const mintingPolicyid = lucid.utils.mintingPolicyToId(mintingScript);
  const githoneyUnit = toUnit(mintingPolicyid, fromText("githoney"));
  const mintAssets = {
    [toUnit(mintingPolicyid, fromText(Roles.ADMIN))]: 1n,
    [toUnit(mintingPolicyid, fromText(Roles.CONTRIBUTOR))]: 1n,
    [toUnit(mintingPolicyid, fromText(Roles.MAINTAINER))]: 1n,
    [githoneyUnit]: 1n
  };
  const { [githoneyUnit]: _, ...mantainerAssets } = mintAssets;
  const maintainerPkh =
    lucid.utils.getAddressDetails(maintainerAddr).paymentCredential!.hash;

  console.debug("Maintainer Address", maintainerAddr);
  console.debug("Githoney Address", githoneyAddr);
  // New tx to pay to the contract the minAda and mint the admin, githoney, developer and mantainer tokens
  console.debug("Rewards", rewards);
  lucid.selectWalletFrom({ address: maintainerAddr });

  const bountyDatum = mkDatum(
    {
      paymentKey:
        lucid.utils.getAddressDetails(adminAddr).paymentCredential!.hash,
      stakeKey: lucid.utils.getAddressDetails(adminAddr).stakeCredential!.hash
    },
    {
      paymentKey: maintainerPkh,
      stakeKey:
        lucid.utils.getAddressDetails(maintainerAddr).stakeCredential!.hash
    },
    {
      paymentKey: gitHoneyCredentials.paymentCredential!.hash,
      stakeKey: gitHoneyCredentials.stakeCredential!.hash
    },
    deadline,
    bounty_id,
    false
  );

  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .payToContract(
      validatorAddress,
      { inline: bountyDatum },
      {
        lovelace: rewards["lovelace"] + MIN_ADA,
        ...rewards,
        [toUnit(mintingPolicyid, fromText("ControlToken"))]: 1n
      }
    )
    .payToAddress(maintainerAddr, {
      lovelace: BigInt(creationFee),
      ...mantainerAssets
    })
    .payToAddress(githoneyAddr, { lovelace: BigInt(creationFee) })
    .addSignerKey(maintainerPkh)
    .addSignerKey(gitHoneyCredentials.paymentCredential!.hash)
    // what if maintainer is the same as githoney? Error
    .mintAssets(mintAssets, Data.void())
    .attachMintingPolicy(mintingScript)
    .complete();

  lucid.selectWalletFrom({ address: maintainerAddr });
  const txCbor = (await tx.sign().complete()).toString();
  console.debug(`TxCbor ${txCbor}`);

  return { txCbor, mintingPolicyid };
}

export default createBounty;
