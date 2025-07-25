import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, toUnit, Utxo } from "@spacebudz/lucid";
import {
  getRewardAsset,
  keyPairsToAddress,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
import { MIN_ADA, rewardFee } from "../../constants.ts";
import { GithoneyDatumSchema, SettingsDatumSchema } from "../../types.ts";

async function mergeBounty(
  adminAddr: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  mergeCbor: string;
}> {
  const scriptAddress = lucidBase.utils.scriptToAddress(
    settingsUtxo.scriptRef!,
  );
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef!).hash;

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const [bountyUtxo] = await lucidBase.utxosByOutRef([utxoRef]);
  const bountyRef = bountyUtxo.txHash + "#" + bountyUtxo.outputIndex;
  const bountyDatum = await lucidBase.datumOf(bountyUtxo, GithoneyDatumSchema);

  const { rewardPolicy, rewardName } = getRewardAsset(
    bountyUtxo.assets,
    scriptHash,
  );
  const rewardUnit = toUnit(rewardPolicy, rewardName);

  const settings = await lucidBase.datumOf(settingsUtxo, SettingsDatumSchema);
  const githoneyAddr = keyPairsToAddress(
    lucidBase.network,
    settings.githoneyAddress,
  );

  const maintainerAddr = keyPairsToAddress(
    lucidBase.network,
    bountyDatum.maintainerAddress,
  );

  const now = new Date().getTime() - 60 * 1000;
  const sixHoursFromNow = new Date(now + 6 * 60 * 60 * 1000).getTime();

  const githoneyFee = (bountyUtxo.assets[rewardUnit] * rewardFee) / 10_000n;

  const { tx } = await protocol.mergeTx({
    admin: { value: adminAddr, type: "String" },
    bountyref: {
      value: bountyRef,
      type: "String",
    },
    collateralref: { value: collateralref, type: "String" },
    githoneyaddr: { value: githoneyAddr, type: "String" },
    githoneyfee: { value: BigInt(githoneyFee), type: "Int" },
    maintainer: { value: maintainerAddr, type: "String" },
    minada: { value: BigInt(MIN_ADA), type: "Int" },
    rewardpolicyid: { value: Buffer.from(rewardPolicy, "hex"), type: "Bytes" },
    rewardassetname: { value: Buffer.from(rewardName, "hex"), type: "Bytes" },
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
  });

  return {
    mergeCbor: tx,
  };
}

export { mergeBounty };
