import { Addresses, fromUnit, OutRef, Utxo } from "@spacebudz/lucid";
import {
  badgesValidator,
  MetadataWithPolicy,
  SettingsDatumSchema,
  settingsPolicy,
} from "../../types.ts";
import {
  logger,
  cardanoCredentialToCredential,
  keyPairsToAddress,
  lucidBase as lucid,
  getScriptVersion,
  lucidWithWallet,
} from "../../utils/utils.ts";
import { protocol } from "../../gen/typescript/protocol.ts";
import { collateralOutRef } from "../../utils/utxo.ts";

/**
 * Collects Utxos from the badges script address avoiding the ones holding some specific metadata.
 * @param settingsUtxo The settings Utxo.
 * @param settingsNftOutRef The output reference passed as a parameter of the settings nft minting policy,
 * @param metadatas The metadata of the badges to be skipped from collection.
 * @returns The cbor of the unsigned transaction.
 */

async function collectUtxos(
  settingsUtxo: Utxo,
  settingsNftOutRef: OutRef,
  metadatas: MetadataWithPolicy[],
): Promise<{ collectCbor: string }> {
  logger.info("START collectUtxos");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);
  const settingsRef = settingsUtxo.txHash + "#" + settingsUtxo.outputIndex;

  const [selectedUtxos] = await collateralOutRef(lucidWithWallet);
  const collateralref = selectedUtxos.txHash + "#" + selectedUtxos.outputIndex;

  const githoneyAddr = keyPairsToAddress(
    lucid.network,
    settings.githoneyAddress,
  );

  const settingsMintingPolicy = settingsPolicy(settingsNftOutRef);
  const settingsNftPolicy = Addresses.scriptToCredential(
    settingsMintingPolicy,
  ).hash;
  const badgesScript = badgesValidator(settingsNftPolicy);
  const scriptAddr = Addresses.scriptToAddress(lucid.network, badgesScript);
  logger.info(`Collecting utxos from ${scriptAddr}`);

  const utxosAtScript = await lucid.utxosAt(scriptAddr);

  const githoneyPaymentHash = cardanoCredentialToCredential(
    settings.githoneyAddress.paymentCredential,
  ).hash;

  lucid.selectReadOnlyWallet({ address: githoneyAddr });

  const { tx } = await protocol.collectUtxosTx({
    badgesscript: {
      type: "String",
      value: badgesScript.script,
    },
    badgesscriptversion: getScriptVersion(badgesScript.type),
    githoneyaddr: githoneyPaymentHash,
    script: scriptAddr,
    settingsref: settingsRef,
    collateralref: collateralref,
  });
  const policiesToAvoid: string[] = [];
  for (const meta of metadatas) {
    if (meta.policyId) {
      policiesToAvoid.push(meta.policyId);
    }
  }
  const inputUtxos: Utxo[] = [];
  utxosAtScript.forEach((utxo) => {
    if (
      Object.keys(utxo.assets).some((unit) => {
        const { policyId } = fromUnit(unit);
        return policiesToAvoid.includes(policyId);
      })
    ) {
      return;
    }
    inputUtxos.push(utxo);
  });
  if (inputUtxos.length === 0) {
    return { collectCbor: "" };
  }
  // TODO - Solve this, since tx3 does not allow lists to be passed as arguments
  //   const txComplete = await tx.collectFrom(inputUtxos, Data.void()).commit();
  //   const cbor = txComplete.toString();

  return { collectCbor: tx };
}

export { collectUtxos };
