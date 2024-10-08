import { Data, Lucid, OutRef, UTxO } from "lucid-txpipe";
import { SettingsDatum, SettingsRedeemer } from "../../types";
import { clearZeroAssets, keyPairsToAddress } from "../../utils";
import logger from "../../logger";
import { settingsPolicy, settingsValidator } from "../../scripts";

/**
 * Builds a `closeSettings` transaction. The tx is built in the context of the GitHoney address.
 * @param utxoRef The output reference passed as a parameter of the settings nft minting policy,
 * this outRef is returned in the deploySettings operation.
 * @param settingsUtxo The settings UTxO.
 * @param lucid Lucid instance.
 * @returns The cbor of the unsigned transaction.
 */

async function closeSettings(
  utxoRef: OutRef,
  settingsUtxo: UTxO,
  lucid: Lucid
): Promise<string> {
  logger.info("START closeSettings");

  const settingsValidatorScript = settingsValidator();

  const settingsMintingPolicy = settingsPolicy(utxoRef);

  const settingsTokenUnit = Object.keys(settingsUtxo.assets).find((unit) => {
    return unit !== "lovelace";
  })!;
  const settingsDatum = await lucid.datumOf(settingsUtxo, SettingsDatum);
  const githoneyAddr = await keyPairsToAddress(
    lucid,
    settingsDatum.githoney_wallet
  );
  const githoneyPkh = settingsDatum.githoney_wallet.paymentKey;

  const githoneyPaymentAssets = clearZeroAssets({
    ...settingsUtxo.assets,
    [settingsTokenUnit]: 0n
  });

  lucid.selectWalletFrom({
    address: githoneyAddr
  });

  const tx = await lucid
    .newTx()
    .collectFrom([settingsUtxo], SettingsRedeemer.Close())
    .mintAssets({ [settingsTokenUnit]: BigInt(-1) }, Data.void())
    .payToAddress(githoneyAddr, githoneyPaymentAssets)
    .addSignerKey(githoneyPkh)
    .attachSpendingValidator(settingsValidatorScript)
    .attachMintingPolicy(settingsMintingPolicy)
    .complete();

  const cbor = tx.toString();
  logger.info("END closeSettings");
  logger.info(`CloseSettings ${cbor}`);
  return cbor;
}

export { closeSettings };
