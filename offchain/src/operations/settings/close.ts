import { Data, Lucid, OutRef, Utxo } from "@spacebudz/lucid";
import {
  SettingsDatum,
  SettingsDatumSchema,
  SettingsRedeemer
} from "../../types";
import {
  cardanoCredentialToCredential,
  clearZeroAssets,
  keyPairsToAddress
} from "../../utils";
import logger from "../../logger";
import { settingsPolicy, settingsValidator } from "../../scripts";

/**
 * Builds a `closeSettings` transaction. The tx is built in the context of the GitHoney address.
 * @param utxoRef The output reference passed as a parameter of the settings nft minting policy,
 * this outRef is returned in the deploySettings operation.
 * @param settingsUtxo The settings Utxo.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function closeSettings(
  utxoRef: OutRef,
  settingsUtxo: Utxo,
  lucid: Lucid
): Promise<string> {
  logger.info("START closeSettings");

  const settingsValidatorScript = settingsValidator();

  const settingsMintingPolicy = settingsPolicy(utxoRef, lucid);

  const settingsTokenUnit = Object.keys(settingsUtxo.assets).find((unit) => {
    return unit !== "lovelace";
  })!;
  const settingsDatum = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);
  const githoneyAddr = await keyPairsToAddress(
    lucid.network,
    settingsDatum.githoneyAddress
  );
  const githoneyPkh = cardanoCredentialToCredential(
    settingsDatum.githoneyAddress.paymentCredential
  ).hash;

  const githoneyPaymentAssets = clearZeroAssets({
    ...settingsUtxo.assets,
    [settingsTokenUnit]: 0n
  });

  lucid.selectReadOnlyWallet({
    address: githoneyAddr
  });

  const tx = await lucid
    .newTx()
    .collectFrom([settingsUtxo], SettingsRedeemer.Close())
    .mint({ [settingsTokenUnit]: BigInt(-1) }, Data.void())
    .payTo(githoneyAddr, githoneyPaymentAssets)
    .addSigner(githoneyPkh)
    .attachScript(settingsValidatorScript)
    .attachScript(settingsMintingPolicy)
    .commit();

  const cbor = tx.toString();
  logger.info("END closeSettings");
  logger.info(`CloseSettings ${cbor}`);
  return cbor;
}

export { closeSettings };
