import { protocol } from "../../gen/typescript/protocol.ts";
import { Addresses, fromUnit, Utxo } from "@spacebudz/lucid";
import { creationFee, rewardFee } from "../../constants.ts";
import {
  getScriptVersion,
  keyPairsToAddress,
  logger,
  lucidBase,
} from "../../utils/utils.ts";
import {
  githoneyValidator,
  SettingsDatumSchema,
  settingsValidator,
} from "../../types.ts";

async function updateSettings(
  settingsUtxo: Utxo,
  settings?: {
    githoneyAddress?: string;
    creationFee: bigint;
    rewardFee: bigint;
  },
): Promise<{
  updateCbor: string;
}> {
  logger.info("START update");

  const settingsValidatorScript = settingsValidator();
  const settingsValidatorVersion = getScriptVersion(
    settingsValidatorScript.type,
  );
  const settingsValidatorAddress = Addresses.scriptToAddress(
    lucidBase.network,
    settingsValidatorScript,
  );

  const settingsPolicyId = fromUnit(
    Object.keys(settingsUtxo.assets).find((unit) => {
      return unit !== "lovelace";
    })!,
  ).policyId;

  const gitHoneyValidator = githoneyValidator(settingsPolicyId);
  const scriptVersion = getScriptVersion(gitHoneyValidator.type);

  const settingsRef = settingsUtxo.txHash + "#" + settingsUtxo.outputIndex;

  const oldSettings = await lucidBase.datumOf(
    settingsUtxo,
    SettingsDatumSchema,
  );

  const githoneyAddress = keyPairsToAddress(
    lucidBase.network,
    oldSettings.githoneyAddress,
  );

  let bountyCreationFee: bigint, bountyRewardFee: bigint;
  if (!settings) {
    bountyCreationFee = creationFee;
    bountyRewardFee = rewardFee;
  } else {
    if (settings.rewardFee < 0n || settings.rewardFee > 10_000n) {
      throw new Error("Reward fee must be between 0 and 10000");
    }
    if (settings.creationFee < 2_000_000n) {
      throw new Error("Creation fee must be at least 2 ADA");
    }
    bountyCreationFee = settings.creationFee;
    bountyRewardFee = settings.rewardFee;
  }

  const { tx } = await protocol.updateTx({
    script: settingsValidatorAddress,
    githoneyaddr: githoneyAddress,
    bountycreationfee: BigInt(bountyCreationFee),
    bountyrewardfee: BigInt(bountyRewardFee),
    settingsref: settingsRef,
    githoneyscript: Buffer.from(gitHoneyValidator.script, "hex"),
    scriptversion: BigInt(scriptVersion),
    settingsvalidatorscript: Buffer.from(settingsValidatorScript.script, "hex"),
    settingsvalidatorversion: BigInt(settingsValidatorVersion),
  });

  logger.info("END update");
  return {
    updateCbor: tx,
  };
}

export { updateSettings };
