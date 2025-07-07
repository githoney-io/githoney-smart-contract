import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, Data, Utxo } from "@spacebudz/lucid";
import { GithoneyContractGithoneySpend } from "../../plutus.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { sortUTxOs } from "../../utils/utxo.ts";

async function addReward(
  userAddr: string,
  rewardAmount: bigint,
  settingsUtxo: Utxo,
  bountyUtxo: Utxo,
): Promise<{
  addRewardCbor: string;
}> {
  const scriptAddress = lucidBase.utils.scriptToAddress(
    settingsUtxo.scriptRef!,
  );
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef!).hash;
  console.log("scriptHash:", scriptHash);

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => {
      console.log("Selected UTXOs:", utxos);
      return utxos.filter(
        (utxo) =>
          utxo.assets["lovelace"] >= 5_000_000 &&
          Object.keys(utxo.assets).length === 1,
      );
    })
    .then((utxos) => sortUTxOs(utxos, "Canonical"));

  const collateralref =
    selectedUtxos[0].txHash + "#" + selectedUtxos[0].outputIndex;

  if (!bountyUtxo.datum) {
    throw new Error("Bounty UTXO datum is undefined");
  }

  const oldDatum = Data.from(
    bountyUtxo.datum,
    GithoneyContractGithoneySpend.datum,
  );

  const rewardName = oldDatum.initialValue[0].assetName;
  const rewardPolicy = oldDatum.initialValue[0].policyId;

  const now = new Date().getTime() - 60;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const { tx } = await protocol.addTx({
    script: scriptAddress,
    user: userAddr,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    bountyref: `${bountyUtxo.txHash}#${bountyUtxo.outputIndex}`,
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    rewardassetname: Buffer.from(rewardName),
    rewardamount: Number(rewardAmount),
    since: lucidBase.utils.unixTimeToSlots(now),
    until: lucidBase.utils.unixTimeToSlots(sixHoursFromNow),
    collateralref: collateralref,
  });

  return {
    addRewardCbor: tx,
  };
}

export { addReward };
