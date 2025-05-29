import {
  Addresses,
  Data,
  fromUnit,
  Lucid,
  OutRef,
  Utxo
} from "@spacebudz/lucid";
import { MetadataWithPolicy } from "./deploy";
import { SettingsDatumSchema } from "../../types";
import { cardanoCredentialToCredential, keyPairsToAddress } from "../../utils";
import { badgesValidator, settingsPolicy } from "../../scripts";
import logger from "../../logger";

/**
 * Collects Utxos from the badges script address avoiding the ones holding some specific metadata.
 * @param settingsUtxo The settings Utxo.
 * @param settingsNftOutRef The output reference passed as a parameter of the settings nft minting policy,
 * @param metadatas The metadata of the badges to be skipped from collection.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function collectUtxos(
  settingsUtxo: Utxo,
  settingsNftOutRef: OutRef,
  metadatas: MetadataWithPolicy[],
  lucid: Lucid
) {
  logger.info("START collectUtxos");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);
  const githoneyAddr = await keyPairsToAddress(
    lucid.network,
    settings.githoneyAddress
  );

  const settingsMintingPolicy = settingsPolicy(settingsNftOutRef, lucid);
  const settingsNftPolicy = await Addresses.scriptToCredential(
    settingsMintingPolicy
  ).hash;
  const badgesScript = badgesValidator(settingsNftPolicy);
  const scriptAddr = await Addresses.scriptToAddress(
    lucid.network,
    badgesScript
  );
  logger.info(`Collecting utxos from ${scriptAddr}`);

  const utxosAtScript = await lucid.utxosAt(scriptAddr);

  const githoneyPaymentHash = cardanoCredentialToCredential(
    settings.githoneyAddress.paymentCredential
  ).hash;

  lucid.selectReadOnlyWallet({ address: githoneyAddr });

  const tx = lucid
    .newTx()
    .attachScript(badgesScript)
    .readFrom([settingsUtxo])
    .addSigner(githoneyPaymentHash);
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
    return "";
  }
  const txComplete = await tx.collectFrom(inputUtxos, Data.void()).commit();
  const cbor = txComplete.toString();

  return cbor;
}

export { collectUtxos };
