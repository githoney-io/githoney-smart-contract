import { buildGithoneyMintingPolicy, buildGithoneyValidator } from "../scripts";
import { Data, fromText, toUnit, Assets } from "lucid-cardano";
import { NetConfig, Roles, MIN_ADA } from "../utils";
import { BountyDatum, BountyDatumT } from "../types";

async function createBounty(
  maintainerAddr: string,
  fee: bigint,
  rewards: Assets,
  deadline: bigint,
  bounty_id: string,
  netConfig: NetConfig
) {
  console.debug("START createBounty");
  const lucid = netConfig.lucidAdmin!;
  const gitHoneyValidator = buildGithoneyValidator();
  const validatorAddress = lucid.utils.validatorToAddress(gitHoneyValidator);
  const utxo = (await lucid.utxosAt(maintainerAddr))[0];
  const outRef = { txHash: utxo.txHash, outputIndex: utxo.outputIndex };
  const mintingScript = buildGithoneyMintingPolicy(outRef);
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
  const githoneyAdrr = await lucid.wallet.address();
  const githoneyPkh =
    lucid.utils.getAddressDetails(githoneyAdrr).paymentCredential!.hash;

  console.debug("Maintainer Address", maintainerAddr);
  console.debug("Githoney Address", await lucid.wallet.address());
  // New tx to pay to the contract the minAda and mint the admin, githoney, developer and mantainer tokens
  console.debug("rewards", rewards);
  lucid.selectWalletFrom({ address: maintainerAddr });

  const bountyInfo = {
    maintainer_addr: maintainerAddr,
    admin_addr: githoneyAdrr,
    bounty_id: bounty_id,
    deadline: deadline,
    merged: false,
    fee_reward: fee
  };

  const bountyDatum = Data.to<BountyDatumT>(
    bountyInfo,
    BountyDatum as unknown as BountyDatumT
  );

  const tx = await lucid
    .newTx()
    .collectFrom([utxo])
    .payToContract(
      validatorAddress,
      { inline: bountyDatum },
      {
        lovelace: rewards["lovelace"] > MIN_ADA ? rewards["lovelace"] : MIN_ADA,
        ...rewards
        // TODO: pay control token to the contract
      }
    ) // NOTE this rewrite the lovelace amount?
    .payToAddress(maintainerAddr, { lovelace: fee, ...mantainerAssets })
    .payToAddress(githoneyAdrr, { lovelace: fee })
    .addSignerKey(maintainerPkh)
    .addSignerKey(githoneyPkh) // what if maintainer is the same as githoney? Error
    .mintAssets(mintAssets, Data.void())
    .attachMintingPolicy(mintingScript)
    .complete();

  lucid.selectWalletFromSeed(netConfig.SEED);
  const txCbor = (await tx.sign().complete()).toString();
  console.debug(`TxCbor ${txCbor}`);

  return { txCbor, mintingPolicyid };
}

export default createBounty;
