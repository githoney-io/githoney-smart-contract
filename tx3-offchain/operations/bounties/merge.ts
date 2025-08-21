import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, OutRef, toUnit, Utxo } from "@spacebudz/lucid";
import {
  getRewardAsset,
  keyPairsToAddress,
  logger,
  lucidBase,
} from "../../utils/utils.ts";
import { MIN_ADA, rewardFee } from "../../constants.ts";
import { GithoneyDatumSchema, SettingsDatumSchema } from "../../types.ts";

async function mergeBounty(
  adminAddr: string,
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  mergeCbor: string;
}> {
  logger.info("START merge");

  if (!settingsUtxo.scriptRef) {
    throw new Error("Githoney validator not found");
  }
  const scriptAddress = lucidBase.utils.scriptToAddress(settingsUtxo.scriptRef);
  const scriptHash = Addresses.scriptToCredential(settingsUtxo.scriptRef).hash;

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
    admin: adminAddr,
    bountyref: bountyRef,
    githoneyaddr: githoneyAddr,
    githoneyfee: BigInt(githoneyFee),
    maintainer: maintainerAddr,
    minada: BigInt(MIN_ADA),
    rewardpolicyid: Buffer.from(rewardPolicy, "hex"),
    rewardassetname: Buffer.from(rewardName, "hex"),
    script: scriptAddress,
    settingsref: `${settingsUtxo.txHash}#${settingsUtxo.outputIndex}`,
    since: BigInt(lucidBase.utils.unixTimeToSlots(now)),
    until: BigInt(lucidBase.utils.unixTimeToSlots(sixHoursFromNow)),
  });

  logger.info("END merge");
  return {
    mergeCbor: tx,
  };
}

export { mergeBounty };
