import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  GithoneyContractSettingsMintingMint,
  GithoneyContractSettingsSpend,
} from "../../plutus.ts";
import {
  getScriptVersion,
  keyPairsToAddress,
  lucidBase,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

async function closeSettings(
  settingsUtxo: Utxo,
  utxoRef: OutRef,
): Promise<{
  closeCbor: string;
}> {
  const settingsValidatorScript = new GithoneyContractSettingsSpend();
  const settingsValidatorVersion = getScriptVersion(
    settingsValidatorScript.type,
  );
  const settingsValidatorAddress = Addresses.scriptToAddress(
    lucidBase.network,
    settingsValidatorScript,
  );
  const settingsValidatorCredential = Addresses.scriptToCredential(
    settingsValidatorScript,
  );
  if (!settingsValidatorCredential) {
    throw new Error(
      "Settings validator address does not have a payment credential",
    );
  }

  const outRefParam = {
    transactionId: utxoRef.txHash,
    outputIndex: BigInt(utxoRef.outputIndex),
  };

  const settingsMintingPolicy = new GithoneyContractSettingsMintingMint(
    outRefParam,
    {
      paymentCredential: { Script: [settingsValidatorCredential.hash] },
      stakeCredential: null,
    },
  );
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
    GithoneyContractSettingsSpend.datum,
  );

  const githoneyAddr = keyPairsToAddress(
    lucidBase.network,
    settingsDatum.githoneyAddress,
  );

  const { tx } = await protocol.closeTx({
    script: { value: settingsValidatorAddress, type: "String" },
    githoneyaddr: { value: githoneyAddr, type: "String" },
    collateralref: { value: collateralref, type: "String" },
    settingsref: {
      value: settingsRef,
      type: "String",
    },
    remainingada: {
      value: BigInt(remainingAda),
      type: "Int",
    },
    settingspolicyid: { value: Buffer.from(policyId, "hex"), type: "Bytes" },
    settingstokenname: {
      value: Buffer.from(settingsTokenName!, "hex"),
      type: "Bytes",
    },
    settingsmintingpolicy: {
      value: settingsMintingPolicy.script,
      type: "String",
    },
    settingsmintingversion: {
      type: "Int",
      value: BigInt(settingsMintingVersion),
    },
    settingsvalidatorscript: {
      value: settingsValidatorScript.script,
      type: "String",
    },
    settingsvalidatorversion: {
      value: BigInt(settingsValidatorVersion),
      type: "Int",
    },
  });

  return {
    closeCbor: tx,
  };
}

export { closeSettings };
