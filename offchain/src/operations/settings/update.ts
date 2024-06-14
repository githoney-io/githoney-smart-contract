import { githoneyValidator, settingsValidator } from "../../scripts";
import { Lucid, UTxO, fromUnit } from "lucid-cardano";
import { addrToWallet, validatorParams } from "../../utils";
import logger from "../../logger";
import { githoneyAddr } from "../../constants";
import { SettingsRedeemer, mkSettingsDatum } from "../../types";

async function update(settingsUtxo: UTxO, lucid: Lucid) {
  logger.info("START update");
  const settingsValidatorScript = settingsValidator();
  let settingsPolicyId = "";
  Object.keys(settingsUtxo.assets).forEach((unit) => {
    if (unit !== "lovelace") {
      settingsPolicyId = fromUnit(unit).policyId;
    }
  });

  const settingsDatum = mkSettingsDatum(validatorParams(lucid));
  const gitHoneyValidator = githoneyValidator(settingsPolicyId);
  const githoneyPkh = addrToWallet(githoneyAddr, lucid).paymentKey;

  lucid.selectWalletFrom({ address: githoneyAddr });

  const tx = await lucid
    .newTx()
    .collectFrom([settingsUtxo], SettingsRedeemer.Update())
    .payToContract(
      settingsUtxo.address,
      { scriptRef: gitHoneyValidator, inline: settingsDatum },
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
