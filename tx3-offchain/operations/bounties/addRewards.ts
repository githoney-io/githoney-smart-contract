import { protocol } from "../../gen/typescript/protocol.ts";
import { Data, Utxo } from "@spacebudz/lucid";
import {
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsSpend,
} from "../../plutus.ts";
import { lucidBase, lucidWithWallet } from "../../utils/utils.ts";
import { selectUTxOs, sortUTxOs } from "../../utils/utxo.ts";

async function addReward(
  userAddr: string,
  rewardAmount: bigint,
  settingsUtxo: Utxo,
  bountyUtxo: Utxo,
): Promise<{
  addRewardCbor: string;
}> {
  const script = new GithoneyContractSettingsSpend();
  const scriptAddress = lucidBase.utils.scriptToAddress(script);

  const selectedUtxos = await lucidWithWallet.wallet
    .getUtxos()
    .then((utxos) => selectUTxOs(utxos, { lovelace: 10_000_000n }))
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

  const now = new Date().getTime();
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
