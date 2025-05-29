import { githoneyValidator, settingsValidator } from "../../scripts";
import { Lucid, Utxo, fromUnit } from "@spacebudz/lucid";
import {
  bech32ToAddressType,
  cardanoCredentialToCredential,
  keyPairsToAddress,
  validatorSettings
} from "../../utils";
import logger from "../../logger";
import {
  SettingsDatum,
  SettingsDatumSchema,
  SettingsRedeemer,
  mkSettingsDatum
} from "../../types";

/**
 * Builds an `update` transaction. The tx is built in the context of the GitHoney address.
 * @param settingsUtxo The settings Utxo.
 * @param lucid Lucid instance.
 * @param settings The new settings to be updated (Optional).
 * @returns The cbor of the unsigned transaction.
 */

async function updateSettings(
  settingsUtxo: Utxo,
  lucid: Lucid,
  settings?: {
    githoneyAddress?: string;
    creationFee: bigint;
    rewardFee: bigint;
  }
): Promise<string> {
  logger.info("START update");
  const settingsValidatorScript = settingsValidator();

  const settingsPolicyId = fromUnit(
    Object.keys(settingsUtxo.assets).find((unit) => {
      return unit !== "lovelace";
    })!
  ).policyId;
  const oldSettings = await lucid.datumOf(settingsUtxo, SettingsDatumSchema);

  const gitHoneyValidator = githoneyValidator(settingsPolicyId);
  const githoneyAddr = await keyPairsToAddress(
    lucid.network,
    oldSettings.githoneyAddress
  );
  const githoneyPkh = cardanoCredentialToCredential(
    oldSettings.githoneyAddress.paymentCredential
  ).hash;
  let newSettingsDatum: string;
  if (!settings) {
    newSettingsDatum = mkSettingsDatum(validatorSettings(githoneyAddr));
  } else {
    if (settings.rewardFee < 0n || settings.rewardFee > 10_000n) {
      throw new Error("Reward fee must be between 0 and 10000");
    }
    if (settings.creationFee < 2_000_000n) {
      throw new Error("Creation fee must be at least 2 ADA");
    }
    newSettingsDatum = mkSettingsDatum({
      ...settings,
      githoneyAddress: bech32ToAddressType(githoneyAddr)
    });
  }

  lucid.selectReadOnlyWallet({ address: githoneyAddr });

  const tx = await lucid
    .newTx()
    .collectFrom([settingsUtxo], SettingsRedeemer.Update())
    .payToContract(
      settingsUtxo.address,
      { scriptRef: gitHoneyValidator, Inline: newSettingsDatum },
      settingsUtxo.assets
    )
    .addSigner(githoneyPkh)
    .attachScript(settingsValidatorScript)
    .commit();

  const cbor = tx.toString();
  logger.info("END update");
  logger.info(`update: ${cbor}`);
  return cbor;
}

export { updateSettings };
