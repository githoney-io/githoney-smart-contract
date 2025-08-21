import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  getScriptVersion,
  keyPairsToAddress,
  logger,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";
import {
  SettingsDatumSchema,
  settingsPolicy,
  settingsValidator,
} from "../../types.ts";

async function closeSettings(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  closeCbor: string;
}> {
  logger.info("START closeSettings");

  const settingsValidatorScript = settingsValidator();
  const settingsValidatorVersion = getScriptVersion(
    settingsValidatorScript.type,
  );
  const settingsValidatorCredential = Addresses.scriptToCredential(
    settingsValidatorScript,
  );
  if (!settingsValidatorCredential) {
    throw new Error(
      "Settings validator address does not have a payment credential",
    );
  }

  const settingsMintingPolicy = settingsPolicy(utxoRef);
  const settingsMintingVersion = getScriptVersion(settingsMintingPolicy.type);

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;
  const settingsRef = settingsUtxo.txHash + "#" + settingsUtxo.outputIndex;

  const settingsTokenUnit = Object.keys(settingsUtxo.assets).find((unit) => {
    return unit !== "lovelace";
  })!;
  const settingsTokenName = fromUnit(settingsTokenUnit).name;
  const policyId = fromUnit(settingsTokenUnit).policyId;

  const remainingAda = settingsUtxo.assets["lovelace"];

  const settingsDatum = await lucidBase.datumOf(
    settingsUtxo,
    SettingsDatumSchema,
  );

  const githoneyAddr = keyPairsToAddress(
    lucidBase.network,
    settingsDatum.githoneyAddress,
  );

  const { tx } = await protocol.closeTx({
    githoneyaddr: githoneyAddr,
    collateralref: collateralref,
    settingsref: settingsRef,
    remainingada: BigInt(remainingAda),
    settingspolicyid: Buffer.from(policyId, "hex"),
    settingstokenname: Buffer.from(settingsTokenName!, "hex"),
    settingsmintingpolicy: Buffer.from(settingsMintingPolicy.script, "hex"),
    settingsmintingversion: BigInt(settingsMintingVersion),
    settingsvalidatorscript: Buffer.from(settingsValidatorScript.script, "hex"),
    settingsvalidatorversion: BigInt(settingsValidatorVersion),
  });

  logger.info("END closeSettings");
  return {
    closeCbor: tx,
  };
}

export { closeSettings };
