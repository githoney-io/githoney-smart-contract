import { githoneyValidator, settingsValidator } from "../../scripts";
import { Lucid, UTxO, fromUnit } from "lucid-cardano";
import { keyPairsToAddress, validatorParams } from "../../utils";
import logger from "../../logger";
import { SettingsDatum, SettingsRedeemer, mkSettingsDatum } from "../../types";

async function update(settingsUtxo: UTxO, lucid: Lucid) {
  logger.info("START update");
  const settingsValidatorScript = settingsValidator();

  const settingsPolicyId = fromUnit(
    Object.keys(settingsUtxo.assets).find((unit) => {
      return unit !== "lovelace";
    })!
  ).policyId;
  const oldSettings = await lucid.datumOf(settingsUtxo, SettingsDatum);

  const newSettingsDatum = mkSettingsDatum(validatorParams(lucid));
  const gitHoneyValidator = githoneyValidator(settingsPolicyId);
  const githoneyAddr = await keyPairsToAddress(
    lucid,
    oldSettings.githoney_wallet
  );
  const githoneyPkh = oldSettings.githoney_wallet.paymentKey;

  lucid.selectWalletFrom({ address: githoneyAddr });

  const tx = await lucid
    .newTx()
    .collectFrom([settingsUtxo], SettingsRedeemer.Update())
    .payToContract(
      settingsUtxo.address,
      { scriptRef: gitHoneyValidator, inline: newSettingsDatum },
      settingsUtxo.assets
    )
    .addSignerKey(githoneyPkh)
    .attachSpendingValidator(settingsValidatorScript)
    .complete();

  const cbor = tx.toString();
  logger.info("END update");
  logger.info(`update: ${cbor}`);
  return cbor;
}

export { update };
