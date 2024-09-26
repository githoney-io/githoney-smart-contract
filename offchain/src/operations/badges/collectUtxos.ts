import { Data, fromUnit, Lucid, OutRef, UTxO } from "lucid-txpipe";
import { MetadataWithPolicy } from "./deploy";
import { SettingsDatum } from "../../types";
import { keyPairsToAddress } from "../../utils";
import { badgesValidator, settingsPolicy } from "../../scripts";
import logger from "../../logger";

/**
 * Collects UTxOs from the badges script address avoiding the ones holding some specific metadata.
 * @param settingsUtxo The settings UTxO.
 * @param settingsNftOutRef The output reference passed as a parameter of the settings nft minting policy,
 * @param metadatas The metadata of the badges to be skipped from collection.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function collectUtxos(
  settingsUtxo: UTxO,
  settingsNftOutRef: OutRef,
  metadatas: MetadataWithPolicy[],
  lucid: Lucid
) {
  logger.info("START collectUtxos");
  const settings = await lucid.datumOf(settingsUtxo, SettingsDatum);
  const githoneyAddr = await keyPairsToAddress(lucid, settings.githoney_wallet);

  const settingsMintingPolicy = settingsPolicy(settingsNftOutRef);
  const settingsNftPolicy = await lucid.utils.mintingPolicyToId(
    settingsMintingPolicy
  );
  const badgesScript = badgesValidator(settingsNftPolicy);
  const scriptAddr = await lucid.utils.validatorToAddress(badgesScript);
  logger.info(`Collecting utxos from ${scriptAddr}`);

  const utxosAtScript = await lucid.utxosAt(scriptAddr);

  lucid.selectWalletFrom({ address: githoneyAddr });

  const tx = lucid
    .newTx()
    .attachSpendingValidator(badgesScript)
    .readFrom([settingsUtxo])
    .addSignerKey(settings.githoney_wallet.paymentKey);
  const policiesToAvoid: string[] = [];
  for (const meta of metadatas) {
    if (meta.policyId) {
      policiesToAvoid.push(meta.policyId);
    }
  }
  const inputUtxos: UTxO[] = [];
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
  const txComplete = await tx.collectFrom(inputUtxos, Data.void()).complete();
  const cbor = txComplete.toString();

  return cbor;
}

export { collectUtxos };
