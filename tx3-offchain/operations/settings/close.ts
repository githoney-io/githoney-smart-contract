import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import { creationFee, rewardFee } from "../../constants.ts";
import {
  GithoneyContractGithoneySpend,
  GithoneyContractSettingsMintingMint,
  GithoneyContractSettingsSpend,
} from "../../plutus.ts";
import {
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

  // TODO - how to attach this script
  const settingsMintingPolicy = new GithoneyContractSettingsMintingMint(
    outRefParam,
    {
      paymentCredential: { Script: [settingsValidatorCredential.hash] },
      stakeCredential: null,
    },
  );

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;
  const settingsRef = settingsUtxo.txHash + "#" + settingsUtxo.outputIndex;

  const settingsTokenUnit = Object.keys(settingsUtxo.assets).find((unit) => {
    return unit !== "lovelace";
  })!;
  const settingsTokenName = fromUnit(settingsTokenUnit).name;
  const policyId = fromUnit(settingsTokenUnit).policyId;

  const payment = Object.keys(settingsUtxo.assets).find((unit) => {
    return unit == "lovelace";
  })!;

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
    payment: {
      value: BigInt(payment),
      type: "Int",
    },
    settingspolicyid: { value: Buffer.from(policyId, "hex"), type: "Bytes" },
    settingstokenname: {
      value: Buffer.from(settingsTokenName!, "hex"),
      type: "Bytes",
    },
  });

  return {
    closeCbor: tx,
  };
}

export { closeSettings };
