import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, Utxo } from "@spacebudz/lucid";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";
import {
  getRewardAsset,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

async function addReward(
  rewardAmount: bigint,
  settingsUtxo: Utxo,
  userAddr: string,
  utxoRef: OutRef,
): Promise<{
  addRewardCbor: string;
}> {
  const scriptAddress = lucidBase.utils.scriptToAddress(
    settingsUtxo.scriptRef!,
  );

  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef!).hash;

  const selectedUtxos = await collateralOutRef(lucidWithWallet);

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);

  const oldDatum = await lucidBase.datumOf(
    bountyUtxo,
    GithoneyContractGithoneySpend.datum,
  );

  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }

  const { rewardPolicy, rewardName } = getRewardAsset(
    bountyUtxo.assets,
    scriptHash,
  );

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const { tx } = await protocol.addTx({
    bountyref: {
      value: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
      type: "String",
    },
    collateralref: { value: collateralref, type: "String" },
    rewardamount: { value: BigInt(rewardAmount), type: "Int" },
    rewardassetname: { value: Buffer.from(rewardName, "hex"), type: "Bytes" },
    rewardpolicyid: { value: Buffer.from(rewardPolicy, "hex"), type: "Bytes" },
    script: { value: scriptAddress, type: "String" },
    settingsref: {
      value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      type: "String",
    },
    since: { value: BigInt(lucidBase.utils.unixTimeToSlots(now)), type: "Int" },
    until: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
      type: "Int",
    },
    user: { value: userAddr, type: "String" },
  });

  return {
    addRewardCbor: tx,
  };
}

export { addReward };
