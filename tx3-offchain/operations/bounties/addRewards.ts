import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, Utxo } from "@spacebudz/lucid";
import {
  getRewardAsset,
  logger,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
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

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;

  const oldDatum = await lucidBase.datumOf(bountyUtxo, GithoneyDatumSchema);

  if (oldDatum.merged) {
    throw new Error("Bounty already merged");
  }
  if (oldDatum.deadline < Date.now()) {
    throw new Error("Bounty deadline passed");
  }

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const addParams = {
    bountyref: {
      value: bountyRef,
      type: "String" as const,
    },
    collateralref: { value: collateralref, type: "String" as const },
    rewardamount: { value: BigInt(rewardAmount), type: "Int" as const },
    script: { value: scriptAddress, type: "String" as const },
    settingsref: {
      value: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
      type: "String" as const,
    },
    since: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(now)),
      type: "Int" as const,
    },
    until: {
      value: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
      type: "Int" as const,
    },
    sponsor: { value: sponsorAddr, type: "String" as const },
  };

  let tx;
  if (!withLovelace) {
    const { rewardPolicy, rewardName } = getRewardAsset(
      bountyUtxo.assets,
      scriptHash,
    );
    ({ tx } = await protocol.addWithTokenTx({
      ...addParams,
      rewardassetname: { value: Buffer.from(rewardName, "hex"), type: "Bytes" },
      rewardpolicyid: {
        value: Buffer.from(rewardPolicy, "hex"),
        type: "Bytes",
      },
    }));
  } else {
    ({ tx } = await protocol.addWithLovelaceTx({
      ...addParams,
    }));
  }

  logger.info("END addRewards");
  return {
    addRewardCbor: tx,
  };
}

export { addRewards };
