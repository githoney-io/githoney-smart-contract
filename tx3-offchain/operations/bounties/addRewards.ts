import { protocol } from "../../gen/typescript/protocol.ts";
import { OutRef, Utxo } from "@spacebudz/lucid";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
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

  let rewardName: string = "";
  let rewardPolicy: string = "";

  for (const [policyId, assets] of oldDatum.initialValue.entries()) {
    if (policyId !== "") {
      // Skip lovelace
      rewardPolicy = policyId;
      const assetNames = Array.from(assets.keys());
      if (assetNames.length > 0) {
        rewardName = assetNames[0];
        break;
      }
    }
  }

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const { tx } = await protocol.addTx({
    bountyref: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
    collateralref: collateralref,
    rewardamount: Number(rewardAmount),
    rewardassetname: Buffer.from(rewardName, "hex"),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
    user: userAddr,
  });

  return {
    addRewardCbor: tx,
  };
}

export { addReward };
