import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, Utxo } from "@spacebudz/lucid";
import { getRewardAsset, logger, lucidBase } from "../../utils/utils.ts";
import { GithoneyDatumSchema } from "../../types.ts";

async function addRewards(
  rewardAmount: bigint,
  settingsUtxo: Utxo,
  sponsorAddr: string,
  utxoRef: OutRef,
  withLovelace?: boolean,
): Promise<{
  addRewardCbor: string;
}> {
  logger.info("START addRewards");

  if (!settingsUtxo.scriptRef) {
    throw new Error("Githoney validator not found");
  }
  const scriptAddress = lucidBase.utils.scriptToAddress(settingsUtxo.scriptRef);
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef).hash;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;

  const oldDatum = await lucidBase.datumOf(bountyUtxo, GithoneyDatumSchema);

  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }

  let rewardPolicy = "";
  let rewardName = "";
  if (!withLovelace) {
    ({ rewardPolicy, rewardName } = getRewardAsset(
      bountyUtxo.assets,
      scriptHash,
    ));
  }

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();
  const { tx } = await protocol.addTx({
    bountyref: bountyRef,
    rewardamount: BigInt(rewardAmount),
    rewardassetname: Buffer.from(rewardName, "hex"),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: BigInt(lucidBase.utils.unixTimeToSlots(now)),
    until: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
    sponsor: sponsorAddr,
  });

  logger.info("END addRewards");
  return {
    addRewardCbor: tx,
  };
}
export { addRewards };
