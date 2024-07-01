import { githoneyValidator, settingsValidator } from "../../scripts";
import { Lucid, UTxO, fromUnit } from "lucid-cardano";
import { keyPairsToAddress, validatorSettings } from "../../utils";
import logger from "../../logger";
import { SettingsDatum, SettingsRedeemer, mkSettingsDatum } from "../../types";

async function updateSettings(
  settingsUtxo: UTxO,
  lucid: Lucid,
  settings?: {
    githoneyWallet: {
      paymentKey: string;
      stakeKey: string | null;
    };
    creationFee: bigint;
    rewardFee: bigint;
  }
): Promise<string> {
  logger.info("START update");
  if (!settings) {
    settings = validatorSettings(lucid);
  } else {
    if (settings.rewardFee < 0n || settings.rewardFee > 10_000n) {
      throw new Error("Reward fee must be between 0 and 10000");
    }
    if (settings.creationFee < 2_000_000n) {
      throw new Error("Creation fee must be at least 2 ADA");
    }
  }
  const settingsValidatorScript = settingsValidator();

  const settingsPolicyId = fromUnit(
    Object.keys(settingsUtxo.assets).find((unit) => {
      return unit !== "lovelace";
    })!
  ).policyId;
  const oldSettings = await lucid.datumOf(settingsUtxo, SettingsDatum);

  const newSettingsDatum = mkSettingsDatum(settings);
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

export { updateSettings };
