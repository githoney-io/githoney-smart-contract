import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import { creationFee, rewardFee } from "../../constants.ts";
import {
  GithoneyContractGithoneySpend,
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
  const script = new GithoneyContractSettingsSpend();
  const scriptAddress = lucidBase.utils.scriptToAddress(script);

  // TODO - apply params to script and use validator

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
    script: { value: scriptAddress, type: "String" },
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
